import { createActor, Actor, fromPromise } from 'xstate';
import { automationMachine, AutomationContext, AutomationEvent } from './machine';
import { Block, BlockResult, IBlockExecutor, ExecutionContext, PauseError } from './interfaces';
import { events } from '../../core/EventBusService';
import { logger } from '../../core/LoggerService';
import { programRepository } from '../persistence/repositories/ProgramRepository';
import { sessionRepository } from '../persistence/repositories/SessionRepository';
import { actionTemplateRepository } from '../persistence/repositories/ActionTemplateRepository';

export class AutomationEngine {
    private actor: Actor<any>;
    private executors = new Map<string, IBlockExecutor>();
    private currentSessionId: string | null = null;

    constructor() {
        // Define the logic for 'executeBlock'
        const executeBlockLogic = fromPromise(async ({ input, signal }: { input: { context: AutomationContext }, signal: AbortSignal }) => {
            return this.executeBlock(input.context, signal);
        });

        // Create the actor with the machine and provided implementations
        this.actor = createActor(automationMachine.provide({
            actors: {
                executeBlock: executeBlockLogic
            }
        }));

        this.setupEventListeners();
        this.actor.start();
    }

    private setupEventListeners() {
        this.actor.subscribe(async (snapshot) => {
            const stateValue = snapshot.value as string;
            logger.debug({ state: stateValue, block: snapshot.context.currentBlockId }, '⚙️ Automation State Transition');

            // Sync with DB Session
            if (this.currentSessionId) {
                try {
                    const updates: any = { status: stateValue };
                    if (stateValue === 'stopped' || stateValue === 'error') {
                        updates.endTime = new Date();
                    }

                    // We could also append logs here if we were buffering them, 
                    // but for now we'll rely on the event bus or direct updates for logs.
                    // Let's just update status for now.
                    await sessionRepository.update(this.currentSessionId, updates);
                } catch (err) {
                    logger.error({ err, sessionId: this.currentSessionId }, '❌ Failed to update session status');
                }
            }

            events.emit('automation:state_change', {
                state: stateValue,
                currentBlock: snapshot.context.currentBlockId,
                context: snapshot.context.execContext,
                sessionId: this.currentSessionId
            });
        });
    }

    public registerExecutor(executor: IBlockExecutor) {
        this.executors.set(executor.type, executor);
    }

    /**
     * Start a program by ID.
     * Loads program from DB, creates a session, and starts the machine.
     */
    /**
     * Load a program into memory (Idle state).
     */
    public async loadProgram(programId: string): Promise<string> {
        // 1. Load Program
        const program = await programRepository.findById(programId);
        if (!program) {
            throw new Error(`Program not found: ${programId}`);
        }

        if (!program.isActive) {
            throw new Error(`Program is not active: ${programId}`);
        }

        // 2. Create Session
        const session = await sessionRepository.create({
            programId: program.id,
            startTime: new Date(),
            status: 'loaded', // Initial status
            logs: [],
            context: {
                resumeState: {}
            }
        });
        this.currentSessionId = session.id;

        logger.info({ sessionId: this.currentSessionId, programId }, '📥 Loading Program Session');

        // 3. Send LOAD event to Machine
        this.actor.send({
            type: 'LOAD',
            programId: program.id,
            templateId: 'default',
            blocks: program.nodes.map((n: any) => ({
                id: n.id,
                type: n.type,
                params: n.params || n.data || {}
            })),
            edges: program.edges as any[]
        } as any);

        return this.currentSessionId!;
    }

    /**
     * Start the currently loaded program.
     */
    public async startProgram() {
        const snapshot = this.actor.getSnapshot();
        if (snapshot.value !== 'loaded' && snapshot.value !== 'stopped' && snapshot.value !== 'completed') {
            throw new Error(`Cannot start program from state: ${snapshot.value}. Must be loaded, stopped, or completed.`);
        }

        this.actor.send({ type: 'START' });
    }

    public async unloadProgram() {
        this.actor.send({ type: 'UNLOAD' });
        this.currentSessionId = null;
    }

    public stopProgram() {
        this.actor.send({ type: 'STOP' });
    }

    public pauseProgram() {
        this.actor.send({ type: 'PAUSE' });
    }

    public resumeProgram() {
        this.actor.send({ type: 'RESUME' });
    }

    public getSnapshot() {
        const snapshot = this.actor.getSnapshot();
        return {
            ...snapshot,
            sessionId: this.currentSessionId
        };
    }

    /**
     * The core logic run by the XState 'invoke'.
     * Executes a single block.
     */
    private async executeBlock(context: AutomationContext, signal?: AbortSignal): Promise<any> {
        const blockId = context.currentBlockId;
        if (!blockId) return { nextBlockId: null };

        const block = context.blocks.get(blockId);
        if (!block) throw new Error(`Block not found: ${blockId}`);

        const executor = this.executors.get(block.type);
        if (!executor) throw new Error(`No executor for block type: ${block.type}`);

        // 0. Sync Context from DB (Critical for Resume)
        // We need to ensure we have the latest resumeState which might have been saved during a Pause.
        if (this.currentSessionId) {
            try {
                const session = await sessionRepository.findById(this.currentSessionId);
                if (session && session.context && session.context.resumeState) {
                    // Update the local context object (this doesn't affect XState context permanently, which is fine)
                    context.execContext.resumeState = session.context.resumeState;
                }
            } catch (err) {
                logger.warn({ err }, 'Failed to sync session context from DB');
            }
        }

        // 1. Emit Block Start
        events.emit('automation:block_start', { blockId, type: block.type, sessionId: this.currentSessionId });

        try {
            // 2. Execute (Deterministic Step)
            const execParams = { ...block.params, _blockId: blockId };
            const result = await executor.execute(context.execContext, execParams, signal);

            // 3. Emit Block End
            events.emit('automation:block_end', { blockId, success: result.success, output: result.output, sessionId: this.currentSessionId });

            // 4. Log to Session (Async -> Sync for consistency)
            if (this.currentSessionId) {
                try {
                    const logEntry = {
                        timestamp: new Date(),
                        level: result.success ? 'info' : 'error',
                        message: `Block ${block.type} executed`,
                        blockId,
                        data: result.output
                    };

                    await sessionRepository.addLog(this.currentSessionId, logEntry);

                    // Emit log event for real-time UI
                    events.emit('log', { ...logEntry, sessionId: this.currentSessionId });

                } catch (err) {
                    logger.error({ err }, 'Failed to save session log');
                }
            }

            if (!result.success) {
                throw new Error(result.error || 'Block execution failed');
            }

            // Determine next block using Graph Edges
            let nextBlockId: string | undefined | null = result.nextBlockId;

            if (nextBlockId === undefined) {
                // Default behavior: Find the first outgoing edge
                const edge = context.edges.find(e => e.source === blockId);
                nextBlockId = edge ? edge.target : null;
            }

            return { nextBlockId, output: result.output };

        } catch (error: any) {
            if (error.name === 'PauseError') {
                logger.info({ blockId, state: error.state }, '⏸️ Block Paused (State Saved)');

                // Save state to DB
                if (this.currentSessionId) {
                    try {
                        const update = {
                            [`context.resumeState.${blockId}`]: error.state
                        };
                        await sessionRepository.update(this.currentSessionId, update);
                    } catch (err) {
                        logger.error({ err }, '❌ Failed to save resume state');
                    }
                }

                // Treat as aborted for XState
                throw new Error('Aborted');
            }

            if (error.message === 'Aborted' || signal?.aborted) {
                logger.info({ blockId }, '⏹️ Block Execution Aborted (Paused/Stopped)');
                throw error; // XState handles cancellation
            }

            logger.error({ error, blockId }, '❌ Block Execution Error');
            throw error; // Triggers onError in XState
        }
    }
}

export const automation = new AutomationEngine();

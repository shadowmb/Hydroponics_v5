import { createActor, Actor, fromPromise } from 'xstate';
import { automationMachine, AutomationContext, AutomationEvent } from './machine';
import { Block, BlockResult, IBlockExecutor, ExecutionContext, PauseError } from './interfaces';
import { events } from '../../core/EventBusService';
import { logger } from '../../core/LoggerService';
import { flowRepository } from '../persistence/repositories/FlowRepository';
import { sessionRepository } from '../persistence/repositories/SessionRepository';
import { actionTemplateRepository } from '../persistence/repositories/ActionTemplateRepository';

// Import Services (Singletons)
import { historyService, HistoryService } from '../../services/HistoryService';
import { unitConversionService, UnitConversionService } from '../../services/conversion/UnitConversionService';
import { hardware, HardwareService } from '../hardware/HardwareService';

// Import Executors
import { SensorReadBlockExecutor } from './blocks/SensorReadBlockExecutor';
import { IfBlockExecutor } from './blocks/IfBlockExecutor';
import { ActuatorSetBlockExecutor } from './blocks/ActuatorSetBlockExecutor';
import { WaitBlockExecutor } from './blocks/WaitBlockExecutor';
import { LogBlockExecutor } from './blocks/LogBlockExecutor';
import { StartBlockExecutor } from './blocks/StartBlockExecutor';
import { EndBlockExecutor } from './blocks/EndBlockExecutor';
import { LoopBlockExecutor } from './blocks/LoopBlockExecutor';
import { FlowControlBlockExecutor } from './blocks/FlowControlBlockExecutor';

export class AutomationEngine {
    private actor: Actor<any>;
    private executors = new Map<string, IBlockExecutor>();
    private currentSessionId: string | null = null;

    private instanceId = Math.random().toString(36).substring(7);

    constructor(
        private historyService: HistoryService,
        private unitConversion: UnitConversionService,
        private deviceService: HardwareService
    ) {
        console.log(`DEBUG: AutomationEngine Created: ${this.instanceId}`);

        // Register Executors
        this.registerExecutor(new StartBlockExecutor());
        this.registerExecutor(new EndBlockExecutor());
        this.registerExecutor(new LogBlockExecutor());
        this.registerExecutor(new WaitBlockExecutor());
        this.registerExecutor(new ActuatorSetBlockExecutor()); // Fixed: No args
        this.registerExecutor(new SensorReadBlockExecutor()); // Fixed: No args
        this.registerExecutor(new IfBlockExecutor());
        this.registerExecutor(new LoopBlockExecutor());
        this.registerExecutor(new FlowControlBlockExecutor());

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

    // ... rest of class ...

    // ... rest of class ...

    private setupEventListeners() {
        this.actor.subscribe(async (snapshot) => {
            const stateValue = snapshot.value as string;
            logger.debug({ state: stateValue, block: snapshot.context.currentBlockId }, '⚙️ Automation State Transition');
            // ... (skip purely existing code references if possible, or use larger chunks)

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
                sessionId: this.currentSessionId,
                error: snapshot.context.error
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
    public async loadProgram(programId: string, overrides: Record<string, any> = {}): Promise<string> {
        // 1. Load Program (Flow)
        const flow = await flowRepository.findById(programId);
        if (!flow) {
            throw new Error(`Flow not found: ${programId}`);
        }

        if (!flow.isActive) {
            throw new Error(`Flow is not active: ${programId}`);
        }

        // 2. Resolve Inputs
        const variables: Record<string, any> = {};
        if (flow.inputs) {
            for (const input of flow.inputs) {
                if (overrides[input.name] !== undefined) {
                    variables[input.name] = overrides[input.name];
                } else if (input.default !== undefined) {
                    variables[input.name] = input.default;
                } else {
                    // Optional: Throw error if required input is missing?
                    // For now, let's leave it undefined or null
                    variables[input.name] = null;
                }
            }
        }

        // 3. Create Session
        const session = await sessionRepository.create({
            programId: flow.id,
            startTime: new Date(),
            status: 'loaded', // Initial status
            logs: [],
            context: {
                resumeState: {},
                variables: variables // Store resolved variables in context
            }
        });
        this.currentSessionId = session.id;

        logger.info({ sessionId: this.currentSessionId, programId, variables }, '📥 Loading Program Session');

        // 4. Send LOAD event to Machine
        this.actor.send({
            type: 'LOAD',
            programId: flow.id,
            templateId: 'default',
            blocks: flow.nodes.map((n: any) => ({
                id: n.id,
                type: n.type,
                params: n.params || n.data || {}
            })),
            edges: flow.edges as any[],
            execContext: { // Pass initial context to machine
                variables
            }
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
     * Helper to resolve variable references in params (e.g. "{{duration}}")
     */
    private resolveParams(params: Record<string, any>, variables: Record<string, any>): Record<string, any> {
        const resolved: Record<string, any> = {};
        for (const [key, value] of Object.entries(params)) {
            if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
                const varName = value.slice(2, -2).trim();
                resolved[key] = variables[varName] !== undefined ? variables[varName] : value;
            } else {
                resolved[key] = value;
            }
        }
        return resolved;
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
                if (session && session.context) {
                    if (session.context.resumeState) {
                        context.execContext.resumeState = session.context.resumeState;
                    }
                    // Also sync variables if they changed (though they are usually static per session)
                    if (session.context.variables) {
                        context.execContext.variables = session.context.variables;
                    }
                }
            } catch (err) {
                logger.warn({ err }, 'Failed to sync session context from DB');
            }
        }

        // 1. Emit Block Start
        events.emit('automation:block_start', { blockId, type: block.type, sessionId: this.currentSessionId });

        try {
            // 2. Resolve Params & Execute (Deterministic Step)
            const rawParams = { ...block.params, _blockId: blockId };
            const resolvedParams = this.resolveParams(rawParams, context.execContext.variables || {});

            const result = await executor.execute(context.execContext, resolvedParams, signal);

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

            // 2.5. Persist State (if returned by block)
            if (result.state && this.currentSessionId) {
                try {
                    const update = {
                        [`context.resumeState.${blockId}`]: result.state
                    };
                    await sessionRepository.update(this.currentSessionId, update);
                    // Update local context too so next block sees it immediately if needed?
                    // Actually, next block is different, but re-entry to THIS block needs it.
                    // We updated DB, but `context.execContext.resumeState` is local.
                    if (!context.execContext.resumeState) context.execContext.resumeState = {};
                    context.execContext.resumeState[blockId] = result.state;
                } catch (err) {
                    logger.error({ err }, '❌ Failed to save block state');
                }
            }

            // Determine next block using Graph Edges
            let nextBlockId: string | undefined | null = result.nextBlockId;

            if (nextBlockId === undefined) {
                // Special Handling for IF block (Conditional Routing)
                if (block.type === 'IF' && typeof result.output === 'boolean') {
                    // Find edge matching the boolean result (true/false)
                    // We assume edges from IF block have sourceHandle 'true' or 'false'
                    // OR we check edge labels/data?
                    // The ConditionNode uses sourceHandle="true" and "false".
                    const expectedHandle = result.output ? 'true' : 'false';
                    const edge = context.edges.find(e => e.source === blockId && e.sourceHandle === expectedHandle);

                    if (edge) {
                        nextBlockId = edge.target;
                    } else {
                        // Fallback: If no specific edge found, maybe just stop?
                        // Or try to find a default edge?
                        nextBlockId = null;
                        logger.warn({ blockId, result: result.output }, '⚠️ IF block has no matching edge');
                    }
                }
                // Special Handling for LOOP block
                else if (block.type === 'LOOP' && typeof result.output === 'boolean') {
                    // true -> body, false -> exit
                    const expectedHandle = result.output ? 'body' : 'exit';
                    const edge = context.edges.find(e => e.source === blockId && e.sourceHandle === expectedHandle);
                    nextBlockId = edge ? edge.target : null;
                }
                else {
                    // Default behavior: Find the first outgoing edge
                    const edge = context.edges.find(e => e.source === blockId);
                    nextBlockId = edge ? edge.target : null;
                }
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

            console.error('BLOCK EXECUTION ERROR:', error);
            logger.error({ error, blockId }, '❌ Block Execution Error');
            throw error; // Triggers onError in XState
        }
    }
}

export const automation = new AutomationEngine(historyService, unitConversionService, hardware);

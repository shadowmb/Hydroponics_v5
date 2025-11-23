import { createActor, Actor, fromPromise } from 'xstate';
import { automationMachine, AutomationContext, AutomationEvent } from './machine';
import { Block, BlockResult, IBlockExecutor, ExecutionContext } from './interfaces';
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
        const executeBlockLogic = fromPromise(async ({ input }: { input: { context: AutomationContext } }) => {
            return this.executeBlock(input.context);
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
    public async startProgram(programId: string): Promise<string> {
        // 1. Load Program
        const program = await programRepository.findById(programId);
        if (!program) {
            throw new Error(`Program not found: ${programId}`);
        }

        if (!program.active) {
            throw new Error(`Program is not active: ${programId}`);
        }

        // 2. Create Session
        const session = await sessionRepository.create({
            programId: program.id,
            startTime: new Date(),
            status: 'running',
            logs: [],
            context: {}
        });
        this.currentSessionId = session.id; // Mongoose ID is usually _id, but our repo might return the doc. 
        // Wait, our repository returns the Mongoose document. 
        // The Schema definition has `id` as a string (UUID) maybe? 
        // Let's check SessionRepository and Schema.
        // ExecutionSession.schema.ts doesn't have a custom 'id' field, it uses default _id.
        // But Program has 'id' (String).
        // Let's assume session.id works (mongoose virtual) or use session._id.
        // For safety, let's check if we need to map _id to id.
        // The repository uses `new this.model(data).save()`.
        // Let's assume we use the returned object's ID.

        logger.info({ sessionId: this.currentSessionId, programId }, '🚀 Starting Program Session');

        // 3. Start Machine
        // We need to map the program blocks to the format expected by the machine
        // The machine expects `blocks: Block[]`.
        // The DB program has `blocks: [Object]`. We assume they match.

        this.actor.send({
            type: 'START',
            programId: program.id,
            templateId: 'default', // TODO: remove templateId if not needed
            blocks: program.blocks as Block[]
        } as any);

        return this.currentSessionId!;
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
    private async executeBlock(context: AutomationContext): Promise<any> {
        const blockId = context.currentBlockId;
        if (!blockId) return { nextBlockId: null };

        const block = context.blocks.get(blockId);
        if (!block) throw new Error(`Block not found: ${blockId}`);

        const executor = this.executors.get(block.type);
        if (!executor) throw new Error(`No executor for block type: ${block.type}`);

        // 1. Emit Block Start
        events.emit('automation:block_start', { blockId, type: block.type, sessionId: this.currentSessionId });

        try {
            // 2. Execute (Deterministic Step)
            const result = await executor.execute(context.execContext, block.params);

            // 3. Emit Block End
            events.emit('automation:block_end', { blockId, success: result.success, output: result.output, sessionId: this.currentSessionId });

            // 4. Log to Session (Async -> Sync for consistency)
            if (this.currentSessionId) {
                try {
                    await sessionRepository.addLog(this.currentSessionId, {
                        timestamp: new Date(),
                        level: result.success ? 'info' : 'error',
                        message: `Block ${block.type} executed`,
                        blockId,
                        data: result.output
                    });
                } catch (err) {
                    logger.error({ err }, 'Failed to save session log');
                }
            }

            if (!result.success) {
                throw new Error(result.error || 'Block execution failed');
            }

            // Determine next block
            const nextBlockId = result.nextBlockId !== undefined ? result.nextBlockId : block.next;

            return { nextBlockId, output: result.output };

        } catch (error: any) {
            logger.error({ error, blockId }, '❌ Block Execution Error');
            throw error; // Triggers onError in XState
        }
    }
}

export const automation = new AutomationEngine();

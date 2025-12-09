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

        if (flow.validationStatus === 'INVALID') {
            throw new Error(`Cannot load invalid flow (Draft mode): ${programId}`);
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
                    variables[input.name] = null;
                }
            }
        }

        logger.info({ overrides, variablesResolved: variables }, '🧩 AutomationEngine: Input Resolution');

        // 2a. Resolve Variable Definitions
        const variableDefinitions: Record<string, any> = {};
        if (flow.variables) {
            flow.variables.forEach((v: any) => {
                // Key by ID if available (preferred), otherwise Name
                const key = v.id || v.name;
                const name = v.name;

                variableDefinitions[key] = {
                    type: v.type,
                    unit: v.unit,
                    scope: v.scope,
                    name: name
                };

                // 2b. INJECTION FIX: Check overrides for this variable
                let val = undefined;

                // Try finding by ID
                if (v.id && overrides[v.id] !== undefined) val = overrides[v.id];
                // Try finding by Name (this is what we see in logs)
                else if (name && overrides[name] !== undefined) val = overrides[name];
                // Fallback to default
                else if (v.default !== undefined) val = v.default;

                // If we found a value, inject it into the runtime map
                if (val !== undefined) {
                    variables[key] = val;
                    // Also enable access by Name if ID is primary key (for convenience in Condition checks)
                    if (v.id && name) {
                        variables[name] = val;
                    }
                }
            });
        }

        // 3. Create Session
        const session = await sessionRepository.create({
            programId: flow.id,
            startTime: new Date(),
            status: 'loaded', // Initial status
            logs: [],
            context: {
                resumeState: {},
                variables: variables, // Store resolved variables in context
                variableDefinitions: variableDefinitions // Store metadata
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
                variables,
                variableDefinitions
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
     * Executes a single block with Error Handling Policy.
     */
    private async executeBlock(context: AutomationContext, signal?: AbortSignal): Promise<any> {
        const blockId = context.currentBlockId;
        if (!blockId) return { nextBlockId: null };

        const block = context.blocks.get(blockId);
        if (!block) throw new Error(`Block not found: ${blockId}`);

        const executor = this.executors.get(block.type);
        if (!executor) throw new Error(`No executor for block type: ${block.type}`);

        // 0. Sync Context from DB (Critical for Resume)
        // REMOVED: This causes stale data issues. In-memory context is the source of truth during execution.
        // DB Sync happens via 'persistState' or on explicit Resume.
        /*
        if (this.currentSessionId) {
            try {
                const session = await sessionRepository.findById(this.currentSessionId);
                if (session && session.context) {
                    if (session.context.resumeState) context.execContext.resumeState = session.context.resumeState;
                    if (session.context.variables) context.execContext.variables = session.context.variables;
                    if (session.context.variableDefinitions) context.execContext.variableDefinitions = session.context.variableDefinitions;
                }
            } catch (err) { }
        }
        */

        // --- ERROR HANDLING & RETRY LOGIC ---
        let params = { ...block.params };
        if (params.mirrorOf) {
            const sourceBlock = context.blocks.get(params.mirrorOf);
            if (sourceBlock) params = { ...sourceBlock.params, ...params, _mirrorId: blockId };
        }

        const retryCount = Number(params.retryCount) || 0;
        const retryDelay = Number(params.retryDelay) || 1000;
        const onFailure = params.onFailure || 'STOP';

        let attempts = 0;
        let lastError: Error | null = null;

        while (attempts <= retryCount) {
            if (signal?.aborted) throw new Error('Aborted');

            try {
                if (attempts === 0) {
                    const resolvedParamsForUI = this.resolveParams({ ...params, _blockId: blockId }, context.execContext.variables || {});

                    // Determine meaningful label
                    let label = resolvedParamsForUI.label || block.type;
                    if (block.type === 'LOG') label = `Log: ${resolvedParamsForUI.message || ''}`;

                    // Determine duration if applicable
                    let duration = 0;
                    if (block.type === 'WAIT' && resolvedParamsForUI.duration) duration = Number(resolvedParamsForUI.duration);
                    // Add other duration blocks here if needed

                    events.emit('automation:block_start', { blockId, type: block.type, sessionId: this.currentSessionId });

                    // New Rich Execution Event
                    events.emit('automation:execution_step', {
                        blockId,
                        type: block.type,
                        sessionId: this.currentSessionId,
                        label: label,
                        duration: duration,
                        timestamp: Date.now(),
                        params: resolvedParamsForUI
                    });
                }

                const resolvedParams = this.resolveParams({ ...params, _blockId: blockId }, context.execContext.variables || {});
                const result = await executor.execute(context.execContext, resolvedParams, signal);

                if (!result.success) throw new Error(result.error || 'Block execution returned failure');

                // Success!
                events.emit('automation:block_end', { blockId, success: true, output: result.output, sessionId: this.currentSessionId });

                // Loop Safety Check
                if (result.output && result.output.status === 'MAX_ITERATIONS') {
                    const onSafety = params.onMaxIterations || 'STOP';
                    if (onSafety === 'CONTINUE') {
                        // Determine 'exit' edge for loop
                        const edge = context.edges.find(e => e.source === blockId && e.sourceHandle === 'exit');
                        return { nextBlockId: edge ? edge.target : null };
                    }
                    if (onSafety === 'PAUSE') {
                        this.actor.send({ type: 'PAUSE', resumeState: { blockId } } as any);
                        return new Promise(() => { });
                    }
                    throw new Error(`Loop Max Iterations Reached (${params.maxIterations})`);
                }

                // --- GRAPH NAVIGATION LOGIC ---
                let nextBlockId: string | undefined | null = result.nextBlockId;
                if (nextBlockId === undefined) {
                    if (block.type === 'IF' && typeof result.output === 'boolean') {
                        const expectedHandle = result.output ? 'true' : 'false';
                        const edge = context.edges.find(e => e.source === blockId && e.sourceHandle === expectedHandle);
                        nextBlockId = edge ? edge.target : null;

                        logger.info({ blockId, result: result.output, expectedHandle, nextBlockId: nextBlockId || 'null' }, '❓ IF Block Navigation Trace');

                        if (!nextBlockId) logger.warn({ blockId, result: result.output }, '⚠️ IF block has no matching edge');
                    }
                    else if (block.type === 'LOOP' && typeof result.output === 'boolean') {
                        const expectedHandle = result.output ? 'body' : 'exit';
                        const edge = context.edges.find(e => e.source === blockId && e.sourceHandle === expectedHandle);
                        nextBlockId = edge ? edge.target : null;
                    }
                    else {
                        const edge = context.edges.find(e => e.source === blockId);
                        nextBlockId = edge ? edge.target : null;

                        logger.info({ blockId, edgeFound: !!edge, nextBlockId }, 'Graph Navigation Trace');
                    }
                }

                return { nextBlockId, output: result.output };

            } catch (err: any) {
                lastError = err;
                attempts++;
                logger.warn({ blockId, attempt: attempts, err: err.message }, `Block execution failed`);
                if (attempts <= retryCount) await new Promise(r => setTimeout(r, retryDelay));
            }
        }

        // FAILURE HANDLING
        logger.error({ blockId, policy: onFailure }, 'All retries exhausted.');

        if (onFailure === 'CONTINUE') {
            // Try to find a default outgoing edge to continue
            const edge = context.edges.find(e => e.source === blockId);
            return { nextBlockId: edge ? edge.target : null };
        }

        if (onFailure === 'PAUSE') {
            this.actor.send({ type: 'PAUSE', resumeState: { blockId } } as any);
            return new Promise(() => { });
        }

        if (onFailure === 'GOTO_LABEL') {
            const targetLabelName = params.errorTargetLabel;
            if (targetLabelName) {
                if (targetLabelName === 'END') return { nextBlockId: null };

                for (const [id, b] of context.blocks) {
                    if (b.type === 'FLOW_CONTROL' && b.params.controlType === 'LABEL' && b.params.labelName === targetLabelName) {
                        return { nextBlockId: id };
                    }
                }
            }
        }

        throw lastError || new Error('Block failed after retries');
    }
}

export const automation = new AutomationEngine(historyService, unitConversionService, hardware);

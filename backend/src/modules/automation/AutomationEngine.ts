import { EventEmitter } from 'events';
import { createActor, Actor, fromPromise } from 'xstate';
import { automationMachine, AutomationContext, AutomationEvent } from './machine';
import { Block, BlockResult, IBlockExecutor, ExecutionContext, PauseError } from './interfaces';
import { logger } from '../../core/LoggerService';
import { flowRepository } from '../persistence/repositories/FlowRepository';
import { sessionRepository } from '../persistence/repositories/SessionRepository';

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

/**
 * AutomationEngine v2.0
 * 
 * A "dumb" worker that only executes flows (block by block).
 * Communicates via EventEmitter events - NO direct dependencies on ActiveProgramService.
 * 
 * Responsibilities:
 * - Load/Start/Stop/Pause/Resume flows
 * - Execute blocks using registered executors
 * - Track active hardware resources for safety cleanup
 * - Emit events for external listeners (Orchestrator pattern)
 */
export class AutomationEngine extends EventEmitter {
    // Centralized event names for type safety and relay bridge
    static readonly EVENTS = [
        'flow:state_change',
        'flow:block_start',
        'flow:block_end',
        'flow:execution_step',
        'flow:signal'
    ] as const;

    private actor!: Actor<any>;
    private executors = new Map<string, IBlockExecutor>();
    private currentSessionId: string | null = null;
    private currentProgramName: string | null = null;
    private executionStartTime: number = 0;

    // Context metadata (passed via overrides, used in events)
    private activeProgramId: string | null = null;
    private currentWindowId: string | null = null;
    private currentWindowName: string | null = null;
    private executionType: string | null = null;

    private instanceId = Math.random().toString(36).substring(7);
    private _suppressStopEvent = false;

    constructor(
        private historyService: HistoryService,
        private unitConversion: UnitConversionService,
        private deviceService: HardwareService
    ) {
        super();
        console.log(`DEBUG: AutomationEngine v2 Created: ${this.instanceId}`);

        // Register Executors
        this.registerExecutor(new StartBlockExecutor());
        this.registerExecutor(new EndBlockExecutor());
        this.registerExecutor(new LogBlockExecutor());
        this.registerExecutor(new WaitBlockExecutor());
        this.registerExecutor(new ActuatorSetBlockExecutor());
        this.registerExecutor(new SensorReadBlockExecutor());
        this.registerExecutor(new IfBlockExecutor());
        this.registerExecutor(new LoopBlockExecutor());
        this.registerExecutor(new FlowControlBlockExecutor());

        this.initializeActor();
    }

    private initializeActor() {
        if (this.actor) {
            this.actor.stop();
        }

        const executeBlockLogic = fromPromise(async ({ input, signal }: { input: { context: AutomationContext }, signal: AbortSignal }) => {
            return this.executeBlock(input.context, signal);
        });

        this.actor = createActor(automationMachine.provide({
            actors: {
                executeBlock: executeBlockLogic
            }
        }));

        this.setupEventListeners();
        this.actor.start();
        logger.info(`✨ AutomationEngine v2 Actor Initialized (Session: ${this.currentSessionId || 'none'})`);
    }

    private setupEventListeners() {
        this.actor.subscribe(async (snapshot) => {
            const stateValue = snapshot.value as string;
            logger.debug({ state: stateValue, block: snapshot.context.currentBlockId }, '⚙️ Automation State Transition');

            // --- SAFETY STOP CLEANUP ---
            if (stateValue === 'stopped' || stateValue === 'error') {
                if (snapshot.context.execContext) {
                    await this.cleanupResources(snapshot.context.execContext);
                }
            }

            // Sync with DB Session
            if (this.currentSessionId) {
                try {
                    const updates: any = { status: stateValue };
                    if (['stopped', 'error', 'completed'].includes(stateValue)) {
                        updates.endTime = new Date();
                    }
                    logger.info({ sessionId: this.currentSessionId, updates }, '💾 Syncing Session Status to DB');
                    await sessionRepository.update(this.currentSessionId, updates);
                } catch (err: any) {
                    logger.error({ err: err.message, sessionId: this.currentSessionId }, '❌ Failed to update session status');
                }
            }

            // Emit local event for state change (replaces global events bus)
            // Fix: Suppress 'stopped' state change if we are cancelling flow silently
            if (!(stateValue === 'stopped' && this._suppressStopEvent)) {
                this.emit('flow:state_change', {
                    state: stateValue,
                    currentBlock: snapshot.context.currentBlockId,
                    context: snapshot.context.execContext,
                    sessionId: this.currentSessionId,
                    error: snapshot.context.error,
                    summary: (snapshot.event as any)?.output?.summary,
                    activeProgramId: this.activeProgramId
                });
            }

            // Emit specific events for terminal states
            if (['stopped', 'error', 'completed'].includes(stateValue)) {
                if (stateValue === 'stopped' && this._suppressStopEvent) {
                    logger.info('🛑 Stop Event Suppressed (Flow Cancellation)');
                    return;
                }

                this.emit('flow:stopped', {
                    sessionId: this.currentSessionId!,
                    reason: stateValue,
                    activeProgramId: this.activeProgramId
                });
            }
        });
    }

    public registerExecutor(executor: IBlockExecutor) {
        this.executors.set(executor.type, executor);
    }

    /**
     * Load a flow into memory (Idle -> Loaded state).
     */
    public async loadProgram(programId: string, overrides: Record<string, any> = {}): Promise<string> {
        // HARD RESET: Ensure clean state before loading new program
        this.currentSessionId = null;
        this._suppressStopEvent = false;
        this.initializeActor();

        // 1. Load Flow from DB
        const flow = await flowRepository.findById(programId);
        if (!flow) {
            throw new Error(`Flow not found: ${programId}`);
        }
        this.currentProgramName = flow.name;

        if (!flow.isActive) {
            logger.warn({ programId }, '⚠️ Loading inactive flow into AutomationEngine');
        }

        if (flow.validationStatus === 'INVALID') {
            throw new Error(`Cannot load invalid flow (Draft mode): ${programId}`);
        }

        // 2. Resolve Inputs & Variables
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
                const key = v.id || v.name;
                const name = v.name;
                variableDefinitions[key] = { type: v.type, unit: v.unit, scope: v.scope, name: name };

                let val = undefined;
                if (v.id && overrides[v.id] !== undefined) val = overrides[v.id];
                else if (name && overrides[name] !== undefined) val = overrides[name];
                else if (v.default !== undefined) val = v.default;

                if (val !== undefined) {
                    variables[key] = val;
                    if (v.id && name) {
                        variables[name] = val;
                    }

                    // Tolerance Injection
                    if (name) {
                        const nameTol = `${name}_tolerance`;
                        const nameMode = `${name}_tolerance_mode`;
                        const idTol = `${key}_tolerance`;
                        const idMode = `${key}_tolerance_mode`;

                        if (overrides[nameTol] !== undefined) {
                            variables[nameTol] = overrides[nameTol];
                            variables[idTol] = overrides[nameTol];
                        }
                        if (overrides[nameMode] !== undefined) {
                            variables[nameMode] = overrides[nameMode];
                            variables[idMode] = overrides[nameMode];
                        }
                        if (overrides[idTol] !== undefined) variables[idTol] = overrides[idTol];
                        if (overrides[idMode] !== undefined) variables[idMode] = overrides[idMode];
                    }
                }
            });
        }

        // System Overrides
        if (overrides['_parentCycleSessionId']) variables['_parentCycleSessionId'] = overrides['_parentCycleSessionId'];
        if (overrides['_triggerReason']) variables['_triggerReason'] = overrides['_triggerReason'];
        if (overrides['_triggerSummary']) variables['_triggerSummary'] = overrides['_triggerSummary'];
        if (overrides['_triggerIndex']) variables['_triggerIndex'] = overrides['_triggerIndex'];

        // Store metadata for events
        if (overrides['activeProgramId']) this.activeProgramId = overrides['activeProgramId'];
        if (overrides['windowId']) this.currentWindowId = overrides['windowId'];
        if (overrides['windowName']) this.currentWindowName = overrides['windowName'];
        this.executionType = overrides['executionType'] || null;

        // 3. Cleanup zombie sessions
        try {
            const { ExecutionSessionModel } = require('../persistence/schemas/ExecutionSession.schema');
            await ExecutionSessionModel.updateMany(
                { status: { $in: ['running', 'paused'] } },
                { $set: { status: 'error', endTime: new Date(), error: 'Forcefully terminated: Preempted by new Execution' } }
            );
        } catch (err: any) {
            logger.warn({ err: err.message }, '⚠️ Auto-Cleanup failed');
        }

        // 4. Create Session
        const session = await sessionRepository.create({
            programId: flow.id,
            programName: flow.name,
            startTime: new Date(),
            status: 'loaded',
            logs: [],
            context: { resumeState: {}, variables: variables, variableDefinitions: variableDefinitions }
        });

        this.currentSessionId = session.id;
        logger.info({ sessionId: this.currentSessionId, programId, variables }, '📥 Loading Program Session');

        // 5. Send LOAD event to Machine
        this.actor.send({
            type: 'LOAD',
            programId: flow.id,
            templateId: 'default',
            blocks: flow.nodes.map((n: any) => ({ id: n.id, type: n.type, params: n.params || n.data || {} })),
            edges: flow.edges as any[],
            execContext: { variables, variableDefinitions, resumeState: {} }
        } as any);

        // Emit flow:loaded event
        this.emit('flow:loaded', { flowId: flow.id, sessionId: this.currentSessionId, flowName: flow.name });

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

        this.executionStartTime = Date.now();
        this._suppressStopEvent = false;
        this.actor.send({ type: 'START' });

        this.emit('flow:started', {
            programId: this.activeProgramId || 'unknown',
            sessionId: this.currentSessionId!,
            programName: this.currentProgramName || 'Unknown Program',
            activeProgramId: this.activeProgramId,
            executionType: this.executionType
        });
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

    /**
     * Cancel current execution flow silently.
     * Stops the engine but suppresses the 'flow:stopped' event.
     */
    public cancelFlow() {
        logger.info('🛑 Cancelling Flow Silently...');
        this._suppressStopEvent = true;
        this.actor.send({ type: 'STOP' });
    }

    public getSnapshot() {
        const snapshot = this.actor.getSnapshot();
        return { ...snapshot, sessionId: this.currentSessionId };
    }

    public getStatus() {
        const snapshot = this.getSnapshot();
        return { status: snapshot.value as string, sessionId: snapshot.sessionId };
    }

    /**
     * Safety Stop Mechanism: Revert active resources to their initial state.
     */
    private async cleanupResources(context: ExecutionContext) {
        if (!context.activeResources) return;

        const resources = Object.values(context.activeResources);
        if (resources.length === 0) return;

        logger.info({ count: resources.length }, '🛡️ Safety Stop: Checking active resources for cleanup...');

        for (const res of resources) {
            if (res.revertOnStop) {
                try {
                    if (!res.driverId) continue;
                    logger.info({ deviceId: res.deviceId, restoreTo: res.initialState }, '🔄 Safety Stop: Reverting Device Status');
                    await this.deviceService.sendCommand(res.deviceId, res.driverId, 'RELAY_SET', { state: res.initialState });

                    // Emit resource released event
                    this.emit('resource:released', { deviceId: res.deviceId });
                } catch (err: any) {
                    logger.error({ err: err.message, deviceId: res.deviceId }, '❌ Failed to revert device state');
                }
            }
        }
    }

    /**
     * Helper to resolve variable references in params (e.g. "{{duration}}")
     */
    private resolveParams(
        params: Record<string, any>,
        variables: Record<string, any>,
        blockType?: string,
        variableDefinitions?: Record<string, any>
    ): Record<string, any> {
        const resolved: Record<string, any> = {};
        const timeFields = ['duration', 'timeout', 'interval', 'retryDelay'];

        for (const [key, value] of Object.entries(params)) {
            if ((blockType === 'IF' || blockType === 'LOOP') && key === 'value') {
                resolved[key] = value;
                continue;
            }

            if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
                const varName = value.slice(2, -2).trim();
                resolved[key] = variables[varName] !== undefined ? variables[varName] : value;

                if (timeFields.includes(key) && variableDefinitions && variableDefinitions[varName]) {
                    const varDef = variableDefinitions[varName];
                    if (varDef.unit) {
                        resolved[`_${key}SourceUnit`] = varDef.unit;
                    }
                }
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
                    const resolvedParamsForUI = this.resolveParams({ ...params, _blockId: blockId }, context.execContext.variables || {}, block.type, context.execContext.variableDefinitions);

                    let label = resolvedParamsForUI.label || block.type;
                    if (block.type === 'LOG') label = `Log: ${resolvedParamsForUI.message || ''}`;

                    let duration = 0;
                    if (block.type === 'WAIT' && resolvedParamsForUI.duration) duration = Number(resolvedParamsForUI.duration);
                    if (block.type === 'ACTUATOR_SET' && resolvedParamsForUI.action) {
                        const amount = Number(resolvedParamsForUI.amount) || 1;
                        if (resolvedParamsForUI.action === 'DOSE') {
                            duration = amount * 1150;
                        } else if (resolvedParamsForUI.action === 'PULSE_ON' || resolvedParamsForUI.action === 'PULSE_OFF') {
                            duration = Number(resolvedParamsForUI.duration) * 1000 || 0;
                        }
                    }

                    // Emit block_start event
                    this.emit('flow:block_start', {
                        blockId, type: block.type, sessionId: this.currentSessionId,
                        blockLabel: label, expectedDuration: duration, activeProgramId: this.activeProgramId
                    });

                    // Emit execution_step event
                    this.emit('flow:execution_step', {
                        blockId, type: block.type, sessionId: this.currentSessionId,
                        label: label, duration: duration, timestamp: Date.now(), params: resolvedParamsForUI
                    });
                }

                const resolvedParams = this.resolveParams({ ...params, _blockId: blockId }, context.execContext.variables || {}, block.type, context.execContext.variableDefinitions);
                const result = await executor.execute(context.execContext, resolvedParams, signal);

                // --- UNIFIED FAILURE HANDLING ---
                if (!result.success) {
                    const errorMessage = result.error || 'Block execution returned failure';

                    if (onFailure === 'STOP') {
                        throw new Error(errorMessage);
                    } else if (onFailure === 'PAUSE') {
                        logger.warn({ blockId, error: errorMessage }, '⚠️ Block Failed. Action: PAUSE');
                        this.emit('flow:block_end', {
                            blockId, blockType: block.type, blockLabel: params.label || block.type,
                            success: false, error: errorMessage, output: { systemAction: 'PAUSE' },
                            sessionId: this.currentSessionId, activeProgramId: this.activeProgramId
                        });
                        return { success: false, output: { systemAction: 'PAUSE' } };
                    } else if (onFailure === 'CONTINUE') {
                        logger.warn({ blockId, error: errorMessage }, '⚠️ Block Failed. Action: CONTINUE');
                    }
                }

                // Success!
                let finalSummary = result.summary;
                if (block.type === 'END' && this.executionStartTime > 0) {
                    const totalMs = Date.now() - this.executionStartTime;
                    const mins = Math.floor(totalMs / 60000);
                    const secs = ((totalMs % 60000) / 1000).toFixed(1);
                    finalSummary = `Total Time: ${mins}m ${secs}s`;
                }

                this.emit('flow:block_end', {
                    blockId, blockType: block.type, blockLabel: params.label || block.type,
                    success: true, output: result.output, summary: finalSummary, logData: result.logData,
                    sessionId: this.currentSessionId, programName: this.currentProgramName,
                    activeProgramId: this.activeProgramId, windowId: this.currentWindowId, windowName: this.currentWindowName,
                    notification: { channelId: params.notificationChannelId, mode: params.notificationMode, config: params }
                });

                // Loop Safety Check
                if (result.output && result.output.status === 'MAX_ITERATIONS') {
                    const onSafety = params.onMaxIterations || 'STOP';
                    if (onSafety === 'CONTINUE') {
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

                // SYSTEM ACTION HANDLER (LOG Block Control)
                if (result.output && typeof result.output === 'object' && result.output.systemAction) {
                    const action = result.output.systemAction;
                    if (action === 'PAUSE') {
                        const targetBlockId = nextBlockId || blockId;
                        logger.info({ blockId, action, targetBlockId }, '⏸️ System Action: PAUSE triggered');
                        this.actor.send({ type: 'PAUSE', resumeState: { blockId: targetBlockId } } as any);
                    } else if (action === 'STOP') {
                        logger.info({ blockId }, '🛑 System Action: STOP triggered');
                        // Emit signal event instead of calling activeProgramService directly
                        this.emit('flow:signal', { signal: 'STOP_PROGRAM', blockId, activeProgramId: this.activeProgramId });
                        this.actor.send({ type: 'STOP' });
                    }
                }

                let currentResumeState = { ...(context.execContext.resumeState || {}) };
                if (result.state) {
                    currentResumeState[blockId] = result.state;
                }

                return {
                    nextBlockId,
                    output: result.output,
                    variables: context.execContext.variables,
                    resumeState: currentResumeState
                };
            } catch (err: any) {
                lastError = err;
                attempts++;
                logger.warn({ blockId, attempt: attempts, err: err.message }, `Block execution failed`);
                if (attempts <= retryCount) await new Promise(r => setTimeout(r, retryDelay));
            }
        }

        // FAILURE HANDLING
        this.emit('flow:block_end', {
            blockId, blockType: block.type, blockLabel: params.label || block.type,
            success: false, error: lastError?.message || 'Block Failed',
            sessionId: this.currentSessionId, activeProgramId: this.activeProgramId,
            windowId: this.currentWindowId, windowName: this.currentWindowName,
            notification: { channelId: params.notificationChannelId, mode: params.notificationMode }
        });

        logger.error({ blockId, policy: onFailure }, 'All retries exhausted.');

        if (onFailure === 'CONTINUE') {
            let edge = context.edges.find(e => e.source === blockId && e.sourceHandle === 'exit');
            if (!edge) edge = context.edges.find(e => e.source === blockId && e.sourceHandle === 'false');
            if (!edge) edge = context.edges.find(e => e.source === blockId && (e.sourceHandle === 'default' || !e.sourceHandle));
            if (!edge) edge = context.edges.find(e => e.source === blockId);
            return { nextBlockId: edge ? edge.target : null };
        }

        if (onFailure === 'PAUSE') {
            this.actor.send({ type: 'PAUSE', resumeState: { blockId } } as any);
            return new Promise(() => { });
        }

        if (onFailure === 'GOTO_LABEL') {
            const targetLabelName = params.errorTargetLabel;
            if (targetLabelName) {
                if (targetLabelName === 'END') {
                    const endBlockEntry = Array.from(context.blocks.entries()).find(([_id, b]) => b.type === 'END');
                    if (endBlockEntry) return { nextBlockId: endBlockEntry[0] };
                    return { nextBlockId: null };
                }
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

// Export singleton instance
export const automation = new AutomationEngine(historyService, unitConversionService, hardware);

import { ActiveProgramModel, IActiveProgram, IActiveScheduleItem, IWindowState } from '../persistence/schemas/ActiveProgram.schema';
import { programRepository } from '../persistence/repositories/ProgramRepository';
import { logger } from '../../core/LoggerService';
import { cycleManager } from './CycleManager';
import { automation } from '../automation/AutomationEngine';
import { events } from '../../core/EventBusService';

/**
 * ActiveProgramService v2.0
 * 
 * Orchestrator for Active Programs. Listens to AutomationEngine events
 * and manages the lifecycle of programs (load, start, stop, pause).
 * 
 * Key Changes from v1:
 * - Uses AutomationEngine EventEmitter instead of global events bus
 * - Cleaner separation of concerns
 * - No circular dependency (Engine doesn't import this service)
 */
export class ActiveProgramService {

    constructor() {
        this.setupEngineListeners();
    }

    /**
     * Setup listeners for AutomationEngine events
     */
    private setupEngineListeners() {
        // Listen for flow state changes
        automation.on('flow:state_change', async (event: any) => {
            try {
                const active = await this.getActive();
                if (!active) return;

                // 1. Handle PAUSE
                if (event.state === 'paused' && active.status !== 'paused') {
                    logger.info('⏸️ Syncing Active Program Status: Engine -> Paused');
                    active.status = 'paused';
                    await active.save();
                }
                // 2. Handle RESUME (Running)
                else if (event.state === 'running' && active.status !== 'running') {
                    logger.info('▶️ Syncing Active Program Status: Engine -> Running');
                    active.status = 'running';
                    await active.save();
                }
            } catch (error) {
                logger.error({ error }, '❌ Error syncing active program status');
            }
        });

        // Listen for STOP_PROGRAM signal from LOG block
        automation.on('flow:signal', async (event: any) => {
            if (event.signal === 'STOP_PROGRAM') {
                logger.info({ activeProgramId: event.activeProgramId }, '🛑 Received STOP_PROGRAM signal from flow');
                try {
                    const active = await this.getActive();
                    if (active && active.status !== 'paused') {
                        await this.stop();
                    }
                } catch (err: any) {
                    logger.error({ err: err.message }, '❌ Failed to stop Active Program from signal');
                }
            }
        });
    }

    /**
     * Load a program template into the active state.
     */
    async loadProgram(programId: string, globalOverrides: Record<string, any> = {}, minCycleInterval: number = 0): Promise<IActiveProgram> {
        // 1. Check if running
        const existing = await ActiveProgramModel.findOne();
        if (existing && existing.status === 'running') {
            throw new Error('Cannot load new program while another is running. Stop it first.');
        }

        // 2. Get Template
        const template = await programRepository.findById(programId);
        if (!template) throw new Error(`Program template not found: ${programId}`);

        // 3. Validation Check
        const { FlowModel } = require('../persistence/schemas/Flow.schema');
        const allFlows = await FlowModel.find({}, { id: 1, name: 1, validationStatus: 1 });
        const flowMap = new Map(allFlows.map((f: any) => [f.id, f]));

        const checkFlow = (flowId: string) => {
            const flow = flowMap.get(flowId) as any;
            if (!flow) throw new Error(`Cannot load program. Referenced flow '${flowId}' was not found.`);
            if (flow.validationStatus === 'INVALID') throw new Error(`Cannot load program. Flow '${flow.name}' is invalid.`);
        };

        // Check Basic Schedule
        if (template.schedule) {
            for (const item of template.schedule) {
                if (item.steps) {
                    for (const step of item.steps) checkFlow(step.flowId);
                }
            }
        }

        // Check Advanced Windows
        if (template.windows) {
            for (const window of template.windows) {
                if (window.triggers) {
                    for (const trigger of window.triggers) {
                        if (trigger.flowId) checkFlow(trigger.flowId);
                        if (trigger.flowIds) {
                            for (const fid of trigger.flowIds) checkFlow(fid);
                        }
                    }
                }
                if (window.fallbackFlowId) checkFlow(window.fallbackFlowId);
                // @ts-ignore
                if (window.fallbackFlowIds) {
                    // @ts-ignore
                    for (const fid of window.fallbackFlowIds) checkFlow(fid);
                }
            }
        }

        // 4. Clear existing
        await ActiveProgramModel.deleteMany({});

        // 5. Build active program data
        const programType = template.type || 'BASIC';
        const activeProgramData: any = {
            sourceProgramId: template.id,
            name: template.name,
            status: 'loaded',
            type: programType,
            minCycleInterval: minCycleInterval || template.minCycleInterval || 60,
            variableOverrides: globalOverrides
        };

        if (programType === 'ADVANCED' && template.windows) {
            activeProgramData.windows = template.windows;
            activeProgramData.windowsState = template.windows.map(w => ({
                windowId: w.id,
                status: 'pending',
                triggersExecuted: [],
                triggersExecuting: [],
                lastCheck: undefined
            } as IWindowState));
            activeProgramData.schedule = [];
            logger.info({ program: template.name, windowCount: template.windows.length }, '📥 Advanced Program Loaded');
        } else {
            const scheduleItems = template.schedule.map(item => {
                const cycleId = (item as any)._id?.toString() || Math.random().toString(36).substring(7);
                return {
                    time: item.time,
                    name: item.name,
                    description: item.description,
                    cycleId: cycleId,
                    cycleName: item.name,
                    cycleDescription: item.description,
                    steps: item.steps,
                    overrides: { ...globalOverrides, ...((item as any).overrides || {}) },
                    status: 'pending'
                } as IActiveScheduleItem;
            });
            activeProgramData.schedule = scheduleItems;
            logger.info({ program: template.name }, '📥 Basic Program Loaded');
        }

        // 6. Create Active Program
        const activeProgram = await ActiveProgramModel.create(activeProgramData);

        // 7. Sync persistent state
        await programRepository.syncActiveStatus(template.id);

        return activeProgram;
    }

    /**
     * Update the active program settings (before starting).
     */
    async updateProgram(updates: Partial<IActiveProgram> & { globalOverrides?: Record<string, any>, windowOverrides?: Record<string, any>, windows?: any[] }): Promise<IActiveProgram> {
        const active = await this.getActive();
        if (!active) throw new Error('No active program loaded');

        const isAdvancedWindowUpdate = active.type === 'ADVANCED' &&
            ((updates.windows && Object.keys(updates).length === 1) || (updates.windowOverrides && Object.keys(updates).length === 1));

        if (!isAdvancedWindowUpdate && active.status !== 'loaded' && active.status !== 'ready') {
            throw new Error('Cannot update program settings after it has started');
        }

        if (updates.minCycleInterval !== undefined) active.minCycleInterval = updates.minCycleInterval;
        if (updates.schedule) active.schedule = updates.schedule;

        if (updates.windows && active.type === 'ADVANCED') {
            (active as any).windows = updates.windows;
        }

        if (updates.globalOverrides) {
            if (active.type === 'ADVANCED') {
                (active as any).variableOverrides = updates.globalOverrides;
            } else {
                active.schedule.forEach(item => {
                    item.overrides = { ...item.overrides, ...updates.globalOverrides };
                });
            }
        }

        if (updates.windowOverrides && active.type === 'ADVANCED') {
            (active as any).windowOverrides = updates.windowOverrides;
        }

        if (updates.status === 'ready') active.status = 'ready';

        await active.save();
        logger.info('📝 Active Program Updated');
        return active;
    }

    /**
     * Get variables defined in the flows of the active program.
     */
    async getProgramVariables(): Promise<Record<string, any[]>> {
        const active = await this.getActive();
        if (!active) return {};

        const FlowModel = require('../persistence/schemas/Flow.schema').FlowModel;
        const variablesMap: Record<string, any[]> = {};

        const getFlowName = async (id: string) => {
            const f = await FlowModel.findOne({ id });
            return f ? f.name : id;
        };

        const extractFlowVariables = async (flowId: string, scopedSeenVars: Set<string>, outputArray: any[]) => {
            const flow = await FlowModel.findOne({ id: flowId });
            if (flow && flow.variables) {
                for (const v of flow.variables) {
                    if (v.scope === 'global' && !scopedSeenVars.has(v.name)) {
                        outputArray.push({
                            name: v.name, type: v.type, default: v.value, unit: v.unit,
                            hasTolerance: v.hasTolerance, description: v.description,
                            flowId: flowId, flowName: flow.name, flowDescription: flow.description
                        });
                        scopedSeenVars.add(v.name);
                    }
                }
            }
        };

        if (active.type === 'ADVANCED' && (active as any).windows) {
            const windowContexts: Record<string, any[]> = {};
            for (const window of (active as any).windows) {
                const windowId = window.id;
                windowContexts[windowId] = [];

                const addContext = async (fid: string, contextId: string, label: string, description?: string) => {
                    const vars: any[] = [];
                    await extractFlowVariables(fid, new Set<string>(), vars);
                    if (vars.length > 0) {
                        windowContexts[windowId].push({ contextId, label, description, variables: vars });
                    }
                };

                if (window.triggers) {
                    for (let tIdx = 0; tIdx < window.triggers.length; tIdx++) {
                        const trigger = window.triggers[tIdx];
                        const triggerName = `Trigger ${tIdx + 1}`;
                        if (trigger.flowIds && Array.isArray(trigger.flowIds) && trigger.flowIds.length > 0) {
                            for (let fIdx = 0; fIdx < trigger.flowIds.length; fIdx++) {
                                const fid = trigger.flowIds[fIdx];
                                await addContext(fid, `t_${tIdx}_f_${fIdx}`, `${triggerName}: ${await getFlowName(fid)}`, trigger.description);
                            }
                        } else if (trigger.flowId) {
                            await addContext(trigger.flowId, `t_${tIdx}_f_0`, `${triggerName}: ${await getFlowName(trigger.flowId)}`, trigger.description);
                        }
                    }
                }

                if ((window as any).fallbackFlowIds && (window as any).fallbackFlowIds.length > 0) {
                    for (let fIdx = 0; fIdx < (window as any).fallbackFlowIds.length; fIdx++) {
                        const fid = (window as any).fallbackFlowIds[fIdx];
                        await addContext(fid, `fb_${fIdx}`, `Fallback: ${await getFlowName(fid)}`, window.description);
                    }
                } else if (window.fallbackFlowId) {
                    await addContext(window.fallbackFlowId, `fb_0`, `Fallback: ${await getFlowName(window.fallbackFlowId)}`, window.description);
                }
            }
            return windowContexts;
        } else {
            for (const item of active.schedule) {
                const cycleId = item.cycleId;
                if (!item.steps || item.steps.length === 0) continue;
                if (!variablesMap[cycleId]) variablesMap[cycleId] = [];

                for (let i = 0; i < item.steps.length; i++) {
                    const step = item.steps[i];
                    const vars: any[] = [];
                    await extractFlowVariables(step.flowId, new Set<string>(), vars);
                    if (vars.length > 0) {
                        variablesMap[cycleId].push({ stepIndex: i, flowId: step.flowId, flowName: await getFlowName(step.flowId), variables: vars });
                    }
                }
            }
        }
        return variablesMap;
    }

    /**
     * Start the loaded program.
     */
    async start(startTime?: Date, options?: { resumeStrategy?: 'resume_flow' | 'skip_active' | 'stop_program' | 'run_expired' | 'skip_expired' | 'terminate_flow' | 'clean_start', expiredStrategy?: 'run' | 'skip' }): Promise<IActiveProgram | { status: 'confirmation_required', resumeContext: any }> {
        const active = await this.getActive();
        if (!active) throw new Error('No active program loaded');

        if (active.status === 'running') return active;

        const previousStatus = active.status;

        // --- RESUME LOGIC ---
        if (active.type === 'ADVANCED' && active.windowsState && previousStatus === 'paused') {
            const { timeService } = require('../../core/TimeService');
            const now = timeService.now();
            const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            const timeToMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
            const currentMin = timeToMin(currentTimeStr);

            const activeWindows = active.windowsState.filter(ws => !!ws.currentFlowSessionId);
            const expiredWindows: any[] = [];
            active.windowsState.forEach(ws => {
                const winDef = (active as any).windows.find((w: any) => w.id === ws.windowId);
                if (winDef && ws.status !== 'completed' && ws.status !== 'skipped') {
                    const endMin = timeToMin(winDef.endTime);
                    if (currentMin > endMin) expiredWindows.push({ windowId: ws.windowId, name: winDef.name });
                }
            });

            let contextType: 'active_flow' | 'active_with_expired' | 'expired' | 'clean' = 'clean';
            if (activeWindows.length > 0 && expiredWindows.length > 0) contextType = 'active_with_expired';
            else if (activeWindows.length > 0) contextType = 'active_flow';
            else if (expiredWindows.length > 0) contextType = 'expired';

            if (!options?.resumeStrategy) {
                logger.info({ contextType, activeCount: activeWindows.length, expiredCount: expiredWindows.length }, '⏸️ Resume Check: Confirmation Required');
                return {
                    status: 'confirmation_required',
                    resumeContext: {
                        type: contextType,
                        activeWindows: activeWindows.map(ws => {
                            const def = (active as any).windows.find((w: any) => w.id === ws.windowId);
                            return { id: ws.windowId, name: def ? def.name : 'Unknown' };
                        }),
                        expiredWindows: expiredWindows
                    }
                };
            }

            // Handle Strategies
            if (options?.resumeStrategy === 'skip_active') {
                automation.stopProgram();
                active.status = 'running';
                activeWindows.forEach(ws => { ws.status = 'skipped'; ws.currentFlowSessionId = undefined; ws.triggersExecuting = []; });
                expiredWindows.forEach(exp => { const ws = active.windowsState!.find(w => w.windowId === exp.windowId); if (ws) ws.status = 'skipped'; });
                active.markModified('windowsState');
            } else if (options?.resumeStrategy === 'terminate_flow') {
                logger.info('🛑 Strategy: Terminating Active Flow & Continuing Program');
                if (active.pauseFlowSessionId) {
                    const { ExecutionSessionModel } = await import('../persistence/schemas/ExecutionSession.schema');
                    await ExecutionSessionModel.findByIdAndUpdate(active.pauseFlowSessionId, {
                        status: 'interrupted', endTime: new Date(),
                        $push: { logs: { timestamp: new Date(), level: 'WARN', message: 'Flow interrupted by user during resume' } }
                    });
                }
                automation.cancelFlow();
                active.status = 'running';
                if (active.pauseWindowId) {
                    const ws = active.windowsState?.find(w => w.windowId === active.pauseWindowId);
                    if (ws) {
                        ws.status = 'interrupted';
                        ws.currentFlowSessionId = undefined;
                        ws.triggersExecuting = [];

                        // Emit window completion event for UI/logging
                        const winDef = (active as any).windows?.find((w: any) => w.id === active.pauseWindowId);
                        events.emit('advanced:window_completed', {
                            programId: active.sourceProgramId,
                            windowId: active.pauseWindowId,
                            windowName: winDef?.name || 'Unknown',
                            result: 'interrupted',
                            timestamp: new Date()
                        });
                    }
                }
                active.markModified('windowsState');
            } else if (options?.resumeStrategy === 'skip_expired') {
                expiredWindows.forEach(exp => {
                    const ws = active.windowsState!.find(w => w.windowId === exp.windowId);
                    if (ws) { ws.status = 'skipped'; ws.lastCheck = new Date(); }
                });
                active.markModified('windowsState');
            } else if (options?.resumeStrategy === 'run_expired') {
                const { triggerEvaluator } = await import('./TriggerEvaluator');
                for (const exp of expiredWindows) {
                    const ws = active.windowsState!.find(w => w.windowId === exp.windowId);
                    const winDef = (active as any).windows.find((w: any) => w.id === exp.windowId);
                    if (ws && winDef) {
                        try {
                            const result = await triggerEvaluator.evaluateWindow(winDef, ws, active.variableOverrides, (active as any).windowOverrides?.[winDef.id] || {}, active.sourceProgramId);
                            if (result === 'triggered' || result === 'executing') ws.status = result === 'executing' ? 'active' : 'completed';
                            else {
                                await triggerEvaluator.executeFallback(winDef, active.variableOverrides, (active as any).windowOverrides?.[winDef.id] || {}, active.sourceProgramId);
                                ws.status = 'completed';
                            }
                        } catch (e) { /* ignore */ }
                    }
                }
                active.markModified('windowsState');
            } else if (options?.resumeStrategy === 'stop_program') {
                return this.stop();
            }
        }

        if (startTime && new Date(startTime) > new Date()) {
            active.status = 'scheduled';
            active.startTime = new Date(startTime);
            await active.save();
            logger.info({ startTime: active.startTime }, '⏳ Active Program Scheduled');
            return active;
        } else {
            active.status = 'running';
            if (!active.startTime) active.startTime = new Date();
            logger.info('▶️ Active Program Started/Resumed');

            const shouldResumeEngine = previousStatus === 'paused' && options?.resumeStrategy !== 'terminate_flow' && options?.resumeStrategy !== 'clean_start';
            if (shouldResumeEngine) {
                logger.info('▶️ Resuming Paused Program in Automation Engine');
                automation.resumeProgram();
            }

            active.schedule.forEach(item => { if (item.status === 'failed' || item.status === 'running') item.status = 'pending'; });

            if (previousStatus === 'paused') {
                active.pausedAt = undefined;
                active.pauseFlowSessionId = undefined;
                active.pauseFlowName = undefined;
                active.pauseBlockId = undefined;
                active.pauseBlockLabel = undefined;
                active.pauseWindowId = undefined;
                active.pauseWindowName = undefined;
                active.pauseTimeout = undefined;
                const { pauseTimeoutService } = await import('./PauseTimeoutService');
                pauseTimeoutService.stop();
            }

            await active.save();

            if (active.type === 'ADVANCED' && active.status === 'running') {
                const isResumingActiveFlow = (options?.resumeStrategy === 'resume_flow');
                if (!isResumingActiveFlow) {
                    setImmediate(async () => {
                        try {
                            const { schedulerService } = await import('./SchedulerService');
                            await schedulerService.triggerImmediateCheck({ silent: !!options?.expiredStrategy });
                        } catch (error: any) {
                            logger.error({ error: error.message }, '❌ Failed to trigger immediate check');
                        }
                    });
                } else {
                    logger.info('⏭️ Skipping Force Check (resuming active flow)');
                }
            }
            return active;
        }
    }

    /**
     * Stop the active program.
     */
    async stop(): Promise<IActiveProgram> {
        const active = await this.getActive();
        if (!active) throw new Error('No active program loaded');

        active.status = 'stopped';
        active.endTime = new Date();

        await cycleManager.stopCycle();

        active.schedule.forEach(item => { if (item.status === 'failed' || item.status === 'running') item.status = 'pending'; });

        if (active.type === 'ADVANCED' && active.windowsState) {
            active.windowsState.forEach(ws => {
                if (ws.status === 'active') { ws.status = 'pending'; ws.triggersExecuting = []; ws.currentFlowSessionId = undefined; }
                if (ws.status === 'pending' && ws.currentFlowSessionId) ws.currentFlowSessionId = undefined;
            });
            active.markModified('windowsState');
        }

        await active.save();
        logger.info('⏹️ Active Program Stopped');
        return active;
    }

    /**
     * Pause the active program.
     */
    async pause(options?: { timeout?: number }): Promise<IActiveProgram> {
        const active = await this.getActive();
        if (!active) throw new Error('No active program loaded');

        if (active.status === 'running') {
            const { ExecutionSessionModel } = await import('../persistence/schemas/ExecutionSession.schema');
            const activeSession = await ExecutionSessionModel.findOne({ status: 'running' });

            if (activeSession) {
                active.pauseFlowSessionId = activeSession._id.toString();
                active.pauseFlowName = activeSession.programName;
                const engineSnapshot = automation.getSnapshot();
                active.pauseBlockId = engineSnapshot.context?.currentBlockId;

                const { flowRepository } = await import('../persistence/repositories/FlowRepository');
                const flow = await flowRepository.findById(activeSession.programId) as any;
                if (flow) {
                    const flowData = flow.toObject() as any;
                    const blocks = flowData.blocks || flowData.nodes || [];
                    const block = blocks.find((b: any) => b.id === active.pauseBlockId);
                    active.pauseBlockLabel = block?.params?.label || active.pauseBlockId;
                } else {
                    active.pauseBlockLabel = active.pauseBlockId;
                }
                automation.pauseProgram();
            } else {
                active.pauseFlowSessionId = undefined;
                active.pauseFlowName = undefined;
                active.pauseBlockId = undefined;
                active.pauseBlockLabel = undefined;
            }

            const currentWindow = active.windowsState?.find(w => w.status === 'active');
            if (currentWindow) {
                const windowDef = active.windows?.find(w => w.id === currentWindow.windowId);
                active.pauseWindowId = currentWindow.windowId;
                active.pauseWindowName = windowDef?.name;
            }

            active.status = 'paused';
            active.pausedAt = new Date();
            active.pauseTimeout = options?.timeout || 600;
            await active.save();

            const io = (global as any).socketIO;
            if (io) io.emit('program:paused', { programId: active.sourceProgramId, pausedAt: active.pausedAt, timeout: active.pauseTimeout });

            logger.info({ hasActiveFlow: !!activeSession, flowName: active.pauseFlowName, blockId: active.pauseBlockId, blockLabel: active.pauseBlockLabel, windowId: active.pauseWindowId, timeout: active.pauseTimeout }, '⏸️ Active Program Paused');
        }
        return active;
    }

    /**
     * Unload (remove) the active program.
     */
    async unload(): Promise<void> {
        await ActiveProgramModel.deleteMany({});
        await cycleManager.stopCycle();
        await programRepository.syncActiveStatus(null);
        logger.info('🗑️ Active Program Unloaded');
    }

    // === BASIC MODE: Cycle Management ===

    async updateScheduleItem(itemId: string, updates: { time?: string, overrides?: Record<string, any>, steps?: any[] }): Promise<IActiveProgram> {
        const active = await this.getActive();
        if (!active) throw new Error('No active program');
        const item = active.schedule.find(i => (i as any)._id.toString() === itemId);
        if (!item) throw new Error('Schedule item not found');
        if (item.status === 'running') throw new Error('Cannot update a cycle that is currently running');

        if (updates.time) {
            item.time = updates.time;
            if (item.status === 'completed' || item.status === 'failed') { item.status = 'pending'; }
        }
        if (updates.overrides) item.overrides = { ...item.overrides, ...updates.overrides };
        if (updates.steps && Array.isArray(updates.steps)) {
            updates.steps.forEach((uStep, idx) => { if (item.steps[idx] && uStep.overrides) item.steps[idx].overrides = { ...item.steps[idx].overrides, ...uStep.overrides }; });
        }

        await active.save();
        logger.info({ itemId, updates }, '✏️ Schedule Item Updated');
        return active;
    }

    async swapCycles(itemIdA: string, itemIdB: string): Promise<IActiveProgram> {
        const active = await this.getActive();
        if (!active) throw new Error('No active program');
        const indexA = active.schedule.findIndex(i => (i as any)._id.toString() === itemIdA);
        const indexB = active.schedule.findIndex(i => (i as any)._id.toString() === itemIdB);
        if (indexA === -1 || indexB === -1) throw new Error('Schedule item not found');

        const itemA = active.schedule[indexA];
        const itemB = active.schedule[indexB];
        if (itemA.status === 'running' || itemB.status === 'running') throw new Error('Cannot swap cycles that are running');

        const tempCycleId = itemA.cycleId; const tempOverrides = itemA.overrides; const tempCycleName = itemA.cycleName;
        itemA.cycleId = itemB.cycleId; itemA.overrides = itemB.overrides; itemA.cycleName = itemB.cycleName;
        itemB.cycleId = tempCycleId; itemB.overrides = tempOverrides; itemB.cycleName = tempCycleName;

        await active.save();
        logger.info({ indexA, indexB }, '🔄 Cycles Swapped');
        return active;
    }

    async skipCycle(itemId: string, type: 'once' | 'until', untilDate?: Date): Promise<IActiveProgram> {
        const active = await this.getActive();
        if (!active) throw new Error('No active program');
        const item = active.schedule.find(i => (i as any)._id.toString() === itemId);
        if (!item) throw new Error('Schedule item not found');
        item.status = 'skipped';
        if (type === 'until' && untilDate) item.skipUntil = untilDate;
        await active.save();
        logger.info({ itemId, type }, '⏭️ Cycle Skipped');
        return active;
    }

    async restoreCycle(itemId: string): Promise<IActiveProgram> {
        const active = await this.getActive();
        if (!active) throw new Error('No active program');
        const item = active.schedule.find(i => (i as any)._id.toString() === itemId);
        if (!item) throw new Error('Schedule item not found');
        if (item.status !== 'skipped') throw new Error('Cannot restore a cycle that is not skipped');
        item.status = 'pending'; item.skipUntil = undefined;
        await active.save();
        logger.info({ itemId }, '⏪ Cycle Restored');
        return active;
    }

    async retryCycle(itemId: string): Promise<IActiveProgram> {
        const active = await this.getActive();
        if (!active) throw new Error('No active program');
        const item = active.schedule.find(i => (i as any)._id.toString() === itemId);
        if (!item) throw new Error('Schedule item not found');
        if (item.status !== 'failed') throw new Error('Cannot retry a cycle that is not failed');
        item.status = 'pending';
        const now = new Date();
        item.time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        await active.save();
        logger.info({ itemId, newTime: item.time }, '🔄 Cycle Retried');
        return active;
    }

    async forceStartCycle(itemId: string): Promise<IActiveProgram> {
        const active = await this.getActive();
        if (!active) throw new Error('No active program');
        const item = active.schedule.find(i => (i as any)._id.toString() === itemId);
        if (!item) throw new Error('Schedule item not found');
        if (item.status === 'running') throw new Error('Cannot force start a cycle that is currently running');

        item.status = 'running';
        await active.save();

        const stepOverrides = item.steps?.map(s => ({ flowId: s.flowId, overrides: s.overrides })) || [];
        const runtimeOverrides = { ...active.variableOverrides, ...item.overrides, activeProgramId: active.sourceProgramId };

        try {
            await cycleManager.startCycle(item.cycleId, item.cycleName || item.name || 'Unknown Cycle', stepOverrides, runtimeOverrides);
            logger.info({ itemId }, '⚡ Cycle Force Started');
        } catch (error: any) {
            item.status = 'failed';
            await active.save();
            throw error;
        }
        return active;
    }

    async markCycleFailed(cycleId: string, reason: string): Promise<void> {
        const active = await this.getActive();
        if (!active) return;
        const item = active.schedule.find(i => i.cycleId === cycleId && (i.status === 'running' || i.status === 'pending'));
        if (item) { item.status = 'failed'; await active.save(); logger.info({ cycleId, reason }, '❌ Cycle Marked Failed'); }
    }

    async markCycleCompleted(cycleId: string): Promise<void> {
        const active = await this.getActive();
        if (!active) return;
        const item = active.schedule.find(i => i.cycleId === cycleId && i.status === 'running');
        if (item) { item.status = 'completed'; await active.save(); logger.info({ cycleId }, '✅ Cycle Marked Completed'); }
    }

    // === ADVANCED MODE: Window Management ===

    async skipWindow(windowId: string, untilDate: Date): Promise<IActiveProgram> {
        const active = await this.getActive();
        if (!active) throw new Error('No active program');
        if (!active.windowsState) throw new Error('Not an advanced program');
        const windowState = active.windowsState.find(w => w.windowId === windowId);
        if (!windowState) throw new Error('Window state not found');

        windowState.status = 'skipped';
        windowState.skipUntil = untilDate;
        windowState.triggersExecuting = [];
        windowState.currentFlowSessionId = undefined;
        active.markModified('windowsState');
        await active.save();
        logger.info({ windowId, untilDate }, '⏭️ Window Skipped');
        return active;
    }

    async restoreWindow(windowId: string): Promise<IActiveProgram> {
        const active = await this.getActive();
        if (!active) throw new Error('No active program');
        if (!active.windowsState) throw new Error('Not an advanced program');
        const windowState = active.windowsState.find(w => w.windowId === windowId);
        if (!windowState) throw new Error('Window state not found');
        if (windowState.status !== 'skipped') throw new Error('Cannot restore a window that is not skipped');

        windowState.status = 'pending';
        windowState.skipUntil = undefined;
        active.markModified('windowsState');
        await active.save();
        logger.info({ windowId }, '⏪ Window Restored');
        return active;
    }

    async updateTrigger(windowId: string, trigger: any): Promise<IActiveProgram> {
        const active = await this.getActive();
        if (!active) throw new Error('No active program');
        if (!active.windowsState) throw new Error('Not an advanced program');

        const windowDef = (active as any).windows.find((w: any) => w.id === windowId);
        if (!windowDef) throw new Error('Window definition not found');
        const windowState = active.windowsState.find(w => w.windowId === windowId);
        if (!windowState) throw new Error('Window state not found');
        if (windowState.status === 'active') throw new Error('Cannot edit trigger while window is active');

        const triggerIndex = windowDef.triggers.findIndex((t: any) => t.id === trigger.id);
        if (triggerIndex === -1) throw new Error('Trigger not found');

        windowDef.triggers[triggerIndex] = trigger;
        active.markModified('windows');
        await active.save();
        logger.info({ windowId, triggerId: trigger.id }, '✏️ Trigger Updated');
        return active;
    }

    /**
     * Get the current active program.
     */
    async getActive(): Promise<IActiveProgram | null> {
        return ActiveProgramModel.findOne();
    }
}

export const activeProgramService = new ActiveProgramService();

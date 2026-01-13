import { ActiveProgramModel, IActiveProgram, IActiveScheduleItem, IWindowState } from '../persistence/schemas/ActiveProgram.schema';
import { programRepository } from '../persistence/repositories/ProgramRepository';
import { logger } from '../../core/LoggerService';
import { cycleManager } from './CycleManager';

export class ActiveProgramService {

    /**
     * Load a program template into the active state.
     * Replaces any existing active program.
     * Supports both BASIC and ADVANCED program types.
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

        // 3. Validation Check: Ensure no flows are invalid OR missing
        const { FlowModel } = require('../persistence/schemas/Flow.schema');
        const allFlows = await FlowModel.find({}, { id: 1, name: 1, validationStatus: 1 });
        const flowMap = new Map(allFlows.map((f: any) => [f.id, f]));

        const checkFlow = (flowId: string) => {
            const flow = flowMap.get(flowId) as any;
            if (!flow) throw new Error(`Cannot load program. Referenced flow '${flowId}' was not found (deleted?).`);
            if (flow.validationStatus === 'INVALID') throw new Error(`Cannot load program. Flow '${flow.name}' is invalid/broken.`);
        };

        // Check Basic Schedule
        if (template.schedule) {
            for (const item of template.schedule) {
                if (item.steps) {
                    for (const step of item.steps) {
                        checkFlow(step.flowId);
                    }
                }
            }
        }

        // Check Advanced Windows
        if (template.windows) {
            for (const window of template.windows) {
                if (window.triggers) {
                    for (const trigger of window.triggers) {
                        if (trigger.flowId) checkFlow(trigger.flowId);
                        if (trigger.flowIds) { // Array support
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

        // 4. Determine program type
        const programType = template.type || 'BASIC';

        // 5. Build active program data
        const activeProgramData: any = {
            sourceProgramId: template.id,
            name: template.name,
            status: 'loaded',
            type: programType,
            minCycleInterval: minCycleInterval || template.minCycleInterval || 60,
            variableOverrides: globalOverrides // Store global variables!
        };

        if (programType === 'ADVANCED' && template.windows) {
            // ADVANCED MODE: Initialize windows and windowsState
            activeProgramData.windows = template.windows;  // Snapshot from template
            activeProgramData.windowsState = template.windows.map(w => ({
                windowId: w.id,
                status: 'pending',
                triggersExecuted: [],
                triggersExecuting: [],
                lastCheck: undefined
            } as IWindowState));
            activeProgramData.schedule = [];  // Empty for advanced mode

            logger.info({ program: template.name, windowCount: template.windows.length }, '📥 Advanced Program Loaded');
        } else {
            // BASIC MODE: Create Schedule Items (existing logic)
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

        // For ADVANCED programs, allow window updates even when running
        // (so users can edit trigger values during execution)
        const isAdvancedWindowUpdate = active.type === 'ADVANCED' &&
            (
                (updates.windows && Object.keys(updates).length === 1) ||
                (updates.windowOverrides && Object.keys(updates).length === 1)
            );

        if (!isAdvancedWindowUpdate && active.status !== 'loaded' && active.status !== 'ready') {
            throw new Error('Cannot update program settings after it has started');
        }

        if (updates.minCycleInterval !== undefined) active.minCycleInterval = updates.minCycleInterval;
        if (updates.schedule) active.schedule = updates.schedule;

        // Update windows for ADVANCED mode
        if (updates.windows && active.type === 'ADVANCED') {
            (active as any).windows = updates.windows;
        }

        // Apply global overrides
        if (updates.globalOverrides) {
            if (active.type === 'ADVANCED') {
                // For ADVANCED: store in dedicated field
                (active as any).variableOverrides = updates.globalOverrides;
            } else {
                // For BASIC: apply to ALL schedule items
                active.schedule.forEach(item => {
                    item.overrides = { ...item.overrides, ...updates.globalOverrides };
                });
            }
        }

        // Apply window overrides (ADVANCED only)
        if (updates.windowOverrides && active.type === 'ADVANCED') {
            (active as any).windowOverrides = updates.windowOverrides;
        }

        // If we are saving changes, we can mark it as ready
        if (updates.status === 'ready') active.status = 'ready';

        await active.save();
        logger.info('📝 Active Program Updated');
        return active;
    }

    /**
     * Get variables defined in the flows of the active program.
     * For BASIC mode: grouped by Cycle ID.
     * For ADVANCED mode: grouped by Flow ID from triggers.
     */
    async getProgramVariables(): Promise<Record<string, any[]>> {
        const active = await this.getActive();
        if (!active) return {};

        const FlowModel = require('../persistence/schemas/Flow.schema').FlowModel;
        const variablesMap: Record<string, any[]> = {};

        // Helper to get flow name
        const getFlowName = async (id: string) => {
            const f = await FlowModel.findOne({ id });
            return f ? f.name : id;
        };

        // Helper to extract variables from a flow, using a scoped seenVars set
        const extractFlowVariables = async (flowId: string, scopedSeenVars: Set<string>, outputArray: any[]) => {
            const flow = await FlowModel.findOne({ id: flowId });
            if (flow && flow.variables) {
                for (const v of flow.variables) {
                    // Only global variables are exposed to the program
                    if (v.scope === 'global' && !scopedSeenVars.has(v.name)) {
                        outputArray.push({
                            name: v.name,
                            type: v.type,
                            default: v.value,
                            unit: v.unit,
                            hasTolerance: v.hasTolerance,
                            description: v.description,
                            flowId: flowId,
                            flowName: flow.name,
                            flowDescription: flow.description
                        });
                        scopedSeenVars.add(v.name);
                    }
                }
            }
        };
        // ADVANCED MODE: Extract from windows/triggers
        if (active.type === 'ADVANCED' && (active as any).windows) {
            // We need to return a structure that preserves the context of each flow
            // Return type: Record<WindowId, { contextId: string, label: string, variables: IVariable[] }[]>
            const windowContexts: Record<string, any[]> = {};

            for (const window of (active as any).windows) {
                const windowId = window.id;
                windowContexts[windowId] = [];

                // Helper to extract vars for a specific flow and add to context list
                const addContext = async (fid: string, contextId: string, label: string, description?: string) => {
                    const vars: any[] = [];
                    // We use a temporary set just for this extraction to avoid duplicates WITHIN the flow definition itself
                    // but we allow duplicates across different contexts
                    await extractFlowVariables(fid, new Set<string>(), vars);

                    if (vars.length > 0) {
                        windowContexts[windowId].push({
                            contextId,
                            label,
                            description,
                            variables: vars
                        });
                    }
                };

                if (window.triggers) {
                    for (let tIdx = 0; tIdx < window.triggers.length; tIdx++) {
                        const trigger = window.triggers[tIdx];
                        const triggerName = `Trigger ${tIdx + 1}`;

                        // Handle flowIds (New Format) OR flowId (Legacy) - BUT NOT BOTH
                        if (trigger.flowIds && Array.isArray(trigger.flowIds) && trigger.flowIds.length > 0) {
                            for (let fIdx = 0; fIdx < trigger.flowIds.length; fIdx++) {
                                const fid = trigger.flowIds[fIdx];
                                await addContext(fid, `t_${tIdx}_f_${fIdx}`, `${triggerName}: ${await getFlowName(fid)}`, trigger.description);
                            }
                        } else if (trigger.flowId) {
                            // Fallback to legacy single flow only if flowIds is empty/missing
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
        }

        // BASIC MODE: Extract from schedule/cycles
        else {
            for (const item of active.schedule) {
                const cycleId = item.cycleId;
                const cycleSeenVars = new Set<string>(); // Scope seenVars to this cycle

                if (!item.steps || item.steps.length === 0) continue;

                if (!variablesMap[cycleId]) variablesMap[cycleId] = [];

                for (let i = 0; i < item.steps.length; i++) {
                    const step = item.steps[i];
                    const vars: any[] = [];
                    // Extract to a temp array, not directly to `variablesMap`
                    // We pass a new Set() for seenVars if we want FULL isolation scope per step (or keep cycleSeenVars to dedupe across cycle?)
                    // For now, let's allow duplicates across steps (so distinct controls), so use separate set or empty set.
                    // Actually, if we want separate controls for identical flows, we MUST use a fresh set per step or just not dedupe by name across steps.
                    await extractFlowVariables(step.flowId, new Set<string>(), vars);

                    if (vars.length > 0) {
                        variablesMap[cycleId].push({
                            stepIndex: i,
                            flowId: step.flowId,
                            flowName: await getFlowName(step.flowId),
                            variables: vars
                        });
                    }
                }
            }
        }

        return variablesMap;
    }


    /**
     * Start the loaded program.
     */
    async start(startTime?: Date, options?: { expiredStrategy?: 'run' | 'skip' }): Promise<IActiveProgram | { status: 'confirmation_required', expiredWindows: any[] }> {
        const active = await this.getActive();
        if (!active) throw new Error('No active program loaded');

        if (active.status === 'running') return active;

        // Allow starting from loaded, ready, paused, or stopped
        if (active.status !== 'loaded' && active.status !== 'ready' && active.status !== 'paused' && active.status !== 'stopped' && active.status !== 'scheduled') {
            // Invalid status for start
        }

        // --- STALE STATE DETECTION (Resume Logic) ---
        if (active.type === 'ADVANCED' && active.windowsState) {
            const now = new Date();
            const currentHours = now.getHours().toString().padStart(2, '0');
            const currentMinutes = now.getMinutes().toString().padStart(2, '0');
            const currentTimeStr = `${currentHours}:${currentMinutes}`;

            const timeToMin = (t: string) => {
                const [h, m] = t.split(':').map(Number);
                return h * 60 + m;
            };
            const currentMin = timeToMin(currentTimeStr);

            const expiredWindows: any[] = [];

            // Identify Expired Pending Windows
            active.windowsState.forEach(ws => {
                const winDef = (active as any).windows.find((w: any) => w.id === ws.windowId);

                logger.info({
                    windowId: ws.windowId,
                    status: ws.status,
                    winDefFound: !!winDef,
                    currentMin,
                    endTime: winDef ? winDef.endTime : 'N/A'
                }, '🕵️ Resume Check: Inspecting Window');

                // Check PENDING or ACTIVE (Interrupted) windows
                if (ws.status === 'pending' || ws.status === 'active') {
                    if (winDef) {
                        const endMin = timeToMin(winDef.endTime);
                        // If current time is past end time (with 1 min buffer?)
                        if (currentMin > endMin) {
                            logger.info({ window: winDef.name, endMin, currentMin }, '⚠️ Resume Check: Found Expired Window');
                            // Store simple object, don't spread Mongoose document
                            expiredWindows.push({ windowId: ws.windowId, name: winDef.name, status: ws.status });
                        }
                    }
                }
            });

            if (expiredWindows.length > 0) {
                // If no strategy provided, Request Confirmation
                if (!options?.expiredStrategy) {
                    logger.info({ expiredCount: expiredWindows.length }, '⏸️ Resume Check: Confirmation Required for Expired Windows');
                    return {
                        status: 'confirmation_required',
                        expiredWindows: expiredWindows.map(w => ({ id: w.windowId, name: w.name }))
                    };
                }

                // Handle Strategy
                if (options.expiredStrategy === 'skip') {
                    // Strategy: SKIP
                    logger.info('⏭️ Resume Strategy: Skipping expired windows');

                    expiredWindows.forEach(exp => {
                        // Use string coercion for robust comparison
                        const ws = active.windowsState!.find(w => String(w.windowId) === String(exp.windowId));
                        if (ws) {
                            ws.status = 'skipped';
                            ws.lastCheck = new Date(); // Update check time to prevent "New Day" reset
                            ws.skipUntil = undefined;  // Clear any previous skip timer
                            ws.currentFlowSessionId = undefined; // Disarm any active flow tracking
                            ws.triggersExecuting = []; // Clear executing triggers

                            // 📝 Log Skip Event (Emit socket event for UI visibility)
                            try {
                                const { events } = require('../../core/EventBusService');
                                events.emit('advanced:window_skipped', {
                                    programId: active.sourceProgramId,
                                    windowId: ws.windowId,
                                    windowName: exp.name, // Use name from expiredWindows map
                                    reason: 'Skipped by User (Resume Strategy)',
                                    timestamp: new Date()
                                });
                            } catch (e) { /* ignore */ }
                        }
                    });
                    // Ensure Mongoose detects the change in the mixed/array type
                    active.markModified('windowsState');
                } else if (options.expiredStrategy === 'run') {
                    // Strategy: RUN (Force Evaluate)
                    logger.info('⚡ Resume Strategy: Force running expired windows');

                    // Lazy import TriggerEvaluator
                    const { triggerEvaluator } = await import('./TriggerEvaluator');

                    // Execute sequentially
                    for (const exp of expiredWindows) {
                        const ws = active.windowsState!.find(w => w.windowId === exp.windowId);
                        const winDef = (active as any).windows.find((w: any) => w.id === exp.windowId);

                        if (ws && winDef) {
                            try {
                                logger.info({ window: winDef.name }, '⚡ Force Evaluating Window (Resume)');

                                // 1. Evaluate Triggers (Force Check)
                                // We need to mock "state" or just pass the current state
                                // evaluateWindow writes to 'state', so we pass 'ws'
                                const result = await triggerEvaluator.evaluateWindow(
                                    winDef,
                                    ws, // Mutates state
                                    active.variableOverrides,
                                    (active as any).windowOverrides?.[winDef.id] || {},
                                    active.sourceProgramId
                                );

                                // 2. Handle Result
                                if (result === 'triggered' || result === 'executing') {
                                    // Trigger matched!
                                    // If executing, it started a flow.
                                    // If triggered (break), it's done.
                                    ws.status = result === 'executing' ? 'active' : 'completed';
                                    ws.lastCheck = new Date(); // Update check time
                                } else {
                                    // 3. No Trigger? Execute Fallback
                                    // If evaluateWindow returned 'all_done' or 'pending', it means no trigger fired (or all done).
                                    // For Resume, 'pending' means "conditions not met".

                                    logger.info('🛡️ No trigger matched during Resume. Executing Fallback.');
                                    const fbSession = await triggerEvaluator.executeFallback(
                                        winDef,
                                        active.variableOverrides,
                                        (active as any).windowOverrides?.[winDef.id] || {},
                                        active.sourceProgramId
                                    );

                                    if (fbSession) {
                                        ws.status = 'active'; // Mark active since flow is running
                                        ws.currentFlowSessionId = fbSession;
                                        ws.triggersExecuting = ['fallback']; // Track execution so Scheduler monitors it
                                    } else {
                                        // Fallback matched nothing or failed?
                                        ws.status = 'completed'; // Treat as done
                                    }
                                }

                            } catch (err: any) {
                                logger.error({ error: err.message, window: winDef.name }, '❌ Failed to force run window');
                                ws.status = 'skipped'; // Fail safe
                            }
                        }
                    }
                    // FIX: Ensure Mongoose detects the change in the mixed/array type for RUN strategy too!
                    // Without this, 'currentFlowSessionId' might not be saved, causing Scheduler to run fallback AGAIN.
                    active.markModified('windowsState');
                }
            }
        }

        if (startTime && new Date(startTime) > new Date()) {
            active.status = 'scheduled';
            active.startTime = new Date(startTime);
            logger.info({ startTime: active.startTime }, '⏳ Active Program Scheduled');
        } else {
            active.status = 'running';
            if (!active.startTime) active.startTime = new Date();
            logger.info('▶️ Active Program Started');

            // Emit start event for Logging Service
            // Only emit if NOT resuming (no expiredStrategy), to avoid spamming "started" on every resume
            if (!options?.expiredStrategy) {
                const { events } = await import('../../core/EventBusService');
                events.emit('active:program_started', {
                    programId: active.sourceProgramId,
                    timestamp: active.startTime
                });
            }
        }

        // Reset FAILED and RUNNING items to PENDING on Start as well
        // This ensures if we restart after a crash (without Stop), errors are cleared
        active.schedule.forEach(item => {
            if (item.status === 'failed' || item.status === 'running') {
                item.status = 'pending';
            }
        });

        await active.save();

        // For ADVANCED programs, trigger immediate check (don't wait for next tick)
        if (active.type === 'ADVANCED' && active.status === 'running') {
            // Use setImmediate to avoid blocking, but execute before next tick
            setImmediate(async () => {
                try {
                    // Dynamic import to avoid circular dependency
                    const { schedulerService } = await import('./SchedulerService');
                    // If resuming (options.expiredStrategy present), suppress log spam
                    await schedulerService.triggerImmediateCheck({ silent: !!options?.expiredStrategy });
                } catch (error: any) {
                    logger.error({ error: error.message }, '❌ Failed to trigger immediate check');
                }
            });
        }

        return active;
    }

    /**
     * Stop the active program.
     */
    async stop(): Promise<IActiveProgram> {
        const active = await this.getActive();
        if (!active) throw new Error('No active program loaded');

        active.status = 'stopped';
        active.endTime = new Date();

        // Stop any running cycle
        await cycleManager.stopCycle();

        // Reset FAILED and RUNNING items to PENDING so they are cleared from UI errors
        // and ready for next run (or manual interaction)
        active.schedule.forEach(item => {
            if (item.status === 'failed' || item.status === 'running') {
                item.status = 'pending';
            }
        });

        // For ADVANCED programs: Reset all window states to pending
        if (active.type === 'ADVANCED' && active.windowsState) {
            active.windowsState.forEach(ws => {
                ws.status = 'pending';
                ws.triggersExecuted = [];
                ws.triggersExecuting = [];
                ws.lastCheck = undefined;
                ws.currentFlowSessionId = undefined;
                // Reset skips as well to treat as fresh start? 
                // User said "Start as if for the first time".
                ws.skipUntil = undefined;
            });
            active.markModified('windowsState');
        }

        await active.save();
        logger.info('⏹️ Active Program Stopped (Statuses Reset)');
        return active;
    }

    /**
     * Pause the active program.
     */
    async pause(): Promise<IActiveProgram> {
        const active = await this.getActive();
        if (!active) throw new Error('No active program loaded');

        if (active.status === 'running') {
            active.status = 'paused';
            await active.save();
            logger.info('⏸️ Active Program Paused');
        }
        return active;
    }

    /**
     * Unload (remove) the active program.
     */
    async unload(): Promise<void> {
        await ActiveProgramModel.deleteMany({});
        // Ensure cycle is stopped
        await cycleManager.stopCycle();

        // Sync persistent state (none active)
        await programRepository.syncActiveStatus(null);

        logger.info('🗑️ Active Program Unloaded');
    }

    /**
     * Update a specific schedule item (Time, Variables, or Step Overrides).
     */
    async updateScheduleItem(itemId: string, updates: { time?: string, overrides?: Record<string, any>, steps?: any[] }): Promise<IActiveProgram> {
        const active = await this.getActive();
        if (!active) throw new Error('No active program');

        const item = active.schedule.find(i => (i as any)._id.toString() === itemId);
        if (!item) throw new Error('Schedule item not found');

        if (item.status === 'running') {
            throw new Error('Cannot update a cycle that is currently running');
        }

        if (updates.time) {
            item.time = updates.time;
            // Reset status if time is changed so it can run again
            if (item.status === 'completed' || item.status === 'failed') {
                item.status = 'pending';
                logger.info({ itemId }, '🔄 Cycle Status Reset to Pending due to Time Update');
            }
        }

        if (updates.overrides) {
            item.overrides = { ...item.overrides, ...updates.overrides };
        }

        if (updates.steps) {
            // Merge step overrides
            // Assumes updates.steps is an array matching item.steps length or containing objects with index?
            // Let's assume the frontend sends the FULL steps array or we map by index.
            // Safer: The frontend should send the full updated steps array structure (just like Program updates).
            // But here we are just updating overrides.

            // Assume updates.steps is an array of { overrides: ... } corresponding to item.steps indices
            if (Array.isArray(updates.steps)) {
                updates.steps.forEach((uStep, idx) => {
                    if (item.steps[idx] && uStep.overrides) {
                        item.steps[idx].overrides = { ...item.steps[idx].overrides, ...uStep.overrides };
                    }
                });
            }
        }

        await active.save();
        logger.info({ itemId, updates }, '✏️ Schedule Item Updated');
        return active;
    }

    /**
     * Swap two cycles in the schedule.
     */
    async swapCycles(itemIdA: string, itemIdB: string): Promise<IActiveProgram> {
        const active = await this.getActive();
        if (!active) throw new Error('No active program');

        const indexA = active.schedule.findIndex(i => (i as any)._id.toString() === itemIdA);
        const indexB = active.schedule.findIndex(i => (i as any)._id.toString() === itemIdB);

        if (indexA === -1 || indexB === -1) throw new Error('Schedule item not found');

        const itemA = active.schedule[indexA];
        const itemB = active.schedule[indexB];

        if (itemA.status === 'running' || itemB.status === 'running') {
            throw new Error('Cannot swap cycles that are running');
        }

        // Swap CycleID and Overrides, BUT KEEP TIME
        // This effectively swaps the "Content" of the slots
        const tempCycleId = itemA.cycleId;
        const tempOverrides = itemA.overrides;
        const tempCycleName = itemA.cycleName;

        itemA.cycleId = itemB.cycleId;
        itemA.overrides = itemB.overrides;
        itemA.cycleName = itemB.cycleName;

        itemB.cycleId = tempCycleId;
        itemB.overrides = tempOverrides;
        itemB.cycleName = tempCycleName;

        await active.save();
        logger.info({ indexA, indexB }, '🔄 Cycles Swapped');
        return active;
    }

    /**
     * Skip a cycle.
     */
    async skipCycle(itemId: string, type: 'once' | 'until', untilDate?: Date): Promise<IActiveProgram> {
        const active = await this.getActive();
        if (!active) throw new Error('No active program');

        const item = active.schedule.find(i => (i as any)._id.toString() === itemId);
        if (!item) throw new Error('Schedule item not found');

        item.status = 'skipped';
        if (type === 'until' && untilDate) {
            item.skipUntil = untilDate;
        }

        await active.save();
        logger.info({ itemId, type }, '⏭️ Cycle Skipped');
        return active;
    }

    /**
     * Restore a skipped cycle to pending status.
     */
    async restoreCycle(itemId: string): Promise<IActiveProgram> {
        const active = await this.getActive();
        if (!active) throw new Error('No active program');

        const item = active.schedule.find(i => (i as any)._id.toString() === itemId);
        if (!item) throw new Error('Schedule item not found');

        if (item.status !== 'skipped') {
            throw new Error('Cannot restore a cycle that is not skipped');
        }

        item.status = 'pending';
        item.skipUntil = undefined;

        await active.save();
        logger.info({ itemId }, '⏪ Cycle Restored');
        return active;
    }

    /**
     * Retry a failed cycle.
     */
    async retryCycle(itemId: string): Promise<IActiveProgram> {
        const active = await this.getActive();
        if (!active) throw new Error('No active program');

        const item = active.schedule.find(i => (i as any)._id.toString() === itemId);
        if (!item) throw new Error('Schedule item not found');

        if (item.status !== 'failed') {
            throw new Error('Cannot retry a cycle that is not failed');
        }

        item.status = 'pending';

        // Update time to NOW to ensure immediate pickup by Scheduler
        const now = new Date();
        const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        item.time = timeString;

        await active.save();

        logger.info({ itemId, newTime: timeString }, '🔄 Cycle Retried (Reset to Pending & Time Updated)');
        return active;
    }

    /**
     * Force start a pending cycle immediately.
     */
    async forceStartCycle(itemId: string): Promise<IActiveProgram> {
        const active = await this.getActive();
        if (!active) throw new Error('No active program');

        const item = active.schedule.find(i => (i as any)._id.toString() === itemId);
        if (!item) throw new Error('Schedule item not found');

        if (item.status === 'running') {
            throw new Error('Cannot force start a cycle that is currently running');
        }

        // Stop any currently running cycle first?
        // Ideally, we should tell the SchedulerService to run this NOW.

        // Implementation Update:
        // Do NOT update time to NOW, as that alters the persistent schedule.
        // Instead, mark as running and Invoke CycleManager directly.

        item.status = 'running';
        await active.save();

        const stepOverrides = item.steps?.map(s => ({
            flowId: s.flowId,
            overrides: s.overrides
        })) || [];

        // Determine overrides (Program Level + Item Level)
        const runtimeOverrides = {
            ...active.variableOverrides, // Global
            ...item.overrides,            // Item Specific
            activeProgramId: active.sourceProgramId
        };

        try {
            await cycleManager.startCycle(item.cycleId, item.cycleName || item.name || 'Unknown Cycle', stepOverrides, runtimeOverrides);
            logger.info({ itemId }, '⚡ Cycle Force Started (Direct Invocation)');
        } catch (error: any) {
            item.status = 'failed';
            await active.save();
            throw error; // Re-throw to notify caller
        }

        return active;
    }

    /**
     * Mark a cycle as failed in the schedule.
     */
    async markCycleFailed(cycleId: string, reason: string): Promise<void> {
        const active = await this.getActive();
        if (!active) return;

        // Find the running item for this cycle
        // We look for 'running' or 'pending' (if it failed immediately on start)
        const item = active.schedule.find(i =>
            i.cycleId === cycleId && (i.status === 'running' || i.status === 'pending')
        );

        if (item) {
            item.status = 'failed';
            // We could store the reason in overrides or a new field if schema supported it
            // For now, just marking as failed is enough for the UI
            await active.save();
            logger.info({ cycleId, reason }, '❌ Active Program Cycle Marked Failed');
        }
    }

    /**
     * Mark a cycle as completed in the schedule.
     */
    async markCycleCompleted(cycleId: string): Promise<void> {
        const active = await this.getActive();
        if (!active) return;

        const item = active.schedule.find(i =>
            i.cycleId === cycleId && i.status === 'running'
        );

        if (item) {
            item.status = 'completed';
            await active.save();
            logger.info({ cycleId }, '✅ Active Program Cycle Marked Completed');
        }
    }

    /**
     * Skip a window (Advanced Mode).
     */
    async skipWindow(windowId: string, untilDate: Date): Promise<IActiveProgram> {
        const active = await this.getActive();
        if (!active) throw new Error('No active program');

        if (!active.windowsState) throw new Error('Not an advanced program (no windowsState)');

        const windowState = active.windowsState.find(w => w.windowId === windowId);
        if (!windowState) throw new Error('Window state not found');

        // If currently active, we might want to stop running flows?
        // For now, we update status. Scheduler should respect this next tick.
        windowState.status = 'skipped';
        windowState.skipUntil = untilDate;
        windowState.triggersExecuting = []; // Clear executing flags
        windowState.currentFlowSessionId = undefined; // Detach session

        // We mark as modified because we are modifying a sub-document array element directly
        active.markModified('windowsState');
        await active.save();

        logger.info({ windowId, untilDate }, '⏭️ Window Skipped');
        return active;
    }

    /**
     * Restore a skipped window (Advanced Mode).
     */
    async restoreWindow(windowId: string): Promise<IActiveProgram> {
        const active = await this.getActive();
        if (!active) throw new Error('No active program');

        if (!active.windowsState) throw new Error('Not an advanced program');

        const windowState = active.windowsState.find(w => w.windowId === windowId);
        if (!windowState) throw new Error('Window state not found');

        if (windowState.status !== 'skipped') {
            throw new Error('Cannot restore a window that is not skipped');
        }

        windowState.status = 'pending';
        windowState.skipUntil = undefined;

        active.markModified('windowsState');
        await active.save();

        logger.info({ windowId }, '⏪ Window Restored');
        return active;
    }

    /**
     * Update a specific trigger in an active window.
     * Allows live editing of parameters (sensor, value, flows, etc.)
     */
    async updateTrigger(windowId: string, trigger: any): Promise<IActiveProgram> {
        const active = await this.getActive();
        if (!active) throw new Error('No active program');

        if (!active.windowsState) throw new Error('Not an advanced program');

        // 1. Find Window Definition
        const windowDef = (active as any).windows.find((w: any) => w.id === windowId);
        if (!windowDef) throw new Error('Window definition not found');

        // 2. Find Window State
        const windowState = active.windowsState.find(w => w.windowId === windowId);
        if (!windowState) throw new Error('Window state not found');

        // 3. Safety Check: Cannot edit if window is ACTIVE/RUNNING
        if (windowState.status === 'active') {
            throw new Error('Cannot edit trigger while window is active');
        }

        // 4. Find Trigger index
        const triggerIndex = windowDef.triggers.findIndex((t: any) => t.id === trigger.id);
        if (triggerIndex === -1) throw new Error('Trigger not found');

        // 5. Update Trigger
        // We replace the entire text of the trigger object
        windowDef.triggers[triggerIndex] = trigger;

        // Mark as modified
        active.markModified('windows');
        await active.save();

        logger.info({ windowId, triggerId: trigger.id }, '✏️ Active Program Trigger Updated');
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

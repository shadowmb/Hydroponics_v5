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

        // 3. Clear existing
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
        return activeProgram;
    }

    /**
     * Update the active program settings (before starting).
     */
    async updateProgram(updates: Partial<IActiveProgram> & { globalOverrides?: Record<string, any>, windows?: any[] }): Promise<IActiveProgram> {
        const active = await this.getActive();
        if (!active) throw new Error('No active program loaded');

        // For ADVANCED programs, allow window updates even when running
        // (so users can edit trigger values during execution)
        const isAdvancedWindowUpdate = active.type === 'ADVANCED' && updates.windows && Object.keys(updates).length === 1;

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
                // For ADVANCED: store in dedicated field (will be used by scheduler when executing flows)
                (active as any).variableOverrides = updates.globalOverrides;
            } else {
                // For BASIC: apply to ALL schedule items
                active.schedule.forEach(item => {
                    item.overrides = { ...item.overrides, ...updates.globalOverrides };
                });
            }
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
        const seenVars = new Set<string>();

        // Helper to extract variables from a flow
        const extractFlowVariables = async (flowId: string, keyId: string) => {
            const flow = await FlowModel.findOne({ id: flowId });
            if (flow && flow.variables) {
                const flowVars: any[] = [];
                flow.variables.forEach((v: any) => {
                    if (v.scope === 'global' && !seenVars.has(v.name)) {
                        flowVars.push({
                            name: v.name,
                            type: v.type,
                            default: v.value,
                            unit: v.unit,
                            hasTolerance: v.hasTolerance,
                            description: v.description,
                            flowId: flow.id,
                            flowName: flow.name || 'Unknown Flow',
                            flowDescription: flow.description
                        });
                        seenVars.add(v.name);
                    }
                });
                if (flowVars.length > 0) {
                    if (!variablesMap[keyId]) {
                        variablesMap[keyId] = [];
                    }
                    variablesMap[keyId].push(...flowVars);
                }
            }
        };

        // ADVANCED MODE: Extract from windows/triggers
        if (active.type === 'ADVANCED' && (active as any).windows) {
            for (const window of (active as any).windows) {
                if (window.triggers) {
                    for (const trigger of window.triggers) {
                        if (trigger.flowId) {
                            await extractFlowVariables(trigger.flowId, trigger.flowId);
                        }
                    }
                }
                if (window.fallbackFlowId) {
                    await extractFlowVariables(window.fallbackFlowId, window.fallbackFlowId);
                }
            }
        }
        // BASIC MODE: Extract from schedule/cycles
        else {
            for (const item of active.schedule) {
                const cycleId = item.cycleId;
                if (!item.steps || item.steps.length === 0) continue;

                for (const step of item.steps) {
                    await extractFlowVariables(step.flowId, cycleId);
                }
            }
        }

        return variablesMap;
    }


    /**
     * Start the loaded program.
     */
    async start(startTime?: Date): Promise<IActiveProgram> {
        const active = await this.getActive();
        if (!active) throw new Error('No active program loaded');

        if (active.status === 'running') return active;

        // Allow starting from loaded, ready, paused, or stopped
        if (active.status !== 'loaded' && active.status !== 'ready' && active.status !== 'paused' && active.status !== 'stopped' && active.status !== 'scheduled') {
            // Invalid status for start
        }

        if (startTime && new Date(startTime) > new Date()) {
            active.status = 'scheduled';
            active.startTime = new Date(startTime);
            logger.info({ startTime: active.startTime }, '⏳ Active Program Scheduled');
        } else {
            active.status = 'running';
            if (!active.startTime) active.startTime = new Date();
            logger.info('▶️ Active Program Started');
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
                    await schedulerService.triggerImmediateCheck();
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
        logger.info('🗑️ Active Program Unloaded');
    }

    /**
     * Update a specific schedule item (Time or Variables).
     */
    async updateScheduleItem(itemId: string, updates: { time?: string, overrides?: Record<string, any> }): Promise<IActiveProgram> {
        const active = await this.getActive();
        if (!active) throw new Error('No active program');

        const item = active.schedule.find(i => (i as any)._id.toString() === itemId);
        if (!item) throw new Error('Schedule item not found');

        if (item.status === 'running') {
            throw new Error('Cannot update a cycle that is currently running');
        }

        if (updates.time) {
            item.time = updates.time;
        }

        if (updates.overrides) {
            item.overrides = { ...item.overrides, ...updates.overrides };
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
        // For now, let's assume the user knows what they are doing.
        // But the SchedulerService might be running something else.
        // Ideally, we should tell the SchedulerService to run this NOW.

        // Implementation:
        // 1. Update time to NOW (so scheduler picks it up)
        // 2. Or call cycleManager directly?
        // Better to update time to NOW so the standard loop handles it.

        const now = new Date();
        const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        item.time = timeString;
        item.status = 'pending'; // Reset status so it gets picked up
        await active.save();

        logger.info({ itemId, newTime: timeString }, '⚡ Cycle Force Started (Time updated to Now)');
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

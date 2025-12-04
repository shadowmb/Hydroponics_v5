import { ActiveProgramModel, IActiveProgram, IActiveScheduleItem } from '../persistence/schemas/ActiveProgram.schema';
import { programRepository } from '../persistence/repositories/ProgramRepository';
import { logger } from '../../core/LoggerService';
import { cycleManager } from './CycleManager';
import { CycleModel } from '../persistence/schemas/Cycle.schema';

export class ActiveProgramService {

    /**
     * Load a program template into the active state.
     * Replaces any existing active program.
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

        // 4. Create Schedule Items
        const scheduleItems = await Promise.all(template.schedule.map(async item => {
            const cycle = await CycleModel.findOne({ id: item.cycleId });
            return {
                time: item.time,
                cycleId: item.cycleId,
                cycleName: cycle?.name || item.cycleId, // Fallback to ID if name not found
                cycleDescription: cycle?.description,
                overrides: { ...globalOverrides, ...((item as any).overrides || {}) }, // Merge global and item overrides
                status: 'pending'
            } as IActiveScheduleItem;
        }));

        // 5. Create Active Program
        const activeProgram = await ActiveProgramModel.create({
            sourceProgramId: template.id,
            name: template.name,
            status: 'loaded',
            minCycleInterval,
            schedule: scheduleItems
        });

        logger.info({ program: template.name }, '📥 Active Program Loaded');
        return activeProgram;
    }

    /**
     * Update the active program settings (before starting).
     */
    async updateProgram(updates: Partial<IActiveProgram> & { globalOverrides?: Record<string, any> }): Promise<IActiveProgram> {
        const active = await this.getActive();
        if (!active) throw new Error('No active program loaded');

        if (active.status !== 'loaded' && active.status !== 'ready') {
            throw new Error('Cannot update program settings after it has started');
        }

        if (updates.minCycleInterval !== undefined) active.minCycleInterval = updates.minCycleInterval;
        if (updates.schedule) active.schedule = updates.schedule;

        // Apply global overrides to ALL schedule items
        if (updates.globalOverrides) {
            active.schedule.forEach(item => {
                item.overrides = { ...item.overrides, ...updates.globalOverrides };
            });
        }

        // If we are saving changes, we can mark it as ready
        if (updates.status === 'ready') active.status = 'ready';

        await active.save();
        logger.info('📝 Active Program Updated');
        return active;
    }

    /**
     * Get variables defined in the cycles of the active program, grouped by Cycle ID.
     */
    async getProgramVariables(): Promise<Record<string, any[]>> {
        const active = await this.getActive();
        if (!active) return {};

        const variablesByCycle: Record<string, any[]> = {};
        const uniqueCycleIds = [...new Set(active.schedule.map(item => item.cycleId))];

        for (const cycleId of uniqueCycleIds) {
            const cycle = await CycleModel.findOne({ id: cycleId });
            if (!cycle || !cycle.steps || cycle.steps.length === 0) continue;

            const cycleVars: any[] = [];
            const seenVars = new Set<string>();

            // Assuming single flow per cycle for now, or we check all steps
            for (const step of cycle.steps) {
                const FlowModel = require('../persistence/schemas/Flow.schema').FlowModel;
                const flow = await FlowModel.findOne({ id: step.flowId });

                if (flow && flow.variables) {
                    flow.variables.forEach((v: any) => {
                        if (v.scope === 'global' && !seenVars.has(v.name)) {
                            cycleVars.push({
                                name: v.name,
                                type: v.type,
                                default: v.value,
                                unit: v.unit,
                                cycleId: cycleId,
                                flowName: flow.name || 'Unknown Flow'
                            });
                            seenVars.add(v.name);
                        }
                    });
                }
            }
            if (cycleVars.length > 0) {
                variablesByCycle[cycleId] = cycleVars;
            }
        }
        return variablesByCycle;
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

        await active.save();
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

        await active.save();
        logger.info('⏹️ Active Program Stopped');
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

        if (item.status !== 'pending') {
            throw new Error('Cannot update a cycle that is already running or completed');
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

        if (itemA.status !== 'pending' || itemB.status !== 'pending') {
            throw new Error('Cannot swap cycles that are not pending');
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
     * Get the current active program.
     */
    async getActive(): Promise<IActiveProgram | null> {
        return ActiveProgramModel.findOne();
    }
}

export const activeProgramService = new ActiveProgramService();

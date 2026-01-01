import { CronJob } from 'cron';
import { programRepository } from '../persistence/repositories/ProgramRepository';
import { monitoringRepository } from '../persistence/repositories/MonitoringRepository';
import { cycleManager } from './CycleManager';
import { automation } from '../automation/AutomationEngine';
import { activeProgramService } from './ActiveProgramService';
import { triggerEvaluator } from './TriggerEvaluator';
import { logger } from '../../core/LoggerService';
import { ITimeWindow } from '../persistence/schemas/Program.schema';
import { IWindowState } from '../persistence/schemas/ActiveProgram.schema';

interface QueueItem {
    type: 'monitoring';
    id: string; // Monitoring ID
    flowId: string;
    priority: number;
    timestamp: number;
}

export class SchedulerService {
    private job: CronJob;
    private queue: QueueItem[] = [];
    private lastRun: Map<string, number> = new Map(); // monitoringId -> timestamp
    private _state: 'STOPPED' | 'RUNNING' | 'WAITING_START' = 'STOPPED';
    private _startTime: number | null = null;
    private _lastTick: Date | null = null;

    constructor() {
        // Run every minute
        this.job = new CronJob('* * * * *', () => this.tick());
    }

    public getLastTick(): Date | null {
        return this._lastTick;
    }

    public start() {
        this.job.start();
        this._state = 'RUNNING';
        logger.info('🕒 Scheduler Service Started');
    }

    public startNow() {
        this._state = 'RUNNING';
        this._startTime = null;
        logger.info('▶️ Scheduler Started (Immediate)');
    }

    public startAt(timestamp: number) {
        this._state = 'WAITING_START';
        this._startTime = timestamp;
        logger.info({ startAt: new Date(timestamp).toISOString() }, '⏳ Scheduler Scheduled for Delayed Start');
    }

    public stopScheduler() {
        this._state = 'STOPPED';
        this._startTime = null;
        logger.info('⏹️ Scheduler Stopped');
    }

    public getState() {
        return {
            state: this._state,
            startTime: this._startTime
        };
    }

    public isPaused() {
        return this._state !== 'RUNNING';
    }

    public getAutomation() {
        return automation;
    }

    public stop() {
        this.job.stop();
    }

    /**
     * Trigger an immediate Advanced Program check.
     * Used when a program starts so we don't wait for the next tick (1 min).
     */
    public async triggerImmediateCheck(): Promise<void> {
        try {
            const activeProgram = await activeProgramService.getActive();
            if (!activeProgram || activeProgram.status !== 'running') {
                return;
            }

            if (activeProgram.type === 'ADVANCED') {
                const now = new Date();
                const timeString = now.toTimeString().slice(0, 5);
                logger.info({ time: timeString }, '⚡ Immediate Advanced Program Check');
                await this.processAdvancedProgram(activeProgram, timeString);
            }
        } catch (error: any) {
            logger.error({ error: error.message }, '❌ Immediate check failed');
        }
    }

    private async tick() {
        this._lastTick = new Date();
        if (this._state === 'STOPPED') {
            return;
        }

        if (this._state === 'WAITING_START') {
            if (this._startTime && Date.now() >= this._startTime) {
                this._state = 'RUNNING';
                this._startTime = null;
                logger.info('▶️ Delayed Start Triggered - Scheduler Running');
            } else {
                return;
            }
        }

        try {
            const now = new Date();
            this._lastTick = now;
            const timeString = now.toTimeString().slice(0, 5); // HH:mm
            logger.info({ time: timeString }, '🕒 Scheduler Tick');

            // 1. Check Active Program & Schedule
            const activeProgram = await activeProgramService.getActive();

            // Check for scheduled start
            if (activeProgram && activeProgram.status === 'scheduled') {
                if (activeProgram.startTime && now >= new Date(activeProgram.startTime)) {
                    logger.info('▶️ Scheduled Active Program Starting...');
                    await activeProgramService.start();
                    // Re-fetch to get updated status
                    const updated = await activeProgramService.getActive();
                    if (updated) Object.assign(activeProgram, updated);
                }
            }

            if (activeProgram && activeProgram.status === 'running') {
                // Handle based on program type
                if (activeProgram.type === 'ADVANCED') {
                    // ADVANCED MODE: Time Windows with Triggers
                    await this.processAdvancedProgram(activeProgram, timeString);
                } else {
                    // BASIC MODE: Exact time matching (existing logic)
                    const scheduledItem = activeProgram.schedule.find(s =>
                        s.time === timeString && s.status === 'pending'
                    );

                    if (scheduledItem) {
                        logger.info({ cycleId: scheduledItem.cycleId, time: timeString }, '⏰ Scheduled Cycle Triggered');
                        await this.handleScheduledCycle(scheduledItem.cycleId, scheduledItem.steps, scheduledItem.overrides, scheduledItem.cycleId);
                        scheduledItem.status = 'running';
                        await activeProgram.save();
                    }
                }
            }

            // 2. Check Monitoring
            const monitoringTasks = await monitoringRepository.findActive();
            for (const task of monitoringTasks) {
                const last = this.lastRun.get(task.id) || 0;
                const elapsedMinutes = (Date.now() - last) / 1000 / 60;

                if (elapsedMinutes >= task.intervalMinutes) {
                    this.addToQueue({
                        type: 'monitoring',
                        id: task.id,
                        flowId: task.flowId,
                        priority: task.priority,
                        timestamp: Date.now()
                    });
                }
            }

            // 3. Process Queue
            await this.processQueue();

        } catch (error) {
            logger.error({ error }, '❌ Scheduler Tick Failed');
        }
    }

    private addToQueue(item: QueueItem) {
        // Deduplication
        const exists = this.queue.find(q => q.id === item.id && q.type === item.type);
        if (exists) return;

        logger.info({ type: item.type, id: item.id }, '📥 Added to Scheduler Queue');
        this.queue.push(item);
        // Sort by priority (descending) then timestamp (ascending)
        this.queue.sort((a, b) => {
            if (a.priority !== b.priority) return b.priority - a.priority;
            return a.timestamp - b.timestamp;
        });
    }

    public async handleScheduledCycle(cycleId: string, steps: any[], overrides: Record<string, any> = {}, cycleName?: string) {
        // Priority: Cycle > Monitoring

        // Check automation state.
        const snapshot = automation.getSnapshot();
        const isAutomationRunning = snapshot.value === 'running' || snapshot.value === 'paused';

        if (isAutomationRunning) {
            logger.info('⚠️ Automation busy, stopping for Scheduled Cycle');

            // Try stopping cycle first
            await cycleManager.stopCycle();

            // Ensure automation is stopped (in case it was monitoring)
            automation.stopProgram();

            // Wait a bit for cleanup?
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        try {
            const sanitizedSteps = steps.map(s => ({
                flowId: s.flowId,
                overrides: s.overrides
            }));
            logger.info({ cycleId, steps: sanitizedSteps }, 'Attempting to start cycle with sanitized steps');

            // Use name if provided, else ID
            const name = cycleName || cycleId;

            await cycleManager.startCycle(cycleId, name, sanitizedSteps, overrides);
        } catch (error: any) {
            logger.error({
                err: { message: error.message, stack: error.stack, name: error.name },
                cycleId
            }, '❌ Failed to start scheduled cycle');
        }
    }

    private async processQueue() {
        if (this.queue.length === 0) return;

        // Check if we can run
        const snapshot = automation.getSnapshot();
        const isAutomationRunning = snapshot.value === 'running' || snapshot.value === 'paused';

        logger.info({ state: snapshot.value, isRunning: isAutomationRunning }, '🔍 Scheduler State Check');

        // We can only run queue if IDLE.
        if (isAutomationRunning) return;

        const item = this.queue.shift(); // Get highest priority
        if (!item) return;

        logger.info({ item }, '🚀 Processing Queue Item');

        try {
            if (item.type === 'monitoring') {
                await automation.loadProgram(item.flowId);
                await automation.startProgram();
                this.lastRun.set(item.id, Date.now());
            }
        } catch (error) {
            logger.error({ error, item }, '❌ Failed to process queue item');
        }
    }

    // =============================================
    // ADVANCED PROGRAM METHODS
    // =============================================

    /**
     * Process an Advanced Program - evaluate time windows and triggers.
     */
    private async processAdvancedProgram(activeProgram: any, timeString: string): Promise<void> {
        if (!activeProgram.windows || !activeProgram.windowsState) {
            logger.warn('⚠️ Advanced program has no windows or windowsState');
            return;
        }

        // Get program start time to determine if we were active during a window
        const programStartTime = activeProgram.startTime ? new Date(activeProgram.startTime) : null;

        for (let i = 0; i < activeProgram.windows.length; i++) {
            const window = activeProgram.windows[i] as ITimeWindow;
            const state = activeProgram.windowsState.find((s: IWindowState) => s.windowId === window.id);

            if (!state) {
                logger.warn({ windowId: window.id }, '⚠️ No state found for window');
                continue;
            }

            // Skip completed or skipped windows
            if (state.status === 'completed' || state.status === 'skipped') continue;

            // Check if we're in the time window
            if (this.isInTimeWindow(timeString, window.startTime, window.endTime)) {
                state.status = 'active';

                // Check if it's time to poll (based on checkInterval)
                if (this.shouldCheck(state.lastCheck, window.checkInterval)) {
                    // BUGFIX: Check if a cycle is already running - skip this tick if so
                    const snapshot = automation.getSnapshot();
                    const isCycleRunning = snapshot.value === 'running' || snapshot.value === 'paused';

                    if (isCycleRunning) {
                        logger.debug({ windowId: window.id }, '⏳ Cycle running, skipping trigger evaluation');
                        continue;
                    }

                    logger.info({ windowId: window.id, windowName: window.name }, '🔄 Evaluating triggers for window');

                    const result = await triggerEvaluator.evaluateWindow(window, state);
                    state.lastCheck = new Date();

                    if (result === 'triggered' || result === 'all_done') {
                        state.status = 'completed';
                        logger.info({ windowId: window.id, result }, '✅ Window completed');
                    }

                    // Save after each window evaluation
                    await activeProgram.save();
                }
            }
            // Check if we're past the window (fallback time)
            else if (this.isPastTimeWindow(timeString, window.endTime) && state.status !== 'completed') {
                // BUGFIX: Check if the program was active during this window's time range
                // If program started AFTER the window ended, skip fallback (window was missed)
                const wasActiveForWindow = this.wasProgramActiveForWindow(
                    programStartTime,
                    window.startTime,
                    window.endTime
                );

                if (!wasActiveForWindow) {
                    logger.info({
                        windowId: window.id,
                        windowName: window.name,
                        programStart: programStartTime?.toISOString(),
                        windowEnd: window.endTime
                    }, '⏭️ Skipping window - program started after window ended');
                    state.status = 'skipped'; // Mark as skipped (not completed)
                    await activeProgram.save();
                    continue;
                }

                logger.info({ windowId: window.id }, '⏰ Window time expired - checking fallback');

                // BUGFIX: Check if a cycle is already running before executing fallback
                const snapshot = automation.getSnapshot();
                const isCycleRunning = snapshot.value === 'running' || snapshot.value === 'paused';

                if (isCycleRunning) {
                    logger.debug({ windowId: window.id }, '⏳ Cycle running, delaying fallback to next tick');
                    continue; // Don't mark as completed, try again next tick
                }

                // Execute fallback if no break trigger was executed
                const hasBreakExecuted = window.triggers.some(
                    t => t.behavior === 'break' && state.triggersExecuted.includes(t.id)
                );

                if (!hasBreakExecuted && window.fallbackFlowId) {
                    await triggerEvaluator.executeFallback(window);
                }

                state.status = 'completed';
                await activeProgram.save();
            }
        }

        // Check if all windows are completed
        const allCompleted = activeProgram.windowsState.every((s: IWindowState) => s.status === 'completed');
        if (allCompleted) {
            logger.info('🏁 All windows completed - Advanced Program finished for today');
            // Note: We don't stop the program, it will reset at midnight or on next load
        }
    }

    /**
     * Check if the program was active during a window's time range.
     * Returns false if program started after the window ended.
     */
    private wasProgramActiveForWindow(
        programStartTime: Date | null,
        windowStartTime: string,
        windowEndTime: string
    ): boolean {
        if (!programStartTime) return true; // No start time, assume active

        // Convert window end time to a Date object for today
        const [endHours, endMinutes] = windowEndTime.split(':').map(Number);
        const windowEndDate = new Date(programStartTime);
        windowEndDate.setHours(endHours, endMinutes, 0, 0);

        // If the window end time is before program start on the same day,
        // the window was never active for this program session
        return programStartTime < windowEndDate;
    }

    /**
     * Check if current time is within a time window.
     */
    private isInTimeWindow(currentTime: string, startTime: string, endTime: string): boolean {
        const current = this.timeToMinutes(currentTime);
        const start = this.timeToMinutes(startTime);
        const end = this.timeToMinutes(endTime);
        return current >= start && current < end;
    }

    /**
     * Check if current time is past a time window.
     */
    private isPastTimeWindow(currentTime: string, endTime: string): boolean {
        const current = this.timeToMinutes(currentTime);
        const end = this.timeToMinutes(endTime);
        return current >= end;
    }

    /**
     * Convert HH:mm string to minutes since midnight.
     */
    private timeToMinutes(time: string): number {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }

    /**
     * Check if enough time has passed for next poll.
     */
    private shouldCheck(lastCheck: Date | undefined, intervalMinutes: number): boolean {
        if (!lastCheck) return true;
        const elapsed = (Date.now() - new Date(lastCheck).getTime()) / 1000 / 60;
        return elapsed >= intervalMinutes;
    }
}

export const schedulerService = new SchedulerService();

import { CronJob } from 'cron';
import { programRepository } from '../persistence/repositories/ProgramRepository';
import { monitoringRepository } from '../persistence/repositories/MonitoringRepository';
import { cycleManager } from './CycleManager';
import { automation } from '../automation/AutomationEngine';
import { activeProgramService } from './ActiveProgramService';
import { logger } from '../../core/LoggerService';

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
                const scheduledItem = activeProgram.schedule.find(s =>
                    s.time === timeString && s.status === 'pending'
                );

                if (scheduledItem) {
                    logger.info({ cycleId: scheduledItem.cycleId, time: timeString }, '⏰ Scheduled Cycle Triggered');
                    await this.handleScheduledCycle(scheduledItem.cycleId, scheduledItem.steps, scheduledItem.overrides);

                    // Mark as running/completed in ActiveProgram
                    // Note: CycleManager events will update the status to 'completed' later
                    scheduledItem.status = 'running';
                    await activeProgram.save();
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

    public async handleScheduledCycle(cycleId: string, steps: any[], overrides: Record<string, any> = {}) {
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

            await cycleManager.startCycle(cycleId, sanitizedSteps, overrides);
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
}

export const schedulerService = new SchedulerService();

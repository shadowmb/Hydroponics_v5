import { CronJob } from 'cron';
import { programRepository } from '../persistence/repositories/ProgramRepository';
import { monitoringRepository } from '../persistence/repositories/MonitoringRepository';
import { cycleManager } from './CycleManager';
import { automation } from '../automation/AutomationEngine';
import { activeProgramService } from './ActiveProgramService';
import { triggerEvaluator } from './TriggerEvaluator';
import { logger } from '../../core/LoggerService';
import { events } from '../../core/EventBusService';
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
    private _lastCheckedDay: number = new Date().getDate();

    constructor() {
        // Run every 10 seconds to capture intervals accurately
        this.job = new CronJob('*/10 * * * * *', () => this.tick());
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
    public async triggerImmediateCheck(options?: { silent?: boolean }): Promise<void> {
        try {
            const activeProgram = await activeProgramService.getActive();
            if (!activeProgram || activeProgram.status !== 'running') {
                return;
            }

            if (activeProgram.type === 'ADVANCED') {
                const now = new Date();
                const timeString = now.toTimeString().slice(0, 5);

                if (!options?.silent) {
                    logger.info({ time: timeString }, '⚡ Immediate Advanced Program Check');

                    // Log manual check event
                    events.emit('advanced:manual_check', {
                        programId: activeProgram.sourceProgramId,
                        timestamp: now,
                        userInitiated: true
                    });
                } else {
                    logger.debug({ time: timeString }, '⚡ Immediate Check (Silent)');
                }

                await this.processAdvancedProgram(activeProgram, timeString, true);
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

            // BASIC MODE: Daily Reset Logic
            // Check if day has changed since last tick/check
            if (activeProgram && (activeProgram.type === 'BASIC' || !activeProgram.type)) {
                const currentDay = now.getDate();
                if (this._lastCheckedDay !== currentDay) {
                    logger.info({ prev: this._lastCheckedDay, curr: currentDay }, '📅 New Day Detected (Basic Mode) - Resetting Completed Cycles');
                    let dirty = false;
                    for (const s of activeProgram.schedule) {
                        if (s.status === 'completed' || s.status === 'skipped') {
                            s.status = 'pending';
                            dirty = true;
                        }
                    }
                    if (dirty) {
                        await activeProgram.save();
                        logger.info('✅ Basic Program Schedule Reset for New Day');
                    }
                    this._lastCheckedDay = currentDay;
                }
            }

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

                        // FIX: Inject activeProgramId so ProgramLogService can record analytics
                        const runtimeOverrides = {
                            ...scheduledItem.overrides,
                            activeProgramId: activeProgram.sourceProgramId
                        };

                        await this.handleScheduledCycle(scheduledItem.cycleId, scheduledItem.steps, runtimeOverrides, scheduledItem.cycleId);
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
    private async processAdvancedProgram(activeProgram: any, timeString: string, force: boolean = false): Promise<void> {
        if (!activeProgram.windows || !activeProgram.windowsState) {
            logger.warn('⚠️ Advanced program has no windows or windowsState');
            return;
        }

        // Get program start time to determine if we were active during a window
        const programStartTime = activeProgram.startTime ? new Date(activeProgram.startTime) : null;

        // Get variable overrides for flow execution (global variables set by user)
        const variableOverrides = activeProgram.variableOverrides || {};

        for (let i = 0; i < activeProgram.windows.length; i++) {
            const window = activeProgram.windows[i] as ITimeWindow;
            const state = activeProgram.windowsState.find((s: IWindowState) => s.windowId === window.id);

            if (!state) {
                logger.warn({ windowId: window.id }, '⚠️ No state found for window');
                continue;
            }

            logger.info({ window: window.name, status: state.status, lastCheck: state.lastCheck }, '🔍 Scheduler: Processing Window Step');

            // ---------------------------------------------------------
            // 0. SKIP & DAY RESET LOGIC
            // ---------------------------------------------------------
            const now = new Date();
            let dirty = false;

            // A. Check for New Day (Reset Logic)
            // If window is done (completed/skipped) but last check was previous day
            if (state.lastCheck && (state.status === 'completed' || state.status === 'skipped')) {
                const lastCheckDate = new Date(state.lastCheck);
                if (lastCheckDate.getDate() !== now.getDate() || lastCheckDate.getMonth() !== now.getMonth()) {
                    // It's a new day!

                    // Check if we should keep it skipped
                    const isStillSkipped = state.skipUntil && new Date(state.skipUntil) > now;

                    if (isStillSkipped) {
                        // Update lastCheck to today so we don't check again this tick
                        state.lastCheck = now;
                        // Status remains 'skipped'
                        dirty = true;
                    } else {
                        logger.info({ windowId: window.id }, '📅 New Day Detected - Resetting window status');
                        state.status = 'pending';
                        state.triggersExecuted = [];
                        state.triggersExecuting = [];
                        state.currentFlowSessionId = undefined;
                        // Clear skip if it was expired
                        if (state.skipUntil && new Date(state.skipUntil) <= now) {
                            state.skipUntil = undefined;
                        }

                        // Reset day flag if needed
                        if (activeProgram.dayCompleteEmitted) {
                            activeProgram.dayCompleteEmitted = false;
                        }
                        dirty = true;
                    }
                }
            }

            // B. Enforce Skip Duration
            if (state.skipUntil) {
                const skipUntil = new Date(state.skipUntil);
                if (now < skipUntil) {
                    if (state.status !== 'skipped') {
                        state.status = 'skipped';
                        state.triggersExecuting = []; // Stop anything running? (Handled by check below)
                        logger.info({ windowId: window.id, until: state.skipUntil }, '⏭️ Window Skipped (Enforced by skipUntil)');
                        dirty = true;
                    }
                } else {
                    // Skip Expired
                    if (state.status === 'skipped') {
                        // Only reset if NO skipUntil (caught above) or explicit check
                        logger.info({ windowId: window.id }, '⏯️ Window Skip Expired - Resuming');
                        state.status = 'pending';
                        state.skipUntil = undefined;
                        dirty = true;
                    }
                }
            }

            if (dirty) {
                activeProgram.markModified('windowsState');
                // We save here to ensure reset persists even if we continue/skip below
                await activeProgram.save();
            }

            // Skip completed or skipped windows
            if (state.status === 'completed' || state.status === 'skipped') continue;

            // ---------------------------------------------------------
            // ASYNC FLOW TRACKING (Variant C) - HOISTED
            // Check if we are waiting for a flow to complete (Trigger or Fallback)
            // ---------------------------------------------------------
            if (state.triggersExecuting && state.triggersExecuting.length > 0) {
                // Check if flow finished:
                // 1. Different session active (machine moved on)
                // 2. Or same session in final state
                const snapshot = automation.getSnapshot();
                const currentSessionId = state.currentFlowSessionId;

                // It's a mismatch if:
                // A. The direct SessionID doesn't match (Running a stand-alone program?)
                // B. AND the parent Cycle Session ID doesn't match (Running a sub-program of our cycle?)
                const isDirectMatch = snapshot.context?.sessionId === currentSessionId;
                // FIX: Parent ID is injected into variables (inside execContext)
                const variables = snapshot.context?.execContext?.variables || {};
                const isParentMatch = variables['_parentCycleSessionId'] === currentSessionId;

                const isSessionMismatch = !isDirectMatch && !isParentMatch;
                const isStatusFinished = ['completed', 'error', 'stopped', 'idle'].includes(snapshot.value as string);

                const isFinished = isSessionMismatch || isStatusFinished;

                // DEBUG LOGGING for prematurely closed windows
                if (isFinished && currentSessionId) {
                    logger.info({
                        windowId: window.id,
                        currentSessionId,
                        snapshotSessionId: snapshot.context?.sessionId,
                        snapshotStatus: snapshot.value,
                        isSessionMismatch,
                        isStatusFinished
                    }, '🔍 Debug: Scheduler detecting flow finish');
                }

                if (isFinished && currentSessionId) {
                    logger.info({ windowId: window.id, sessionId: currentSessionId }, '✅ Trigger/Fallback flow finished');

                    // Move executing triggers to executed
                    // If it was 'fallback', we still push it to track that fallback ran
                    state.triggersExecuted.push(...state.triggersExecuting);
                    state.triggersExecuting = []; // Clear executing
                    state.currentFlowSessionId = undefined;

                    // Check if any executed trigger was a BREAK trigger
                    const breakTrigger = window.triggers.find(t =>
                        state.triggersExecuted.includes(t.id) && t.behavior === 'break'
                    );

                    // Check if fallback was executed (pseudo-ID)
                    const fallbackExecuted = state.triggersExecuted.includes('fallback');

                    // If it was a BREAK trigger OR Fallback finished, close the window NOW
                    if (breakTrigger || fallbackExecuted) {
                        state.status = 'completed';

                        const result = breakTrigger ? 'triggered' : (fallbackExecuted ? 'fallback' : 'no_trigger');
                        logger.info({ windowId: window.id, result }, '🛑 Flow finished (Break/Fallback) - closing window');

                        events.emit('advanced:window_completed', {
                            programId: activeProgram.sourceProgramId,
                            windowId: window.id,
                            windowName: window.name,
                            result: result as any, // 'triggered' | 'fallback' | 'no_trigger'
                            timestamp: new Date(),
                            flowId: this.getFlowIdFromExecution(window, state),
                            flowName: this.getFlowIdFromExecution(window, state)
                        });

                        // RECORD SUMMARY (Fix for /short analysis)
                        try {
                            const { resourceSummaryService } = require('../analysis/ResourceSummaryService');
                            const flowId = this.getFlowIdFromExecution(window, state);

                            await resourceSummaryService.recordWindowSummary({
                                programId: activeProgram.sourceProgramId,
                                programName: activeProgram.name || activeProgram.sourceProgramId,
                                windowId: window.id,
                                windowName: window.name,
                                flowId: flowId,
                                flowName: flowId, // Should verify if we can get real name
                                executionType: 'WINDOW'
                            });
                            logger.info('📊 [ResourceSummaryService] Summary recorded for Fallback/Trigger flow');
                        } catch (err) {
                            logger.error({ err }, '❌ Failed to record resource summary');
                        }
                    }

                    await activeProgram.save();
                }

                // If still executing, SKIP further evaluation for this window
                // We wait for the current flow to finish before checking other triggers
                continue;
            }

            // Check if we're in the time window
            if (this.isInTimeWindow(timeString, window.startTime, window.endTime)) {
                // Emit window_active event only when status changes to active
                if (state.status !== 'active') {
                    events.emit('advanced:window_active', {
                        programId: activeProgram.sourceProgramId,
                        windowId: window.id,
                        windowName: window.name,
                        timestamp: new Date()
                    });

                    state.status = 'active';
                    // Save immediately to prevent duplicate event on next tick
                    activeProgram.markModified('windowsState');
                    await activeProgram.save();
                }

                // Check if it's time to poll (based on checkInterval) or FORCE check
                if (force || this.shouldCheck(state.lastCheck, window.checkInterval)) {
                    // BUGFIX: Check if a cycle is already running - skip this tick if so
                    const snapshot = automation.getSnapshot();
                    const isCycleRunning = snapshot.value === 'running' || snapshot.value === 'paused';

                    if (isCycleRunning) {
                        logger.debug({ windowId: window.id }, '⏳ Cycle running, skipping trigger evaluation');
                        continue;
                    }

                    logger.info({ windowId: window.id, windowName: window.name }, '🔄 Evaluating triggers for window');

                    const windowOverrides = (activeProgram as any).windowOverrides?.[window.id] || {};

                    const result = await triggerEvaluator.evaluateWindow(
                        window,
                        state,
                        variableOverrides, // Global defaults
                        windowOverrides,   // Context specific
                        activeProgram.sourceProgramId
                    );
                    state.lastCheck = new Date();

                    if (result === 'executing') {
                        // Flow started, we will track completion in next ticks
                        await activeProgram.save();
                        continue;
                    }

                    if (result === 'triggered' || result === 'all_done') {
                        state.status = 'completed';
                        logger.info({ windowId: window.id, result }, '✅ Window completed');
                        events.emit('advanced:window_completed', {
                            programId: activeProgram.sourceProgramId,
                            windowId: window.id,
                            windowName: window.name,
                            result: result === 'triggered' ? 'triggered' : 'no_trigger',
                            timestamp: new Date(),
                            flowId: this.getFlowIdFromExecution(window, state),
                            flowName: this.getFlowIdFromExecution(window, state)
                        });
                    }

                    // Save after each window evaluation
                    await activeProgram.save();
                }
            }

            // ZOMBIE CHECK: If status is 'active' but no session ID, and past time -> Force Complete
            else if (state.status === 'active' && !state.currentFlowSessionId && this.isPastTimeWindow(timeString, window.endTime)) {
                logger.warn({ windowId: window.id }, '🧟 Zombie Active Window detected (No Session ID). Marking completed.');
                state.status = 'completed';

                // Add log entry so user sees it finished
                try {
                    const { programLogService } = require('../logging/ProgramLogService');
                    programLogService.logEvent({
                        programId: activeProgram.sourceProgramId,
                        type: 'WINDOW_EVENT',
                        message: `Прозорец "${window.name}" завърши (Resume/Fallback)`,
                        metadata: { windowId: window.id }
                    });
                } catch (e) { }

                await activeProgram.save();
                continue;
            }

            // Check if we're past the window (fallback time)
            else if (this.isPastTimeWindow(timeString, window.endTime) && state.status !== 'completed' && state.status !== 'active') {
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
                    events.emit('advanced:window_skipped', {
                        programId: activeProgram.sourceProgramId,
                        windowId: window.id,
                        windowName: window.name,
                        reason: 'Program started after window ended',
                        timestamp: new Date()
                    });
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

                const hasLinkedFallback = !!(window as any).fallbackTriggerId;
                const legacyFallback = !!(window.fallbackFlowId || (window.fallbackFlowIds && window.fallbackFlowIds.length > 0));

                if (!hasBreakExecuted && (hasLinkedFallback || legacyFallback)) {
                    const linkedId = (window as any).fallbackTriggerId;
                    let flowNameLog = 'Unknown';

                    if (hasLinkedFallback) {
                        // Resolve trigger index for friendlier log?
                        const tIdx = window.triggers.findIndex(t => t.id === linkedId);
                        flowNameLog = `Linked Trigger #${tIdx + 1}`;
                    } else {
                        const stepsCount = window.fallbackFlowIds?.length || (window.fallbackFlowId ? 1 : 0);
                        flowNameLog = stepsCount > 1 ? `${stepsCount} Flows` : (window.fallbackFlowId || window.fallbackFlowIds?.[0] || 'Legacy');
                    }

                    events.emit('advanced:fallback_executed', {
                        programId: activeProgram.sourceProgramId,
                        windowId: window.id,
                        windowName: window.name,
                        flowName: flowNameLog,
                        timestamp: new Date()
                    });



                    const windowOverrides = (activeProgram as any).windowOverrides?.[window.id] || {};
                    // Pass global (variableOverrides) and window-specific (windowOverrides) separately
                    const fallbackSessionId = await triggerEvaluator.executeFallback(
                        window,
                        variableOverrides,
                        windowOverrides,
                        activeProgram.sourceProgramId
                    );

                    // FIX: Track fallback execution to prevent premature window completion
                    if (fallbackSessionId) {
                        state.currentFlowSessionId = fallbackSessionId;
                        state.triggersExecuting = ['fallback']; // Use pseudo-ID to track execution
                        await activeProgram.save();
                        continue; // Wait for next tick to track completion
                    }
                }

                state.status = 'completed';
                // Check if we completed due to break or fallback
                // Note: If we just finished fallback, 'fallback' will be in triggersExecuted (logic below)
                // But here we are setting it immediately if fallback failed to start or wasn't needed?
                // Wait, if fallback started, we 'continue' above. So we only reach here if NO fallback ran.
                // OR if we are handling the completion of the fallback (in the flow tracking block above).

                // Oops, the flow tracking block handles completion and sets triggersExecuted = triggersExecuting.
                // So if fallback finishes, triggersExecuted will contain 'fallback'.

                // We should NOT emit 'window_completed' here if we just started fallback (handled by continue).
                // We ARE here because either:
                // 1. No break trigger + No fallback defined.
                // 2. Program missed window (handled above).

                events.emit('advanced:window_completed', {
                    programId: activeProgram.sourceProgramId,
                    windowId: window.id,
                    windowName: window.name,
                    result: hasBreakExecuted ? 'triggered' : 'no_trigger',
                    timestamp: new Date(),
                    flowId: this.getFlowIdFromExecution(window, state),
                    flowName: this.getFlowIdFromExecution(window, state)
                });
                await activeProgram.save();
            }
        }

        // Check if all windows are completed or skipped
        const allDone = activeProgram.windowsState.every((s: IWindowState) =>
            s.status === 'completed' || s.status === 'skipped'
        );
        if (allDone && !activeProgram.dayCompleteEmitted) {
            logger.info('🏁 All windows completed - Advanced Program finished for today');
            events.emit('advanced:program_day_complete', {
                programId: activeProgram.sourceProgramId,
                timestamp: new Date()
            });
            activeProgram.dayCompleteEmitted = true;
            await activeProgram.save();
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
    /**
     * Determine the primary Flow ID that was executed in this window session
     */
    private getFlowIdFromExecution(window: ITimeWindow, state: IWindowState): string | undefined {
        // 1. Check for Break Trigger (Highest Priority)
        const breakTrigger = window.triggers.find(t =>
            state.triggersExecuted.includes(t.id) && t.behavior === 'break'
        );
        if (breakTrigger) {
            return breakTrigger.flowId || (breakTrigger.flowIds && breakTrigger.flowIds.length > 0 ? breakTrigger.flowIds[0] : undefined);
        }

        // 2. Check for Fallback
        if (state.triggersExecuted.includes('fallback')) {
            return window.fallbackFlowId || (window.fallbackFlowIds && window.fallbackFlowIds.length > 0 ? window.fallbackFlowIds[0] : undefined);
        }

        // 3. Check for any executed trigger (if no break trigger)
        for (const triggerId of state.triggersExecuted) {
            const trigger = window.triggers.find(t => t.id === triggerId);
            if (trigger) {
                return trigger.flowId || (trigger.flowIds && trigger.flowIds.length > 0 ? trigger.flowIds[0] : undefined);
            }
        }

        return undefined;
    }

    private timeToMinutes(time: string): number {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }

    private shouldCheck(lastCheck: Date | undefined, intervalMinutes: number): boolean {
        if (!lastCheck) return true;
        const elapsed = (Date.now() - new Date(lastCheck).getTime()) / 1000 / 60;
        return elapsed >= intervalMinutes;
    }
}

export const schedulerService = new SchedulerService();

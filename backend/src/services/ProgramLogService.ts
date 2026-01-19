import { events } from '../core/EventBusService';
import { programDailyLogRepository } from '../modules/persistence/repositories/ProgramDailyLogRepository';
import { logger } from '../core/LoggerService';
import { timeService } from '../core/TimeService';

interface LogEntry {
    programId: string | undefined;
    type: 'TRIGGER' | 'FLOW_STATE' | 'WINDOW_EVENT' | 'ERROR' | 'SYSTEM' | 'INFO' | 'WARNING' | 'TRIGGER_MATCH' | 'TRIGGER_SKIP' | 'FLOW_EXECUTED' | 'USER_LOG' | 'WAIT_START' | 'SYSTEM_PAUSE' | 'SYSTEM_RESUME' | 'SYSTEM_STOP';
    message: string;
    metadata?: any;
    level?: 'info' | 'warn' | 'error';
}

export class ProgramLogService {
    constructor() {
        logger.info('📋 [ProgramLogService] Initializing event listeners...');
        this.setupListeners();
        logger.info('📋 [ProgramLogService] Ready');
    }

    private setupListeners() {
        // --- Scheduler / Advanced Program Events ---

        // Automation State Change (Pause/Resume/Stop)
        events.on('automation:state_change', async (data: any) => {
            const progId = data.activeProgramId;
            if (!progId) return;

            let type: any = 'INFO';
            let message = '';

            if (data.state === 'paused') {
                type = 'SYSTEM_PAUSE';
                message = '⏸️ Програмата е паузирана';
            } else if (data.state === 'running' && data.previousState === 'paused') {
                type = 'SYSTEM_RESUME';
                message = '▶️ Програмата е възобновена';
            } else if (data.state === 'stopped') {
                type = 'SYSTEM_STOP';
                message = '🛑 Програмата е спряна';
            } else {
                return; // Ignore other state changes for now
            }

            await this.logEvent({
                programId: progId,
                type: type,
                message,
                metadata: {
                    state: data.state,
                    previousState: data.previousState
                }
            });
        });

        // Block Execution
        events.on('automation:block_end', async (data: any) => {
            const progId = data.activeProgramId;
            if (!progId) return;

            const { blockId, blockType, blockLabel, success, summary, error, output, logData } = data;

            // Determine which blocks to log
            const importantBlocks = ['SENSOR_READ', 'ACTUATOR_SET', 'IF', 'LOOP', 'LOG', 'WAIT'];
            if (!importantBlocks.includes(blockType)) return;

            const name = blockLabel || blockType;
            let message = '';
            let type: any = success ? 'INFO' : 'ERROR';

            switch (blockType) {
                case 'SENSOR_READ':
                    message = `📊 ${name}: ${summary || output?.displayValue || 'Прочит'}`;
                    break;
                case 'ACTUATOR_SET':
                    message = `⚡ ${name}: ${summary || 'Действие'}`;
                    break;
                case 'IF':
                    message = `❓ ${name}: ${summary || (output?.result ? 'TRUE' : 'FALSE')}`;
                    break;
                case 'LOOP':
                    message = `🔄 ${name}: ${summary || `Итерация ${output?.iteration || '?'}`}`;
                    break;
                case 'LOG':
                    type = 'USER_LOG';
                    // summary contains the Action (e.g. "Pause Program") or just "Log Only"
                    // name contains the block label (e.g. "Level Error")
                    message = `📝 ${name} - ${summary || 'Log'}`; // Added Notepad icon for visibility
                    break;
                case 'WAIT':
                    type = 'WAIT_START';
                    message = `⏳ Изчакване: ${summary || '...'}`;
                    break;
            }

            if (!success && error) {
                message = `❌ ${name}: ${error}`;
                type = 'ERROR';
            }

            await this.logEvent({
                programId: progId,
                type: type,
                message: message,
                metadata: {
                    blockId,
                    blockType,
                    blockLabel,
                    success,
                    output: output?.displayValue || output?.result,
                    logData,
                    sessionId: data.sessionId,
                    windowId: data.windowId,
                    windowName: data.windowName,
                    flowName: data.programName
                }
            });
        });

        // Window Active
        events.on('advanced:window_active', async (data: any) => {
            await this.logEvent({
                programId: data.programId,
                type: 'WINDOW_EVENT',
                message: `Прозорец "${data.windowName}" стартира`,
                metadata: {
                    windowId: data.windowId,
                    windowName: data.windowName,
                    startTime: data.startTime,
                    endTime: data.endTime
                }
            });
        });

        // Window Completed
        events.on('advanced:window_completed', async (data: any) => {
            const reason = data.result === 'triggered' ? 'Поток приключен' :
                data.result === 'fallback' ? 'Fallback' : 'Изтекло време';

            await this.logEvent({
                programId: data.programId,
                type: 'WINDOW_EVENT',
                message: `Прозорец "${data.windowName}" завърши (${reason})`,
                metadata: {
                    windowId: data.windowId,
                    windowName: data.windowName,
                    result: data.data?.result
                }
            });

            // Record aggregated resource summary
            if (data.programId && data.windowId) {
                try {
                    const { resourceSummaryService } = require('./ResourceSummaryService');
                    await resourceSummaryService.recordExecution({
                        programId: data.programId,
                        programName: data.programName || data.programId,
                        windowId: data.windowId,
                        windowName: data.windowName,
                        flowId: data.flowId,
                        flowName: data.flowName,
                        executionType: 'WINDOW',
                        sessionId: data.sessionId
                    });
                } catch (err: any) {
                    logger.error({ err: err.message }, '❌ [ProgramLogService] Failed to record resource summary');
                }
            }
        });

        // Window Skipped
        events.on('advanced:window_skipped', async (data: any) => {
            await this.logEvent({
                programId: data.programId,
                type: 'WINDOW_EVENT',
                message: `Прозорец "${data.windowName}" пропуснат: ${data.data?.reason}`,
                metadata: {
                    windowId: data.windowId,
                    reason: data.data?.reason
                }
            });
        });

        // Trigger Matched
        events.on('advanced:trigger_matched', async (data: any) => {
            await this.logEvent({
                programId: data.programId,
                type: 'TRIGGER_MATCH',
                message: `Тригер: ${data.sensorName} (${data.sensorValue}) ${data.condition}`,
                metadata: {
                    windowId: data.windowId,
                    windowName: data.windowName,
                    sensorId: data.sensorId,
                    value: data.sensorValue,
                    flowIds: data.flowIds
                }
            });
        });

        // Trigger Evaluation (Detailed Logging)
        events.on('advanced:trigger_evaluation', async (data: any) => {
            if (!data.programId) return;

            // Use deduplication to update the last log entry if it's the same trigger evaluation
            await programDailyLogRepository.addOrUpdateEvent(
                data.programId,
                {
                    timestamp: timeService.now(),
                    type: 'TRIGGER_EVALUATION',
                    message: '🎯 [TriggerEvaluator] Evaluation Result',
                    metadata: {
                        windowId: data.windowId,
                        triggerId: data.triggerId,
                        triggerIndex: data.triggerIndex,
                        logicalOp: data.logicalOp,
                        conditions: data.conditions,
                        results: data.results,
                        isTriggered: data.isTriggered
                    }
                },
                {
                    type: 'TRIGGER_EVALUATION',
                    triggerId: data.triggerId,
                    windowId: data.windowId
                }
            );
        });

        // Trigger Skipped (sensor error or condition not met)
        events.on('advanced:trigger_skipped', async (data: any) => {
            if (!data.programId) return;

            const isSensorError = data.condition === 'SENSOR ERROR';
            const type = isSensorError ? 'WARNING' : 'TRIGGER_SKIP';
            const message = isSensorError
                ? `Сензор "${data.sensorName}" - грешка при четене`
                : `Тригер: ${data.sensorName} (${data.sensorValue}) ${data.condition} - не съвпадна`;

            const metadata = {
                windowId: data.windowId,
                windowName: data.windowName,
                triggerId: data.triggerId,
                sensorValue: data.sensorValue,
                condition: data.condition
            };

            try {
                // Use smart deduplication - update last similar event instead of creating new
                await programDailyLogRepository.addOrUpdateEvent(
                    data.programId,
                    {
                        timestamp: timeService.now(),
                        type: type as any,
                        message,
                        metadata
                    },
                    {
                        type,
                        triggerId: data.triggerId,
                        windowId: data.windowId
                    }
                );
                logger.debug({ programId: data.programId, type }, '✅ [ProgramLogService] Trigger skip logged (deduplicated)');
            } catch (err: any) {
                logger.error({ err, programId: data.programId }, '❌ [ProgramLogService] Failed to log trigger skip');
            }
        });

        // Active Program Started (Day/Schedule Start)
        events.on('active:program_started', async (data: any) => {
            await this.logEvent({
                programId: data.programId,
                type: 'INFO',
                message: `Програмата стартира`,
                metadata: {
                    timestamp: timeService.now()
                }
            });
        });

        // Manual Check Initiated
        events.on('advanced:manual_check', async (data: any) => {
            await this.logEvent({
                programId: data.programId,
                type: 'INFO',
                message: `Извънредна проверка (Force Check)`,
                metadata: {
                    timestamp: data.timestamp,
                    userInitiated: true
                }
            });
        });

        // Automation Flow Start
        events.on('automation:program_start', async (data: any) => {
            const progId = data.activeProgramId;
            if (progId) {
                let message = `Стартиран поток: ${data.programName}`;
                if (data.executionType === 'fallback') {
                    message = `Стартиран поток (Fallback): ${data.programName}`;
                }

                await this.logEvent({
                    programId: progId,
                    type: 'FLOW_EXECUTED',
                    message,
                    metadata: {
                        sessionId: data.sessionId,
                        flowId: data.programId, // Template ID
                        executionType: data.executionType
                    }
                });
            }
        });
    }

    /**
     * Helper to log safely
     */
    public async logEvent(entry: LogEntry) {
        logger.info({ programId: entry.programId, type: entry.type, message: entry.message }, '📝 [ProgramLogService] logEvent called');

        if (!entry.programId) {
            logger.warn({ type: entry.type, message: entry.message }, '⚠️ [ProgramLogService] Skipping log - no programId');
            return;
        }

        try {
            await programDailyLogRepository.addEvent(entry.programId, {
                timestamp: timeService.now(), // Uses Virtual Time if Simulating
                type: entry.type,
                message: entry.message,
                metadata: entry.metadata,
                level: entry.level || 'info'
            });
            logger.info({ programId: entry.programId, type: entry.type }, '✅ [ProgramLogService] Event saved to DB');
        } catch (err) {
            logger.error({ err, programId: entry.programId, type: entry.type }, '❌ [ProgramLogService] Failed to write to DailyLog');
        }
    }
}

export const programLogService = new ProgramLogService();

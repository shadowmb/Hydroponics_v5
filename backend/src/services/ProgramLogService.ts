import { events } from '../core/EventBusService';
import { programDailyLogRepository } from '../modules/persistence/repositories/ProgramDailyLogRepository';
import { logger } from '../core/LoggerService';


export class ProgramLogService {
    constructor() {
        logger.info('📋 [ProgramLogService] Initializing event listeners...');
        this.setupListeners();
        logger.info('📋 [ProgramLogService] Ready');
    }

    private setupListeners() {
        // --- Scheduler / Advanced Program Events ---

        // Window Active
        events.on('advanced:window_active', async (data: any) => {
            await this.logEvent(data.programId, 'WINDOW_EVENT', `Прозорец "${data.windowName}" стартира`, {
                windowId: data.windowId,
                windowName: data.windowName,
                startTime: data.startTime,
                endTime: data.endTime
            });
        });

        // Window Completed
        events.on('advanced:window_completed', async (data: any) => {
            const reason = data.data?.result === 'triggered' ? 'Тригер' :
                data.data?.result === 'fallback' ? 'Fallback' : 'Изтекло време';

            await this.logEvent(data.programId, 'WINDOW_EVENT', `Прозорец "${data.windowName}" завърши (${reason})`, {
                windowId: data.windowId,
                windowName: data.windowName,
                result: data.data?.result
            });
        });

        // Window Skipped
        events.on('advanced:window_skipped', async (data: any) => {
            await this.logEvent(data.programId, 'WINDOW_EVENT', `Прозорец "${data.windowName}" пропуснат: ${data.data?.reason}`, {
                windowId: data.windowId,
                reason: data.data?.reason
            });
        });

        // Trigger Matched
        events.on('advanced:trigger_matched', async (data: any) => {
            // data usually has { programId, windowId, sensorName, sensorValue, condition, flowId ... }
            await this.logEvent(data.programId, 'TRIGGER_MATCH', `Тригер: ${data.sensorName} (${data.sensorValue}) ${data.condition}`, {
                windowId: data.windowId,
                windowName: data.windowName, // Using windowId as fallback if name missing? No, TriggerEvaluator sends it.
                sensorId: data.sensorId,
                value: data.sensorValue,
                flowIds: data.flowIds
            });
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
                        timestamp: new Date(),
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
            } catch (err) {
                logger.error({ err, programId: data.programId }, '❌ [ProgramLogService] Failed to log trigger skip');
            }
        });

        // Automation Block Execution (High Level Only)
        // We probably don't want EVERY block step in the Daily Log, maybe just Flows?
        // User said: "information about ... what programs and blocks are executed"
        // But also "We have 20 lines...".
        // If we log every 'execution_step', it will be spammed.
        // Let's log 'program_start' (Flow Start) and 'program_stop' (Flow End) which correspond to Flows running.

        // Active Program Started (Day/Schedule Start)
        events.on('active:program_started', async (data: any) => {
            await this.logEvent(data.programId, 'INFO', `Програмата стартира`, {
                timestamp: new Date()
            });
        });

        // Automation Flow Start
        events.on('automation:program_start', async (data: any) => {
            const progId = data.activeProgramId;
            if (progId) {
                await this.logEvent(progId, 'FLOW_EXECUTED', `Стартиран поток: ${data.programName}`, {
                    sessionId: data.sessionId,
                    flowId: data.programId // Template ID
                }, data.sessionId);
            }
        });

        // Block Execution (only important blocks to avoid spam)
        events.on('automation:block_end', async (data: any) => {
            logger.info({ activeProgramId: data.activeProgramId, blockType: data.blockType, blockId: data.blockId }, '📋 [ProgramLogService] Received block_end event');

            const progId = data.activeProgramId;
            if (!progId) {
                logger.warn({ blockId: data.blockId }, '⚠️ [ProgramLogService] Skipping - no activeProgramId');
                return; // Skip if no program context
            }

            const { blockId, blockType, blockLabel, success, summary, error, output, logData } = data;

            // Determine which blocks to log
            const importantBlocks = ['SENSOR_READ', 'ACTUATOR_SET', 'IF', 'LOOP'];
            if (!importantBlocks.includes(blockType)) return;

            // Use blockLabel if available, otherwise fallback to blockType
            const name = blockLabel || blockType;

            // Build message based on block type
            let message = '';
            let type: 'INFO' | 'WARNING' | 'ERROR' = success ? 'INFO' : 'ERROR';

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
            }

            if (!success && error) {
                message = `❌ ${name}: ${error}`;
            }

            await this.logEvent(progId, type, message, {
                blockId,
                blockType,
                blockLabel,
                success,
                output: output?.displayValue || output?.result,
                logData, // <--- Persist Structured Data
                sessionId: data.sessionId,
                windowId: data.windowId,
                windowName: data.windowName,
                flowName: data.programName // In automation engine 'programName' is the flow name
            }, data.sessionId);
        });

    }

    /**
     * Helper to log safely
     */
    private async logEvent(programId: string | undefined, type: any, message: string, metadata: any = {}, executionSessionId?: string) {
        logger.info({ programId, type, message }, '📝 [ProgramLogService] logEvent called');

        if (!programId) {
            logger.warn({ type, message }, '⚠️ [ProgramLogService] Skipping log - no programId');
            return;
        }

        try {
            await programDailyLogRepository.addEvent(programId, {
                timestamp: new Date(),
                type,
                message,
                metadata,
                executionSessionId
            });
            logger.info({ programId, type }, '✅ [ProgramLogService] Event saved to DB');
        } catch (err) {
            logger.error({ err, programId, type }, '❌ [ProgramLogService] Failed to write to DailyLog');
        }
    }
}

export const programLogService = new ProgramLogService();

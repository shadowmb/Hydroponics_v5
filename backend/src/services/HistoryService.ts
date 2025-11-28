import { events } from '../core/EventBusService';
import { logger } from '../core/LoggerService';
import { Reading } from '../models/Reading';

export class HistoryService {
    private static instance: HistoryService;

    private constructor() {
        // Singleton
    }

    public static getInstance(): HistoryService {
        if (!HistoryService.instance) {
            HistoryService.instance = new HistoryService();
        }
        return HistoryService.instance;
    }

    public initialize(): void {
        logger.info('📜 [HistoryService] Initializing...');
        this.bindEvents();
    }

    private bindEvents(): void {
        events.on('device:data', this.handleDeviceData.bind(this));
    }

    private async handleDeviceData(payload: any): Promise<void> {
        try {
            const { deviceId, driverId, deviceName, value, raw, details, timestamp, readings: incomingReadings } = payload;

            // Construct readings object
            let readings: Record<string, any> = {};

            if (incomingReadings && Object.keys(incomingReadings).length > 0) {
                // Use the pre-constructed readings from HardwareService (contains correct metric keys)
                readings = incomingReadings;
            } else if (details && typeof details === 'object' && !Array.isArray(details)) {
                // Legacy Fallback: If details contains useful keys like 'temp', 'humidity', use them.
                if (Object.keys(details).length > 0) {
                    readings = { ...details };
                } else {
                    readings = { value, raw };
                }
            } else {
                readings = { value, raw };
            }

            // Create the record
            await Reading.create({
                timestamp: timestamp || new Date(),
                metadata: {
                    deviceId,
                    deviceName,
                    deviceType: driverId
                },
                readings
            });

            logger.debug({ deviceId }, '💾 [HistoryService] Saved reading');

        } catch (error) {
            logger.error({ err: error, payload }, '❌ [HistoryService] Failed to save reading');
        }
    }
}

export const historyService = HistoryService.getInstance();

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
            const { deviceId, driverId, deviceName, value, raw, details, timestamp } = payload;

            // Construct readings object
            // If details is an object with multiple values (e.g. DHT22), use it.
            // Otherwise, use the single 'value' and 'raw'.
            let readings: Record<string, any> = {};

            if (details && typeof details === 'object' && !Array.isArray(details)) {
                // If details contains useful keys like 'temp', 'humidity', use them.
                // We filter out internal keys if necessary, but for now, let's trust the details.
                // However, 'details' might be the raw response structure (e.g. { ok: 1, registers: [...] }).
                // We need to be careful. 

                // Strategy: If 'details' has keys that look like physical values, use them.
                // For now, let's store the 'value' as 'primaryValue' and 'raw' as 'rawInput'.
                // AND if we have specific known keys from multi-value sensors, we should map them.
                // But the payload from HardwareService should ideally be clean.

                // Let's rely on what we send from HardwareService.
                // If HardwareService sends a clean 'readings' object, that's best.
                // If not, we construct it here.

                // For this iteration, let's assume HardwareService sends a 'readings' object in the payload
                // OR we construct it from value/raw.

                // Let's look at what we have:
                // Single Value: value=7.2, raw=123
                // Multi Value: value=24.5, details={temp: 24.5, humidity: 60}

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

import { IDevice } from '../../models/Device';
import { logger } from '../../core/LoggerService';

export interface ValidationResult {
    success: boolean;
    value?: number;
    error?: string;
    isFallback?: boolean;
    fallbackType?: string;
    data?: any; // Full result object from readFn
}

export class SensorValidationService {
    private static instance: SensorValidationService;
    private failureCounts: Map<string, number> = new Map();

    private constructor() { }

    public static getInstance(): SensorValidationService {
        if (!SensorValidationService.instance) {
            SensorValidationService.instance = new SensorValidationService();
        }
        return SensorValidationService.instance;
    }

    /**
     * reset failure count (call this on successful read)
     */
    private resetFailureCount(deviceId: string) {
        this.failureCounts.delete(deviceId);
    }

    /**
     * increment failure count and return new value
     */
    private incrementFailureCount(deviceId: string): number {
        const current = this.failureCounts.get(deviceId) || 0;
        const next = current + 1;
        this.failureCounts.set(deviceId, next);
        return next;
    }

    /**
     * Validates a single value against device configuration
     */
    public validate(device: IDevice, value: number): { isValid: boolean; error?: string } {
        const validation = device.config.validation;

        // 1. Check User Defined Range
        if (validation?.range && (validation.range.min !== undefined || validation.range.max !== undefined)) {
            const { min, max } = validation.range;
            if (min !== undefined && value < min) return { isValid: false, error: `Value ${value} below user min ${min}` };
            if (max !== undefined && value > max) return { isValid: false, error: `Value ${value} above user max ${max}` };
        }

        // 2. Check Template/Physical Range (Future: If we want to check template limits, pass them here. 
        // For now, we assume user overrides are the primary check or "physical" limits are implicitly checked via template if passed)
        // TODO: Access template if needed.

        return { isValid: true };
    }

    /**
     * Executes a read function with retry and fallback logic
     */
    public async executeProtectedRead(
        device: IDevice,
        readFn: () => Promise<{ value: number; unit?: string; raw?: number; details?: any }>
    ): Promise<ValidationResult> {
        const validation = device.config.validation || {};
        const retryCount = validation.retryCount ?? 3;
        const retryDelayMs = validation.retryDelayMs ?? 100;

        let lastError: any = null;
        let attempts = 0;

        // --- RETRY LOOP ---
        while (attempts <= retryCount) {
            try {
                attempts++;
                const result = await readFn();

                // Validate
                const check = this.validate(device, result.value);
                if (check.isValid) {
                    this.resetFailureCount(device.id); // Success! Reset stale counter.
                    return { success: true, value: result.value, data: result };
                } else {
                    lastError = new Error(check.error);
                    logger.warn(`[SensorValidation] Device ${device.name} invalid read (Attempt ${attempts}/${retryCount + 1}): ${check.error}`);
                }

            } catch (err: any) {
                lastError = err;
                logger.warn(`[SensorValidation] Device ${device.name} read error (Attempt ${attempts}/${retryCount + 1}): ${err.message}`);
            }

            // Wait before retry if not last attempt
            if (attempts <= retryCount) {
                await new Promise(resolve => setTimeout(resolve, retryDelayMs));
            }
        }

        // --- FALLBACK LOGIC ---
        // If we get here, all retries failed.
        const failures = this.incrementFailureCount(device.id);
        const fallbackAction = validation.fallbackAction || 'error';
        const staleLimit = validation.staleLimit ?? 1;
        const staleTimeoutMs = validation.staleTimeoutMs ?? 30000;



        logger.error(`[SensorValidation] Device ${device.name} failed after ${attempts} attempts. Action: ${fallbackAction}. Consec. Failures: ${failures}`);

        if (fallbackAction === 'error') {
            return { success: false, error: lastError?.message || 'Read failed' };
        }

        // Stale limit check removed to allow infinite fallback retries

        if (fallbackAction === 'useLastValid') {
            if (device.lastReading && device.lastReading.value != null) {
                // Check Staleness Age
                const age = Date.now() - new Date(device.lastReading.timestamp).getTime();



                if (age > staleTimeoutMs) {
                    // --- EXPIRED FALLBACK: Check if we can fallback to DEFAULT ---
                    const defVal = validation.defaultValue as any;
                    if (defVal !== undefined && defVal !== null && defVal !== '') {
                        logger.warn(`[SensorValidation] Last valid value expired (${age}ms > ${staleTimeoutMs}ms). Switching to Default Value: ${defVal}`);
                        return {
                            success: true,
                            value: Number(defVal),
                            isFallback: true,
                            fallbackType: 'useDefault'
                        };
                    }

                    logger.warn(`[SensorValidation] FAIL: Last valid expired (${age}ms > ${staleTimeoutMs}ms) AND No Default Value allowed/set.`);
                    return { success: false, error: `Last valid value too old (${age}ms > ${staleTimeoutMs}ms) and no valid Default Value configured.` };
                }

                logger.info(`[SensorValidation] Using Last Valid Value: ${device.lastReading.value} (Age: ${age}ms)`);
                return {
                    success: true,
                    value: device.lastReading.value as number,
                    isFallback: true,
                    fallbackType: 'useLastValid'
                };
            } else {
                // No Last Reading at all? Try Default
                const defVal = validation.defaultValue as any;
                if (defVal !== undefined && defVal !== null && defVal !== '') {
                    logger.warn(`[SensorValidation] No Last Reading available. Switching to Default Value: ${defVal}`);
                    return {
                        success: true,
                        value: Number(defVal),
                        isFallback: true,
                        fallbackType: 'useDefault'
                    };
                }
                return { success: false, error: 'No last valid value available and no Default Value configured.' };
            }
        }

        if (fallbackAction === 'useDefault') {
            const defVal = validation.defaultValue as any;
            if (defVal !== undefined && defVal !== null && defVal !== '') {
                logger.warn(`[SensorValidation] Fallback Action is 'useDefault'. Returning: ${defVal}`);
                return {
                    success: true,
                    value: Number(defVal),
                    isFallback: true,
                    fallbackType: 'useDefault'
                };
            }
            logger.warn(`[SensorValidation] FAIL: Action is 'useDefault' BUT No Default Value allowed/set.`);
            return { success: false, error: 'No default value configured for fallback' };
        }

        // Removed 'skip' logic as per new requirements. 
        // Any unknown action defaults to error.
        return { success: false, error: lastError?.message || 'Unknown validation error' };
    }
}

export const sensorValidation = SensorValidationService.getInstance();

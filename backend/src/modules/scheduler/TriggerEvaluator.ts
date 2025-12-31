/**
 * TriggerEvaluator.ts
 * 
 * Evaluates triggers within a Time Window for Advanced Programs.
 * Reads sensor values (cached or live) and compares against trigger conditions.
 */

import { ITimeWindow, ITrigger, TriggerOperator } from '../persistence/schemas/Program.schema';
import { IWindowState } from '../persistence/schemas/ActiveProgram.schema';
import { DeviceModel } from '../../models/Device';
import { hardware } from '../hardware/HardwareService';
import { cycleManager } from './CycleManager';
import { logger } from '../../core/LoggerService';

export type EvaluationResult = 'pending' | 'triggered' | 'all_done';

export class TriggerEvaluator {

    /**
     * Evaluate all pending triggers in a window.
     * Returns 'triggered' if a BREAK trigger was executed (window should close).
     * Returns 'all_done' if all triggers have been executed.
     * Returns 'pending' otherwise (continue polling).
     */
    async evaluateWindow(
        window: ITimeWindow,
        windowState: IWindowState
    ): Promise<EvaluationResult> {

        const pendingTriggers = window.triggers.filter(
            t => !windowState.triggersExecuted.includes(t.id)
        );

        if (pendingTriggers.length === 0) {
            logger.info({ windowId: window.id }, '✅ All triggers executed in window');
            return 'all_done';
        }

        // Evaluate triggers in order (priority is implicit by array order)
        for (const trigger of pendingTriggers) {
            try {
                const sensorValue = await this.readSensor(trigger.sensorId, window.dataSource);

                if (sensorValue === null) {
                    logger.warn({ triggerId: trigger.id, sensorId: trigger.sensorId },
                        '⚠️ Sensor read returned null, skipping trigger');
                    continue;
                }

                const matches = this.matchesCondition(sensorValue, trigger);

                logger.debug({
                    triggerId: trigger.id,
                    sensorId: trigger.sensorId,
                    sensorValue,
                    operator: trigger.operator,
                    targetValue: trigger.value,
                    targetValueMax: trigger.valueMax,
                    matches
                }, '🔍 Trigger evaluation');

                if (matches) {
                    logger.info({
                        triggerId: trigger.id,
                        flowId: trigger.flowId,
                        behavior: trigger.behavior
                    }, '⚡ Trigger condition matched - executing flow');

                    // Execute the flow
                    await cycleManager.startCycle(
                        trigger.id,  // cycleId
                        `Trigger: ${trigger.id}`,  // name
                        [{ flowId: trigger.flowId, overrides: {} }],  // steps
                        {}  // overrides
                    );

                    // Mark trigger as executed
                    windowState.triggersExecuted.push(trigger.id);

                    if (trigger.behavior === 'break') {
                        logger.info({ windowId: window.id }, '🛑 BREAK trigger executed - closing window');
                        return 'triggered';
                    }
                    // behavior === 'continue': keep checking other triggers
                }
            } catch (error: any) {
                logger.error({
                    triggerId: trigger.id,
                    error: error.message
                }, '❌ Error evaluating trigger');
                // Continue to next trigger (safe default)
            }
        }

        return 'pending';
    }

    /**
     * Execute the fallback flow for a window.
     */
    async executeFallback(window: ITimeWindow): Promise<void> {
        if (!window.fallbackFlowId) {
            logger.info({ windowId: window.id }, '⚠️ No fallback flow configured');
            return;
        }

        logger.info({
            windowId: window.id,
            fallbackFlowId: window.fallbackFlowId
        }, '🛡️ Executing fallback flow');

        await cycleManager.startCycle(
            `fallback-${window.id}`,
            `Fallback: ${window.name}`,
            [{ flowId: window.fallbackFlowId, overrides: {} }],
            {}
        );
    }

    /**
     * Read sensor value (cached or live).
     */
    private async readSensor(
        sensorId: string,
        source: 'cached' | 'live'
    ): Promise<number | null> {
        try {
            if (source === 'cached') {
                const device = await DeviceModel.findById(sensorId);
                if (!device) {
                    logger.warn({ sensorId }, '⚠️ Sensor not found');
                    return null;
                }
                return device.lastReading?.value ?? null;
            } else {
                // Live read
                const result = await hardware.readSensorValue(sensorId);
                return result.value;
            }
        } catch (error: any) {
            logger.error({ sensorId, error: error.message }, '❌ Failed to read sensor');
            return null;
        }
    }

    /**
     * Check if a sensor value matches a trigger condition.
     */
    private matchesCondition(value: number, trigger: ITrigger): boolean {
        const { operator, value: target, valueMax } = trigger;

        switch (operator) {
            case '>':
                return value > target;
            case '<':
                return value < target;
            case '>=':
                return value >= target;
            case '<=':
                return value <= target;
            case '=':
                return value === target;
            case '!=':
                return value !== target;
            case 'between':
                return value >= target && value <= (valueMax ?? target);
            default:
                logger.warn({ operator }, '⚠️ Unknown operator');
                return false;
        }
    }
}

export const triggerEvaluator = new TriggerEvaluator();

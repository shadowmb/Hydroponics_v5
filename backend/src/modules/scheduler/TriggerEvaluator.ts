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
import { events } from '../../core/EventBusService';

export type EvaluationResult = 'pending' | 'triggered' | 'executing' | 'all_done';

export class TriggerEvaluator {

    /**
     * Evaluate all pending triggers in a window.
     * Returns 'triggered' if a BREAK trigger was executed (window should close).
     * Returns 'all_done' if all triggers have been executed.
     * Returns 'pending' otherwise (continue polling).
     */
    async evaluateWindow(
        window: ITimeWindow,
        windowState: IWindowState,
        variableOverrides: Record<string, any> = {}
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
                // Get sensor name first (needed for logging/events)
                const sensorDevice = await DeviceModel.findById(trigger.sensorId);
                const sensorName = sensorDevice?.name || trigger.sensorId;

                const sensorValue = await this.readSensor(trigger.sensorId, window.dataSource);

                if (sensorValue === null) {
                    logger.warn({ triggerId: trigger.id, sensorId: trigger.sensorId },
                        '⚠️ Sensor read returned null, skipping trigger');

                    // Emit skipped event for visibility
                    events.emit('advanced:trigger_skipped', {
                        windowId: window.id,
                        triggerId: trigger.id,
                        sensorName,
                        sensorValue: 0, // Placeholder
                        condition: 'SENSOR ERROR',
                        timestamp: new Date()
                    });
                    continue;
                }

                const matches = this.matchesCondition(sensorValue, trigger);

                if (matches) {
                    logger.info({
                        triggerId: trigger.id,
                        flowIds: trigger.flowIds,
                        flowId: trigger.flowId,
                        behavior: trigger.behavior
                    }, '⚡ Trigger condition matched - executing flow(s)');

                    // Construct steps from multiple flows or legacy single flow
                    let steps: { flowId: string, overrides: any }[] = [];

                    if (trigger.flowIds && trigger.flowIds.length > 0) {
                        steps = trigger.flowIds.map(fid => ({ flowId: fid, overrides: variableOverrides }));
                    } else if (trigger.flowId) {
                        steps = [{ flowId: trigger.flowId, overrides: variableOverrides }];
                    } else {
                        logger.warn({ triggerId: trigger.id }, '⚠️ Trigger matched but no flows defined');
                        return 'pending';
                    }

                    // Emit trigger_matched event for Live Execution Log
                    // For multi-flow, we show "Multiple Flows" or the first one
                    const flowDisplayName = steps.length > 1 ? `${steps.length} Flows` : steps[0]?.flowId;

                    events.emit('advanced:trigger_matched', {
                        windowId: window.id,
                        triggerId: trigger.id,
                        sensorName,
                        sensorValue,
                        condition: `${trigger.operator} ${trigger.value}${trigger.valueMax ? `-${trigger.valueMax}` : ''}`,
                        flowName: flowDisplayName,
                        timestamp: new Date()
                    });

                    // Execute the flow(s) with variable overrides
                    const flowSessionId = await cycleManager.startCycle(
                        trigger.id,  // cycleId
                        `Trigger: ${trigger.id}`,  // name
                        steps,  // multi-step array
                        variableOverrides  // session overrides
                    );

                    // Mark trigger as executing (will be moved to executed when flow completes)
                    if (!windowState.triggersExecuting) windowState.triggersExecuting = [];
                    windowState.triggersExecuting.push(trigger.id);
                    windowState.currentFlowSessionId = flowSessionId;

                    logger.info({
                        windowId: window.id,
                        triggerId: trigger.id,
                        flowSessionId,
                        stepsCount: steps.length
                    }, '🚀 Trigger flow(s) started - waiting for completion');

                    return 'executing';
                } else {
                    // Trigger condition NOT met
                    events.emit('advanced:trigger_skipped', {
                        windowId: window.id,
                        triggerId: trigger.id,
                        sensorName,
                        sensorValue,
                        condition: `${trigger.operator} ${trigger.value}${trigger.valueMax ? `-${trigger.valueMax}` : ''}`,
                        timestamp: new Date()
                    });
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
     * Returns session ID if started.
     */
    async executeFallback(window: ITimeWindow, variableOverrides: Record<string, any> = {}): Promise<string | undefined> {
        // Migration support: check both new plural array and old single ID
        const useMultiFlow = window.fallbackFlowIds && window.fallbackFlowIds.length > 0;
        const useSingleFlow = !!window.fallbackFlowId;

        if (!useMultiFlow && !useSingleFlow) {
            logger.info({ windowId: window.id }, '⚠️ No fallback flow(s) configured');
            return undefined;
        }

        logger.info({
            windowId: window.id,
            fallbackFlowId: window.fallbackFlowId,
            fallbackFlowIds: window.fallbackFlowIds
        }, '🛡️ Executing fallback flow(s)');

        try {
            // Construct steps (Multiple flows logic)
            let steps: { flowId: string, overrides: any }[] = [];

            if (useMultiFlow) {
                steps = window.fallbackFlowIds!.map(fid => ({
                    flowId: fid,
                    overrides: variableOverrides
                }));
            } else if (useSingleFlow) {
                // Backward compatibility
                steps = [{
                    flowId: window.fallbackFlowId!,
                    overrides: variableOverrides
                }];
            }

            // Execute via CycleManager
            const flowSessionId = await cycleManager.startCycle(
                `fallback-${window.id}`,
                `Fallback: ${window.name}`,
                steps,
                variableOverrides
            );

            logger.info({ flowSessionId }, '🛡️ Fallback started');
            return flowSessionId;
        } catch (error: any) {
            logger.error({
                windowId: window.id,
                error: error.message
            }, '❌ Error executing fallback flow');
            return undefined;
        }
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

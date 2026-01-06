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
        globalOverrides: Record<string, any> = {},
        contextOverrides: Record<string, any> = {}, // Nest: { contextId: { var: val } }
        programId?: string // Added for logging context
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
                // Determine original index for context generation
                const originalTIdx = window.triggers.findIndex(t => t.id === trigger.id);

                // Get sensor name first (needed for logging/events)
                const sensorDevice = await DeviceModel.findById(trigger.sensorId);
                const sensorName = sensorDevice?.name || trigger.sensorId;

                const sensorValue = await this.readSensor(trigger.sensorId, window.dataSource);

                if (sensorValue === null) {
                    logger.warn({ triggerId: trigger.id, sensorId: trigger.sensorId },
                        '⚠️ Sensor read returned null, skipping trigger');

                    // Emit skipped event for visibility
                    events.emit('advanced:trigger_skipped', {
                        programId,
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
                logger.info({ sensorValue, condition: `${trigger.operator} ${trigger.value}`, matches }, '🎯 [TriggerEvaluator] Condition check result');

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
                        steps = trigger.flowIds.map((fid, fIdx) => {
                            const contextId = `t_${originalTIdx}_f_${fIdx}`;
                            const specificOverrides = contextOverrides[contextId] || {};
                            return {
                                flowId: fid,
                                overrides: { ...globalOverrides, ...specificOverrides }
                            };
                        });
                    } else if (trigger.flowId) {
                        const contextId = `t_${originalTIdx}_f_0`;
                        const specificOverrides = contextOverrides[contextId] || {};
                        steps = [{
                            flowId: trigger.flowId,
                            overrides: { ...globalOverrides, ...specificOverrides }
                        }];
                    } else {
                        logger.warn({ triggerId: trigger.id }, '⚠️ Trigger matched but no flows defined');
                        return 'pending';
                    }

                    // Emit trigger_matched event for Live Execution Log
                    // For multi-flow, we show "Multiple Flows" or the first one
                    const flowDisplayName = steps.length > 1 ? `${steps.length} Flows` : steps[0]?.flowId;

                    events.emit('advanced:trigger_matched', {
                        programId,
                        windowId: window.id,
                        triggerId: trigger.id,
                        sensorName,
                        sensorValue,
                        condition: `${trigger.operator} ${trigger.value}${trigger.valueMax ? `-${trigger.valueMax}` : ''}`,
                        flowName: flowDisplayName,
                        timestamp: new Date()
                    });

                    // Execute the flow(s) with variable overrides
                    // Add activeProgramId + window context so ProgramLogService can track flow executions
                    // NOTE: The overrides are now per-step, but we pass merged session overrides for tracking
                    // We'll use the first step's overrides as base context, or global
                    const baseContext = {
                        ...globalOverrides,
                        activeProgramId: programId,
                        windowId: window.id,
                        windowName: window.name
                    };

                    // We need to inject the context into EACH step's overrides
                    steps = steps.map(s => ({
                        ...s,
                        overrides: { ...s.overrides, ...baseContext }
                    }));

                    const flowSessionId = await cycleManager.startCycle(
                        trigger.id,  // cycleId
                        `Trigger: ${trigger.id}`,  // name
                        steps,
                        baseContext  // session overrides (base)
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
                        programId,
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
    async executeFallback(
        window: ITimeWindow,
        globalOverrides: Record<string, any> = {},
        contextOverrides: Record<string, any> = {},
        activeProgramId?: string
    ): Promise<string | undefined> {
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
            // Include activeProgramId in overrides for logging
            const baseContext = {
                ...globalOverrides,
                activeProgramId,
                windowId: window.id,
                windowName: window.name
            };

            // Construct steps (Multiple flows logic)
            let steps: { flowId: string, overrides: any }[] = [];

            if (useMultiFlow) {
                steps = window.fallbackFlowIds!.map((fid, fIdx) => {
                    const contextId = `fb_${fIdx}`;
                    const specificOverrides = contextOverrides[contextId] || {};
                    return {
                        flowId: fid,
                        overrides: { ...baseContext, ...specificOverrides }
                    };
                });
            } else if (useSingleFlow) {
                // Backward compatibility
                const contextId = `fb_0`;
                const specificOverrides = contextOverrides[contextId] || {};
                steps = [{
                    flowId: window.fallbackFlowId!,
                    overrides: { ...baseContext, ...specificOverrides }
                }];
            }

            // Execute via CycleManager
            const flowSessionId = await cycleManager.startCycle(
                `fallback-${window.id}`,
                `Fallback: ${window.name}`,
                steps,
                baseContext
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
        logger.info({ sensorId, source }, '🔍 [TriggerEvaluator] Reading sensor...');

        try {
            if (source === 'cached') {
                const device = await DeviceModel.findById(sensorId);
                if (!device) {
                    logger.warn({ sensorId }, '⚠️ Sensor not found');
                    return null;
                }
                const value = device.lastReading?.value ?? null;
                logger.info({ sensorId, value }, '📊 [TriggerEvaluator] Cached value');
                return value;
            } else {
                // Live read
                logger.info({ sensorId }, '📡 [TriggerEvaluator] Starting LIVE read...');
                const result = await hardware.readSensorValue(sensorId);
                logger.info({ sensorId, value: result.value }, '📊 [TriggerEvaluator] Live value received');
                return result.value;
            }
        } catch (error: any) {
            logger.error({ sensorId, error: error.message }, '❌ [TriggerEvaluator] Failed to read sensor');
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

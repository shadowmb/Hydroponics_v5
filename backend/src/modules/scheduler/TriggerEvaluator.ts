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
        contextOverrides: Record<string, any> = {},
        programId?: string
    ): Promise<EvaluationResult> {

        const pendingTriggers = window.triggers.filter(t => {
            // Check if currently executing
            if (windowState.triggersExecuting.includes(t.id)) return false;

            // Get execution count safely (handle Map or Object structure from Mongoose)
            let count = 0;
            if (windowState.triggerCounts instanceof Map) {
                count = windowState.triggerCounts.get(t.id) || 0;
            } else if (windowState.triggerCounts && typeof windowState.triggerCounts === 'object') {
                // @ts-ignore
                count = windowState.triggerCounts[t.id] || 0;
            }

            // Determine if pending based on Repeat Mode
            const mode = (t as any).repeatMode || 'once'; // Default to once
            const limit = (t as any).repeatCount || 0;

            let isPending = false;
            if (mode === 'always') {
                isPending = true; // Always pending if not executing
            } else if (mode === 'count') {
                isPending = count < limit; // Pending if under limit
            } else {
                // Default 'once'
                isPending = !windowState.triggersExecuted.includes(t.id);
            }

            // DEBUG LOGGING
            if (mode === 'count') {
                // Only log count mode to reduce noise, or log all if debugging specifically
                // (Using console.log or logger if available. Logger is likely imported.)
                // Assuming logger is available or console
                console.log(`[TriggerEvaluator] ID: ${t.id} | Mode: ${mode} | Count: ${count} | Limit: ${limit} | Executed: ${windowState.triggersExecuted.includes(t.id)} | PENDING: ${isPending}`);
            }

            return isPending;
        });

        if (pendingTriggers.length === 0) {
            logger.info({ windowId: window.id }, '✅ All triggers executed in window');
            return 'all_done';
        }

        // Evaluate triggers in order
        for (const trigger of pendingTriggers) {
            try {
                const originalTIdx = window.triggers.findIndex(t => t.id === trigger.id);

                // --- Condition Evaluation Logic ---
                let isTriggered = false;
                let logDetails: any = { matchingConditions: [] };
                let detailedConditions: any[] = [];
                let results: boolean[] = [];
                let logicalOp = trigger.logicalOperator || 'AND';
                let conditionsToCheck: any[] = [];

                // 0. Check for Unconditional Execution
                if (trigger.conditionEnabled === false) {
                    isTriggered = true;
                    logDetails.unconditional = true;
                    logger.info({ triggerId: trigger.id }, '🚀 Unconditional Trigger - Skipping Conditions');
                } else {
                    // Normal Evaluation
                    conditionsToCheck = trigger.conditions || [];

                    // Fallback: If no conditions array, build one from legacy fields
                    if (conditionsToCheck.length === 0 && trigger.sensorId) {
                        conditionsToCheck = [{
                            sensorId: trigger.sensorId,
                            operator: trigger.operator!,
                            value: trigger.value!,
                            valueMax: trigger.valueMax
                        }];
                    }

                    if (conditionsToCheck.length === 0) {
                        logger.warn({ triggerId: trigger.id }, '⚠️ Trigger has no conditions defined');
                        continue;
                    }

                    // We need to check ALL conditions for AND, or ANY for OR
                    for (const condition of conditionsToCheck) {
                        // Resolve sensor name
                        let sensorName = condition.sensorId;
                        try {
                            const device = await DeviceModel.findById(condition.sensorId).select('name').lean();
                            if (device && device.name) sensorName = device.name;
                        } catch (e) { /* ignore */ }

                        const sensorValue = await this.readSensor(condition.sensorId, window.dataSource);

                        if (sensorValue === null) {
                            // If a sensor fails, AND logic fails immediately. OR logic ignores it (treats as false).
                            logger.warn({ triggerId: trigger.id, sensorId: condition.sensorId }, '⚠️ Sensor read null');
                            results.push(false);
                            detailedConditions.push({ ...condition, sensorName, sensorValue: 'ERR', error: true });
                            continue;
                        }

                        const match = this.matchesCondition(sensorValue, condition);
                        results.push(match);
                        detailedConditions.push({ ...condition, sensorName, sensorValue });

                        if (match) {
                            logDetails.matchingConditions.push(`${sensorName} ${condition.operator} ${condition.value}`);
                        }
                    }

                    if (logicalOp === 'AND') {
                        isTriggered = results.every(r => r === true);
                    } else {
                        // OR
                        isTriggered = results.some(r => r === true);
                    }
                }

                logger.info({
                    triggerId: trigger.id,
                    triggerIndex: originalTIdx + 1,
                    logicalOp,
                    conditions: detailedConditions,
                    results,
                    isTriggered,
                    unconditional: !!logDetails.unconditional
                }, '🎯 [TriggerEvaluator] Evaluation Result');

                // Emit detailed evaluation for UI logging
                events.emit('advanced:trigger_evaluation', {
                    programId,
                    windowId: window.id,
                    triggerId: trigger.id,
                    triggerIndex: originalTIdx + 1,
                    logicalOp,
                    conditions: detailedConditions,
                    results,
                    isTriggered,
                    unconditional: !!logDetails.unconditional
                });

                // --- Action Execution ---
                if (isTriggered) {
                    logger.info({
                        triggerId: trigger.id,
                        flowIds: trigger.flowIds,
                        flowId: trigger.flowId,
                        behavior: trigger.behavior
                    }, '⚡ Trigger matched - executing flow(s)');

                    // Emit matched event
                    events.emit('advanced:trigger_matched', {
                        programId,
                        windowId: window.id,
                        triggerId: trigger.id,
                        sensorName: 'Multi-Condition', // TODO: List names?
                        sensorValue: 0, // Not applicable for multi
                        condition: `${conditionsToCheck.length} conditions (${logicalOp})`,
                        flowName: trigger.flowIds?.length ? `${trigger.flowIds.length} Flows` : 'Flow',
                        timestamp: new Date()
                    });

                    // Construct steps
                    let steps: { flowId: string, overrides: any }[] = [];

                    if (trigger.flowIds && trigger.flowIds.length > 0) {
                        steps = trigger.flowIds.map((fid, fIdx) => {
                            const contextId = `t_${originalTIdx}_f_${fIdx}`;
                            return {
                                flowId: fid,
                                overrides: { ...globalOverrides, ...contextOverrides[contextId] || {} }
                            };
                        });
                    } else if (trigger.flowId) {
                        const contextId = `t_${originalTIdx}_f_0`;
                        steps = [{
                            flowId: trigger.flowId,
                            overrides: { ...globalOverrides, ...contextOverrides[contextId] || {} }
                        }];
                    } else {
                        return 'pending';
                    }

                    // Context injection
                    const baseContext = {
                        ...globalOverrides,
                        activeProgramId: programId,
                        windowId: window.id,
                        windowName: window.name,
                        executionType: 'trigger',
                    };

                    steps = steps.map(s => ({
                        ...s,
                        overrides: { ...s.overrides, ...baseContext }
                    }));

                    const flowSessionId = await cycleManager.startCycle(
                        trigger.id,
                        `Trigger: ${trigger.id}`,
                        steps,
                        baseContext
                    );

                    if (!windowState.triggersExecuting) windowState.triggersExecuting = [];
                    windowState.triggersExecuting.push(trigger.id);
                    windowState.currentFlowSessionId = flowSessionId;

                    return 'executing';
                }

            } catch (error: any) {
                logger.error({ triggerId: trigger.id, error: error.message }, '❌ Error evaluating trigger');
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
        // Linked Trigger Support
        const linkedTriggerId = (window as any).fallbackTriggerId; // Cast as any if interface not picked up yet
        let steps: { flowId: string, overrides: any }[] = [];
        let sourceDescription = '';

        if (linkedTriggerId) {
            const linkedTrigger = window.triggers.find(t => t.id === linkedTriggerId);
            if (linkedTrigger) {
                logger.info({ windowId: window.id, linkedTriggerId }, '🔗 Using Linked Trigger for Fallback');

                // Find the index of the linked trigger to resolve correct variable context
                const linkedTriggerIndex = window.triggers.findIndex(t => t.id === linkedTriggerId);

                // Determine flows from trigger
                if (linkedTrigger.flowIds && linkedTrigger.flowIds.length > 0) {
                    steps = linkedTrigger.flowIds.map((fid, fIdx) => {
                        // REUSE the context key from the trigger definition (e.g. t_0_f_0)
                        // This requires that linkedTriggerIndex is valid (>= 0). It should be if found.
                        const contextKey = `t_${linkedTriggerIndex}_f_${fIdx}`;
                        return {
                            flowId: fid,
                            overrides: { ...globalOverrides, ...contextOverrides[contextKey] || {} }
                        };
                    });
                    sourceDescription = `Linked Trigger: ${linkedTrigger.id}`;
                } else if (linkedTrigger.flowId) {
                    const contextKey = `t_${linkedTriggerIndex}_f_0`;
                    steps = [{
                        flowId: linkedTrigger.flowId,
                        overrides: { ...globalOverrides, ...contextOverrides[contextKey] || {} }
                    }];
                    sourceDescription = `Linked Trigger: ${linkedTrigger.id}`;
                } else {
                    logger.warn({ linkedTriggerId }, '⚠️ Linked Trigger has no flows');
                }
            } else {
                logger.warn({ linkedTriggerId }, '⚠️ Linked Trigger not found in window');
            }
        }

        // Migration support: check both new plural array and old single ID if no linked trigger used
        const useMultiFlow = window.fallbackFlowIds && window.fallbackFlowIds.length > 0;
        const useSingleFlow = !!window.fallbackFlowId;

        if (steps.length === 0) {
            if (!useMultiFlow && !useSingleFlow) {
                logger.info({ windowId: window.id }, '⚠️ No fallback flow(s) configured');
                return undefined;
            }

            logger.info({
                windowId: window.id,
                fallbackFlowId: window.fallbackFlowId,
                fallbackFlowIds: window.fallbackFlowIds
            }, '🛡️ Executing fallback flow(s)');

            // Construct steps (Multiple flows logic)
            if (useMultiFlow) {
                steps = window.fallbackFlowIds!.map((fid, fIdx) => {
                    const contextId = `fb_${fIdx}`;
                    const specificOverrides = contextOverrides[contextId] || {};
                    return {
                        flowId: fid,
                        overrides: { ...globalOverrides, ...contextOverrides[contextId] || {} }
                    };
                });
            } else if (useSingleFlow) {
                // Backward compatibility
                const contextId = `fb_0`;
                const specificOverrides = contextOverrides[contextId] || {};
                steps = [{
                    flowId: window.fallbackFlowId!,
                    overrides: { ...globalOverrides, ...contextOverrides[contextId] || {} }
                }];
            }
        }

        try {
            // Include activeProgramId in overrides for logging
            const baseContext = {
                ...globalOverrides,
                activeProgramId,
                windowId: window.id,
                windowName: window.name,
                executionType: 'fallback', // <--- Track as Fallback Execution
            };

            // Apply base context to all steps
            steps = steps.map(s => ({
                flowId: s.flowId,
                overrides: { ...baseContext, ...s.overrides }
            }));

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
    /**
     * Check if a sensor value matches a trigger condition.
     */
    private matchesCondition(value: number, condition: { operator: TriggerOperator, value: number, valueMax?: number }): boolean {
        const { operator, value: target, valueMax } = condition;

        // Ensure values are numbers (runtime safety)
        if (typeof target !== 'number') return false;

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
                // For 'between', we need valueMax
                if (typeof valueMax !== 'number') return false;
                return value >= target && value <= valueMax;
            default:
                logger.warn({ operator }, '⚠️ Unknown operator');
                return false;
        }
    }
}

export const triggerEvaluator = new TriggerEvaluator();

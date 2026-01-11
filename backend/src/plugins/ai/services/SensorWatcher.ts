import { events } from '../../../core/EventBusService';
import { aiActionsService } from './AIActionsService';
import { aiService } from './AIService';
import { TriggerEvaluator } from './TriggerEvaluator';

export class SensorWatcher {
    private intervalJobs: Map<string, NodeJS.Timeout> = new Map();

    constructor() {
        console.log('👀 SensorWatcher initialized.');
    }

    async start() {
        console.log('🚀 Starting SensorWatcher...');

        // 1. Listen for ALL sensor data (Real-time triggers, if we want immediate reaction)
        // However, the new plan favors "Interval Checks" for sensors to avoid spam.
        // But users might also want "Immediate" reaction? 
        // The plan has "frequency.type" which can be 'interval'.
        // If 'interval', handled by intervals. If 'immediate' (not explicitly in plan but implied by event bus), handled here.
        // Let's implement BOTH: 
        // - Periodic checks for 'interval' frequency
        // - Event listener for potential future 'immediate' frequency or just checks.

        // Strategy: 
        // We load all sensor actions. 
        // If frequency.type === 'interval', we set a setInterval.
        // If frequency.type === 'once' (immediate/event-based typically), we listen to events.
        // Current Plan Schema default is 'interval'.

        await this.refreshAll();
    }

    async refreshAll() {
        // clear existing
        this.intervalJobs.forEach(t => clearInterval(t));
        this.intervalJobs.clear();

        const actions = await aiActionsService.getActiveActions();
        for (const action of actions) {
            if (action.trigger.type === 'sensor') {
                this.setupWatcher(action);
            }
        }
    }

    setupWatcher(action: any) {
        // Clear existing for this action if any
        if (this.intervalJobs.has(action.id)) {
            clearInterval(this.intervalJobs.get(action.id)!);
            this.intervalJobs.delete(action.id);
        }

        if (!action.enabled) return;

        const freq = action.trigger.frequency;

        if (freq && freq.type === 'interval' && freq.intervalMinutes) {
            const ms = freq.intervalMinutes * 60 * 1000;
            console.log(`⏱️ Setting up Interval Watcher for ${action.name} every ${freq.intervalMinutes} mins`);

            const timer = setInterval(async () => {
                await this.checkAction(action.id);
            }, ms);

            this.intervalJobs.set(action.id, timer);
        }

        // If we want immediate reaction (e.g. event-based), we would subscribe to 'sensor:data' here.
        // For now, sticking to interval as requested in the plan discussion.
    }

    /**
     * Checks if the action conditions are met.
     * We need to FETCH the latest value for the sensor.
     * Since we are inside the interval, we assume we need to query the current state.
     * Ideally, we should have a "DeviceStateService" or cache to get the latest value instantly.
     * Or we can use the last known value from DB/Cache.
     */
    async checkAction(actionId: string) {
        const action = await aiActionsService.getAction(actionId);
        if (!action || !action.enabled) {
            this.setupWatcher(action); // reload/clear
            return;
        }

        // We need the current value of the sensor. 
        // OPTION 1: Use a method from HardwareService to get "last known value".
        // OPTION 2: Keep a local cache in SensorWatcher updated via EventBus.
        // Let's use Option 2: It's cleaner for this module to be self-contained listener.

        // Wait, if I use setInterval, I don't have the value "right now" unless I cache it.
        // So I need to subscribe to 'sensor:data' ANYWAY to keep a cache of values.
    }
}

// Separate class to maintain cache? Or just merge logic?
// Let's refine SensorWatcher to maintain a cache.

class SensorCache {
    private static cache = new Map<string, number>();

    static update(sensorId: string, value: number) {
        this.cache.set(sensorId, value);
    }

    static get(sensorId: string): number | undefined {
        return this.cache.get(sensorId);
    }
}

// Extend functionality
// We subscribe globally once.
events.on('sensor:data', (payload) => {
    // payload: { deviceId, value, ... }
    SensorCache.update(payload.deviceId, payload.value);
});

// Also listen to device:data which might have more info
events.on('device:data', (payload) => {
    // device:data value can be object or number. We need number for comparison.
    // implementation specific. Assuming simple number or 'value' field.
    let val: number | undefined;
    if (typeof payload.value === 'number') val = payload.value;
    else if (payload.readings && typeof payload.readings.value === 'number') val = payload.readings.value;

    if (val !== undefined) SensorCache.update(payload.deviceId, val);
});

export class SensorWatcherActual extends SensorWatcher {
    async checkAction(actionId: string) {
        const action = await aiActionsService.getAction(actionId);
        if (!action || !action.enabled) return;

        const sensorId = action.trigger.sensorId;
        if (!sensorId) return;

        const currentValue = SensorCache.get(sensorId);

        // Debug
        // console.log(`Checking action ${action.name}: Sensor ${sensorId} = ${currentValue}`);

        if (currentValue === undefined) {
            // No data yet
            return;
        }

        // Evaluate
        if (TriggerEvaluator.shouldTrigger(action, currentValue)) {
            console.log(`🔥 SENSOR TRIGGER MATCHED: ${action.name} (val: ${currentValue})`);
            await aiService.executeAction(action.id as string, { value: currentValue });
        }
    }
}

export const sensorWatcher = new SensorWatcherActual();

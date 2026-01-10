import { IAIAction } from '../../persistence/schemas/AIAction.schema';

export class TriggerEvaluator {

    /**
     * Checks if a sensor trigger condition is met.
     */
    static shouldTrigger(action: IAIAction, currentValue: number): boolean {
        if (!action.enabled || !action.trigger || action.trigger.type !== 'sensor') return false;

        const { operator, value, rangeMax, cooldownMinutes, activeWindow } = action.trigger;

        // 1. Check Active Window (Time of Day)
        if (activeWindow && activeWindow.enabled) {
            if (!this.isWithinTimeWindow(activeWindow.startTime, activeWindow.endTime)) {
                return false;
            }
        }

        // 2. Check Cooldown
        if (action.lastRun && cooldownMinutes) {
            const now = new Date();
            const lastRunTime = new Date(action.lastRun);
            const diffMinutes = (now.getTime() - lastRunTime.getTime()) / (1000 * 60);
            if (diffMinutes < cooldownMinutes) {
                return false;
            }
        }

        // 3. Check Value Condition
        // Ensure values are present
        if (value === undefined) return false;

        switch (operator) {
            case '>':
                return currentValue > value;
            case '<':
                return currentValue < value;
            case '>=':
                return currentValue >= value;
            case '<=':
                return currentValue <= value;
            case '=':
                // Fuzzy equality for floats
                return Math.abs(currentValue - value) < 0.01;
            case '!=':
                return Math.abs(currentValue - value) >= 0.01;
            case 'range':
                if (rangeMax === undefined) return false;
                // INCLUSIVE RANGE: value <= x <= rangeMax
                return currentValue >= value && currentValue <= rangeMax;
            default:
                return false;
        }
    }

    private static isWithinTimeWindow(start: string, end: string): boolean {
        if (!start || !end) return true;

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        const [startH, startM] = start.split(':').map(Number);
        const [endH, endM] = end.split(':').map(Number);

        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;

        if (endMinutes < startMinutes) {
            // Window crosses midnight (e.g. 23:00 to 06:00)
            return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
        } else {
            return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
        }
    }
}

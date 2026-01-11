import * as cron from 'node-cron';
import { aiActionsService } from './AIActionsService';
import { aiService } from './AIService';
import { IAIAction } from '../../persistence/schemas/AIAction.schema';

export class ActionScheduler {
    private jobs: Map<string, cron.ScheduledTask> = new Map();

    constructor() {
        console.log('📅 ActionScheduler initialized.');
    }

    /**
     * Start the scheduler: fetch all schedule-based actions and schedule them.
     */
    async start() {
        console.log('🚀 Starting ActionScheduler...');
        const actions = await aiActionsService.getActiveActions();

        for (const action of actions) {
            if (action.trigger.type === 'schedule') {
                this.scheduleAction(action);
            }
        }

        console.log(`✅ ActionScheduler started with ${this.jobs.size} jobs.`);
    }

    /**
     * Schedule a single action.
     */
    scheduleAction(action: IAIAction) {
        // If already exists, stop and replace
        if (this.jobs.has(action.id)) {
            this.jobs.get(action.id)?.stop();
            this.jobs.delete(action.id);
        }

        if (!action.enabled || !action.trigger.cron) return;

        try {
            const task = cron.schedule(action.trigger.cron, async () => {
                console.log(`⏰ Cron Trigger for action: ${action.name} (${action.id})`);
                await aiService.executeAction(action.id as string);
            });

            this.jobs.set(action.id, task);
        } catch (error) {
            console.error(`❌ Failed to schedule action ${action.name}:`, error);
        }
    }

    /**
     * Stop and remove a job (e.g. when action is disabled/deleted)
     */
    unscheduleAction(actionId: string) {
        if (this.jobs.has(actionId)) {
            this.jobs.get(actionId)?.stop();
            this.jobs.delete(actionId);
        }
    }

    /**
     * Refresh a specific action (called after update)
     */
    async refreshAction(actionId: string) {
        const action = await aiActionsService.getAction(actionId);
        if (action) {
            if (action.trigger.type === 'schedule') {
                this.scheduleAction(action);
            } else {
                // If it was scheduled but now changed to sensor, remove it from cron
                this.unscheduleAction(actionId);
            }
        } else {
            // Action deleted
            this.unscheduleAction(actionId);
        }
    }
}

export const actionScheduler = new ActionScheduler();

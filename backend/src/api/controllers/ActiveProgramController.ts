import { FastifyRequest, FastifyReply } from 'fastify';
import { activeProgramService } from '../../modules/scheduler/ActiveProgramService';

export class ActiveProgramController {
    static async getActive(req: FastifyRequest, reply: FastifyReply) {
        try {
            const active = await activeProgramService.getActive();
            reply.send(active);
        } catch (error: any) {
            reply.status(500).send({ message: error.message });
        }
    }

    static async load(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { programId, overrides, minCycleInterval } = req.body as any;
            const active = await activeProgramService.loadProgram(programId, overrides, minCycleInterval);
            reply.send(active);
        } catch (error: any) {
            reply.status(500).send({ message: error.message });
        }
    }

    static async update(req: FastifyRequest, reply: FastifyReply) {
        try {
            const updates = req.body as any;
            const active = await activeProgramService.updateProgram(updates);
            reply.send(active);
        } catch (error: any) {
            reply.status(500).send({ message: error.message });
        }
    }

    static async start(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { startTime } = req.body as any || {};
            const active = await activeProgramService.start(startTime);
            reply.send(active);
        } catch (error: any) {
            reply.status(500).send({ message: error.message });
        }
    }

    static async stop(req: FastifyRequest, reply: FastifyReply) {
        try {
            const active = await activeProgramService.stop();
            reply.send(active);
        } catch (error: any) {
            reply.status(500).send({ message: error.message });
        }
    }

    static async pause(req: FastifyRequest, reply: FastifyReply) {
        try {
            const active = await activeProgramService.pause();
            reply.send(active);
        } catch (error: any) {
            reply.status(500).send({ message: error.message });
        }
    }

    static async unload(req: FastifyRequest, reply: FastifyReply) {
        try {
            await activeProgramService.unload();
            reply.send({ success: true });
        } catch (error: any) {
            reply.status(500).send({ message: error.message });
        }
    }

    static async updateScheduleItem(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { itemId } = req.params as any;
            const updates = req.body as any;
            const active = await activeProgramService.updateScheduleItem(itemId, updates);
            reply.send(active);
        } catch (error: any) {
            reply.status(500).send({ message: error.message });
        }
    }

    static async swapCycles(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { itemIdA, itemIdB } = req.body as any;
            const active = await activeProgramService.swapCycles(itemIdA, itemIdB);
            reply.send(active);
        } catch (error: any) {
            reply.status(500).send({ message: error.message });
        }
    }

    static async skipCycle(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { itemId } = req.params as any;
            const { type, untilDate } = req.body as any;
            const active = await activeProgramService.skipCycle(itemId, type, untilDate);
            reply.send(active);
        } catch (error: any) {
            reply.status(500).send({ message: error.message });
        }
    }

    static async restoreCycle(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { itemId } = req.params as any;
            const active = await activeProgramService.restoreCycle(itemId);
            reply.send(active);
        } catch (error: any) {
            reply.status(500).send({ message: error.message });
        }
    }
    static async getVariables(req: FastifyRequest, reply: FastifyReply) {
        console.log('GET /api/active-program/variables called');
        try {
            const variables = await activeProgramService.getProgramVariables();
            console.log('Variables found:', variables);
            reply.send(variables);
        } catch (error: any) {
            console.error('Error getting variables:', error);
            reply.status(500).send({ message: error.message });
        }
    }
    static async retryCycle(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { itemId } = req.params as any;
            const active = await activeProgramService.retryCycle(itemId);

            // Force execution immediately via SchedulerService
            const item = active.schedule.find(i => (i as any)._id.toString() === itemId);
            if (item) {
                const schedulerService = require('../../modules/scheduler/SchedulerService').schedulerService;
                // Mark as running first
                item.status = 'running';
                await active.save();

                // Trigger execution
                await schedulerService.handleScheduledCycle(item.cycleId, item.steps, item.overrides);
            }

            reply.send(active);
        } catch (error: any) {
            reply.status(500).send({ message: error.message });
        }
    }

    static async forceStartCycle(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { itemId } = req.params as any;
            const active = await activeProgramService.forceStartCycle(itemId);

            // Force execution immediately via SchedulerService
            const item = active.schedule.find(i => (i as any)._id.toString() === itemId);
            if (item) {
                const schedulerService = require('../../modules/scheduler/SchedulerService').schedulerService;
                // Mark as running first to prevent double execution if scheduler ticks
                item.status = 'running';
                await active.save();

                // Trigger execution
                await schedulerService.handleScheduledCycle(item.cycleId, item.steps, item.overrides);
            }

            reply.send(active);
        } catch (error: any) {
            reply.status(500).send({ message: error.message });
        }
    }

    static async skipWindow(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { windowId } = req.params as any;
            const { untilDate } = req.body as any;
            const active = await activeProgramService.skipWindow(windowId, untilDate);
            reply.send(active);
        } catch (error: any) {
            reply.status(500).send({ message: error.message });
        }
    }

    static async restoreWindow(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { windowId } = req.params as any;
            const active = await activeProgramService.restoreWindow(windowId);
            reply.send(active);
        } catch (error: any) {
            reply.status(500).send({ message: error.message });
        }
    }
    static async updateTrigger(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { windowId } = req.params as any;
            const trigger = req.body as any;
            const active = await activeProgramService.updateTrigger(windowId, trigger);
            reply.send(active);
        } catch (error: any) {
            reply.status(500).send({ message: error.message });
        }
    }
}

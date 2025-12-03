import { FastifyRequest, FastifyReply } from 'fastify';
import { programRepository } from '../../modules/persistence/repositories/ProgramRepository';
import { logger } from '../../core/LoggerService';

export class ProgramController {

    static async create(req: FastifyRequest, reply: FastifyReply) {
        try {
            const data = req.body as any;
            // Generate ID if not provided
            if (!data.id) {
                data.id = `prog_${Date.now()}`;
            }
            const program = await programRepository.create(data);
            return reply.send(program);
        } catch (error: any) {
            logger.error({ error }, 'Failed to create program');
            return reply.status(400).send({ message: error.message || 'Failed to create program' });
        }
    }

    static async list(req: FastifyRequest, reply: FastifyReply) {
        try {
            const programs = await programRepository.findAll();
            return reply.send(programs);
        } catch (error: any) {
            logger.error({ error }, 'Failed to list programs');
            return reply.status(500).send({ message: 'Failed to list programs' });
        }
    }

    static async get(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        try {
            const program = await programRepository.findById(id);
            if (!program) return reply.status(404).send({ message: 'Program not found' });
            return reply.send(program);
        } catch (error: any) {
            logger.error({ error }, 'Failed to get program');
            return reply.status(500).send({ message: 'Failed to get program' });
        }
    }

    static async update(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        try {
            const data = req.body as any;
            const program = await programRepository.update(id, data);
            if (!program) return reply.status(404).send({ message: 'Program not found' });
            return reply.send(program);
        } catch (error: any) {
            logger.error({ error }, 'Failed to update program');
            return reply.status(400).send({ message: 'Failed to update program' });
        }
    }

    static async delete(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        try {
            const success = await programRepository.delete(id);
            if (!success) return reply.status(404).send({ message: 'Program not found' });
            return reply.send({ success: true });
        } catch (error: any) {
            logger.error({ error }, 'Failed to delete program');
            return reply.status(500).send({ message: 'Failed to delete program' });
        }
    }

    static async getSchedulerStatus(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { schedulerService } = require('../../modules/scheduler/SchedulerService');
            const activeProgram = await programRepository.findActive();
            let nextRun = null;

            if (activeProgram) {
                const now = new Date();
                const currentMinutes = now.getHours() * 60 + now.getMinutes();

                // Sort schedule by time
                const sortedSchedule = activeProgram.schedule.sort((a, b) => {
                    const [h1, m1] = a.time.split(':').map(Number);
                    const [h2, m2] = b.time.split(':').map(Number);
                    return (h1 * 60 + m1) - (h2 * 60 + m2);
                });

                const nextEvent = sortedSchedule.find(s => {
                    const [h, m] = s.time.split(':').map(Number);
                    return (h * 60 + m) > currentMinutes;
                });

                // If no event later today, pick the first one tomorrow
                const targetEvent = nextEvent || sortedSchedule[0];

                if (targetEvent) {
                    nextRun = {
                        time: targetEvent.time,
                        cycleId: targetEvent.cycleId
                    };
                }

                return reply.send({
                    activeProgram: {
                        name: activeProgram.name,
                        id: activeProgram.id,
                        schedule: sortedSchedule // Send full schedule
                    },
                    nextRun,
                    scheduler: schedulerService.getState()
                });
            }

            return reply.send({
                activeProgram: null,
                nextRun: null,
                scheduler: schedulerService.getState()
            });
        } catch (error: any) {
            logger.error({ error }, 'Failed to get scheduler status');
            return reply.status(500).send({ message: 'Failed to get scheduler status' });
        }
    }

    static async pauseScheduler(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { schedulerService } = require('../../modules/scheduler/SchedulerService');
            schedulerService.pause();
            return reply.send({ success: true, paused: true });
        } catch (error: any) {
            logger.error({ error }, 'Failed to pause scheduler');
            return reply.status(500).send({ message: 'Failed to pause scheduler' });
        }
    }

    static async resumeScheduler(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { schedulerService } = require('../../modules/scheduler/SchedulerService');
            schedulerService.resume();
            return reply.send({ success: true, paused: false });
        } catch (error: any) {
            logger.error({ error }, 'Failed to resume scheduler');
            return reply.status(500).send({ message: 'Failed to resume scheduler' });
        }
    }

    static async startScheduler(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { schedulerService } = require('../../modules/scheduler/SchedulerService');
            const { startTime } = req.body as { startTime?: number };

            if (startTime) {
                schedulerService.startAt(startTime);
            } else {
                schedulerService.startNow();
            }

            return reply.send({ success: true, scheduler: schedulerService.getState() });
        } catch (error: any) {
            logger.error({ error }, 'Failed to start scheduler');
            return reply.status(500).send({ message: 'Failed to start scheduler' });
        }
    }

    static async stopScheduler(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { schedulerService } = require('../../modules/scheduler/SchedulerService');
            schedulerService.stopScheduler();
            return reply.send({ success: true, scheduler: schedulerService.getState() });
        } catch (error: any) {
            logger.error({ error }, 'Failed to stop scheduler');
            return reply.status(500).send({ message: 'Failed to stop scheduler' });
        }
    }
}

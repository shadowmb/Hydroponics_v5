
import { FastifyRequest, FastifyReply } from 'fastify';
import { timeService } from '../../core/TimeService';

export class TimeController {

    // GET /api/time
    static async getStatus(req: FastifyRequest, reply: FastifyReply) {
        try {
            return reply.send({ success: true, data: timeService.getStatus() });
        } catch (error) {
            req.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to get time status' });
        }
    }

    // POST /api/time/simulate
    static async simulate(req: FastifyRequest<{ Body: { enable: boolean; targetTime?: string; speed?: number } }>, reply: FastifyReply) {
        try {
            const { enable, targetTime, speed } = req.body;

            let dateObj: Date | undefined = undefined;
            if (targetTime) {
                dateObj = new Date(targetTime);
                if (isNaN(dateObj.getTime())) {
                    return reply.status(400).send({ success: false, error: 'Invalid targetTime format' });
                }
            }

            timeService.setSimulation(enable, dateObj);

            return reply.send({ success: true, data: timeService.getStatus() });
        } catch (error) {
            req.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to set simulation' });
        }
    }

    // POST /api/time/offset
    static async setOffset(req: FastifyRequest<{ Body: { minutes: number } }>, reply: FastifyReply) {
        try {
            const { minutes } = req.body;
            if (typeof minutes !== 'number') {
                return reply.status(400).send({ success: false, error: 'minutes must be a number' });
            }

            timeService.setManualOffset(minutes);
            return reply.send({ success: true, data: timeService.getStatus() });
        } catch (error) {
            req.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to set offset' });
        }
    }

    // POST /api/time/timezone
    static async setTimezone(req: FastifyRequest<{ Body: { timezone: string } }>, reply: FastifyReply) {
        try {
            const { timezone } = req.body;
            if (!timezone) {
                return reply.status(400).send({ success: false, error: 'Timezone is required' });
            }
            // Basic validation
            try {
                Intl.DateTimeFormat(undefined, { timeZone: timezone });
            } catch (e) {
                return reply.status(400).send({ success: false, error: 'Invalid timezone identifier' });
            }

            timeService.setTimezone(timezone);
            return reply.send({ success: true, data: { timezone } });
        } catch (error) {
            req.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to set timezone' });
        }
    }
}

import { FastifyRequest, FastifyReply } from 'fastify';
import { NotificationRule } from '../../models/NotificationRule';
import { logger } from '../../core/LoggerService';

export class NotificationRuleController {

    // GET /api/notifications/rules
    static async list(req: FastifyRequest, reply: FastifyReply) {
        try {
            const rules = await NotificationRule.find().sort({ event: 1 });
            return reply.send(rules);
        } catch (error) {
            logger.error({ error }, 'Failed to fetch notification rules');
            return reply.status(500).send({ message: 'Failed to fetch rules' });
        }
    }

    // PUT /api/notifications/rules/:event
    // Upsert: Create or Update rule for a specific Event Type
    static async update(req: FastifyRequest<{ Params: { event: string }, Body: any }>, reply: FastifyReply) {
        try {
            const { event } = req.params;
            const body = req.body as any; // Fix unknown type error

            // Ensure event matches param
            if (body.event && body.event !== event) {
                return reply.status(400).send({ message: 'Event type mismatch' });
            }

            const rule = await NotificationRule.findOneAndUpdate(
                { event: event },
                {
                    event: event,
                    channelId: body.channelId,
                    isEnabled: body.isEnabled,
                    template: body.template
                },
                { new: true, upsert: true, setDefaultsOnInsert: true }
            );

            return reply.send(rule);

        } catch (error) {
            logger.error({ error }, 'Failed to update notification rule');
            return reply.status(500).send({ message: 'Failed to update rule' });
        }
    }
}

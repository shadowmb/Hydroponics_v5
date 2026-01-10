import { FastifyInstance } from 'fastify';
import { insightsService } from '../services/InsightsService';

export async function InsightController(fastify: FastifyInstance) {

    fastify.get('/', async (req, reply) => {
        try {
            const insights = await insightsService.getRecentInsights();
            return { success: true, data: insights };
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to fetch insights' });
        }
    });

    fastify.get('/count', async (req, reply) => {
        try {
            const count = await insightsService.getUnreadCount();
            return { success: true, count };
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to fetch count' });
        }
    });

    fastify.post('/mark-read', async (req, reply) => {
        try {
            await insightsService.markAllAsRead();
            return { success: true };
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to mark read' });
        }
    });
}

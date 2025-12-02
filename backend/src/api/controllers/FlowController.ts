import { FastifyRequest, FastifyReply } from 'fastify';
import { flowRepository } from '../../modules/persistence/repositories/FlowRepository';
import { logger } from '../../core/LoggerService';

export class FlowController {

    static async create(req: FastifyRequest, reply: FastifyReply) {
        try {
            const data = req.body as any;
            // Basic validation or let repository handle it
            const flow = await flowRepository.create(data);
            return reply.send(flow);
        } catch (error: any) {
            logger.error({ error }, 'Failed to create flow');
            return reply.status(400).send({ message: error.message || 'Failed to create flow' });
        }
    }

    static async list(req: FastifyRequest, reply: FastifyReply) {
        try {
            const flows = await flowRepository.findAll();
            return reply.send(flows);
        } catch (error: any) {
            logger.error({ error }, 'Failed to list flows');
            return reply.status(500).send({ message: 'Failed to list flows' });
        }
    }

    static async get(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        try {
            const flow = await flowRepository.findById(id);
            if (!flow) return reply.status(404).send({ message: 'Flow not found' });
            return reply.send(flow);
        } catch (error: any) {
            logger.error({ error }, 'Failed to get flow');
            return reply.status(500).send({ message: 'Failed to get flow' });
        }
    }

    static async update(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        try {
            const data = req.body as any;
            const flow = await flowRepository.update(id, data);
            if (!flow) return reply.status(404).send({ message: 'Flow not found' });
            return reply.send(flow);
        } catch (error: any) {
            logger.error({ error }, 'Failed to update flow');
            return reply.status(400).send({ message: 'Failed to update flow' });
        }
    }

    static async delete(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        try {
            const success = await flowRepository.delete(id);
            if (!success) return reply.status(404).send({ message: 'Flow not found' });
            return reply.send({ success: true });
        } catch (error: any) {
            logger.error({ error }, 'Failed to delete flow');
            return reply.status(500).send({ message: 'Failed to delete flow' });
        }
    }
}

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
            const { deleted } = req.query as { deleted?: string };

            if (deleted === 'true') {
                const { FlowModel } = await import('../../modules/persistence/schemas/Flow.schema');
                // @ts-ignore
                const flows = await FlowModel.find({ deletedAt: { $ne: null } }).setOptions({ withDeleted: true }).sort({ createdAt: -1 });
                return reply.send(flows);
            }

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
            return reply.send({ success: true, message: 'Flow moved to Recycle Bin' });
        } catch (error: any) {
            logger.error({ error }, 'Failed to delete flow');
            return reply.status(500).send({ message: 'Failed to delete flow' });
        }
    }

    static async restore(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = req.params as { id: string };
            const { name } = req.body as { name?: string };
            const { FlowModel } = await import('../../modules/persistence/schemas/Flow.schema');

            // @ts-ignore
            const flow = await FlowModel.findOne({ id, deletedAt: { $ne: null } }).setOptions({ withDeleted: true });

            if (!flow) {
                return reply.status(404).send({ success: false, message: 'Flow not found in recycle bin' });
            }

            if (name) {
                const existing = await FlowModel.findOne({ name, id: { $ne: id } });
                if (existing) {
                    return reply.status(400).send({ success: false, message: 'Flow name already exists' });
                }
                flow.name = name;
            }

            await flow.restore();
            return reply.send({ success: true, message: 'Flow restored' });
        } catch (error: any) {
            logger.error({ error }, 'Failed to restore flow');
            return reply.status(500).send({ success: false, message: error.message || 'Failed to restore flow' });
        }
    }

    static async hardDelete(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = req.params as { id: string };
            const { FlowModel } = await import('../../modules/persistence/schemas/Flow.schema');

            // @ts-ignore
            const flow = await FlowModel.findOne({ id, deletedAt: { $ne: null } }).setOptions({ withDeleted: true });

            if (!flow) {
                return reply.status(404).send({ success: false, message: 'Flow not found in recycle bin' });
            }

            // @ts-ignore
            await FlowModel.deleteOne({ id }, { hardDelete: true });
            return reply.send({ success: true, message: 'Flow permanently deleted' });
        } catch (error: any) {
            logger.error({ error }, 'Failed to permanently delete flow');
            return reply.status(500).send({ success: false, message: error.message || 'Failed to permanently delete flow' });
        }
    }
}

import { FastifyRequest, FastifyReply } from 'fastify';
import { flowRepository } from '../../modules/persistence/repositories/FlowRepository';
import { programRepository } from '../../modules/persistence/repositories/ProgramRepository';
import { logger } from '../../core/LoggerService';
import { slugify } from '../../utils/StringUtils';

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

            const { ActiveProgramModel } = await import('../../modules/persistence/schemas/ActiveProgram.schema');
            const activeProgram = await ActiveProgramModel.findOne({});
            const activeProgramId = activeProgram ? activeProgram.sourceProgramId : null;

            // Enrich with usage data
            const enrichedFlows = await Promise.all(flows.map(async (flow) => {
                const programs = await programRepository.findProgramsByFlowId(flow.id);
                return {
                    ...flow.toObject(),
                    usedIn: programs.map(p => ({
                        id: p.id,
                        name: p.name,
                        isActive: p.id === activeProgramId
                    }))
                };
            }));

            return reply.send(enrichedFlows);
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

            // @ts-ignore
            await (flow as any).restore();
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
    static async duplicate(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = req.params as { id: string };
            const { name } = req.body as { name: string };
            const { FlowModel } = await import('../../modules/persistence/schemas/Flow.schema');

            if (!name) {
                return reply.status(400).send({ success: false, message: 'New flow name is required' });
            }

            // 1. Find the original flow
            // @ts-ignore
            const originalFlow = await FlowModel.findOne({ id }).exec();
            if (!originalFlow) {
                return reply.status(404).send({ success: false, message: 'Flow not found' });
            }

            // 2. Generate new ID (slug) using robust utility
            let newId = slugify(name);

            // Fallback if slugify results in empty string (e.g. only symbols)
            if (!newId) {
                newId = `flow_${Date.now()}`;
            }

            // 3. Check for existing ID/Name
            const existing = await FlowModel.findOne({
                $or: [{ id: newId }, { name: name }]
            });

            if (existing) {
                return reply.status(400).send({ success: false, message: 'A flow with this name or ID already exists' });
            }

            // 4. Sanitize and Create New Flow
            const originalObj = originalFlow.toObject() as any;
            const { _id, id: oldId, name: oldName, createdAt, updatedAt, __v, deletedAt, ...cleanFlow } = originalObj;

            const newFlowData = {
                ...cleanFlow,
                name: name,
                id: newId,
                isActive: false, // Always start as stopped
                deletedAt: null // Ensure it's not deleted even if source was
            };

            const newFlow = await FlowModel.create(newFlowData);
            return reply.send({ success: true, FLOW: newFlow });

        } catch (error: any) {
            logger.error({ error }, 'Failed to duplicate flow');
            return reply.status(500).send({ success: false, message: error.message || 'Failed to duplicate flow' });
        }
    }
}

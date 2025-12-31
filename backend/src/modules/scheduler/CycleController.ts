import { FastifyRequest, FastifyReply } from 'fastify';
import { cycleManager } from './CycleManager';
import { CycleModel } from '../persistence/schemas/Cycle.schema';
import { logger } from '../../core/LoggerService';

export class CycleController {
    // GET /api/cycles
    async getAll(req: FastifyRequest, reply: FastifyReply) {
        try {
            const cycles = await CycleModel.find().sort({ createdAt: -1 });
            return reply.send(cycles);
        } catch (error) {
            logger.error({ error }, 'Failed to fetch cycles');
            return reply.status(500).send({ message: 'Failed to fetch cycles' });
        }
    }

    // GET /api/cycles/:id
    async getById(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        try {
            const cycle = await CycleModel.findOne({ id: req.params.id });
            if (!cycle) return reply.status(404).send({ message: 'Cycle not found' });
            return reply.send(cycle);
        } catch (error) {
            logger.error({ error }, 'Failed to fetch cycle');
            return reply.status(500).send({ message: 'Failed to fetch cycle' });
        }
    }

    // POST /api/cycles
    async create(req: FastifyRequest<{ Body: any }>, reply: FastifyReply) {
        try {
            const body = req.body as any;
            const id = body.name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
            const cycle = new CycleModel({
                ...body,
                id: id
            });
            await cycle.save();
            return reply.send(cycle);
        } catch (error) {
            logger.error({ error }, 'Failed to create cycle');
            return reply.status(500).send({ message: 'Failed to create cycle' });
        }
    }

    // PUT /api/cycles/:id
    async update(req: FastifyRequest<{ Params: { id: string }, Body: any }>, reply: FastifyReply) {
        try {
            const cycle = await CycleModel.findOneAndUpdate(
                { id: req.params.id },
                req.body as any,
                { new: true }
            );
            if (!cycle) return reply.status(404).send({ message: 'Cycle not found' });
            return reply.send(cycle);
        } catch (error) {
            logger.error({ error }, 'Failed to update cycle');
            return reply.status(500).send({ message: 'Failed to update cycle' });
        }
    }

    // DELETE /api/cycles/:id
    async delete(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        try {
            const result = await CycleModel.deleteOne({ id: req.params.id });
            if (result.deletedCount === 0) return reply.status(404).send({ message: 'Cycle not found' });
            return reply.send({ success: true });
        } catch (error) {
            logger.error({ error }, 'Failed to delete cycle');
            return reply.status(500).send({ message: 'Failed to delete cycle' });
        }
    }

    // POST /api/cycles/:id/start
    async start(req: FastifyRequest<{ Params: { id: string }, Body: any }>, reply: FastifyReply) {
        try {
            const cycle = await CycleModel.findOne({ id: req.params.id });
            if (!cycle) return reply.status(404).send({ message: 'Cycle not found' });

            // Allow overrides from body
            const overrides = req.body || {};

            await cycleManager.startCycle(req.params.id, cycle.name, cycle.steps, overrides);
            return reply.send({ success: true });
        } catch (error: any) {
            logger.error({ error }, 'Failed to start cycle');
            return reply.status(500).send({ message: error.message || 'Failed to start cycle' });
        }
    }
}

export const cycleController = new CycleController();

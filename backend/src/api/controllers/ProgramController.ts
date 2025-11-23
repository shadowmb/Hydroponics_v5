import { FastifyRequest, FastifyReply } from 'fastify';
import { programRepository } from '../../modules/persistence/repositories/ProgramRepository';
import { logger } from '../../core/LoggerService';
import { ProgramSchema } from '../../modules/persistence/schemas/Program.schema';

export class ProgramController {

    static async create(req: FastifyRequest, reply: FastifyReply) {
        try {
            const data = req.body as any;
            // Basic validation or let repository handle it
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
}

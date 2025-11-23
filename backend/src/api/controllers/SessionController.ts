import { FastifyRequest, FastifyReply } from 'fastify';
import { sessionRepository } from '../../modules/persistence/repositories/SessionRepository';
import { logger } from '../../core/LoggerService';

export class SessionController {

    static async getSession(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        try {
            const session = await sessionRepository.findById(id);
            if (!session) {
                return reply.status(404).send({ message: 'Session not found' });
            }
            return reply.send(session);
        } catch (error: any) {
            logger.error({ error, id }, 'Failed to fetch session');
            return reply.status(500).send({ message: 'Failed to fetch session' });
        }
    }
}

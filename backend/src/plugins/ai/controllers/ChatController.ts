import { FastifyInstance } from 'fastify';
import { chatSessionService } from '../services/ChatSessionService';

export async function ChatController(fastify: FastifyInstance) {

    // GET /sessions - List all active sessions
    fastify.get('/sessions', async (req, reply) => {
        try {
            const sessions = await chatSessionService.getSessions(false);
            return { success: true, data: sessions };
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to fetch sessions' });
        }
    });

    // POST /sessions - Create new session
    fastify.post('/sessions', async (req, reply) => {
        try {
            const body = (req.body as any) || {};
            const session = await chatSessionService.createSession(body.initialMessage);
            return { success: true, data: session };
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to create session', details: error instanceof Error ? error.message : String(error) });
        }
    });

    // GET /sessions/:id - Get full session details
    fastify.get('/sessions/:id', async (req, reply) => {
        try {
            const { id } = req.params as any;
            const session = await chatSessionService.getSessionById(id);
            if (!session) return reply.status(404).send({ success: false, error: 'Session not found' });
            return { success: true, data: session };
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to fetch session' });
        }
    });

    // DELETE /sessions/:id - Delete (or archive) session
    fastify.delete('/sessions/:id', async (req, reply) => {
        try {
            const { id } = req.params as any;
            await chatSessionService.deleteSession(id);
            return { success: true };
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to delete session' });
        }
    });

    // PATCH /sessions/:id/title - Rename session
    fastify.patch('/sessions/:id/title', async (req, reply) => {
        try {
            const { id } = req.params as any;
            const { title } = req.body as any;
            const session = await chatSessionService.updateTitle(id, title);
            return { success: true, data: session };
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to update title' });
        }
    });
}

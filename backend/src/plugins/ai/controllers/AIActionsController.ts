import { FastifyInstance } from 'fastify';
import { aiActionsService } from '../services/AIActionsService';
import { aiService } from '../services/AIService';

export default async function AIActionsController(fastify: FastifyInstance) {

    // GET all actions
    fastify.get('/actions', async (request, reply) => {
        try {
            const actions = await aiActionsService.getAllActions();
            return { success: true, data: actions };
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to fetch actions' });
        }
    });

    // POST create action
    fastify.post('/actions', async (request, reply) => {
        try {
            const data = request.body as any;
            const action = await aiActionsService.createAction(data);
            return { success: true, data: action };
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to create action' });
        }
    });

    // PUT update action
    fastify.put('/actions/:id', async (request, reply) => {
        try {
            const { id } = request.params as any;
            const data = request.body as any;
            const action = await aiActionsService.updateAction(id, data);

            if (!action) {
                return reply.status(404).send({ success: false, error: 'Action not found' });
            }

            return { success: true, data: action };
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to update action' });
        }
    });

    // DELETE action
    fastify.delete('/actions/:id', async (request, reply) => {
        try {
            const { id } = request.params as any;
            const success = await aiActionsService.deleteAction(id);

            if (!success) {
                return reply.status(404).send({ success: false, error: 'Action not found' });
            }

            return { success: true };
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to delete action' });
        }
    });

    // POST run action (Manual Trigger)
    fastify.post('/actions/:id/run', async (request, reply) => {
        try {
            const { id } = request.params as any;

            // Execute in background (async)
            aiService.executeAction(id).catch(err => {
                request.log.error({ err }, 'Failed to run manual action');
            });

            return { success: true, message: 'Action queued for execution' };
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to run action' });
        }
    });
}

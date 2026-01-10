import { FastifyInstance } from 'fastify';
import { ChatShortcutService } from '../services/ChatShortcutService';

export const ChatShortcutController = async (fastify: FastifyInstance) => {
    const service = new ChatShortcutService();

    fastify.get('/', async (req, reply) => {
        try {
            const shortcuts = await service.getAllShortcuts();
            return reply.send({ success: true, data: shortcuts });
        } catch (error: any) {
            fastify.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to fetch shortcuts' });
        }
    });

    fastify.post('/', async (req: any, reply) => {
        try {
            const shortcut = await service.createShortcut(req.body);
            return reply.send({ success: true, data: shortcut });
        } catch (error: any) {
            fastify.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to create shortcut' });
        }
    });

    fastify.put('/:id', async (req: any, reply) => {
        try {
            const { id } = req.params;
            const shortcut = await service.updateShortcut(id, req.body);
            if (!shortcut) return reply.status(404).send({ success: false, error: 'Shortcut not found' });
            return reply.send({ success: true, data: shortcut });
        } catch (error: any) {
            fastify.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to update shortcut' });
        }
    });

    fastify.delete('/:id', async (req: any, reply) => {
        try {
            const { id } = req.params;
            const success = await service.deleteShortcut(id);
            if (!success) return reply.status(404).send({ success: false, error: 'Shortcut not found' });
            return reply.send({ success: true });
        } catch (error: any) {
            fastify.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to delete shortcut' });
        }
    });
};

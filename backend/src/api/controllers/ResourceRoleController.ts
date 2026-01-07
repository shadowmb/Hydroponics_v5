
import { FastifyRequest, FastifyReply } from 'fastify';
import ResourceRoleManager from '../../services/ResourceRoleManager';

export class ResourceRoleController {

    // GET /api/system/roles
    async list(request: FastifyRequest, reply: FastifyReply) {
        try {
            const roles = await ResourceRoleManager.getAllRoles();
            return reply.send({ success: true, data: roles });
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to fetch roles' });
        }
    }

    // POST /api/system/roles/sync
    async sync(request: FastifyRequest, reply: FastifyReply) {
        try {
            const result = await ResourceRoleManager.scanAndSyncRoles();
            return reply.send({ success: true, data: result });
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to sync roles' });
        }
    }

    // PUT /api/system/roles/:key
    async update(request: FastifyRequest<{ Params: { key: string }, Body: any }>, reply: FastifyReply) {
        const { key } = request.params;
        const updates = request.body;

        try {
            const updated = await ResourceRoleManager.updateRole(key, updates as Partial<import('../../models/ResourceRole').IResourceRole>);
            if (!updated) {
                return reply.status(404).send({ success: false, error: 'Role not found' });
            }
            return reply.send({ success: true, data: updated });
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to update role' });
        }
    }
}

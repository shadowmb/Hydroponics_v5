import { FastifyInstance } from 'fastify';
import { cycleController } from '../../modules/scheduler/CycleController';

export async function cycleRoutes(fastify: FastifyInstance) {
    fastify.get('/', cycleController.getAll);
    fastify.get('/:id', cycleController.getById);
    fastify.post('/', cycleController.create);
    fastify.put('/:id', cycleController.update);
    fastify.delete('/:id', cycleController.delete);
    fastify.post('/:id/start', cycleController.start);
}

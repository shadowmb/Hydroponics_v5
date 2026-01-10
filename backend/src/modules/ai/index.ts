import { FastifyInstance } from 'fastify';
import AIController from './controllers/AIController';
import AIActionsController from './controllers/AIActionsController';
import { InsightController } from './controllers/InsightController';
import { actionScheduler } from './services/ActionScheduler';
import { sensorWatcher } from './services/SensorWatcher';

export async function aiModule(fastify: FastifyInstance) {
    console.log('🤖 AI Module Loaded');
    fastify.register(AIController, { prefix: '/api/ai' });
    fastify.register(AIActionsController, { prefix: '/api/ai' });
    fastify.register(InsightController, { prefix: '/api/ai/insights' });

    // Start background services
    await actionScheduler.start();
    await sensorWatcher.start();
}

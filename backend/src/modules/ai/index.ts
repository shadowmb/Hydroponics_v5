import { FastifyInstance } from 'fastify';
import AIController from './controllers/AIController';

export async function aiModule(fastify: FastifyInstance) {
    console.log('🤖 AI Module Loaded');
    fastify.register(AIController, { prefix: '/api/ai' });
}

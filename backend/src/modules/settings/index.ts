import { FastifyInstance } from 'fastify';
import { SettingsController } from './controllers/SettingsController';

export const settingsModule = async (fastify: FastifyInstance) => {
    fastify.register(SettingsController, { prefix: '/settings' });
};

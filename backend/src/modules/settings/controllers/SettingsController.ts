import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { settingsService } from '../services/SettingsService';

export const SettingsController = async (fastify: FastifyInstance) => {

    // GET /api/settings/ai
    fastify.get('/ai', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const config = await settingsService.getAIConfig();
            // Mask API Key for security
            if (config.apiKey) {
                config.apiKey = '********'; // Masked
            }
            return reply.send({ success: true, data: config });
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to fetch AI settings' });
        }
    });

    // POST /api/settings/ai
    fastify.post('/ai', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const newConfig = request.body as any; // Cast to any to avoid unknown error

            // If the key is masked ('********'), we should NOT overwrite the real key.
            // We need to fetch the existing config and preserve the old key if the new one is masked.
            if (newConfig.apiKey === '********') {
                const existing = await settingsService.getAIConfig();
                newConfig.apiKey = existing.apiKey;
            }

            await settingsService.saveAIConfig(newConfig);
            return reply.send({ success: true, message: 'Settings saved' });
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to save settings' });
        }
    });
};

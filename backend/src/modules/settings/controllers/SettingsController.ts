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
            if (config.roles) {
                // Mask keys inside roles
                Object.keys(config.roles).forEach(role => {
                    if (config.roles[role].apiKey) {
                        config.roles[role].apiKey = '********';
                    }
                });
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
            // Security: Handle Masked Keys
            // If the key is masked ('********'), we MUST restore the original key from DB.
            const existing = await settingsService.getAIConfig();

            // 1. Global Key
            if (newConfig.apiKey === '********') {
                newConfig.apiKey = existing.apiKey;
            }

            // 2. Role Keys
            if (newConfig.roles && existing.roles) {
                for (const role of ['assistant', 'analyzer', 'sentinel']) {
                    if (newConfig.roles[role]?.apiKey === '********') {
                        newConfig.roles[role].apiKey = existing.roles[role].apiKey;
                    }
                }
            }

            await settingsService.saveAIConfig(newConfig);
            return reply.send({ success: true, message: 'Settings saved' });
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to save settings' });
        }
    });
};

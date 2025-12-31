import { FastifyRequest, FastifyReply } from 'fastify';
import { channelService } from '../../services/NotificationChannelService';
import { NotificationProvider, INotificationProvider } from '../../models/NotificationProvider';
import { telegramService } from '../../services/TelegramBotService';
import { logger } from '../../core/LoggerService';

export class NotificationController {

    // --- Channels ---

    static async getChannels(request: FastifyRequest, reply: FastifyReply) {
        const channels = await channelService.getAll();
        reply.send(channels);
    }

    static async createChannel(request: FastifyRequest, reply: FastifyReply) {
        const data = request.body as any;
        const channel = await channelService.create(data);
        reply.send(channel);
    }

    static async updateChannel(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as any;
        const data = request.body as any;
        const channel = await channelService.update(id, data);
        reply.send(channel);
    }

    static async deleteChannel(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as any;
        try {
            await channelService.delete(id);
            reply.send({ success: true });
        } catch (err: any) {
            reply.status(400).send({ error: err.message });
        }
    }

    // --- Providers ---

    static async getProviders(request: FastifyRequest, reply: FastifyReply) {
        const providers = await NotificationProvider.find();
        reply.send(providers);
    }

    static async createProvider(request: FastifyRequest, reply: FastifyReply) {
        const data = request.body as INotificationProvider;
        const provider = new NotificationProvider(data);
        await provider.save();

        // If it's a Telegram provider, try to register the bot immediately
        if (provider.type === 'telegram' && provider.isEnabled) {
            telegramService.registerBot(provider);
        }

        reply.send(provider);
    }

    static async updateProvider(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as any;
        const data = request.body as any;

        const provider = await NotificationProvider.findByIdAndUpdate(id, data, { new: true });

        if (provider && provider.type === 'telegram') {
            if (provider.isEnabled) {
                telegramService.registerBot(provider);
            } else {
                telegramService.stopBot(provider._id.toString());
            }
        }

        reply.send(provider);
    }

    static async deleteProvider(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as any;
        // Check if used in any channel?
        // For now, let's just allow delete (Mongoose references might break or just stay valid but empty)

        const provider = await NotificationProvider.findById(id);
        if (provider && provider.type === 'telegram') {
            telegramService.stopBot(id);
        }

        await NotificationProvider.findByIdAndDelete(id);
        reply.send({ success: true });
    }

    // --- Test ---

    static async testProvider(request: FastifyRequest, reply: FastifyReply) {
        const { providerId, message } = request.body as any;

        try {
            const provider = await NotificationProvider.findById(providerId);
            if (!provider) {
                return reply.status(404).send({ error: 'Provider not found' });
            }

            if (!provider.isEnabled) {
                return reply.status(400).send({ error: 'Provider is disabled' });
            }

            if (provider.type === 'telegram') {
                const chatId = provider.config.chatId;
                if (!chatId) return reply.status(400).send({ error: 'No Chat ID configured' });

                // Ensure bot is ready
                if (!await telegramService.hasBot(providerId)) {
                    await telegramService.registerBot(provider);
                }

                await telegramService.sendMessage(providerId, chatId, message || "🔔 Test Notification from Hydroponics v5");
                reply.send({ success: true, message: 'Message sent' });
            } else {
                reply.status(400).send({ error: 'Unsupported provider type for test' });
            }
        } catch (err: any) {
            logger.error({ err, providerId }, 'Tests Failed');
            reply.status(500).send({ error: err.message });
        }
    }
}

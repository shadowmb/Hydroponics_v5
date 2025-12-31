import { Telegraf, Context } from 'telegraf';
import { logger } from '../core/LoggerService';
import { events } from '../core/EventBusService';
import { NotificationProvider, INotificationProvider } from '../models/NotificationProvider';

export class TelegramBotService {
    private static instance: TelegramBotService;
    private bots: Map<string, Telegraf> = new Map(); // providerId -> Telegraf Instance

    private constructor() { }

    public static getInstance(): TelegramBotService {
        if (!TelegramBotService.instance) {
            TelegramBotService.instance = new TelegramBotService();
        }
        return TelegramBotService.instance;
    }

    /**
     * Initialize/Re-initialize a bot for a provider
     */
    public async registerBot(provider: INotificationProvider) {
        if (provider.type !== 'telegram' || !provider.isEnabled) return;

        try {
            // Decrypt token if needed (v1 is just masking presentation, assume cleartext in DB for now or handle unmasking)
            // NOTE: In v1 we assume the DB has the real token. If we implement Encryption, we decipher here.
            const token = provider.config.token;

            if (!token || token === '***_MASKED_***') {
                logger.warn({ provider: provider.name }, '⚠️ Invalid or Masked Token. Cannot start bot.');
                return;
            }

            // Stop existing instance if any
            await this.stopBot(provider._id.toString());

            const bot = new Telegraf(token);

            // Register Middleware / Commands
            this.setupCommands(bot, provider._id.toString());

            // Start Polling (with error handling)
            bot.launch().then(() => {
                logger.info({ provider: provider.name }, '🚀 Telegram Bot Started');
            }).catch(err => {
                logger.error({ err, provider: provider.name }, '❌ Failed to launch Telegram Bot');
            });

            this.bots.set(provider._id.toString(), bot);

            // Graceful Stop
            process.once('SIGINT', () => bot.stop('SIGINT'));
            process.once('SIGTERM', () => bot.stop('SIGTERM'));

        } catch (err) {
            logger.error({ err, provider: provider.name }, '❌ Error registering Telegram Bot');
        }
    }

    public async stopBot(providerId: string) {
        const bot = this.bots.get(providerId);
        if (bot) {
            try {
                bot.stop();
            } catch (ignore) { }
            this.bots.delete(providerId);
        }
    }

    /**
     * Broadcast to configuration Chat ID
     */
    public async hasBot(providerId: string): Promise<boolean> {
        return this.bots.has(providerId);
    }

    public async sendMessage(providerId: string, chatId: string, message: string) {
        const bot = this.bots.get(providerId);
        if (!bot) {
            logger.warn({ providerId }, '⚠️ Bot not active involved in dispatch.');
            throw new Error('Bot not active');
        }

        try {
            await bot.telegram.sendMessage(chatId, message);
        } catch (err) {
            logger.error({ err, providerId, chatId }, '❌ Telegram Send Failed');
            throw err;
        }
    }

    private setupCommands(bot: Telegraf, providerId: string) {
        // Universal Security Middleware
        bot.use(async (ctx, next) => {
            const chatId = ctx.chat?.id.toString();
            // Log for discovery
            logger.info({ chatId, from: ctx.from?.username }, '📨 [Telegram] Message Received');

            if (chatId && await this.checkWhitelist(providerId, chatId)) {
                return next();
            } else {
                logger.warn({ chatId, providerId }, '⛔ Unauthorized Telegram Access Attempt (Not in Whitelist)');
            }
        });

        // Simple Command Parser
        bot.command('status', (ctx) => {
            this.emitCommand(providerId, 'STATUS', ctx);
            ctx.reply('🔍 Checking system status...');
        });

        bot.command('start', (ctx) => {
            const args = ctx.message.text.split(' ').slice(1);
            const programName = args.join(' ');
            this.emitCommand(providerId, 'START', ctx, { programName });
            ctx.reply(`⏳ Requesting start for: ${programName}`);
        });

        bot.command('stop', (ctx) => {
            this.emitCommand(providerId, 'STOP', ctx);
            ctx.reply('🛑 Sending STOP signal...');
        });

        bot.command('help', (ctx) => {
            this.emitCommand(providerId, 'HELP', ctx);
        });

        bot.command('sensors', (ctx) => {
            this.emitCommand(providerId, 'SENSORS', ctx);
        });

        bot.command('sensor', (ctx) => {
            const args = ctx.message.text.split(' ').slice(1).join(' ');
            this.emitCommand(providerId, 'SENSOR', ctx, { args });
        });

        bot.on('text', (ctx) => {
            // General text handler if needed
        });
    }

    private async checkWhitelist(providerId: string, chatId: string): Promise<boolean> {
        try {
            const provider = await NotificationProvider.findById(providerId);
            if (!provider || !provider.config.whitelist) {
                logger.warn({ providerId }, '⛔ Whitelist empty or provider missing');
                return false;
            }

            // Normalize whitelist to array of strings
            const allowedIds = Array.isArray(provider.config.whitelist)
                ? provider.config.whitelist.map(id => String(id).trim())
                : String(provider.config.whitelist).split(',').map(s => s.trim());

            const incomingId = String(chatId).trim();
            const isAllowed = allowedIds.includes(incomingId);

            if (!isAllowed) {
                logger.warn({ incomingId, allowedIds }, '⛔ Whitelist Mismatch');
            }

            return isAllowed;
        } catch (err) {
            logger.error({ err }, 'Security Check Failed');
            return false;
        }
    }

    private emitCommand(providerId: string, command: string, ctx: Context, params: any = {}) {
        if (!ctx.from) return;

        events.emit('telegram:command' as any, {
            command,
            providerId,
            chatId: ctx.chat?.id.toString(),
            user: ctx.from.username || ctx.from.first_name,
            params
        });
    }
}

export const telegramService = TelegramBotService.getInstance();

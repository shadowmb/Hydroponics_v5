import { events } from '../core/EventBusService';
import { logger } from '../core/LoggerService';
import { NotificationChannel, INotificationChannel } from '../models/NotificationChannel';
import { NotificationProvider } from '../models/NotificationProvider';
import { telegramService } from './TelegramBotService';

// Rate Limiting Types
interface RateLimitEntry {
    count: number;
    firstSeen: number;
}

export class NotificationService {
    private static instance: NotificationService;
    private rateLimits: Map<string, RateLimitEntry> = new Map();

    // Config: Max 5 identical alerts per 60 seconds
    private readonly RATE_LIMIT_WINDOW = 60 * 1000;
    private readonly RATE_LIMIT_COUNT = 5;

    private constructor() {
        // defined but lazy init
    }

    public static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    public initialize() {
        this.initializeListeners();
    }

    private initializeListeners() {
        logger.info('🔔 [NotificationService] Initializing Listeners...');

        // 1. Listen for Automation Block Events (Success & Error)
        events.on('automation:block_end', async (payload) => {
            await this.handleBlockEvent(payload);
        });

        // 2. Listen for Device Offline/Error
        events.on('device:update', async (payload) => {
            if (payload.status === 'error' || payload.status === 'offline') {
                await this.handleDeviceStatus(payload);
            }
        });

        // 3. Listen for Critical System Errors
        events.on('error:critical', async (payload) => {
            await this.dispatchToChannel('System Alerts', `🚨 CRITICAL: ${payload.message}`, 'CRITICAL');
        });
    }

    /**
     * Handle Block Events (Success or Failure)
     */
    private async handleBlockEvent(payload: any) {
        // 1. Check for overrides in payload (Source: AutomationEngine)
        const config = payload.notification;

        if (config) {
            logger.info({ blockId: payload.blockId, config }, '🔔 NotificationService: Received Block Event with Config');
        }

        // Default Logic (Auto/Legacy)
        // If no config, we fallback to "Errors Only" on a "Automation Errors" channel (if it existed) or just log.
        // But per v5 spec, we only notify if explicitly configured or if it's a critical error?
        // Let's implement v5 Spec: defaults to AUTO (Errors Only) if nothing specified?
        // Actually, if nothing is specified in Block UI, we likely do NOTHING unless global settings exist.
        // But handleBlockEvent is called for ALL blocks. We shouldn't spam.

        if (!config || !config.channelId) {
            // Only logs if 'Automation Errors' global channel is a thing.
            // For now, if no channel configured on block, we ignore.
            // EXCEPT: If it's a failure, maybe we want a default "System" alert?
            // User requested: "If this block fails, write to General Alerts".
            return;
        }

        const mode = config.mode || 'AUTO';
        const channelId = config.channelId;
        const isError = !payload.success;

        // 2. Evaluate Mode
        let shouldNotify = false;

        if (mode === 'MUTE') {
            shouldNotify = false;
        }
        else if (mode === 'ALWAYS') {
            shouldNotify = true;
        }
        else if (mode === 'AUTO') {
            // "Errors Only"
            shouldNotify = isError;
        }

        if (!shouldNotify) return;

        // 3. Compose Message
        let icon = isError ? '⚠️' : '✅';
        let title = isError ? 'Block Failed' : 'Block Executed';
        let body = isError
            ? `Error: ${payload.error}`
            : `Summary: ${payload.summary || 'Success'}`;

        // Basic Message Format
        const message = `${icon} ${title} (${payload.blockId})\n${body}`;

        // 4. Dispatch
        await this.dispatchToChannelById(channelId, message, payload.blockId);
    }


    /**
     * Handle Device Status Changes
     */
    private async handleDeviceStatus(payload: any) {
        const message = `📡 Device ${payload.status.toUpperCase()}: ${payload.id}`;
        await this.dispatchToChannel('Hardware Alerts', message, payload.id);
    }

    /**
     * Core Dispatch Logic with Rate Limiting
     */
    public async dispatchToChannel(channelName: string, message: string, listKey: string) {
        // 1. Check Rate Limit
        if (this.isRateLimited(channelName, listKey)) {
            logger.warn({ channelName, listKey }, '🔕 Notification Rate Limited (Spam Protection)');
            return;
        }

        try {
            // 2. Resolve Channel
            const channel = await NotificationChannel.findOne({ name: channelName }).populate('providerIds');
            if (!channel || !channel.providerIds || channel.providerIds.length === 0) {
                // Defines channel as "missing" only if it was explicitly expected, 
                // but effectively we just log debug to stay quiet by default.
                logger.debug({ channelName }, 'No listeners for this channel.');
                return;
            }

            // 3. Dispatch to all Providers in Channel
            for (const provider of channel.providerIds as any[]) {
                if (!provider.isEnabled) continue;

                await this.sendToProvider(provider, message);
            }

        } catch (err) {
            logger.error({ err, channelName }, '❌ Failed to dispatch notification');
        }
    }

    /**
     * Send to specific provider (Stub for now)
     */
    private async sendToProvider(provider: any, message: string) {
        logger.info({ provider: provider.name, type: provider.type }, `📨 Sending Notification: "${message}"`);

        if (provider.type === 'telegram') {
            const chatId = provider.config.chatId;
            if (chatId) {
                // Ensure bot is registered/started (Lazy init or managed elsewhere)
                // ideally, we register bots on startup. For now, check and try to register if missing?
                // Better pattern: Service should load all providers on Init.
                if (!await telegramService.hasBot(provider._id.toString())) {
                    await telegramService.registerBot(provider);
                }

                await telegramService.sendMessage(provider._id.toString(), chatId, message);
            }
        }
        else if (provider.type === 'email') {
            // TODO: Call EmailService
        }
    }

    /**
     * Dispatch by Channel ID (Preferred for Automation)
     */
    public async dispatchToChannelById(channelId: string, message: string, listKey: string) {
        // 1. Check Rate Limit
        if (this.isRateLimited(channelId, listKey)) {
            logger.warn({ channelId, listKey }, '🔕 Notification Rate Limited (Spam Protection)');
            return;
        }

        try {
            // 2. Resolve Channel
            const channel = await NotificationChannel.findById(channelId).populate('providerIds');
            if (!channel || !channel.providerIds || channel.providerIds.length === 0) {
                return;
            }

            // 3. Dispatch
            for (const provider of channel.providerIds as any[]) {
                if (!provider.isEnabled) continue;
                await this.sendToProvider(provider, message);
            }

        } catch (err) {
            logger.error({ err, channelId }, '❌ Failed to dispatch notification by ID');
        }
    }

    /**
     * Simple Rate Limiting Logic
     * Returns TRUE if we should block the message
     */
    private isRateLimited(scope: string, key: string): boolean {
        const compositeKey = `${scope}:${key}`;
        const now = Date.now();
        const entry = this.rateLimits.get(compositeKey);

        if (!entry) {
            this.rateLimits.set(compositeKey, { count: 1, firstSeen: now });
            return false;
        }

        if (now - entry.firstSeen > this.RATE_LIMIT_WINDOW) {
            // Reset window
            this.rateLimits.set(compositeKey, { count: 1, firstSeen: now });
            return false;
        }

        entry.count++;
        if (entry.count > this.RATE_LIMIT_COUNT) {
            return true; // BLOCK
        }

        return false; // ALLOW
    }
}

export const notifications = NotificationService.getInstance();

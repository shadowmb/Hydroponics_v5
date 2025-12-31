import { events } from '../core/EventBusService';
import { logger } from '../core/LoggerService';
import { NotificationChannel, INotificationChannel } from '../models/NotificationChannel';
import { NotificationRule } from '../models/NotificationRule';
import { NotificationProvider } from '../models/NotificationProvider';
import { telegramService } from './TelegramBotService';
import mongoose from 'mongoose';

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

    public async initialize() {
        this.initializeListeners();
        await this.seedDefaultRules();
        await this.startProviders();
    }

    private async startProviders() {
        try {
            const providers = await NotificationProvider.find({ isEnabled: true, type: 'telegram' });
            for (const p of providers) {
                if (!await telegramService.hasBot(p._id.toString())) {
                    logger.info({ provider: p.name }, '🚀 Booting Telegram Bot...');
                    await telegramService.registerBot(p);
                }
            }
        } catch (err) {
            logger.warn({ err }, 'Failed to auto-start notification providers');
        }
    }

    private async seedDefaultRules() {
        try {
            const count = await NotificationRule.countDocuments();
            if (count === 0) {
                // Find a channel to bind to
                const channel = await NotificationChannel.findOne();
                if (channel) {
                    await NotificationRule.create({
                        event: 'PROGRAM_START',
                        channelId: channel._id,
                        template: '🚀 Application Started: {{programName}}',
                        isEnabled: true
                    });

                    await NotificationRule.create({
                        event: 'CYCLE_COMPLETE',
                        channelId: channel._id,
                        template: '✅ Cycle Finished: {{cycleId}}',
                        isEnabled: true
                    });

                    logger.info('🌱 Seeded Default Notification Rules');
                }
            }
        } catch (err) {
            logger.warn({ err }, 'Failed to seed default rules');
        }
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
            // Also try Rule Engine
            await this.handleSystemEvent('CRITICAL_ERROR', payload);
        });

        // 4. System / Automation Events
        // We need to verify exact event names emitted by AutomationEngine
        // 'automation:state_change' -> check state
        // OR better: AutomationEngine emits new atomic events? 
        // Currently it emits: automation:block_start, automation:block_end, automation:state_change

        // We might need to Hook into 'automation:state_change' or add specific events in AutomationEngine.
        // Let's assume we will add/use:
        // 'automation:program_start' -> emitted by ProgramController/Engine
        // 'automation:program_stop'
        // 'scheduler:cycle_start' 
        // 'scheduler:cycle_complete'

        // For now, let's catch generic ones or add them.
        events.on('automation:program_start' as any, (p) => this.handleSystemEvent('PROGRAM_START', p));
        events.on('automation:program_stop' as any, (p) => this.handleSystemEvent('PROGRAM_STOP', p));
        events.on('scheduler:cycle_start' as any, (p) => this.handleSystemEvent('CYCLE_START', p));
        events.on('scheduler:cycle_complete' as any, (p) => this.handleSystemEvent('CYCLE_COMPLETE', p));

        // Startup
        this.handleSystemEvent('SYSTEM_STARTUP', { timestamp: new Date() });

        // 5. Listen for Telegram Commands
        events.on('telegram:command' as any, async (payload) => {
            await this.handleCommand(payload);
        });
    }

    /**
     * Handle Incoming Commands (e.g. from Telegram)
     */
    private async handleCommand(payload: any) {
        const { command, providerId, chatId, user, params } = payload;

        logger.info({ command, user }, '🤖 Processing Bot Command');

        try {
            let response = '';

            if (command === 'STATUS') {
                // Lazy import to avoid circular dep if any
                const { automation } = require('../modules/automation/AutomationEngine');
                const state = automation.getSnapshot().value;
                const isRunning = state === 'running' || state === 'paused';

                const { activeProgramService } = require('../modules/scheduler/ActiveProgramService');
                const active = await activeProgramService.getActive();
                const programName = active?.programId || 'None';

                response = `🤖 **System Status**\n` +
                    `State: ${isRunning ? '🟢 RUNNING' : '⚪ ' + state.toUpperCase()}\n` +
                    `Program: ${programName}\n` +
                    `Time: ${new Date().toLocaleTimeString()}`;
            }
            else if (command === 'STOP') {
                const { automation } = require('../modules/automation/AutomationEngine');
                await automation.stopProgram();
                response = `🛑 **EMERGENCY STOP**\nRequested by: ${user}`;
            }
            else if (command === 'SENSORS') {
                const { DeviceModel } = require('../models/Device');
                const sensors = await DeviceModel.find({ type: 'SENSOR', isEnabled: true });

                if (sensors.length === 0) {
                    response = '📭 No active sensors found.';
                } else {
                    response = `📡 **Active Sensors:**\n\n`;
                    for (const s of sensors) {
                        const val = s.lastReading?.value !== undefined ? s.lastReading.value.toFixed(2) : '--';
                        const unit = s.displayUnit || ''; // Basic unit fallback
                        response += `• ${s.name}: **${val} ${unit}**\n`;
                    }
                }
            }
            else if (command === 'SENSOR') {
                const nameOrId = params?.args ? params.args.trim() : ''; // We need to ensure params.args is passed
                if (!nameOrId) {
                    response = '⚠️ Please specify a sensor name or ID.\nUsage: /sensor <name>';
                } else {
                    const { DeviceModel } = require('../models/Device');
                    const mongoose = require('mongoose');
                    // Case-insensitive search by name or exact ID
                    const sensor = await DeviceModel.findOne({
                        $or: [
                            { _id: mongoose.isValidObjectId(nameOrId) ? nameOrId : null },
                            { name: { $regex: new RegExp(`^${nameOrId}$`, 'i') } }
                        ]
                    });

                    if (!sensor) {
                        response = `❌ Sensor not found: "${nameOrId}"`;
                    } else {
                        const val = sensor.lastReading?.value !== undefined ? sensor.lastReading.value : '--';
                        const raw = sensor.lastReading?.raw !== undefined ? sensor.lastReading.raw : '--';
                        const time = sensor.lastReading?.timestamp ? new Date(sensor.lastReading.timestamp).toLocaleTimeString() : 'Never';
                        const unit = sensor.displayUnit || '';

                        response = `🔎 **Sensor Details**\n\n` +
                            `Name: ${sensor.name}\n` +
                            `Status: ${sensor.status.toUpperCase()}\n` +
                            `Value: **${val} ${unit}**\n` +
                            `Raw: ${raw}\n` +
                            `Last Update: ${time}\n` +
                            `ID: \`${sensor._id}\``;
                    }
                }
            }
            else if (command === 'HELP') {
                response = `🤖 **Available Commands**\n\n` +
                    `/status - Check system health & program\n` +
                    `/sensors - List all active sensors\n` +
                    `/sensor <name> - details for specific sensor\n` +
                    `/stop - EMERGENCY STOP automation\n` +
                    `/start <name> - Start a program\n` +
                    `/help - Show this message`;
            }
            else {
                response = `❓ Unknown command: ${command}`;
            }

            // Send Reply
            await telegramService.sendMessage(providerId, chatId, response);

        } catch (err: any) {
            logger.error({ err }, 'Command Processing Failed');
            await telegramService.sendMessage(providerId, chatId, `⚠️ Error: ${err.message}`);
        }
    }

    /**
     * Handle Global System Events via Rules
     */
    private async handleSystemEvent(eventType: string, payload: any) {
        try {
            // 1. Find Rule
            const rule = await NotificationRule.findOne({ event: eventType });

            if (!rule || !rule.isEnabled || !rule.channelId) {
                return; // No rule or disabled
            }

            // 2. Format Message (Simple Template)
            // Default Templates if none provided
            let message = rule.template || `ℹ️ Event: ${eventType}`;

            // Simple Variable Substitution
            if (payload) {
                if (payload.programName) message = message.replace('{{programName}}', payload.programName);
                if (payload.cycleId) message = message.replace('{{cycleId}}', payload.cycleId);
                if (payload.cycleName) message = message.replace('{{cycleName}}', payload.cycleName); // NEW
                if (payload.reason) message = message.replace('{{reason}}', payload.reason);
                if (payload.message) message = message.replace('{{error}}', payload.message); // Payload often has 'message' for errors
                if (payload.error) message = message.replace('{{error}}', payload.error);     // OR 'error'

                // Timestamp support
                const timeStr = new Date().toLocaleTimeString();
                message = message.replace('{{timestamp}}', timeStr);
            }

            // Fallback for empty template
            if (eventType === 'PROGRAM_START') message = message.includes('Event:') ? `🚀 Program Started` : message;
            if (eventType === 'PROGRAM_STOP') message = message.includes('Event:') ? `🛑 Program Stopped` : message;

            // 3. Dispatch
            await this.dispatchToChannelById(rule.channelId, message, eventType);

        } catch (error) {
            logger.warn({ error, eventType }, 'Failed to process system notification rule');
        }
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

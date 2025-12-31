import { NotificationChannel, INotificationChannel } from '../models/NotificationChannel';
import { logger } from '../core/LoggerService';

export class NotificationChannelService {
    private static instance: NotificationChannelService;

    private constructor() { }

    public static getInstance(): NotificationChannelService {
        if (!NotificationChannelService.instance) {
            NotificationChannelService.instance = new NotificationChannelService();
        }
        return NotificationChannelService.instance;
    }

    public async getAll(): Promise<INotificationChannel[]> {
        return NotificationChannel.find().populate('providerIds');
    }

    public async getById(id: string): Promise<INotificationChannel | null> {
        return NotificationChannel.findById(id).populate('providerIds');
    }

    public async create(data: Partial<INotificationChannel>): Promise<INotificationChannel> {
        const channel = new NotificationChannel(data);
        await channel.save();
        logger.info({ id: channel._id, name: channel.name }, '📢 Notification Channel Created');
        return channel;
    }

    public async update(id: string, data: Partial<INotificationChannel>): Promise<INotificationChannel | null> {
        const channel = await NotificationChannel.findByIdAndUpdate(id, data, { new: true });
        if (channel) {
            logger.info({ id: channel._id, name: channel.name }, '📢 Notification Channel Updated');
        }
        return channel;
    }

    public async delete(id: string): Promise<boolean> {
        const channel = await NotificationChannel.findById(id);
        if (channel && channel.isSystem) {
            throw new Error('Cannot delete system channel');
        }
        await NotificationChannel.findByIdAndDelete(id);
        logger.info({ id }, '🗑️ Notification Channel Deleted');
        return true;
    }
}

export const channelService = NotificationChannelService.getInstance();

import { InsightModel, IInsight } from '../../persistence/schemas/Insight.schema';

class InsightsService {

    async createInsight(data: Partial<IInsight>) {
        return await InsightModel.create(data);
    }

    async getUnreadCount() {
        return await InsightModel.countDocuments({ isRead: false });
    }

    async getRecentInsights(limit = 20) {
        return await InsightModel.find().sort({ createdAt: -1 }).limit(limit);
    }

    async markAsRead(id: string) {
        return await InsightModel.findByIdAndUpdate(id, { isRead: true }, { new: true });
    }

    async markAllAsRead() {
        return await InsightModel.updateMany({ isRead: false }, { isRead: true });
    }
}

export const insightsService = new InsightsService();

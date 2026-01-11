import { AIInsightModel, IAIInsight } from '../models/AIInsight.schema';

class InsightsService {

    async createInsight(data: Partial<IAIInsight>) {
        return await AIInsightModel.create(data);
    }

    async getUnreadCount() {
        return await AIInsightModel.countDocuments({ isRead: false });
    }

    async getRecentInsights(limit = 20) {
        return await AIInsightModel.find().sort({ createdAt: -1 }).limit(limit);
    }

    async markAsRead(id: string) {
        return await AIInsightModel.findByIdAndUpdate(id, { isRead: true }, { new: true });
    }

    async markAllAsRead() {
        return await AIInsightModel.updateMany({ isRead: false }, { isRead: true });
    }

    async deleteInsight(id: string) {
        return await AIInsightModel.findByIdAndDelete(id);
    }
}

export const insightsService = new InsightsService();

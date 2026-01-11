import { AIActionModel, IAIAction } from '../models/AIAction.schema';

export class AIActionsService {

    async createAction(data: Partial<IAIAction>): Promise<IAIAction> {
        const action = new AIActionModel(data);
        return await action.save();
    }

    async updateAction(id: string, data: Partial<IAIAction>): Promise<IAIAction | null> {
        return await AIActionModel.findByIdAndUpdate(id, data, { new: true });
    }

    async deleteAction(id: string): Promise<boolean> {
        // Using soft delete plugin logic if available, or just standard findByIdAndDelete
        // The schema uses softDeletePlugin, so we should use delete() if the plugin adds it, 
        // or update deletedAt manually if typescript definition doesn't show it.
        // Assuming the standard mongoose plugin behavior:
        const action = await AIActionModel.findById(id);
        if (!action) return false;

        // @ts-ignore - softDeletePlugin adds delete method but types might need adjustment
        if (typeof action.delete === 'function') {
            // @ts-ignore
            await action.delete();
        } else {
            // Fallback
            // @ts-ignore
            action.deleted = true;
            // @ts-ignore
            action.deletedAt = new Date();
            await action.save();
        }
        return true;
    }

    async getAction(id: string): Promise<IAIAction | null> {
        return await AIActionModel.findById(id);
    }

    async getAllActions(): Promise<IAIAction[]> {
        return await AIActionModel.find();
    }

    async getActiveActions(): Promise<IAIAction[]> {
        return await AIActionModel.find({ enabled: true });
    }
}

export const aiActionsService = new AIActionsService();

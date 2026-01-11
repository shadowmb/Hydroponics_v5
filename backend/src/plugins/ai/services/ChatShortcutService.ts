import { AIChatShortcutModel, IAIChatShortcut } from '../models/AIChatShortcut.schema';

export class ChatShortcutService {

    async getAllShortcuts(): Promise<IAIChatShortcut[]> {
        return await AIChatShortcutModel.find().sort({ order: 1, category: 1, label: 1 });
    }

    async createShortcut(data: Partial<IAIChatShortcut>): Promise<IAIChatShortcut> {
        const shortcut = new AIChatShortcutModel(data);
        return await shortcut.save();
    }

    async updateShortcut(id: string, data: Partial<IAIChatShortcut>): Promise<IAIChatShortcut | null> {
        return await AIChatShortcutModel.findByIdAndUpdate(id, data, { new: true });
    }

    async deleteShortcut(id: string): Promise<boolean> {
        const result = await AIChatShortcutModel.findByIdAndDelete(id);
        return !!result;
    }
}

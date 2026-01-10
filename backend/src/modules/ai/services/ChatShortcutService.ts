import { ChatShortcutModel, IChatShortcut } from '../../persistence/schemas/ChatShortcut.schema';

export class ChatShortcutService {

    async getAllShortcuts(): Promise<IChatShortcut[]> {
        return await ChatShortcutModel.find().sort({ order: 1, category: 1, label: 1 });
    }

    async createShortcut(data: Partial<IChatShortcut>): Promise<IChatShortcut> {
        const shortcut = new ChatShortcutModel(data);
        return await shortcut.save();
    }

    async updateShortcut(id: string, data: Partial<IChatShortcut>): Promise<IChatShortcut | null> {
        return await ChatShortcutModel.findByIdAndUpdate(id, data, { new: true });
    }

    async deleteShortcut(id: string): Promise<boolean> {
        const result = await ChatShortcutModel.findByIdAndDelete(id);
        return !!result;
    }
}

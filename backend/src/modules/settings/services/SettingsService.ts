import { SystemSettingModel, ISystemSetting } from '../../persistence/schemas/SystemSetting.schema';

export class SettingsService {
    async getSetting(key: string): Promise<any> {
        const setting = await SystemSettingModel.findOne({ key, deletedAt: null });
        return setting ? setting.value : null;
    }

    async getSettingsByCategory(category: string): Promise<Record<string, any>> {
        const settings = await SystemSettingModel.find({ category, deletedAt: null });
        return settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, any>);
    }

    async saveSetting(key: string, value: any, category: string, description?: string): Promise<ISystemSetting> {
        return SystemSettingModel.findOneAndUpdate(
            { key },
            { value, category, description, deletedAt: null },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
    }

    // Helper to get formatted AI config
    async getAIConfig() {
        // We expect keys like 'ai_provider', 'ai_model', 'ai_api_key', 'ai_enabled'
        // stored individually or as a single object 'ai_config'
        // Let's store them as a single object 'ai_config' for atomicity
        const config = await this.getSetting('ai_config');
        return config || {};
    }

    async saveAIConfig(config: any) {
        return this.saveSetting('ai_config', config, 'ai', 'AI Assistant Configuration');
    }
}

export const settingsService = new SettingsService();

import { AIAdapterFactory, AIProvider } from './AIAdapterFactory';
// Used for OpenAI/Anthropic/Ollama
// dynamic import helper
const dynamicImport = (pkg: string) => new Function(`return import('${pkg}')`)();

// We need to import the official SDK statically because we installed it and it supports CJS usually, 
// or if it is ESM only we use dynamic import. @google/generative-ai is usually dual or ESM.
// Let's use dynamic to be safe given the environment.
// Adjusted import path for plugin architecture: 
// plugins/ai/services/AIService.ts -> ../../../modules/settings
import { settingsService } from '../../../modules/settings/services/SettingsService';
// import { UIMessage } from '@tanstack/ai-client/react'; // Removed frontend import
import { config as envConfig } from '../../../core/ConfigService';

export class AIService {
    private adapters: Map<string, any> = new Map();

    constructor() {
        // Adapters are created on demand.
    }

    /**
     * Gets or creates an adapter for a specific role based on current configuration.
     * @param role 'assistant' | 'analyzer' | 'sentinel'
     */
    private async getAdapter(role: 'assistant' | 'analyzer' | 'sentinel' = 'assistant') {
        const config = await settingsService.getAIConfig();
        const mode = config.mode || 'basic';
        let provider, model, apiKey;

        if (mode === 'advanced' && config.roles && config.roles[role]) {
            // Advanced Mode: Use specific role config
            const roleConfig = config.roles[role];
            provider = roleConfig.provider;
            model = roleConfig.model;
            // FALLBACK: If role key is empty, use global key
            apiKey = roleConfig.apiKey || config.apiKey;
        } else {
            // Basic Mode (or missing role config): Use Global Fallback
            provider = config.provider;
            model = config.model;
            apiKey = config.apiKey;
        }

        // Validate
        if (!provider || !model) {
            throw new Error(`AI Configuration missing for role: ${role} (Mode: ${mode})`);
        }

        // Cache Key: We cache adapters by "provider:model:apiKey" to reuse connections
        const cacheKey = `${provider}:${model}:${apiKey ? 'custom-key' : 'env-key'}`;

        if (this.adapters.has(cacheKey)) {
            return this.adapters.get(cacheKey);
        }

        console.log(`🔌 AI Service: creating adapter for [${role}] -> ${provider}/${model}`);
        const adapter = await AIAdapterFactory.createAdapter(
            provider as any,
            apiKey,
            model
        );

        this.adapters.set(cacheKey, adapter);
        return adapter;
    }

    /**
     * Main chat entry point
     */
    async chat(messages: any[], role: 'assistant' | 'analyzer' | 'sentinel' = 'assistant', tools: any[] = []) {
        // Ensure core AI library is loaded
        // @ts-ignore
        const { chat } = await new Function('return import("@tanstack/ai")')();

        try {
            const adapter = await this.getAdapter(role);

            // Log for debugging
            console.log(`💬 AI Chat Request [Role: ${role}]`);

            // Use TanStack AI chat
            return await chat({
                adapter: adapter,
                messages: messages,
                // tools: tools // Tools not yet fully implemented
            });
        } catch (error) {
            console.error('❌ AI Chat Error:', error);
            throw error; // Let Controller handle 500
        }
    }

    /**
     * Executes a defined AI Action.
     * 1. Fetches Action
     * 2. Gathers Context
     * 3. Sends to AI
     * 4. Handles Output
     */
    async executeAction(actionId: string, triggerContext: any = {}) {
        // dynamic import to avoid circular dependency issues at runtime if any
        const { aiActionsService } = await import('./AIActionsService');
        const action = await aiActionsService.getAction(actionId);

        if (!action || !action.enabled) {
            console.log(`⚠️ AI Action ${actionId} not found or disabled.`);
            return;
        }

        console.log(`🚀 Executing AI Action: ${action.name}`);

        // 1. Gather Context
        // Placeholder: in real implementation, query Influx/Mongo for history
        let contextData = `Current System Time: ${new Date().toISOString()}\n`;

        if (triggerContext.value !== undefined) {
            contextData += `Trigger value: ${triggerContext.value}\n`;
        }

        if (action.payload?.contextConfiguration) {
            // Logic to fetch 1h or 24h history would go here
            // const history = await historyService.get(...)
            // contextData += ...
            contextData += `(History data placeholder)\n`;
        }

        // 2. Construct Prompt
        const systemPrompt = action.payload.systemPrompt;
        // Inject context into prompt if using template strings, or just append
        const fullPrompt = `${systemPrompt}\n\n=== CONTEXT DATA ===\n${contextData}\n==================`;

        // 3. Call AI
        // We use a non-streaming chat call here effectively.
        try {
            const stream = await this.chat([{ role: 'user', content: fullPrompt }]);

            let fullResponse = '';
            for await (const chunk of stream) {
                if (chunk.delta) fullResponse += chunk.delta;
            }

            console.log(`🤖 AI Response for '${action.name}':`, fullResponse.substring(0, 50) + '...');

            // 4. Handle Outputs
            if (action.outputs.saveInsight) {
                // Dynamic import to avoid circular dependency
                const { insightsService } = await import('./InsightsService');

                await insightsService.createInsight({
                    actionId: action.id,
                    actionName: action.name,
                    content: fullResponse,
                    type: 'info', // TODO: Let AI determine severity
                    isRead: false
                });
                console.log(`💾 Insight saved to DB: ${action.name}`);
            }

            if (action.outputs.notifyTelegram) {
                // TODO: Call Telegram Service
                console.log(`📱 Telegram sent: ${fullResponse}`);
            }

            // Update Last Run
            await aiActionsService.updateAction(action.id, { lastRun: new Date() });

        } catch (error) {
            console.error(`❌ Error executing AI Action ${action.name}:`, error);
        }
    }

}

export const aiService = new AIService();

import { config } from '../../../core/ConfigService';

export type AIProvider = 'gemini' | 'openai' | 'anthropic' | 'ollama';

// Helper to bypass TS transpilation of dynamic imports (force native Node ESM loader)
const dynamicImport = (pkg: string) => new Function(`return import('${pkg}')`)();

export class AIAdapterFactory {
    static async createAdapter(provider: AIProvider, model?: string) {
        switch (provider) {
            case 'gemini':
                if (!config.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is missing');

                const usedModel = model || 'gemini-2.5-flash';
                console.log('🤖 Gemini Adapter: Connecting...', { model: usedModel, keyLength: config.GEMINI_API_KEY?.length });

                const { createGeminiChat } = await dynamicImport('@tanstack/ai-gemini');
                // Use 2.5-flash as default (Pro 1.0 is deprecated/404)
                return createGeminiChat(usedModel as any, config.GEMINI_API_KEY);

            case 'openai':
                if (!config.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is missing');
                const { createOpenaiChat } = await dynamicImport('@tanstack/ai-openai');
                return createOpenaiChat((model || 'gpt-4o-mini') as any, config.OPENAI_API_KEY);

            case 'anthropic':
                if (!config.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is missing');
                const { createAnthropicChat } = await dynamicImport('@tanstack/ai-anthropic');
                return createAnthropicChat((model || 'claude-3-5-sonnet') as any, config.ANTHROPIC_API_KEY);

            case 'ollama':
                const { createOllamaChat } = await dynamicImport('@tanstack/ai-ollama');
                return createOllamaChat((model || 'llama3') as any, 'http://localhost:11434');

            default:
                throw new Error(`Unsupported AI provider: ${provider}`);
        }
    }
}

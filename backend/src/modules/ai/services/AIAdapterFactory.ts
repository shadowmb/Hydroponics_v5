import { config } from '../../../core/ConfigService';

export type AIProvider = 'gemini' | 'openai' | 'anthropic' | 'ollama' | 'ollama-cloud';

// Helper to bypass TS transpilation of dynamic imports (force native Node ESM loader)
const dynamicImport = (pkg: string) => new Function(`return import('${pkg}')`)();

export class AIAdapterFactory {
    static async createAdapter(provider: AIProvider, apiKey?: string, modelOverride?: string) {
        switch (provider) {
            case 'gemini':
                // Use provided key or fallback to env (though service should have handled this)
                const geminiKey = apiKey || config.GEMINI_API_KEY;
                if (!geminiKey) throw new Error('GEMINI_API_KEY is missing');

                const geminiUsedModel = modelOverride || 'gemini-1.5-flash';
                console.log('🤖 Gemini Adapter: Connecting...', { model: geminiUsedModel, keyLength: geminiKey?.length });

                // @ts-ignore
                const { createGeminiChat } = await new Function('return import("@tanstack/ai-gemini")')();
                // Use 1.5-flash as default (Pro 1.0 is deprecated/404)
                return createGeminiChat(geminiUsedModel as any, geminiKey);

            case 'openai':
                const openaiKey = apiKey || config.OPENAI_API_KEY;
                if (!openaiKey) throw new Error('OPENAI_API_KEY is missing');
                const { createOpenaiChat } = await dynamicImport('@tanstack/ai-openai');
                return createOpenaiChat((modelOverride || 'gpt-4o-mini') as any, openaiKey);

            case 'anthropic':
                const anthropicKey = apiKey || config.ANTHROPIC_API_KEY;
                if (!anthropicKey) throw new Error('ANTHROPIC_API_KEY is missing');
                const { createAnthropicChat } = await dynamicImport('@tanstack/ai-anthropic');
                return createAnthropicChat((modelOverride || 'claude-3-5-sonnet') as any, anthropicKey);

            case 'ollama':
                console.log('🦙 Ollama Adapter: Connecting...', { model: modelOverride || 'llama3' });
                // @ts-ignore
                const { createOllamaChat } = await new Function('return import("@tanstack/ai-ollama")')();
                // Ensure 127.0.0.1 is used to avoid node 17+ localhost ipv6 issues
                return createOllamaChat((modelOverride || 'llama3') as any, 'http://127.0.0.1:11434');

            case 'ollama-cloud':
                console.log('☁️ Ollama Cloud: Connecting...', { model: modelOverride });
                // We use OpenAI adapter for Cloud Ollama to easily support Bearer Auth & Compatibility
                const cloudKey = apiKey;
                if (!cloudKey) throw new Error('Ollama Cloud requires an API Key');



                // Use consistent dynamic import pattern
                // @ts-ignore
                const { createOpenaiChat: createCloudChat } = await new Function('return import("@tanstack/ai-openai")')();

                if (typeof createCloudChat !== 'function') {
                    throw new Error('Failed to load createOpenaiChat from @tanstack/ai-openai');
                }

                // Pointing to the standardized OpenAI-compatible endpoint of Ollama
                const adapter = createCloudChat((modelOverride || 'llama3.3') as any, cloudKey, {
                    baseURL: 'https://ollama.com/v1'
                });

                console.log('✅ AIAdapterFactory: Adapter created.', adapter ? 'Object found' : 'UNDEFINED');
                if (adapter) console.log('Keys:', Object.keys(adapter));
                return adapter;

            default:
                throw new Error(`Unsupported AI provider: ${provider}`);
        }
    }
}

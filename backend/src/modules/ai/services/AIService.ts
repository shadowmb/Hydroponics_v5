import { AIAdapterFactory, AIProvider } from './AIAdapterFactory';
// Used for OpenAI/Anthropic/Ollama
// dynamic import helper
const dynamicImport = (pkg: string) => new Function(`return import('${pkg}')`)();

// We need to import the official SDK statically because we installed it and it supports CJS usually, 
// or if it is ESM only we use dynamic import. @google/generative-ai is usually dual or ESM.
// Let's use dynamic to be safe given the environment.
import { settingsService } from '../../settings/services/SettingsService';
// import { UIMessage } from '@tanstack/ai-client/react'; // Removed frontend import
import { config as envConfig } from '../../../core/ConfigService';

export class AIService {
    private provider: 'gemini' | 'openai' | 'anthropic' | 'ollama' = 'gemini';
    private model: string = 'gemini-2.5-flash'; // Default

    constructor() {
        // Initial load from env if needed, but per-request is better for dynamic updates
        this.provider = (envConfig as any).AI_PROVIDER || 'gemini';
    }

    /**
     * Main chat entry point
     */
    async chat(messages: any[], tools: any[] = []) {
        // 1. Fetch Dynamic Config
        const dbConfig = await settingsService.getAIConfig();

        // Priority: DB Config > Env Config > Defaults
        const provider = dbConfig.provider || this.provider;
        const model = dbConfig.model || this.model;
        const apiKey = dbConfig.apiKey || envConfig.GEMINI_API_KEY; // Fallback to env

        console.log(`🧠 AI Service: Using ${provider} / ${model}`);

        // Dynamic import for the main library
        // @ts-ignore
        const { chat } = await new Function('return import("@tanstack/ai")')();

        // Create adapter dynamically with Specific Config
        const adapter = await AIAdapterFactory.createAdapter(provider, apiKey, model);

        // Cast adapter to any to satisfy the generic 'Adapter' constraints
        return chat({
            adapter: adapter as any,
            messages,
            tools,
        });
    }

    // Custom implementation using the stable @google/generative-ai
    private async *chatGemini(messages: any[]) {
        const { GoogleGenerativeAI } = await dynamicImport('@google/generative-ai');
        const { config } = await import('../../../core/ConfigService'); // dynamic or static is fine here

        if (!config.GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY");

        const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: this.model || 'gemini-1.5-flash' });

        // Convert messages to Gemini format
        // TanStack/OpenAI format: [{ role: 'user', content: '...' }]
        // Gemini format history: [{ role: 'user' | 'model', parts: [{ text: '...' }] }]

        const history = messages.slice(0, -1).map((m: any) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }));

        const lastMessage = messages[messages.length - 1].content;

        const chat = model.startChat({
            history,
            generationConfig: {
                maxOutputTokens: 1000,
            },
        });

        try {
            const result = await chat.sendMessageStream(lastMessage);

            for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                // Mimic TanStack AI StreamChunk structure
                yield {
                    type: 'content',
                    delta: chunkText,
                    role: 'assistant'
                };
            }
        } catch (err: any) {
            console.error("Gemini Stream Error:", err);
            yield {
                type: 'error',
                error: err.message
            };
        }
    }
}

import { AIAdapterFactory, AIProvider } from './AIAdapterFactory';
// Used for OpenAI/Anthropic/Ollama
// dynamic import helper
const dynamicImport = (pkg: string) => new Function(`return import('${pkg}')`)();

// We need to import the official SDK statically because we installed it and it supports CJS usually, 
// or if it is ESM only we use dynamic import. @google/generative-ai is usually dual or ESM.
// Let's use dynamic to be safe given the environment.

export class AIService {
    private provider: AIProvider;
    private model?: string;

    constructor(provider: AIProvider = 'gemini', model?: string) {
        this.provider = provider;
        this.model = model || (provider === 'gemini' ? 'gemini-2.5-flash' : undefined);
    }

    async chat(messages: any[], tools: any[] = []) {
        // 1. Custom Path for Gemini (Bypass TanStack Adapter due to 404/ESM issues)
        if (this.provider === 'gemini') {
            return this.chatGemini(messages);
        }

        // 2. Standard Path for others (OpenAI, etc) using TanStack AI
        const { chat } = await dynamicImport('@tanstack/ai');
        const adapter = await AIAdapterFactory.createAdapter(this.provider, this.model);

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

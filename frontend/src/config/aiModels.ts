export const AI_PROVIDERS = [
    { id: 'gemini', name: 'Google Gemini' },
    { id: 'openai', name: 'OpenAI (ChatGPT)' },
    { id: 'anthropic', name: 'Anthropic (Claude)' },
    { id: 'ollama', name: 'Ollama (Local)' }
] as const;

export const AI_MODELS: Record<string, { id: string; name: string }[]> = {
    gemini: [
        // The 'id' MUST be the exact model identifier from Google.
        // The 'name' is just what is shown in the list.
        { id: 'gemini-2.5-flash', name: 'Gemini 2.0 Flash' },
        { id: 'gemini-flash-latest', name: 'Gemini Flash Latest' },
        { id: 'gemini-3-flash-preview', name: 'Gemini 3.0 Flash Preview' },

    ],
    openai: [
        { id: 'gpt-4o', name: 'GPT-4o' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
    ],
    anthropic: [
        { id: 'claude-3-5-sonnet-20240620', name: 'Claude 3.5 Sonnet' },
        { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
        { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' }
    ],
    ollama: [
        { id: 'llama3', name: 'Llama 3 (8B)' },
        { id: 'mistral', name: 'Mistral (7B)' },
        { id: 'gemma', name: 'Gemma (7B)' },
        { id: 'codellama', name: 'CodeLlama' }
    ]
};

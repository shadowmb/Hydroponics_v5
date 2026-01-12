export const AI_PROVIDERS = [
    { id: 'gemini', name: 'Google Gemini' },
    { id: 'openai', name: 'OpenAI (ChatGPT)' },
    { id: 'anthropic', name: 'Anthropic (Claude)' },
    { id: 'ollama', name: 'Ollama (Local)' },
    { id: 'ollama-cloud', name: 'Ollama Cloud' }
] as const;

export const AI_MODELS: Record<string, { id: string; name: string; description?: string }[]> = {
    gemini: [
        // The 'id' MUST be the exact model identifier from Google.
        // The 'name' is just what is shown in the list.
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
        { id: 'gemini-3-flash', name: 'Gemini 3.0 Flash' }

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
        { id: 'llama3.2', name: 'Llama 3.2' },
        { id: 'llama3.1:8b', name: 'Llama 3.1 (8B)' }
    ],
    'ollama-cloud': [
        { id: 'cogito-2.1:671b', name: 'Cogito 2.1 (671B)', description: 'Използва се за мащабни индустриални анализи и е силен в следването на комплексни, многостъпкови технически инструкции.' },
        { id: 'glm-4.6', name: 'GLM 4.6', description: 'Използва се за гладка двупосочна комуникация и е силен в естествения диалог и разбирането на контекст.' },
        { id: 'glm-4.7', name: 'GLM 4.7', description: 'Използва се за разширени мултиезични задачи и е силен в прецизния технически превод и логическите разсъждения.' },
        { id: 'kimi-k2:1t', name: 'Kimi K2 (1T)', description: 'Използва се за обработка на гигантски масиви от данни и е силен в анализа на изключително дълги документи без загуба на нишката.' },
        { id: 'kimi-k2-thinking', name: 'Kimi K2 Thinking', description: 'Използва се за критично решаване на проблеми и е силен в "мисленето" тип верига от разсъждения (Chain-of-Thought).' },
        { id: 'qwen3-coder:480b', name: 'Qwen 3 Coder (480B)', description: 'Използва се за автоматизация на софтуер и е силен в генерирането на код и архитектурни решения за Hydroponics.' },
        { id: 'qwen3-next:80b', name: 'Qwen 3 Next (80B)', description: 'Използва се като универсален балансиран асистент и е силен в бързата реакция при висока интелигентност.' },
        { id: 'deepseek-v3.2', name: 'DeepSeek v3.2', description: 'Използва се за хардуерна диагностика и е силен в математическата логика и анализа на системни откази.' },
        { id: 'deepseek-v3.1:671b', name: 'DeepSeek v3.1 (671B)', description: 'Използва се за тежки изчисления и е силен в обработката на сложни JSON структури и логове.' },
        { id: 'gpt-oss:120b', name: 'GPT-OSS (120B)', description: 'Използва се за общи изследователски цели и е силен в широкоспектърното разсъждение с отворени тегла.' },
        { id: 'nemotron-3-nano:30b', name: 'Nemotron 3 Nano (30B)', description: 'Използва се за бързи автономни агенти и е силен в изпълнението на директни команди с ниска латентност.' },
        { id: 'gpt-oss:20b', name: 'GPT-OSS (20B)', description: 'Използва се за леки чат приложения и е силен в базовото разбиране на езика при висока скорост.' },
        { id: 'qwen3-vl:235b-instruct', name: 'Qwen 3 VL Instruct (235B)', description: 'Използва се за визуална инспекция и е силен в следването на инструкции, базирани на изображения (камери).' },
        { id: 'qwen3-vl:235b', name: 'Qwen 3 VL (235B)', description: 'Използва се за видео мониторинг и е силен в разпознаването на обекти и аномалии в реално време.' },
        { id: 'minimax-m2', name: 'MiniMax M2', description: 'Използва се за ефективни работни процеси и е силен в оптимизацията на задачи и кодиране.' },
        { id: 'minimax-m2.1', name: 'MiniMax M2.1', description: 'Използва се за усъвършенствано инженерство и е силен в многоезичното програмиране и техническата прецизност.' },
        { id: 'ministral-3:3b', name: 'Ministral 3 (3B)', description: 'Използва се за вграждане в микроконтролери и е силен в работата на устройства с минимална памет.' },
        { id: 'ministral-3:8b', name: 'Ministral 3 (8B)', description: 'Използва се за локални хардуерни модули и е силен в баланса между размер и техническа грамотност.' },
        { id: 'ministral-3:14b', name: 'Ministral 3 (14B)', description: 'Използва се за по-мощни локални станции и е силен в автономното вземане на решения без интернет.' },
        { id: 'mistral-large-3:675b', name: 'Mistral Large 3 (675B)', description: 'Използва се за корпоративен RAG и е силен в предоставянето на отговори с нулеви халюцинации.' },
        { id: 'devstral-2:123b', name: 'Devstral 2 (123B)', description: 'Използва се за разработка на софтуер и е силен в анализа на цели кодови бази и файлови системи.' },
        { id: 'devstral-small-2:24b', name: 'Devstral Small 2 (24B)', description: 'Използва се за бързо редактиране на код и е силен в поддръжката на софтуерни агенти.' },
        { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro Preview', description: 'Използва се за "умния" облачен център на системата и е силен в мултимодалното разбиране и висшата логика.' },
        { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash Preview', description: 'Използва се за масов потребителски интерфейс и е силен в светкавичните отговори на ниска цена.' },
        { id: 'gemma3:4b', name: 'Gemma 3 (4B)', description: 'Използва се за базово визуално разпознаване и е силен в бързия анализ на снимки на локално ниво.' },
        { id: 'gemma3:12b', name: 'Gemma 3 (12B)', description: 'Използва се за ежедневен технически асистент и е силен в работата на български език върху стандартен хардуер.' },
        { id: 'gemma3:27b', name: 'Gemma 3 (27B)', description: 'Използва се за пълноценен RAG модул и е силен в детайлното разбиране на българска техническа документация.' },
        { id: 'rnj-1:8b', name: 'RNJ 1 (8B)', description: 'Използва се за научно-технически изчисления и е силен в STEM задачите и логиката на ниво 8B модели.' }
    ]
};

# Насоки за разработчика: AI Модул

## Преди да започнеш

1. Прочети `AI_IMPLEMENTATION_PLAN.md` за пълна картина
2. Увери се, че имаш Gemini API key
3. Създай feature branch: `git checkout -b feature/ai-assistant`

---

## Стъпка 1: Инсталиране на пакети

### Backend
```bash
cd backend
npm install @tanstack/ai @tanstack/ai-gemini @tanstack/ai-openai @tanstack/ai-anthropic @tanstack/ai-ollama zod
```

### Frontend
```bash
cd frontend
npm install @tanstack/ai-react @tanstack/ai-client
```

---

## Стъпка 2: Създаване на модулна структура

### Backend
```bash
mkdir -p backend/src/modules/ai/{services,controllers,models,tools,jobs}
```

Създай `backend/src/modules/ai/index.ts`:
```typescript
import { FastifyInstance } from 'fastify';
import AIController from './controllers/AIController';

export default async function aiModule(fastify: FastifyInstance) {
  fastify.register(AIController, { prefix: '/api/ai' });
}
```

### Frontend
```bash
mkdir -p frontend/src/modules/ai/{components,services}
```

---

## Стъпка 3: Environment Variables

Добави в `.env`:
```env
AI_ENABLED=true
GEMINI_API_KEY=your-key-here
```

Добави в `config.ts`:
```typescript
AI_ENABLED: process.env.AI_ENABLED === 'true',
GEMINI_API_KEY: process.env.GEMINI_API_KEY,
```

---

## Стъпка 4: Backend - Models

### AISettings.ts
```typescript
import mongoose from 'mongoose';

const AISettingsSchema = new mongoose.Schema({
  provider: { type: String, enum: ['gemini', 'openai', 'anthropic', 'ollama'], default: 'gemini' },
  apiKey: { type: String },
  model: { type: String, default: 'gemini-2.5-flash' },
  enabled: { type: Boolean, default: true },
});

export default mongoose.model('AISettings', AISettingsSchema);
```

### AIInsight.ts
```typescript
const AIInsightSchema = new mongoose.Schema({
  type: { type: String, enum: ['ANOMALY', 'DAILY_SUMMARY', 'RECOMMENDATION'] },
  severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'] },
  title: String,
  content: String,
  relatedSensor: String,
  isRead: { type: Boolean, default: false },
  isResolved: { type: Boolean, default: false },
}, { timestamps: true });
```

### AIAction.ts
```typescript
const AIActionSchema = new mongoose.Schema({
  name: String,
  description: String,
  triggerType: { type: String, enum: ['time', 'sensor'] },
  triggerValue: String,
  systemPrompt: String,
  sendAs: { type: String, enum: ['insight', 'email', 'both'] },
  enabled: { type: Boolean, default: true },
});
```

### AIQuickQuestion.ts
```typescript
const AIQuickQuestionSchema = new mongoose.Schema({
  question: String,      // Видим за потребителя
  systemPrompt: String,  // Скрит prompt
  order: Number,
});
```

---

## Стъпка 5: Backend - AIAdapterFactory

```typescript
// modules/ai/services/AIAdapterFactory.ts
import { createGeminiText } from '@tanstack/ai-gemini';
import { createOpenaiChat } from '@tanstack/ai-openai';
import { createAnthropicChat } from '@tanstack/ai-anthropic';
import { createOllamaText } from '@tanstack/ai-ollama';

export function createAdapter(provider: string, apiKey: string, model: string) {
  switch (provider) {
    case 'gemini':
      return createGeminiText(apiKey)(model);
    case 'openai':
      return createOpenaiChat(apiKey)(model);
    case 'anthropic':
      return createAnthropicChat(apiKey)(model);
    case 'ollama':
      return createOllamaText('http://localhost:11434')(model);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
```

---

## Стъпка 6: Backend - Tools

### Пример: querySensorHistory.ts
```typescript
import { toolDefinition } from '@tanstack/ai';
import { z } from 'zod';
import SensorLog from '../../../models/SensorLog'; // Съществуващ модел

export const querySensorHistoryDef = toolDefinition({
  name: 'query_sensor_history',
  description: 'Извлича исторически данни от сензор за определен период',
  inputSchema: z.object({
    sensorId: z.string().describe('ID на сензора'),
    hours: z.number().default(24).describe('Колко часа назад'),
  }),
  outputSchema: z.array(z.object({
    timestamp: z.string(),
    value: z.number(),
  })),
});

export const querySensorHistory = querySensorHistoryDef.server(
  async ({ sensorId, hours }) => {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const logs = await SensorLog.find({
      sensorId,
      timestamp: { $gte: since }
    }).sort({ timestamp: 1 }).lean();
    
    return logs.map(l => ({
      timestamp: l.timestamp.toISOString(),
      value: l.value,
    }));
  }
);
```

Други tools за създаване:
- `getCurrentReadings.ts` - текущи стойности на сензори
- `getResourceConsumption.ts` - изразходвани ресурси
- `getFlowExecutionHistory.ts` - история на flows

---

## Стъпка 7: Backend - AIService

```typescript
// modules/ai/services/AIService.ts
import { chat } from '@tanstack/ai';
import { createAdapter } from './AIAdapterFactory';
import { querySensorHistory } from '../tools/querySensorHistory';
// ... други tools

export class AIService {
  private adapter;
  
  constructor(provider: string, apiKey: string, model: string) {
    this.adapter = createAdapter(provider, apiKey, model);
  }
  
  async chat(messages: any[], systemPrompt?: string) {
    return chat({
      adapter: this.adapter,
      messages,
      systemPrompts: systemPrompt ? [systemPrompt] : [],
      tools: [querySensorHistory, /* други tools */],
      modelOptions: { temperature: 0.7 },
    });
  }
}
```

---

## Стъпка 8: Backend - Controller

```typescript
// modules/ai/controllers/AIController.ts
import { FastifyInstance } from 'fastify';
import { toServerSentEventsResponse } from '@tanstack/ai';
import { AIService } from '../services/AIService';
import AISettings from '../models/AISettings';
import AIInsight from '../models/AIInsight';

export default async function AIController(fastify: FastifyInstance) {
  
  // Chat endpoint (SSE streaming)
  fastify.post('/chat', async (request, reply) => {
    const { messages, systemPrompt } = request.body as any;
    const settings = await AISettings.findOne();
    
    const service = new AIService(
      settings.provider,
      settings.apiKey,
      settings.model
    );
    
    const stream = service.chat(messages, systemPrompt);
    return toServerSentEventsResponse(stream);
  });
  
  // Insights CRUD
  fastify.get('/insights', async () => {
    return AIInsight.find().sort({ createdAt: -1 }).limit(20);
  });
  
  fastify.post('/insights/:id/read', async (request) => {
    const { id } = request.params as any;
    return AIInsight.findByIdAndUpdate(id, { isRead: true });
  });
  
  // Settings
  fastify.get('/settings', async () => {
    return AISettings.findOne() || {};
  });
  
  fastify.put('/settings', async (request) => {
    const data = request.body;
    return AISettings.findOneAndUpdate({}, data, { upsert: true, new: true });
  });
}
```

---

## Стъпка 9: Backend - Регистриране на модула

В `app.ts`:
```typescript
import config from './config';

// ... съществуващ код ...

if (config.AI_ENABLED) {
  fastify.register(import('./modules/ai'));
}
```

---

## Стъпка 10: Frontend - AI Service

```typescript
// modules/ai/services/ai.service.ts
const API_URL = '/api/ai';

export const aiService = {
  getSettings: () => fetch(`${API_URL}/settings`).then(r => r.json()),
  updateSettings: (data: any) => fetch(`${API_URL}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(r => r.json()),
  
  getInsights: () => fetch(`${API_URL}/insights`).then(r => r.json()),
  markAsRead: (id: string) => fetch(`${API_URL}/insights/${id}/read`, { method: 'POST' }),
};
```

---

## Стъпка 11: Frontend - Chat Component

```tsx
// modules/ai/components/AIChatPopup.tsx
import { useChat, fetchServerSentEvents } from '@tanstack/ai-react';

export function AIChatPopup({ quickQuestions }: { quickQuestions: any[] }) {
  const { messages, sendMessage, isLoading } = useChat({
    connection: fetchServerSentEvents('/api/ai/chat'),
  });
  
  const handleQuickQuestion = (q: any) => {
    // Изпраща въпроса с допълнителен systemPrompt
    sendMessage(q.question, { body: { systemPrompt: q.systemPrompt } });
  };
  
  return (
    <div className="ai-chat-popup">
      {/* Quick questions */}
      <div className="quick-questions">
        {quickQuestions.map(q => (
          <button key={q._id} onClick={() => handleQuickQuestion(q)}>
            {q.question}
          </button>
        ))}
      </div>
      
      {/* Messages */}
      <div className="messages">
        {messages.map(m => (
          <div key={m.id} className={m.role}>
            {m.parts.map((p, i) => p.type === 'text' && <span key={i}>{p.content}</span>)}
          </div>
        ))}
      </div>
      
      {/* Input */}
      <input 
        onKeyDown={(e) => e.key === 'Enter' && sendMessage(e.currentTarget.value)}
        disabled={isLoading}
      />
    </div>
  );
}
```

---

## Стъпка 12: Header Integration

В `Header.tsx`:
```tsx
import config from '../config';
import { AIChatButton } from '../modules/ai/components/AIChatButton';
import { AIInsightsButton } from '../modules/ai/components/AIInsightsButton';

// В JSX:
{config.AI_ENABLED && <AIChatButton />}
{config.AI_ENABLED && <AIInsightsButton />}
```

---

## Тестване

1. Стартирай backend: `npm run dev`
2. Стартирай frontend: `npm run dev`
3. Отвори Settings → AI таб
4. Въведи Gemini API key
5. Кликни на 🤖 бутона
6. Задай въпрос

---

## Чеклист

- [ ] Backend пакети инсталирани
- [ ] Frontend пакети инсталирани
- [ ] AI модул структура създадена
- [ ] Models създадени
- [ ] AIAdapterFactory готов
- [ ] Tools имплементирани
- [ ] AIService готов
- [ ] AIController готов
- [ ] Модулът е регистриран в app.ts
- [ ] Frontend service готов
- [ ] Chat компонент готов
- [ ] Header integration
- [ ] Тестване работи

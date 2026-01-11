# План за интеграция на AI Асистент в Hydroponics v5

## Обобщение

AI Асистентът ще:
1. **Следи за аномалии** в сензорните данни (проактивно)
2. **Изпълнява планирани действия** по час или тригер (дневни отчети)
3. **Отговаря на въпроси** за исторически данни и анализ
4. **Помага на потребителя** да разбере системата

Потребителят **избира AI provider** от настройките.

---

## Модулна архитектура

AI модулът е **напълно отделен** и може да се активира/деактивира или премахне.

### Файлова структура

```
backend/
├── src/
│   ├── modules/
│   │   └── ai/                    ← Целият AI модул
│   │       ├── services/
│   │       │   ├── AIService.ts
│   │       │   └── AIAdapterFactory.ts
│   │       ├── controllers/
│   │       │   └── AIController.ts
│   │       ├── models/
│   │       │   ├── AISettings.ts
│   │       │   ├── AIInsight.ts
│   │       │   ├── AIAction.ts
│   │       │   └── AIQuickQuestion.ts
│   │       ├── tools/
│   │       │   └── *.ts
│   │       ├── jobs/
│   │       │   └── AIAnalysisJob.ts
│   │       └── index.ts           ← Export точка
│   └── app.ts

frontend/
├── src/
│   ├── modules/
│   │   └── ai/                    ← Целият AI UI
│   │       ├── components/
│   │       │   ├── AIChatButton.tsx
│   │       │   ├── AIChatPopup.tsx
│   │       │   └── AIInsightsButton.tsx
│   │       ├── services/
│   │       │   └── ai.service.ts
│   │       └── index.ts
```

### Активиране/деактивиране

```env
# .env
AI_ENABLED=true   # или false
```

```typescript
// backend/app.ts
if (config.AI_ENABLED) {
  fastify.register(require('./modules/ai'));
}

// frontend/Header.tsx
{config.AI_ENABLED && <AIChatButton />}
{config.AI_ENABLED && <AIInsightsButton />}
```

### Премахване на модула

1. Изтрий `backend/src/modules/ai/`
2. Изтрий `frontend/src/modules/ai/`
3. Премахни `AI_ENABLED` от `.env`
4. Готово - системата работи без AI

---

## TanStack AI - Технически детайли

### NPM пакети

```bash
# Backend
npm install @tanstack/ai zod
npm install @tanstack/ai-gemini      # Gemini
npm install @tanstack/ai-openai      # OpenAI
npm install @tanstack/ai-anthropic   # Anthropic
npm install @tanstack/ai-ollama      # Ollama (локален)

# Frontend
npm install @tanstack/ai-react @tanstack/ai-client
```

### Основни API функции

| Функция | Пакет | Описание |
|---------|-------|----------|
| `chat(options)` | @tanstack/ai | Създава streaming chat |
| `toolDefinition(config)` | @tanstack/ai | Дефинира tool |
| `toServerSentEventsResponse()` | @tanstack/ai | SSE response |
| `useChat(options)` | @tanstack/ai-react | React hook |
| `fetchServerSentEvents(url)` | @tanstack/ai-client | SSE connection |

### chat() параметри

```typescript
chat({
  adapter,           // AI adapter (gemini/openai/etc)
  messages,          // Масив от съобщения
  tools?,            // Масив от tools
  systemPrompts?,    // System prompts
  agentLoopStrategy?, // default: maxIterations(5)
  modelOptions?,     // Provider-specific опции
})
```

### toolDefinition() параметри

```typescript
toolDefinition({
  name: 'tool_name',
  description: 'Описание за AI',
  inputSchema: z.object({...}),   // Zod схема
  outputSchema?: z.object({...}), // Optional
  needsApproval?: boolean,        // Изисква одобрение
})
```

---

## Поддържани AI Providers

| Provider | Env Variable | Модели |
|----------|--------------|--------|
| **Gemini** | `GEMINI_API_KEY` | gemini-2.5-flash (препоръч.), gemini-2.5-pro |
| **OpenAI** | `OPENAI_API_KEY` | gpt-4o-mini (препоръч.), gpt-4o |
| **Anthropic** | `ANTHROPIC_API_KEY` | claude-sonnet-4-5, claude-opus-4 |
| **Ollama** | (без ключ) | llama3, mistral, qwen2 |

### Gemini

```typescript
import { createGeminiText } from '@tanstack/ai-gemini';
const adapter = createGeminiText(apiKey)('gemini-2.5-flash');
// modelOptions: { maxOutputTokens, temperature, topP, topK }
```

### OpenAI

```typescript
import { createOpenaiChat } from '@tanstack/ai-openai';
const adapter = createOpenaiChat(apiKey)('gpt-4o-mini');
// modelOptions: { max_tokens, temperature, top_p, frequency_penalty }
```

### Anthropic

```typescript
import { createAnthropicChat } from '@tanstack/ai-anthropic';
const adapter = createAnthropicChat(apiKey)('claude-sonnet-4-5');
// modelOptions: { max_tokens, temperature, top_p, top_k }
```

### Ollama

```typescript
import { createOllamaText } from '@tanstack/ai-ollama';
const adapter = createOllamaText('http://localhost:11434')('llama3');
```

---

## Use Cases

### Автоматични (Background)

| Use Case | Trigger | Описание |
|----------|---------|----------|
| **Anomaly Detection** | Всеки 5 мин | Проверка за аномалии в сензори |
| **Daily Summary** | Определен час | Обобщение на деня |

### On-Demand (Потребителят пита)

| Use Case | Примери |
|----------|---------|
| **System Analysis** | "Как мина днес?", "Има ли проблеми?" |
| **Historical Query** | "Средна температура за 5 дни?", "Колко разтвор изхарчихме?" |
| **System Help** | "Как да добавя устройство?", "Как да пусна програма?" |

---

## Визуална концепция

### Header

```
┌──────────────────────────────────────────────────────────────┐
│  🌿 Hydroponics   [Dashboard][Programs][...]  [🤖][🔔3][⏰14:44] │
└──────────────────────────────────────────────────────────────┘
                                                 │    │
                    AI Chat ─────────────────────┘    │
                    Insights (с брояч) ───────────────┘
```

---

## Chat Widget (🤖)

### Малък режим (popup)

- Винаги достъпен от header-а
- Бързи въпроси (от настройките)
- Текстово поле за свободен въпрос
- Бутон `[⬜]` за разширяване

```
┌─────────────────────────────┐
│ AI Асистент          [─][⬜] │
├─────────────────────────────┤
│ Бързи въпроси:              │
│ ┌─────────────────────────┐ │
│ │ Как мина днес?          │ │
│ │ Има ли проблеми?        │ │
│ │ Разход за седмицата?    │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ [Въведи въпрос...]     [➤]  │
└─────────────────────────────┘
```

### Голям режим (цяла страница)

- История на разговорите в sidebar
- Пълен чат в главната част
- Опция за изтриване на стари разговори

```
┌─────────────────────────────────────────────────────────┐
│ AI Асистент                                    [Затвори] │
├─────────────┬───────────────────────────────────────────┤
│ История     │  🤖 Здравей! Как мога да помогна?         │
│ ──────────  │                                           │
│ 09.01 14:30 │  👤 Как мина днес?                        │
│ 08.01 22:00 │                                           │
│ 08.01 10:15 │  🤖 Днес системата работи нормално.       │
│             │     Изпълнени са 3 цикъла...              │
├─────────────┼───────────────────────────────────────────┤
│ [Изтрий]    │  [Въведи въпрос...]                  [➤]  │
└─────────────┴───────────────────────────────────────────┘
```

---

## Insights Panel (🔔)

Dropdown с автоматични съобщения от AI.

```
┌──────────────────────────────┐
│ Известия                     │
├──────────────────────────────┤
│ 📊 Дневен отчет - 09.01      │
│    "Системата работи..."     │
│                     преди 2ч │
├──────────────────────────────┤
│ ⚠️ pH аномалия               │
│    "Открита е необичайна..." │
│                    преди 15м │
├──────────────────────────────┤
│ ✅ Всичко е наред            │
│    "Няма открити проблеми"   │
│                     преди 1ч │
├──────────────────────────────┤
│ [Виж всички →] [Маркирай ✓]  │
└──────────────────────────────┘
```

---

## Settings → AI таб

### Секция 1: Основни настройки

| Поле | Тип | Описание |
|------|-----|----------|
| AI Provider | Dropdown | Gemini / OpenAI / Anthropic / Ollama |
| API Key | Password | Ключ (не за Ollama) |
| Модел | Dropdown | Зависи от provider-а |
| Активен | Toggle | Вкл/изкл на AI |

> При смяна на Provider → полето "Модел" се актуализира.

---

### Секция 2: Действия и планиране

Потребителски дефинирани автоматични действия.

**Бутон:** `[+ Добави действие]` → отваря диалог

**Диалог за действие:**

| Поле | Описание |
|------|----------|
| Име | "Дневен отчет" |
| Описание | Какво прави действието |
| Тригер тип | `Час` (Фаза 1) / `Сензор` (Фаза 2) |
| Тригер стойност | 22:00 / pH < 5.5 |
| System Prompt | Инструкции към AI |
| Изпрати като | Insight / Email / И двете |

**Списък с действия:**
```
┌────────────────────────────────────┐
│ 📅 Дневен отчет                    │
│    Trigger: 22:00                  │
│    [Редактирай] [Изтрий]           │
├────────────────────────────────────┤
│ ⚠️ Аномалия pH (Фаза 2)            │
│    Trigger: pH < 5.5 или pH > 7.5  │
│    [Редактирай] [Изтрий]           │
└────────────────────────────────────┘
[+ Добави действие]
```

---

### Секция 3: Бързи въпроси

Въпроси за бърз достъп в Chat-а.

| Поле | Видимост | Описание |
|------|----------|----------|
| Въпрос | Вижда се | "Как мина днес?" |
| System Prompt | Скрит | Детайлни инструкции |

**Бутон:** `[+ Добави въпрос]`

**Пример:**
```
Въпрос: "Как мина днес?"
Prompt: "Направи обобщение на днешния ден. Включи 
         изпълнени цикли, консумация на ресурси,
         средни стойности на pH/EC/температура."
```

---

## AI като помощник

AI отговаря на въпроси за системата:
- "Как да добавя ново устройство?"
- "Как да пусна програма?"
- "Какво означава грешка X?"

Ще създадем `system-guide.md` с описание на функциите.

---

## Нови файлове

### Backend

| Файл | Описание |
|------|----------|
| `services/AIService.ts` | Главен сервиз |
| `services/AIAdapterFactory.ts` | Factory за adapters |
| `ai/tools/querySensorHistory.ts` | Tool: сензорна история |
| `ai/tools/getCurrentReadings.ts` | Tool: текущи стойности |
| `ai/tools/getResourceConsumption.ts` | Tool: ресурси |
| `ai/tools/getFlowExecutionHistory.ts` | Tool: flow история |
| `models/AISettings.ts` | Настройки модел |
| `models/AIInsight.ts` | Insights модел |
| `models/AIAction.ts` | Действия модел |
| `models/AIQuickQuestion.ts` | Въпроси модел |
| `controllers/AIController.ts` | REST endpoints |
| `jobs/AIAnalysisJob.ts` | Background jobs |

### Frontend

| Файл | Описание |
|------|----------|
| `components/ai/AIChatButton.tsx` | Бутон 🤖 в header |
| `components/ai/AIChatPopup.tsx` | Малък chat |
| `components/ai/AIChatPage.tsx` | Голям chat |
| `components/ai/AIInsightsButton.tsx` | Бутон 🔔 в header |
| `components/ai/AIInsightsDropdown.tsx` | Insights dropdown |
| `components/settings/AISettingsTab.tsx` | Settings таб |
| `components/settings/AIActionsSection.tsx` | Секция действия |
| `components/settings/AIQuestionsSection.tsx` | Секция въпроси |
| `components/settings/AIActionDialog.tsx` | Диалог за действие |
| `services/ai.service.ts` | API клиент |

---

## Фази

### Фаза 1 (2-3 седмици)
- Settings: Provider, API Key, Model
- Chat бутон + popup с бързи въпроси
- Insights бутон + dropdown
- Background anomaly detection
- 1 действие: Дневен отчет

### Фаза 2 (след месец)
- Голям chat с история
- Редактор за действия (диалог)
- Редактор за бързи въпроси
- Сензорни тригери

### Фаза 3 (бъдеще)
- AI препоръки за оптимизация
- Гласов вход/изход

---

## ⚡ Фаза 4: Действия и Планиране (Actions & Planning)

Тази секция позволява на потребителя да дефинира **автоматични задачи**, които AI изпълнява при определени условия.

### Архитектура на Действието (Data Model)

Всяко действие (`AIAction`) ще има следната структура в базата данни:

```typescript
interface IAIAction {
    id: string;
    name: string;          // "Дневен отчет", "pH Аномалия"
    enabled: boolean;
    
    // 1. КОГА? (Trigger)
    trigger: {
        type: 'schedule' | 'sensor';
        
        // За Schedule
        cron?: string;        // "0 22 * * *" (Всеки ден в 22:00)
        days?: number[];      // [1, 2, 3..] (Понеделник, Вторник...)
        time?: string;        // "22:00"
        
        // За Sensor
        sensorId?: string;    // "ph_sensor_1"
        condition?: '>' | '<' | '='; // Оператор
        value?: number;       // 5.5
        cooldown?: number;    // Минути между изпълненията (напр. 60 мин)
    };

    // 2. КАКВО? (Intelligence)
    payload: {
        systemPrompt: string; // "Анализирай тези данни и дай препоръки..."
        includeContext: {
            currentValue: boolean; // Прикача моментна стойност ({{value}})
            history: '1h' | '24h' | 'none'; // Прикача CSV/JSON история
        };
    };

    // 3. КЪДЕ? (Output)
    outputs: {
        saveInsight: boolean; // Запис в Dashboard
        telegram: boolean;    // Изпращане в Telegram
        email: boolean;       // Изпращане на Email
    };
    
    lastRun?: Date;
}
```

### UI/UX Визия (Диалог за Действие)

Диалогът ще бъде разделен на логически стъпки, за да е лесен за употреба.

**Стъпка 1: Тригер (Trigger)**
*   **Име на действието:** Текстово поле.
*   **Тип:** Избор между `[📅 График]` и `[🌡️ Сензор]`.
    *   *График:* Избор на Час (TimePicker) и Дни (Checkboxes).
    *   *Сензор:*
        *   Dropdown: Избери Сензор (от наличните в системата).
        *   Оператор: `>`, `<`, `=`
        *   Стойност: Числово поле.
        *   **Cooldown:** "Не повтаряй в следващите [ 60 ] минути." (Важно за предотвратяване на спам).

**Стъпка 2: Интелект (Brain)**
*   **Инструкция (Prompt):** Textarea за задачата на AI.
    *   *Hint:* "Можеш да използваш `{{value}}` за текущата стойност на сензора."
*   **Контекст данни:**
    *   Check: `[x] Прикачи текущата стойност към промпта` (Автоматично за сензори).
    *   Select: `История на данните` -> `Няма` / `Последен 1 час` / `Последни 24 часа`.

**Стъпка 3: Резултат (Action)**
*   **Канали за известяване:**
    *   `[x] Insights Dashboard` (Записва се в системата).
    *   `[ ] Telegram` (Изпраща се веднага на телефона).
    *   `[ ] Email` (Ако е конфигуриран).
*   **Тест:** Бутон `[▶️ Test Run]`, който изпълнява действието веднага с фиктивни данни, за да се види резултатът.

### Backend Логика (Scheduler & Watcher)

1.  **Scheduler Service:**
    *   Зарежда всички `schedule` действия.
    *   Използва `node-cron` за планиране.
    *   При `tick` -> извиква `AIService.executeAction(actionId)`.

2.  **Sensor Watcher (Event Bus):**
    *   Слуша събитието `sensor:update`.
    *   Проверява всички `sensor` действия.
    *   Ако `(value < threshold)` И `(now - lastRun > cooldown)` -> изпълнява действието.

3.  **Execute Action:**
    *   Събира Context (сензорни данни/история).
    *   Генерира Prompt: `System Prompt + Context Data`.
    *   Изпраща към AI Provider (Gemini/OpenAI).
    *   Получава отговор.
    *   Разпределя към Outputs (Save Insight / Telegram Service).


# AI Plugin Architecture & Development Guidelines

This document serves as the **Standard Operating Procedure (SOP)** for developing, extending, and maintaining the AI functionality in Hydroponics v5.
The AI system is designed as an **Optional, Modular Plugin**. All future development must adhere to this architecture to prevent coupling with the core system.

---

## 1. Core Philosophy: "The Plugin Rule"

> **The system must function 100% correctly if the `plugins/ai` folder is deleted.**

*   **Zero Hard Dependencies:** Core modules (Hardware, Auth, Server) must NEVER import files from `plugins/ai`.
*   **Soft Integration:** The Core triggers AI features via:
    *   **Events** (EventBus) - e.g., "Sensor data received" -> AI listens.
    *   **Dynamic Discovery** (Settings) - e.g., "Is plugin active?" -> UI renders button.
*   **Self-Contained Data:** The Plugin owns its own persistence schemas (`ai_sessions`, `ai_actions`).

---

## 2. Directory Structure

### Backend (`backend/src/plugins/ai`)
Everything related to AI lives here.
*   `index.ts`: Entry point. Registers routes and starts background services.
*   `controllers/`: API Endpoints. MUST be prefixed with `/api/ai`.
*   `services/`: Business logic (LLM adapters, Actions, History).
*   `models/`: Mongoose Schemas. MUST use `ai_` prefix for collections.
*   `utils/`: Helper functions specific to AI.

### Frontend (`frontend/src/components/ai`, `pages/AIAssistantPage.tsx`)
*   **Components:** All UI widgets (Chat, Popup) live in `components/ai`.
*   **Context:** `AIContext.tsx` manages state (Open/Close, Active Session).
*   **Services:** `ai.service.ts` works as the bridge API client.
*   **Conditional Rendering:** All UI entry points (Buttons, Menu Items) must check `isPluginActive` before rendering.

---

## 3. Development Rules

### Data Persistence
*   **DO NOT** reuse Core collections for Plugin data.
*   **Correct:** Create `AIChatSession.schema.ts` -> `ai_sessions`.
*   **Incorrect:** Importing `ChatSession.schema.ts` from Core.
*   **Why?** Modifying Core schemas to fit AI needs creates a dependency mess.

### API Routes
*   All routes must be registered in `index.ts` under the common prefix.
    ```typescript
    fastify.register(AIController, { prefix: '/api/ai' });
    ```

### Adding New Features
If you want to add a new AI capability (e.g., "Vision Analysis"):
1.  **Backend:**
    *   Create `VisionController.ts`.
    *   Create `VisionService.ts`.
    *   Register in `index.ts`.
2.  **Frontend:**
    *   Create `VisionComponent.tsx` in `components/ai`.
    *   Add condition `if (!isPluginActive) return null;` in parent.

---

## 4. Troubleshooting
*   **"Plugin Not Found" (404):** Check if `index.ts` in persistence is correct or if the folder `plugins/ai` exists.
*   **"Session Not Saving":** Ensure `sessionId` is passed in the REQUEST BODY/QUERY. The middleware/hook logic relies on explicit ID passing.

---

## 5. Управление на Знанието на AI (Knowledge Management)

Тази секция описва как да добавяте ново знание, което AI асистентът да използва при отговори на потребителски въпроси.

### 5.1 Къде се съхранява знанието

Всички файлове с документация, които AI чете, се намират в:
```
backend/src/plugins/ai/docs/
```

Можете да създавате подпапки за по-добра организация:
```
backend/src/plugins/ai/docs/
  ├── Firmware-Generator-Walkthrough.md
  ├── Test-Devices.md
  ├── Test-Flows.md
  ├── System-Overview.md
  └── Tutorials/
      ├── Tutorial-Basics.md
      └── Tutorial-Firmware.md
```

### 5.2 Конфигурационен файл (knowledge-map.json)

Намира се в:
```
backend/src/plugins/ai/config/knowledge-map.json
```

Този файл описва **кога** AI да зарежда **кой** файл. Съдържа две секции:

#### keywords (Ключови думи)
AI проверява дали потребителят е използвал определена дума в съобщението си.

```json
"keywords": {
    "regex_pattern": "файл.md"
}
```

**Пример:**
```json
"device|sensor|сензор|устройство": "Test-Devices.md"
```

- Ако потребител напише "Как да настроя **сензор**?", AI автоматично зарежда `Test-Devices.md`.
- Шаблонът е **Regex** (регулярен израз). Използвайте `|` за "ИЛИ".
- Поддържа се кирилица и латиница.

#### path_mappings (Страници)
AI зарежда документация автоматично, когато потребителят е на определена страница в приложението.

```json
"path_mappings": {
    "/url_path": "файл.md"
}
```

**Пример:**
```json
"/flows": "Test-Flows.md",
"/hardware": "Test-Devices.md"
```

- Ако потребител отвори страница `/flows` и зададе въпрос, AI вече е прочел `Test-Flows.md`.
- Работи и за nested routes: `/flows/editor` ще съвпадне с `/flows`.

### 5.3 Стъпка по стъпка: Добавяне на ново знание

#### Сценарий А: Знание, свързано с ключови думи

1. **Създайте `.md` файл** с документацията:
   ```
   backend/src/plugins/ai/docs/Relay-Management.md
   ```

2. **Редактирайте `knowledge-map.json`**, добавете ред в `keywords`:
   ```json
   "keywords": {
       "relay|реле|actuator|актуатор": "Relay-Management.md",
       // ... други
   }
   ```

3. **Тествайте**: Попитайте AI "Как да добавя реле?" и проверете дали отговаря с информация от новия файл.

#### Сценарий Б: Знание за конкретна страница

1. **Създайте `.md` файл**:
   ```
   backend/src/plugins/ai/docs/Settings-Guide.md
   ```

2. **Редактирайте `knowledge-map.json`**, добавете ред в `path_mappings`:
   ```json
   "path_mappings": {
       "/settings": "Settings-Guide.md",
       // ... други
   }
   ```

3. **Тествайте**: Отворете страница `/settings`, попитайте AI нещо общо и проверете дали отговаря с информация от `Settings-Guide.md`.

### 5.4 Wizard Логика (Многостъпкови процеси)

За сложни Wizard-и (като Firmware Builder, Add Controller), AI може да следи **конкретната стъпка** на потребителя.

#### А. Frontend Интеграция (React)

Компонентът на Wizard-а трябва да "излъчва" своето състояние към `UIStateContext`.

1. **Импортирайте хука:**
   ```typescript
   import { useUIState } from '@/context/UIStateContext';
   ```

2. **Извикайте `setWizardState` в `useEffect`:**
   ```typescript
   const { setWizardState, clearWizardState } = useUIState();

   // Мапване на стъпки (ако са string) към число
   const stepMap = { 'select-type': 1, 'configure': 2, 'review': 3 };

   useEffect(() => {
       if (open) {
           setWizardState({
               active: true,
               name: 'MyNewWizard', // Уникално име за Backend-а
               step: stepMap[currentStep], // Число (1, 2, 3...)
               config: formData // Полезни данни за AI
           });
       }
       return () => clearWizardState();
   }, [open, currentStep, formData]);
   ```

#### Б. Backend Логика (Node.js)

Файл: `backend/src/plugins/ai/controllers/AIController.ts`

AI контролерът чете `uiContext.step` и може да инжектира специфични инструкции.

```typescript
if (uiContext?.wizard === 'MyNewWizard') {
    // 1. Зареждане на основния файл
    const docPath = path.join(docsBasePath, 'My-Wizard-Guide.md');
    const content = safeReadFile(docPath, 'Wizard Guide');
    
    if (content) {
        specificContext += `\n=== WIZARD GUIDE: My New Wizard ===\n` + content + '\n';
    }

    // 2. Инструкции за конкретна стъпка (Step-Awareness)
    if (uiContext.step) {
        specificContext += `\n[!IMPORTANT] AI INSTRUCTION: The user is on STEP ${uiContext.step} of MyNewWizard. Provide guidance ONLY for this step.\n`;
        
        // Опционално: Зареждане на допълнителен файл само за тази стъпка
        if (uiContext.step === 2) {
             // load 'Step2-Advanced-Config.md'
        }
    }
}
```

#### В. Документиране

В самия `.md` файл на ръководството (`My-Wizard-Guide.md`) е добра практика да се разделят секциите ясно, за да може AI лесно да намира информацията за "Step 1", "Step 2" и т.н.

### 5.5 Приоритет на зареждане

Когато AI получи въпрос, знанието се зарежда в следния ред:

1. **System-Overview.md** (винаги)
2. **Wizard документация** (ако е активен Wizard)
3. **Стъпково-специфична документация** (ако е в конкретна стъпка)
4. **Path Mappings** (според URL на страницата)
5. **Keywords** (според думи в съобщението)

Ако един файл вече е зареден на предходна стъпка, той **НЕ се дублира**.

### 5.6 Обобщение

| Тип знание | Къде се конфигурира | Кога се зарежда |
|---|---|---|
| Ключови думи | `knowledge-map.json` → `keywords` | Потребителят написа ключова дума |
| Страница | `knowledge-map.json` → `path_mappings` | Потребителят е на определен URL |
| Wizard | `AIController.ts` | Потребителят е в Wizard процес |
| Основно | `System-Overview.md` | Винаги |

---

## 6. Резервно поведение (Fallback)

Ако файл липсва или е повреден:
- AI продължава да работи.
- В терминала се показва предупреждение: `⚠️ RAG Warning: File not found - [filename]`.
- Отговорите ще бъдат по-общи, без специфичен контекст.

Препоръка: Проверявайте логовете след добавяне на нови файлове.

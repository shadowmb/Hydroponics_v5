# План за Модуларизация на AI (Plugin Architecture)

Този документ описва стратегията за преструктуриране на AI интеграцията в Hydroponics v5 към "Plug & Play" архитектура, където модулът може да се добавя/премахва физически (copy-paste), а зависимостите са предварително инсталирани.

---

## 1. Цели
1.  **Пълна Модулност:** Превръщане на AI от вграден модул (`modules/ai`) в плъгин (`plugins/ai`).
2.  **Защита от Грешки:** Системата трябва да работи безупречно, дори ако папката на плъгина липсва напълно.
3.  **Лесна Активация:** Инсталацията става чрез просто копиране на файлове (без `npm install`).
4.  **UI Адаптация:** Потребителският интерфейс да показва плъгина като наличен (визуално), но неактивен, ако файловете липсват.

---

## 2. Анализ и Подготовка на Средата

### 2.1. Зависимости (Dependencies)
Всички библиотеки, необходими за AI (и бъдещи плъгини), ще бъдат добавени в основния `package.json`. Това гарантира "Instant Activation".
*   **Действие:** Проверка и потвърждение, че следните пакети са в `backend/package.json`:
    *   `@tanstack/ai`
    *   `@tanstack/ai-gemini`, `ai-openai`, `ai-anthropic`, `ai-ollama`
    *   `langchain` (ако се ползва)
    *   `zod`

### 2.2. Файлова Структура (Нова)
```
backend/src/
  ├── core/
  ├── modules/          (Core modules: Hardware, Automation)
  └── plugins/          (NEW: Extension folder)
      └── ai/           (Moved here from modules/ai)
          ├── index.ts  (Entry Point)
          └── ...
```

---

## 3. Backend Реализация (Dynamic Loader)

### 3.1. Създаване на `PluginManager`
Вместо статични импорти, ще създадем `core/PluginManager.ts`.
*   **Функционалност:**
    *   При стартиране (`bootstrap`), сканира директорията `src/plugins`.
    *   За всяка подпапка проверява наличието на `index.ts`.
    *   Използва `await import()` с динамичен път за зареждане на модула.
    *   Регистрира плъгина във Fastify инстанцията.
    *   Логва кои плъгини са заредени успешно.

### 3.2. Ресетване на `index.ts` (Entry Point)
*   Премахване на реда: `import { aiModule } from './modules/ai';`
*   Добавяне на извикване: `await PluginManager.loadPlugins(app);`
*   Това гарантира, че компилаторът (TypeScript) няма да търси `modules/ai` и build-ът няма да гръмне, ако папката я няма.

### 3.3. Database Schema Isolation & Naming Convention
*   **Локация:** Всички Mongoose схеми (`.schema.ts`) ще се намират в `plugins/ai/models/`. Те **НЯМА** да бъдат част от `backend/src/models`.
*   **Именуване (Code):** TypeScript класовете започват с `AI` (напр. `AIAction`, `AISettings`).
*   **Именуване (DB):** Имената на колекциите в MongoDB **ЗАДЪЛЖИТЕЛНО** използват префикс `ai_` (lowercase snake_case).
    *   Пример: `mongoose.model('AIAction', schema, 'ai_actions')`
*   **Lifecycle:** Колекциите се създават автоматично от Mongoose при първоначалното зареждане на плъгина. Ако плъгинът бъде изтрит, данните остават в базата (за безопасност), но са невидими за приложението.

---

## 4. Frontend Адаптация ("The Lazy Shell")

### 4.1. "Bungling" the Service Layer (`ai.service.ts`)
Сървисът трябва да стане устойчив на 404 грешки.
*   Добавяне на метод `checkHealth()`: Прави `GET /api/ai/health`.
*   Всички методи (`getActions`, `chat`) се увиват в проверки. Ако API-то липсва -> хвърлят грешка `PLUGIN_MISSING`.

### 4.2. Глобален Context (`AIContext.tsx`)
*   При стартиране проверява `aiService.checkHealth()`.
*   Запазва състояние: `isPluginInstalled: boolean`.
*   Ако е `false`:
    *   Функциите за отваряне на чата не правят нищо (или показват Modal).
    *   Polling заявките (за нови Insights) се спират напълно.

### 4.3. UI Индикация
*   **AIChatButton:** Ако `!isPluginInstalled`, бутонът може да има катинарче или да изкарва Tooltip "Premium Plugin Required".
*   **Settings Page:** Секцията "AI Configuration" трябва да показва съобщение "Module not active", ако API-то липсва, вместо да гърми с грешки при зареждане на настройките.

---

## 5. План за Миграция (Стъпка по Стъпка)

### Фаза 1: Backend Refactoring
1.  [ ] Създаване на папка `backend/src/plugins`.
2.  [ ] Преместване на `backend/src/modules/ai` -> `backend/src/plugins/ai`.
3.  [ ] **DB Update:** Преименуване на колекциите в моделите (ако е нужно) да ползват `ai_` префикс.
4.  [ ] Създаване на `backend/src/core/PluginManager.ts`.
5.  [ ] Обновяване на `backend/src/index.ts` да ползва `PluginManager`.
6.  [ ] Тест: Стартиране СЪС файловете (трябва да работи).
7.  [ ] Тест: Стартиране БЕЗ файловете (трябва да работи, без AI).

### Фаза 2: Frontend Hardening
1.  [ ] Добавяне на `/health` endpoint в `AIController`.
2.  [ ] Обновяване на `ai.service.ts` (Safety wrapper).
3.  [ ] Обновяване на `AIContext.tsx` (Health check logic).
4.  [ ] Тест: UI поведение при липсващ модул.

### Фаза 3: Distributable Creation
1.  [ ] Създаване на примерен ZIP архив на `src/plugins/ai`.
2.  [ ] Симулация на "Покупка": Изтриване на папката, старт на системата, разархивиране, рестарт.

---

## 6. Критични Бележки
*   **TypeScript Paths:** Трябва да внимаваме с `tsconfig.json`. Ако имаме alias `@modules/ai`, той трябва да се махне или пренасочи.
*   **База Данни:** Схемите (`AIAction`, `AISettings`) са дефинирани вътре в плъгина. Ако плъгинът липсва, Mongoose няма да знае за тези колекции. Това е ОК, защото никой няма да ги търси.
*   **Event Bus:** Ако `SensorWatcher` (част от плъгина) липсва, събитията `sensor:data` просто отиват "в нищото". Това е перфектно (Loose Coupling).

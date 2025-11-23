# Hydroponics v5 - System Specification (The Master Blueprint)

**Status**: Final Blueprint
**Language**: Bulgarian (Primary), English (Technical Terms)
**Philosophy**: "Simple Code, Functional System" (KISS Principle)

## 1. Introduction (Въведение)
Този документ е **Главен Архитектурен План (Master Blueprint)** за изграждането на Hydroponics v5. Той е синтезиран след детайлен анализ на v4 и дефинира точно **какво**, **как** и **защо** ще бъде изградено.
Целта е да послужи като единствен източник на истина (Single Source of Truth) за разработката, позволявайки изграждане на системата от нулата без нужда от стария код.

---

## 2. System Architecture (Системна Архитектура)

### 2.1. High-Level Design
Системата ще бъде **Modular Monolith** (Модулен Монолит). Това осигурява простота на разработка и deployment (като монолит), но с ясни граници между модулите (като микросървиси), за да се избегне "спагети код".

*   **Backend**: Node.js (TypeScript) + Fastify.
*   **Frontend**: React (Vite) + TailwindCSS.
*   **Database**: MongoDB (Mongoose).
*   **Real-time**: Socket.io.

### 2.2. Directory Structure
```text
/src
  /core          # Logging, Config, DI, Error Handling
  /modules
    /hardware    # Serial comms, Device drivers, Firmware gen
    /automation  # Flow engine, Scheduler, State machines
    /data        # Data retention, Analytics
    /notifications # Email, Telegram, Push
  /api           # REST Routes & Socket Events
  /shared        # Shared Types (Frontend <-> Backend)
```

---

## 3. Core Domain (Фундаментът)

### 3.1. Configuration
*   **Strategy**: Centralized `ConfigService` using `dotenv` and `zod` for validation.
*   **Why**: Prevents silent failures due to missing env vars.

### 3.2. Logging
*   **Strategy**: **Pino** logger.
*   **Implementation**: JSON logs for production, pretty-print for dev.
*   **Storage**:
    *   `debug` -> Memory Ring Buffer (for UI live view).
    *   `info/error` -> MongoDB (capped collection) + File rotation.

### 3.3. Dependency Injection (DI)
*   **Strategy**: **Manual DI** (Bootstrap Class).
*   **Why**: Avoid complex frameworks like Inversify. Simple `new Service(dep1, dep2)` in a `Bootstrap.ts` file is explicit and easy to debug.

---

## 4. Hardware Domain (Хардуерен Слой)

### 4.1. Communication Protocol
*   **Protocol**: JSON-over-Serial (Newline Delimited).
*   **Format**:
    *   Request: `{ "id": "uuid", "cmd": "RELAY", "pin": 13, "state": 1 }`
    *   Response: `{ "id": "uuid", "status": "ok", "data": { ... } }`
*   **Improvement**: Added `id` for request-response correlation (Async support).

### 4.2. Drivers & Templates
*   **Concept**: `DeviceTemplate` (JSON files).
*   **Location**: `/config/devices/*.json` (GitOps ready).
*   **Structure**: Defines capabilities (`RELAY`, `SENSOR`) and pin mappings.

### 4.3. Firmware Generation
*   **Engine**: **Handlebars**.
*   **Process**:
    1.  Load `base.ino.hbs`.
    2.  Inject command modules based on `DeviceTemplate`.
    3.  Compile/Upload using `arduino-cli`.

---

## 5. Automation Domain (Автоматизация)

### 5.1. Flow Engine
*   **Core**: **XState** (Finite State Machine).
*   **Why**: Replaces the fragile `while(true)` loop from v4. Provides predictable execution, pause/resume, and visual debugging.
*   **Execution**:
    *   `FlowInterpreter` loads JSON definition.
    *   Executes blocks as async functions.
    *   Handles `WAIT`, `IF`, `LOOP` natively.

### 5.2. Scheduler
*   **Strategy**: **BullMQ** (Redis) or `node-schedule` (In-memory).
*   **Decision**: Start with `node-schedule` for simplicity. If scaling is needed, move to BullMQ.

---

## 6. Data & Notifications (Данни и Известия)

### 6.1. Persistence
*   **ORM**: Mongoose.
*   **Collections**:
    *   `Flows`: Automation logic.
    *   `Devices`: Hardware configuration.
    *   `SensorData`: Time-series data (consider TimescaleDB later, stick to Mongo for now).
    *   `Logs`: System events.

### 6.2. Notifications
*   **Engine**: `NotificationService`.
*   **Templates**: External **Handlebars** files (`email-alert.hbs`).
*   **Queue**: In-memory queue to prevent SMTP blocking.

---

## 7. Frontend Domain (Потребителски Интерфейс)

### 7.1. Tech Stack
*   **Framework**: React 18 + Vite.
*   **State**: Zustand (Global Store) + TanStack Query (Server State).
*   **UI Lib**: TailwindCSS + Shadcn/ui (Clean, modern, accessible).

### 7.2. Flow Editor
*   **Library**: **React Flow**.
*   **Why**: Industry standard, handles zoom/pan/minimap/connections out of the box. Replaces custom Vue engine.
*   **Features**: Drag-and-drop blocks, validation, minimap.

### 7.3. Dashboard
*   **Library**: **React Grid Layout**.
*   **Features**: Draggable widgets, resizeable panels.
*   **Data**: Direct WebSocket subscription for real-time updates (no polling).

---

## 8. Migration Strategy (План за Миграция)

### Phase 1: The Foundation (Weeks 1-2)
1.  Setup Monorepo (Backend/Frontend).
2.  Implement Core (Config, Logger, DI).
3.  Implement Hardware Layer (Serial Adapter, Protocol).
4.  **Verification**: Control an LED via API.

### Phase 2: The Brain (Weeks 3-4)
1.  Implement `DeviceTemplate` logic.
2.  Build `AutomationEngine` (XState).
3.  Implement basic blocks (`SET_PIN`, `WAIT`, `IF`).
4.  **Verification**: Run a simple "Blink" flow.

### Phase 3: The Face (Weeks 5-6)
1.  Setup React + React Flow.
2.  Build Flow Editor UI.
3.  Connect Editor to Backend API.
4.  **Verification**: Create and save a flow from UI.

### Phase 4: Integration (Weeks 7-8)
1.  Implement Dashboard & Widgets.
2.  Setup Notifications.
3.  Full System Testing.

# Hydroponics System v5 - Research & Implementation Proposal

## 1. Executive Summary
The goal is to rebuild the Hydroponics system ("v5") from scratch to achieve higher **reliability**, **productivity**, **speed**, **simplicity**, and **adaptability**.
Based on the analysis of v4, the current system is feature-rich but suffers from architectural complexity (38+ flat services, 87+ frontend modules) and cross-dependency issues.

## 2. Current System Analysis (v4)
- **Backend**: Node.js (Express), TypeScript, MongoDB.
    - **Strengths**: Comprehensive hardware control, extensive logging.
    - **Weaknesses**: "Service Soup" (too many flat services), circular dependencies (e.g., `SystemRecoveryService`), complex orchestration.
- **Frontend**: Quasar (Vue 3), TypeScript.
    - **Strengths**: Modern UI framework, good component library.
    - **Weaknesses**: Over-modularization (87 modules), potentially fragmented state.
- **Architecture**: Service-Oriented / Hub-Hybrid.
    - **Issues**: The "Selective Hub" analysis highlights the struggle between centralization and isolation.

## 3. Architecture Decision: Modular Monolith vs Flat Service

The user requested a detailed comparison to ensure the best choice for Hydroponics v5.

### Option A: Flat Service Architecture (Current v4 Style)
*   **Structure**: All 38+ services sit in one `src/services` folder.
*   **Pros**:
    *   Low friction to start (just create a file).
    *   No "boilerplate" code for boundaries.
*   **Cons (Why v4 struggled)**:
    *   **"Spaghetti Dependencies"**: Any service can import any other. `SystemRecovery` ended up depending on everything, creating a tangle.
    *   **Hard to Test**: To test one service, you often have to mock 10 others.
    *   **Low Adaptability**: Logic often gets mixed with hardware details (e.g., Arduino-specific code inside a scheduling service).

### Option B: Modular Monolith (Recommended for v5)
*   **Structure**: Group code into "Domains" (folders) with strict public interfaces.
    *   `src/modules/hardware/` (Only hardware stuff)
    *   `src/modules/automation/` (Only rules/schedules)
    *   `src/modules/core/` (Logging, Config)
*   **Why it fits Hydroponics v5**:
    *   **Enforces "Universality"**: By forcing `Automation` to talk to `Hardware` through a generic interface, we ensure the system doesn't care if it's running on an Arduino or a Raspberry Pi.
    *   **Easier Maintenance**: If you change how the database works, you only touch the `Data` module. The `Hardware` module doesn't care.
    *   **Better Testing**: You can test the `Automation` logic purely by mocking the `Hardware` interface, without needing real hardware code.

### Recommendation
**Proceed with Modular Monolith.**
It directly supports your goal of making the system **"Universal" and "Adaptable"**. A flat structure naturally drifts towards tight coupling, which kills adaptability.

## 4. Technology Stack (Confirmed)

| Component | Current (v4) | Proposed (v5) | Status |
| :--- | :--- | :--- | :--- |
| **Runtime** | Node.js | **Node.js (Latest LTS)** | ✅ Keep |
| **Framework** | Express | **Fastify** | ✅ **Confirmed by User**. Faster, lower overhead. |
| **Language** | TypeScript | **TypeScript (Strict)** | ✅ Keep |
| **Database** | MongoDB | **MongoDB** | ✅ Keep |
| **Frontend** | Quasar (Vue 3) | **Quasar (Vue 3)** | ✅ Keep |
| **Comms** | WebSocket (ws) | **Socket.io** | ✅ **Confirmed by User**. Better reliability/rooms. |

## 5. Стратегия за Миграция на Модули (Detailed Module Migration)

На база на детайлния анализ на `FlowEditor`, `FlowExecutor` и `SchedulerService`, ето планът за тяхната миграция:

### 5.1. FlowEditor (Frontend)
*   **Текущо състояние**: Vue 3 компоненти, генериращи JSON `FlowDefinition`. Добре структуриран.
*   **План**:
    *   **Запазване**: Запазваме визуалния редактор и JSON формата (`blocks`, `connections`). Той е гъвкав и работи добре.
    *   **Промяна**: Ще пренапишем API слоя (`services/monitoringFlowService.ts`), за да комуникира с новия Fastify бекенд.
    *   **Подобрение**: Ще добавим валидация на типовете още във фронтенда (Zod schema), която да съвпада с бекенд валидацията.

### 5.2. FlowExecutor (Backend - "The Brain")
*   **Текущо състояние**: Сложен `FlowInterpreter` със смесена логика (`SystemStateManager`, `ExecutionSession`, `WebSocketManager`). Дублиране на хардуерна логика (`StartupService` vs `HardwareService`).
*   **План за v5 (Automation Domain)**:
    *   **Engine**: Ще създадем нов `AutomationEngine`, който е "чист" (pure logic). Той приема JSON и "Context", и връща команди.
    *   **Block Executors**: Вместо един огромен `BlockExecutor`, ще имаме малки, изолирани функции за всеки тип блок (`executeSensor`, `executeIf`, `executeAction`).
    *   **Hardware Abstraction**: Екзекуторът НЯМА да знае за `Arduino` или `SerialPort`. Той ще вика `hardwareAdapter.read(deviceId)`, а адаптерът ще решава как да го направи.

### 5.3. Scheduler & Concurrency (Планировчик)
*   **Текущо състояние**: `SchedulerService` с cron jobs и сложна логика за конфликти ("cycle" vs "monitoring").
*   **План за v5**:
    *   **Job Queue**: Ще заменим сложните `if-else` проверки с опашка (Queue).
        *   `High Priority Queue`: Потребителски команди, Аварийни спирания.
        *   `Normal Priority Queue`: Графици (Cycles).
        *   `Low Priority Queue`: Мониторинг (сензори).
    *   **Worker**: Един "Worker" ще взима задачи от опашката и ще ги подава на `AutomationEngine`. Това гарантира, че никога няма да имаме два конфликтни процеса, които се бият за хардуера.

### 5.4. Hardware Layer (Универсалност)
*   **Текущо състояние**: Директни връзки към `StartupService` и `HardwareService`.
*   **План за v5**:
    *   **IHardwareAdapter**: Интерфейс с методи `readSensor(id)`, `writeActuator(id, value)`.
    *   **Implementations**:
        *   `ArduinoAdapter`: За текущия хардуер (Serial/USB).
        *   `MockAdapter`: За тестове (връща случайни данни).
        *   `RpiAdapter` (Future): За Raspberry Pi GPIO.

## 6. Implementation Plan (Updated)

### Phase 1: Foundation (The Core)
-   Setup Monorepo (optional, but good for keeping backend/frontend in sync).
-   Initialize Fastify backend with strict TypeScript config.
-   Implement the **Event Bus** (internal pub/sub) to decouple domains.

### Phase 2: Hardware Layer (The Universal Adapter)
-   Define the `IHardwareAdapter` interface.
-   Implement `ArduinoAdapter` (porting logic from v4).
-   Implement `MockAdapter` for testing without hardware.

### Phase 3: Data & Automation
-   Setup MongoDB connection with Mongoose.
-   Implement the `Automation Engine` (Rules/Schedules).

### Phase 4: Frontend Rebuild
-   Initialize fresh Quasar project.
-   Connect to Fastify API.
-   Build "Universal Dashboard" that adapts to available hardware.

## 7. Verification Plan
-   **Automated Tests**: Vitest (faster than Jest) for unit tests.
-   **Integration Tests**: Supertest for API endpoints.
-   **Hardware Simulation**: Use `MockAdapter` to simulate sensor readings and verify automation logic without physical devices.

## User Review Required
> [!IMPORTANT]
> **Decision Point**: Do you agree with switching to **Fastify** for the backend? It requires a slight learning curve but offers better performance.
> **Decision Point**: Do you agree with the **Modular Monolith** approach (grouping services into domains) vs the current flat service structure?

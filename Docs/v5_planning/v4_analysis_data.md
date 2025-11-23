# Hydroponics v4 Deep Dive: Data & Notifications

**Status**: Draft
**Domain**: Data Persistence & User Alerts
**Modules**: NotificationService, LogStorageManager

## 1. Introduction
This document analyzes how the system persists critical data (logs) and communicates with the outside world (notifications).

---

## 2. Module Analysis

## 2. Module Analysis

### 2.1. NotificationService (The Messenger)
*Responsible for sending alerts via Email and Telegram.*

#### 🔍 Logic & Flow
*   **Providers**: Supports `Email` (Nodemailer) and `Telegram` (Direct API).
*   **Initialization**: Loads active providers from MongoDB (`NotificationProvider`).
*   **Message Types**:
    *   **Periodic**: Fetches sensor data (`MonitoringData`) and sends a report.
    *   **Error**: Triggered by Flow Engine (Standard & Custom).
    *   **Lifecycle**: Controller connect/disconnect events.
*   **Templating**: **Hardcoded HTML strings** inside the service.

#### 🧬 Data Structures (Blueprint)
```typescript
interface NotificationProvider {
  type: 'email' | 'telegram'
  config: {
    host?: string; port?: number; user?: string; pass?: string; // Email
    botToken?: string; chatId?: string; // Telegram
  }
  isActive: boolean
}

interface NotificationMessage {
  name: string
  type: 'periodic' | 'event'
  deliveryMethods: ('email' | 'telegram')[]
  tags: string[] // Sensors to include
  schedule?: string // Cron expression
}
```

#### ⚠️ Pain Points
*   **Hardcoded Templates**: Changing the email look requires a code deploy.
*   **No Queue**: If SMTP is slow, the whole request hangs.
*   **No Throttling**: A looping error block could spam 1000 emails/minute.

#### 🚀 V5 Strategy
*   **Decision**: **REFACTOR**.
*   **Migration**:
    *   **Templates**: Use a template engine (Handlebars/EJS) stored in files.
    *   **Queue**: Use a Job Queue (BullMQ) for sending.
    *   **Throttling**: Add rate limiting per channel/recipient.

---

### 2.2. LogStorageManager (The Archivist)
*Hybrid logging system with Memory and MongoDB storage.*

#### 🔍 Logic & Flow
*   **Hybrid Storage**:
    *   **Memory**: Circular buffer (1000 items) for real-time `debug` logs.
    *   **Database**: MongoDB for `info`, `warn`, `error`.
*   **Real-time**: Implements Observer pattern (`subscribe`) to push logs to WebSockets.
*   **Deduplication**: Has custom logic to prevent duplicate logs based on timestamp + content hash.

#### 🚀 V5 Strategy
*   **KEEP & OPTIMIZE**.
*   **Improvement**:
    *   Replace custom buffer logic with a high-performance logger like **Pino**.
    *   Pino supports "Transport Streams" which can write to MongoDB and WebSockets asynchronously without blocking the main thread.

---

## 3. Cross-Module Dependencies
*   `NotificationService` -> `MonitoringData` (for reports).
*   `NotificationService` -> `NotificationProvider` (DB).
*   `LogStorageManager` -> `LogEntry` (DB).

## 4. Summary
The Data domain is simple but effective. The main technical debt is the **hardcoded HTML generation** in `NotificationService`.

**Key Actions for V5:**
1.  **Externalize Templates**: Move HTML out of TypeScript files.
2.  **Async Notifications**: Move sending logic to a background worker.
3.  **Pino Logging**: Standardize logging infrastructure.

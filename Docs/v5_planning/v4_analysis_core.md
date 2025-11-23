# Hydroponics v4 Deep Dive: Core Infrastructure

**Status**: Draft
**Domain**: Core System
**Modules**: StartupService, UnifiedLoggingService, ConnectionManagerService, SystemRecoveryService

## 1. Introduction
This document analyzes the "Spine" of the application—the services responsible for bringing the system up, keeping it running, and recording what happens.

---

## 2. Module Analysis

## 2. Module Analysis

### 2.1. StartupService (The "Smart Router Hub")
*Currently acts as a central service bus and bootloader.*

#### 🔍 Logic & Flow
*   **Architecture**: Implements a "Smart Router Hub" pattern.
*   **Responsibility**:
    1.  **Boot Sequence**: DB -> Settings -> Hardware -> Scheduler -> Server.
    2.  **Service Registry**: Maps `category:service:method` strings to actual service instances.
    3.  **Routing**: `execute('hardware:device:executeCommand', params)` routes to `DeviceCommandService`.
*   **Performance**: Has a `criticalServicesCache` to speed up lookups.

#### ⚠️ Pain Points
*   **Over-Engineering**: The "Smart Router" adds a layer of indirection (string parsing) for internal method calls.
*   **Type Safety**: `execute(string, any)` kills TypeScript's type checking.
*   **Monolithic**: It knows too much about every other service.

#### 🚀 V5 Strategy
*   **Decision**: **REFACTOR / SIMPLIFY**.
*   **Migration**:
    *   **Boot**: Use a dedicated `Bootstrap` class with explicit dependency ordering.
    *   **Routing**: Remove the "Smart Router". Use direct Dependency Injection (DI) or ES Modules imports.
    *   **Type Safety**: Restore direct method calls.

---

### 2.2. UnifiedLoggingService (The Observer)
*Centralized logging with multi-level storage.*

#### 🔍 Logic & Flow
*   **Levels**: `debug` (memory), `info` (24h), `warn` (7d), `error` (30d), `analytics` (90d).
*   **Storage**:
    *   `Memory`: Array for debug logs (circular buffer 1000 items).
    *   `Persistent`: MongoDB for important logs.
*   **Context**: Captures `module`, `tag`, `data`, and `business` context.

#### 🧬 Data Structures (Blueprint)
```typescript
interface LogEntry {
  timestamp: Date
  level: 'debug' | 'info' | 'warn' | 'error' | 'analytics'
  tag: string
  module: string
  data: any
  context?: {
    deviceId?: string
    controllerId?: string
    business?: { category: string, operation: string }
  }
}
```

#### 🚀 V5 Strategy
*   **KEEP & IMPROVE**.
*   **Improvement**:
    *   Use a standard logger like `Pino` or `Winston` for better performance and JSON formatting.
    *   Keep the "Business Context" concept—it's excellent for debugging.

---

### 2.3. ConnectionManagerService (The Gatekeeper)
*Manages active connections to controllers.*

#### 🔍 Logic & Flow
*   **Dual Mode**: Supports both Legacy `SerialPort` and new `IControllerAdapter`.
*   **Lifecycle**: `addConnection` -> `isConnected` -> `removeConnection`.
*   **Sharing**: Has a `shareConnections()` method to leak state to other services (Legacy debt).

#### 🚀 V5 Strategy
*   **REFACTOR**.
*   **Migration**:
    *   Drop "Legacy Serial" support. Everything must be an `Adapter`.
    *   Remove `shareConnections()`. Services should ask the Manager, not grab the raw socket.

---

### 2.4. SystemRecoveryService (The Healer)
*Handles automatic reconnection and error recovery.*

#### 🔍 Logic & Flow
*   **Algorithm**:
    1.  Triggered by `HardwareHealthChecker` or connection loss.
    2.  Closes existing connection.
    3.  Retries 3 times with delays (1s, 3s, 5s).
    4.  Re-initializes controller via `SystemInitializationService`.
    5.  Sends Notifications (Disconnect/Reconnect).

#### 🚀 V5 Strategy
*   **KEEP**.
*   **Improvement**:
    *   Make retry policy configurable per device type (e.g., WiFi needs more retries than USB).
    *   Integrate with `EventBus` to broadcast status changes instead of calling `NotificationService` directly.

---

## 3. Cross-Module Dependencies
*   `StartupService` -> **EVERYTHING** (Central Hub).
*   `SystemRecovery` -> `ConnectionManager` + `SystemInitialization`.
*   `ConnectionManager` -> `ControllerAdapter`.

## 4. Summary
The Core Infrastructure is functional but suffers from "Architecture Astronaut" syndrome in the `StartupService` (Smart Router). The logging and recovery logic is sound.

**Key Actions for V5:**
1.  **Dismantle the Smart Router**: Go back to simple, typed dependency injection.
2.  **Standardize Adapters**: Kill the legacy serial code in ConnectionManager.
3.  **Professional Logger**: Swap custom implementation for Pino/Winston but keep the schema.

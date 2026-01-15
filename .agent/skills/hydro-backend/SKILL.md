---
name: hydro-backend
description: Expert Backend Specialist for Hydroponics v5 System (Fastify/Node.js). Use when creating APIs, Services, or DB Logic.
---

# Hydroponics v5 - Backend Specialist Skill

This skill defines the architecture, patterns, and coding standards for the Node.js/Fastify backend.

## 🛠 Tech Stack
- **Framework:** Fastify v4 (TypeScript).
- **Database:** MongoDB (Mongoose v8).
- **Validation:** Zod v3.
- **Logging:** Pino (via `FastifyRequest.log` or `LoggerService`).
- **Realtime:** Socket.io (Events emitted via `EventBusService`).

## 🏗 Architecture Patterns

### 1. Controller-Service Pattern
- **Standard:** Use the provided templates for consistency.
- **Service Template:** [Service.ts.hbs](./templates/Service.ts.hbs) (Singleton Pattern, Typed Config).
- **Controller Template:** [Controller.ts.hbs](./templates/Controller.ts.hbs) (Implements Try-Catch, Standard Response).
- **Access:** Services export a singleton instance (e.g., `export const hardware = HardwareService.getInstance();`).

### 2. Dependency Injection & Circular Deps
- **Critical Rule:** To avoid circular dependency issues between Services and Models, use **Dynamic Imports** or `require` inside methods.
- **Example:**
  ```typescript
  // BAD: Top-level import causing cycle
  import { DeviceModel } from '../../models/Device';
  
  // GOOD: Lazy load inside method
  public async getDevice() {
      // Option A: Dynamic Import
      const { DeviceModel } = await import('../../models/Device');
      // Option B: Legacy Require (if needed for obscure corner cases)
      const { someService } = require('./SomeService'); 
      return DeviceModel.findById(...);
  }
  ```

### 3. Error Handling
- **Controllers:** Every controller method MUST be wrapped in a `try-catch` block.
- **Response:** On error, return status 500 with standard JSON format.
  ```typescript
  catch (error: any) {
      req.log.error(error); // Log with request context
      return reply.status(500).send({ 
          success: false, 
          error: error.message || 'Internal Server Error' 
      });
  }
  ```

### 4. File Paths & Build Safety
- **Problem:** `__dirname` behaves differently in TS vs JS (dist/ folder issue).
- **Rule:** ALWAYS use `path.resolve(process.cwd(), 'path/to/resource')` to access static files or config. Never rely on relative paths from source files.

### 5. System Bootstrap
- **Rule:** Critical metadata (like Resource Roles, Templates) MUST be auto-loaded into DB at server startup (`index.ts`).
- **Anti-Pattern:** Do not rely on manual "Sync" buttons or lazy-loading for core system data.

## 📜 Coding Standards

### 6. Configuration & Environment
- **Env Vars:** NEVER use `process.env` directly in application logic. Always use `ConfigService`.
- **System Paths:** Use `process.cwd()` for all file operations to ensure compatibility across different startup contexts.
- **State Integrity:** "Memory is Volatile, DB is Truth".
  - On Startup: Always reconcile in-memory state with DB state (e.g. `syncStatus`).
  - Never assume the Engine status matches DB status blindly.
- **Safe Shutdown:**
  - **Rule:** Critical long-running operations (Windows, Cycles) MUST be wrapped in `try/finally` blocks.
  - **Reason:** To ensure status is updated to `completed/stopped/error` even if the code crashes, preventing "Zombie" sessions.

### 7. Data Robustness & Recovery
- **ID Handling:** Be prepared for mixed `_id` types (String vs ObjectId) in legacy or migrated data.
  - When writing recovery tools (e.g., Force Stop), implement **Fallbacks**:
    1. Try `Model.findById(id)` first.
    2. If not found, fall back to direct driver access: `mongoose.connection.db.collection(...).updateOne({ _id: id })`.
- **Debugging:** When data seems "invisible", create a temporary script in the `backend/` root using `mongoose` natively to inspect the raw types:
    ```javascript
    // debug.js
    const mongoose = require('mongoose');
    // ... connect and inspect types ...
    ```
- **Rule:** Do NOT use `process.env` directly in business logic.
- **Solution:** Use the typed `ConfigService` (`core/ConfigService.ts`).
- **Example:** `import { config } from '@/core/ConfigService'; ... config.MONGO_URI`.

### API Responses
Always return a consistent JSON envelope:
```typescript
{
  success: boolean;
  data?: any;       // The actual payload
  error?: string;   // Human readable error message
  details?: any;    // Validation errors or debug info
}
```

### Database (Mongoose)
- **Soft Delete:** Most models use soft delete (`deletedAt` field). Check `deletedAt: { $ne: null }` unless querying history.
- **Deep Merge:** When updating complex objects (like `config`), use manual Deep Merge or strict field setting to avoid overwriting nested props.

### Logging
- Use `req.log.info/error` inside Controllers (to attach Request ID).
- Use `logger.info/error` (from `core/LoggerService`) inside Services/Background Jobs.

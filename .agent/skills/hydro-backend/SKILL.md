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
- **Controllers:** Static classes (e.g., `HardwareController.ts`) handling HTTP req/res logic.
- **Services:** Singleton classes (e.g., `HardwareService.ts`) containing business logic.
- **Access:** Services export a singleton instance (e.g., `export const hardware = HardwareService.getInstance();`).

### 2. Dependency Injection & Circular Deps
- **Critical Rule:** To avoid circular dependency issues between Services and Models, use **Dynamic Imports** inside methods.
- **Example:**
  ```typescript
  // BAD
  import { DeviceModel } from '../../models/Device';
  
  // GOOD
  public async getDevice() {
      const { DeviceModel } = await import('../../models/Device');
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

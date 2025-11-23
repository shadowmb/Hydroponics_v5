# Hydroponics v5 - API Contracts Specification

**Status**: Draft
**Protocol**: REST (HTTP/1.1) + Socket.io (WebSockets)
**Format**: JSON

## 1. Standard Response Format
All REST API responses will follow this standard envelope:

```typescript
// Success Response (HTTP 200/201)
interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
}

// Error Response (HTTP 4xx/5xx)
interface ApiError {
  success: false;
  error: {
    code: string; // e.g., 'RESOURCE_NOT_FOUND'
    message: string;
    details?: any; // Validation errors, etc.
  };
}
```

---

## 2. REST API (Resource Management)

### 2.1. Devices (`/api/devices`)
*   `GET /` - List all devices.
*   `POST /` - Create a new device.
*   `GET /:id` - Get device details.
*   `PATCH /:id` - Update device config.
*   `DELETE /:id` - Remove device.
*   `POST /:id/command` - Send immediate hardware command (Manual override).
    *   Body: `{ "command": "RELAY_ON", "params": {} }`

### 2.2. ActionTemplates (`/api/templates`)
*   `GET /` - List all templates.
*   `POST /` - Create a new template.
*   `GET /:id` - Get template definition.
*   `PUT /:id` - Update template definition.
*   `POST /:id/validate` - Validate template logic (Dry run).

### 2.3. Programs (`/api/programs`)
*   `GET /` - List all programs.
*   `POST /` - Create a new program.
*   `GET /:id` - Get program details.
*   `PATCH /:id` - Update program schedule.
*   `POST /:id/start` - Start program execution.
*   `POST /:id/stop` - Stop program execution.

### 2.4. System (`/api/system`)
*   `GET /status` - System health, uptime, memory.
*   `GET /logs` - Retrieve system logs (filtered).
*   `GET /settings` - Get global settings.
*   `PATCH /settings` - Update global settings.

---

## 3. Socket.io Events (Real-time Communication)

### 3.1. Client -> Server (Commands)
Events sent from the Frontend to the Backend.

*   `subscribe:monitoring` - Subscribe to real-time sensor data.
    *   Payload: `{ deviceIds: string[] }`
*   `subscribe:execution` - Subscribe to execution logs for a specific program/template.
    *   Payload: `{ executionId: string }`
*   `manual:control` - Direct hardware control (Low latency).
    *   Payload: `{ deviceId: string, action: string, value: any }`

### 3.2. Server -> Client (Updates)
Events broadcasted from Backend to Frontend.

*   `monitoring:data` - Real-time sensor reading.
    *   Payload: `{ deviceId: string, value: number, timestamp: string }`
*   `device:status` - Device connectivity change.
    *   Payload: `{ deviceId: string, status: 'ONLINE' | 'OFFLINE' }`
*   `execution:step` - Progress update for running automation.
    *   Payload: `{ executionId: string, nodeId: string, status: 'RUNNING' | 'COMPLETED', result?: any }`
*   `program:status` - Overall program state change.
    *   Payload: `{ programId: string, status: 'RUNNING' | 'PAUSED' | 'STOPPED' }`
*   `system:alert` - Critical system notification.
    *   Payload: `{ level: 'WARN' | 'ERROR', message: string }`

---

## 4. Authentication (Optional for v5.0)
*   **Strategy**: JWT (JSON Web Tokens).
*   **Header**: `Authorization: Bearer <token>`
*   *Note*: For the initial v5 release on local network, we might skip strict auth or use a simple PIN code.

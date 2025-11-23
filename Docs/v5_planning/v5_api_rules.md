# Hydroponics v5 - API Layer Rules

## 1. Architectural Principles
*   **Thin Layer:** The API Layer must be a "Thin Layer" over the core services. It should NOT contain business logic.
*   **Pattern:** Use the **Controller-Service** pattern.
    *   **Controllers:** Handle HTTP request parsing, validation (Zod), and response formatting.
    *   **Services:** Perform the actual work (`HardwareService`, `AutomationEngine`).
*   **Stateless:** The API itself is stateless. State resides in the Services (Singleton instances).

## 2. Core Components
### 2.1 Hardware Controller (`/api/hardware`)
*   **Purpose:** Manual control and status monitoring.
*   **Endpoints:**
    *   `POST /command`: Send a command to a device.
        *   Body: `{ deviceId, command, params }`
    *   `GET /devices`: Get current state of all devices (from `HardwareService` memory).

### 2.2 Automation Controller (`/api/automation`)
*   **Purpose:** Manage automation processes.
*   **Endpoints:**
    *   `POST /start`: Start a program.
        *   Body: `{ programId, templateId }`
    *   `POST /stop`: Stop the current program.
    *   `POST /pause`: Pause execution.
    *   `POST /resume`: Resume execution.
    *   `GET /status`: Get current engine status (Idle, Running, Block ID).

### 2.3 Real-Time Gateway (Socket.io)
*   **Purpose:** Push updates to the Frontend to avoid polling.
*   **Mechanism:**
    *   Listens to `EventBus` events (`device:connected`, `sensor:data`, `automation:block_start`, etc.).
    *   Forwards them to connected Socket.io clients.
*   **Namespaces:** Use namespaces if necessary (e.g., `/events`).

## 3. Data Flow
*   **Inbound (Commands):** `Client` -> `API Controller` -> `Service Method` (await) -> `Return 200 OK`.
*   **Outbound (Updates):** `Service` -> `EventBus` -> `Real-Time Gateway` -> `Client (Socket)`.

## 4. Validation & Error Handling
*   **Validation:** STRICT Zod validation for all incoming request bodies. Reuse existing schemas where possible.
*   **Error Format:** Unified JSON error response:
    ```json
    {
      "error": {
        "code": "DEVICE_BUSY",
        "message": "The device is currently executing another command.",
        "details": { ... }
      }
    }
    ```
*   **HTTP Status Codes:**
    *   `200`: Success
    *   `400`: Validation Error
    *   `404`: Device/Resource Not Found
    *   `500`: Internal Server Error

## 5. Security (Initial)
*   **CORS:** Enable CORS for development (allow all).
*   **Auth:** (To be defined later) - Currently open access for local network.

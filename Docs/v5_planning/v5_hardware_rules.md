# Hydroponics v5 - Hardware Layer Rules & Constraints (The Constitution)

**Status**: Final
**Scope**: `src/modules/hardware`

## 1. Scope & Boundaries
*   **Single Gateway**: `HardwareService` is the ONLY entry/exit point for hardware communication.
*   **No Business Logic**: `HardwareService` never decides "when" to act. It only executes commands.
*   **No Implicit Delays**: `HardwareService` never uses `sleep()` or `delay()`. Timing is the responsibility of the Automation Engine.
*   **Strict Separation**: `HardwareService` does **NOT** implement retry logic. That belongs to `SystemRecoveryService`.

## 2. State Management
*   **Source of Truth**: The Database (`Device` model) is the ONLY source of truth for configuration.
*   **Runtime State**: `HardwareService` maintains *in-memory* state (`lastSeen`, `value`, `status`) but NEVER modifies the persistent configuration.

## 3. Transport Layer (Serial/JSON)
*   **Protocol**: Strict **JSON-over-Serial** (Newline Delimited).
*   **Error Propagation**: Transport errors (disconnect, IO) must emit `device:connection_error` or `device:disconnected`. They must NOT be swallowed.
*   **Buffering**: Must handle partial chunks and assemble valid JSON.

## 4. Command Execution
*   **Queue Policy**: **FIFO per Device**. Commands to the same MCU must be serialized. No concurrency on the same Serial port.
*   **Validation**:
    *   Template MUST exist.
    *   Command MUST exist in Template.
    *   Parameters MUST pass Template's Zod schema.
*   **Version Safety**: If a template is missing/invalid, the command is rejected immediately.

## 5. Request-Response Correlation
*   **UUIDs**: Every request has a unique ID.
*   **Deadlines**: Every request has a strict Timeout.
*   **Timeout Behavior**:
    *   Reject the Promise.
    *   Emit `command:timeout`.
    *   Do **NOT** automatically mark device as OFFLINE (HealthChecker does that).

## 6. Forbidden Patterns
*   ❌ **No Direct DB Writes** (except initialization).
*   ❌ **No Direct Socket.io Access** (Use EventBus).
*   ❌ **No "Smart" Logic** inside drivers (keep them dumb).

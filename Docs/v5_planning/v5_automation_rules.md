# Hydroponics v5 - Automation Domain Rules (The Constitution)

**Status**: Final
**Scope**: `src/modules/automation`

## 1. Automation Engine (XState)
*   **Single Source of Truth**: `AutomationEngine` is the ONLY component that executes logic. No hidden scripts in other modules.
*   **State Machine**: Uses **XState** for state management (`IDLE`, `RUNNING`, `PAUSED`, `ERROR`).
*   **Non-Blocking**: The Engine is asynchronous. It does NOT block the Event Loop, even during `WAIT` blocks (uses `setTimeout` or Scheduler, never `Atomics.wait`).

## 2. Execution Context (Memory)
*   **Isolation**: Each `ExecutionSession` has its own isolated Context (`variables`, `stepCount`). Variables do not leak between sessions.
*   **Read-Only Hardware**: The Context contains a *snapshot* of hardware state (`devices`). The Engine reads from this snapshot but writes ONLY via commands to `HardwareService`.
*   **Serializable**: The Context must be fully serializable (JSON) to support persistence during pauses or errors.

## 3. Blocks (The Logic)
*   **Stateless**: Block Executors are pure functions or stateless classes. They accept `Context` + `Params` and return `Result`. They do NOT hold internal state.
*   **Atomic**: One block does one thing. A `SENSOR_READ` block must NOT also trigger a pump.
*   **Timeout**: Every block has a maximum execution time (e.g., 5s). If it hangs, the Engine forcibly terminates it.

## 4. Events & Observability
*   **Granularity**: The Engine emits events for every step: `BLOCK_START`, `BLOCK_END`, `VAR_UPDATE`.
*   **No Silent Failures**: A block error generates an `ERROR` event. If no `ERROR_HANDLER` block is present, the session halts.
*   **Real-time**: All events are sent to the EventBus to allow the Frontend to visualize execution in real-time.

## 5. Constraints (Forbidden)
*   ❌ **NO Direct Hardware Access**: The Engine NEVER calls `SerialPort.write`. It calls `HardwareService.sendCommand`.
*   ❌ **NO Infinite Loops**: `LOOP` blocks must have a safety fuse (e.g., max 1000 iterations) to prevent system freeze.
*   ❌ **NO Eval**: Usage of `eval()` for expression evaluation is strictly forbidden. Use a safe parser (e.g., `mathjs` or `filtrex`).

## 6. Persistence
*   **Checkpointing**: For long-running processes (e.g., "Wait 1 hour"), state is saved to DB to survive server restarts.

## 7. Execution Guarantees (Critical)
*   **Deterministic Step Engine**: Execution is strictly sequential. One block completes fully BEFORE the next one is selected. No parallel or overlapping execution (critical for `WAIT`, `HTTP`, `SENSOR_READ`).
*   **Mandatory Await**: The Engine MUST always `await` `HardwareService.sendCommand()`. Fire-and-forget is forbidden to maintain XState synchronization.
*   **Error Propagation Consistency**:
    *   On block error: Generate `ERROR` event.
    *   If no `ERROR_HANDLER`: Session status -> `FAILED`.
    *   Context is serialized and saved.
    *   Execution stops deterministically (no partial continuations).

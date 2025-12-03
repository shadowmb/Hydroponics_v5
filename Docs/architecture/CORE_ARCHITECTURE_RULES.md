# AI Context & Logic Guide (Hydroponics v5)

> **PURPOSE**: This document is a "Cheat Sheet" for AI Agents. It defines the core architectural rules, state machines, and priority logic of the Scheduler. **Read this before modifying the Scheduler.**

## 1. Core Architecture (The Brain)

The system is a **Graph-based Execution Engine** managed by a **Priority Scheduler**.

### Hierarchy
1.  **Program** (`IProgram`): A daily schedule of Cycles. *Single Active Instance.*
2.  **Cycle** (`ICycle`): An ordered sequence of Flows.
3.  **Flow** (`IActionTemplate`): A graph of Blocks (Nodes).
4.  **Block** (`IBlock`): Atomic unit of execution (e.g., "Turn On Pump", "Wait").

### Key Files Map
| Component | Path | Responsibility |
| :--- | :--- | :--- |
| **Scheduler** | `backend/src/modules/scheduler/SchedulerService.ts` | The "Tick" loop (1min), State Machine, Priority Logic. |
| **Cycle Runner** | `backend/src/modules/scheduler/CycleManager.ts` | Executes a Cycle's flows sequentially. Handles persistence. |
| **Engine** | `backend/src/modules/automation/AutomationEngine.ts` | Executes a single Flow (XState machine). |
| **API** | `backend/src/api/controllers/ProgramController.ts` | Controls: Start, Stop, Pause, Delayed Start. |
| **UI** | `frontend/src/pages/Dashboard.tsx` | Main control interface (Agenda, Status). |

---

## 2. Logic & Rules

### A. Scheduler State Machine
The Scheduler (`SchedulerService`) has 3 exclusive states:

1.  **`STOPPED`** (Default):
    *   System is idle.
    *   Tick loop runs but **ignores** all schedules.
    *   *Transition to RUNNING*: via `startNow()`.
    *   *Transition to WAITING*: via `startAt(timestamp)`.

2.  **`WAITING_START`**:
    *   System is counting down to a specific timestamp.
    *   Tick loop checks time.
    *   *Transition to RUNNING*: Automatically when `now >= startTime`.
    *   *Transition to STOPPED*: via `stopScheduler()`.

3.  **`RUNNING`**:
    *   System is fully active.
    *   Tick loop executes Programs and Monitoring.
    *   *Transition to STOPPED*: via `stopScheduler()`.

### B. Priority Logic (The "Tick")
Every minute, the Scheduler evaluates what to run based on this strict hierarchy:

1.  **Manual Override** (Highest): If a user manually runs a flow, it blocks everything else.
2.  **Cycle (Program)** (High):
    *   If a Cycle is scheduled for `now`: **It Starts.**
    *   If a Monitoring flow is running: **It is Aborted** to make room for the Cycle.
3.  **Monitoring** (Low):
    *   Runs only if system is **IDLE**.
    *   If a Cycle is running: Monitoring is added to a **Queue**.

### C. The Queue (Conflict Resolution)
*   **Purpose**: Stores Monitoring flows that missed their slot because a Cycle was running.
*   **Behavior**:
    *   **Deduplication**: If `Sensor Read` is already in queue, don't add it again.
    *   **Drain**: When a Cycle finishes, the Scheduler immediately drains the Queue (runs pending monitoring tasks).

---

## 3. Critical Constraints (DO NOT BREAK)

1.  **Single Active Program**: Only ONE Program can be `isActive: true` in the DB. The Backend (`ProgramRepository`) enforces this.
2.  **Soft Delete**: Never physically delete records. Set `deletedAt`.
3.  **No Auto-Start**: Loading a program (activating it) puts the Scheduler in `STOPPED`. User MUST explicitly Start.
4.  **JSON Templates**: Hardware definitions live in `backend/src/templates/`. Do not hardcode device capabilities.

## 4. Common Tasks

### How to Add a New State?
1.  Update `SchedulerService.ts`: `_state` type and `tick()` logic.
2.  Update `ProgramController.ts`: Expose state in `getSchedulerStatus`.
3.  Update `Dashboard.tsx`: Handle UI for new state.

### How to Debug Execution?
1.  Check `SchedulerService` logs for "Tick" and "State".
2.  Check `CycleManager` logs for sequence progression.
3.  Check `AutomationEngine` logs for Block execution.

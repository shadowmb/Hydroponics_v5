# Active Program Lifecycle Analysis

This document summarizes the exact implementation logic for Start, Stop, Pause, and Resume of the "Active Program" in Hydroponics v5, based on the current codebase.

## 1. Overview
The "Active Program" state is primarily managed by `ActiveProgramService.ts`, but the actual execution of tasks relies on `SchedulerService.ts`, `CycleManager.ts`, and `AutomationEngine.ts`.

| Action | Physical Effect? | Immediate? | Responsible Service |
| :--- | :--- | :--- | :--- |
| **START** | No (Logic only) | Yes | `ActiveProgramService` |
| **STOP** | **YES** (Safety Stop) | Yes | `ActiveProgramService` -> `CycleManager` -> `AutomationEngine` |
| **PAUSE** | **NO** (Logical only) | No (Current flow continues) | `ActiveProgramService` |
| **RESUME** | No (Restores state) | Yes | `ActiveProgramService` |

---

## 2. Detailed Mechanics

### ▶️ START (Loading / Initializing)
**File:** `ActiveProgramService.ts` -> `start()`

1.  **Status Update:** Sets `active.status = 'running'`.
2.  **Scheduling:** If `startTime` is set in the future, sets status to `'scheduled'` instead.
3.  **Error Clearing:** Resets any `failed` or `running` schedule items to `pending` (allows fresh retry).
4.  **Resume Handling:**
    *   If resuming from `paused`, calls `automation.resumeProgram()`.
    *   **Advanced Programs:** Triggers an immediate "Force Check" in `SchedulerService` (unless `resumeStrategy` is 'resume_flow').

### ⏹️ STOP (Hard Stop & Safety)
**File:** `ActiveProgramService.ts` -> `stop()`

1.  **Status Update:** Sets `active.status = 'stopped'`.
2.  **Cycle Termination:** Calls `cycleManager.stopCycle()`.
    *   **Chain Reaction:** `CycleManager` calls `automation.stopProgram()`.
    *   **Hardware Safety:** `AutomationEngine` transitions to `stopped` state. This triggers the **`cleanupResources`** method, which explicitly reverts any "Resource Locked" actuators (e.g., pumps, valves) to their safe/initial state.
3.  **State Reset:**
    *   Resets all schedule items to `pending`.
    *   Resets all Windows (Advanced Mode) to `pending`.
    *   Clears `triggerCounts` and `currentFlowSessionId`.

### ⏸️ PAUSE (Logical Freeze)
**File:** `ActiveProgramService.ts` -> `pause()`

1.  **Status Update:** Sets `active.status = 'paused'`.
2.  **Limit:** **Does NOT call** `automation.pauseProgram()` or `cycleManager.pause()`.
    *   **Implication:** If a flow is currently running (e.g., "Irrigate 10 mins"), it **will continue to run** until completion or error.
    *   **Impact:** "Pause" prevents *new* cycles/windows from starting (handled by `SchedulerService` checks), but does not interrupt *current* hardware operations.

### ⏯️ RESUME (Context Aware)
**File:** `ActiveProgramService.ts` -> `start()` (Re-entry)

1.  **Context Detection:** Calculates "missed" time windows while paused.
2.  **User Decision:** If windows expired, asks user for strategy:
    *   `skip_expired`: Marks missed windows as skipped.
    *   `run_expired`: Forces triggered logic calculation for missed windows.
    *   `stop_program`: Aborts.
    *   `resume_flow`: Continues without logic re-eval (used when flow was actually running).
3.  **Execution:** Restores status to `'running'` and triggers `SchedulerService`.

---

## 3. Key Findings for Refactoring

1.  **Pause Inconsistency:** The current "Pause" is not a "Hard Pause". Actuators keep running. Refactoring should introduce `cycleManager.pauseCycle()` which triggers `automation.pauseProgram()`.
2.  **Monolithic Service:** `ActiveProgramService` handles DB state, Scheduling logic, and Resume complexities. Separating these concerns (e.g., `ProgramStateService`, `ProgramControlService`) would be beneficial.
3.  **Resume Complexity:** The resume logic is heavily intertwined with the "start" method, making it hard to test.

## 4. File Map
*   **State Control:** `backend/src/modules/scheduler/ActiveProgramService.ts`
*   **Execution Loop:** `backend/src/modules/scheduler/SchedulerService.ts`
*   **Sequential Logic:** `backend/src/modules/scheduler/CycleManager.ts`
*   **Hardware Execution:** `backend/src/modules/automation/AutomationEngine.ts`

# Task: Propagate Rich Execution Context to Logic and UI

## Status
- [x] Initial Research & Schema Analysis
- [x] Backend: Update `TriggerEvaluator` to capture rich context (Trigger Index & Condition)
- [x] Backend: Update `CycleManager` to accept and store rich context in `CycleSession` (Verified usage of generic context provided by TriggerEvaluator)
- [x] Backend: Update `AutomationEngine` snapshot to include `CycleSession` context (Verified `loadProgram` persistence of overrides)
- [x] Backend: Update `/api/automation/status` endpoint to expose this context (Verified it calls `getSnapshot`)
- [x] Frontend: Update `RunningProgramCard` to display Trigger Index and Condition

## Problem
Currently, the `RunningProgramCard` UI displays generic information (e.g., "Active Flow") and misses critical details like:
1.  **Which trigger fired?** (e.g., "Trigger #1")
2.  **Why did it fire?** (e.g., "Humidity (35%) < 40%")
3.  **What flow is running?** (Correct Flow Name instead of generic ID)

This information exists in `TriggerEvaluator` logs but is lost during the handoff to `CycleManager` -> `ExecutionSession` -> `UI`.

## Architecture Analysis
1.  **Source:** `TriggerEvaluator.ts` evaluates conditions and knows exactly *why* execution is starting.
2.  **Carrier:** `CycleSession` (via `CycleManager`) is the wrapper for a "Logical Unit of Work" (Trigger -> Flows). It has a `context` field.
3.  **Destination:** `RunningProgramCard.tsx` polls `/api/automation/status`.

## Plan
1.  **Rich Context Structure:** Define a standard object for "Execution Reason".
    ```typescript
    interface ExecutionReason {
        type: 'TRIGGER' | 'FALLBACK' | 'MANUAL' | 'SCHEDULE';
        summary: string; // "Trigger #1: Humidity < 40%"
        details?: {
            triggerIndex?: number;
            triggerId?: string;
            condition?: string;
            sensorValue?: any;
        }
    }
    ```

2.  **Backend Implementation:**
    - Modify `TriggerEvaluator.evaluateWindow`: When a trigger matches, construct this `ExecutionReason` object and pass it to `cycleManager.startCycle(..., context)`.
    - Modify `CycleManager.startCycle`: Ensure it merges this context into the `CycleSession`.
    - Modify `AutomationController.getSystemStatus` (or `AutomationEngine.getSnapshot`): Ensure it retrieves the *active cycle's* context if available and exposes it.

3.  **Frontend Implementation:**
    - Parse this new `reason` object in `RunningProgramCard`.
    - Display rich text: "Executing: Trigger #1 (Humidity < 40%)".

## Dependencies
- `TriggerEvaluator.ts`
- `CycleManager.ts`
- `CycleSession.schema.ts`
- `AutomationController.ts`
- `RunningProgramCard.tsx`

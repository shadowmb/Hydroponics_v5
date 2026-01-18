# Task: UI Execution Details Display

**Status:** In Progress
**Objective:** Update the `RunningProgramCard` to correctly display the active flow name and trigger details (index/summary) based on the `dbActiveSession` data structure.

## Context
We have confirmed via `temp.md` that the backend correctly propagates execution context into the `ExecutionSession`.
- `programId`: matches the flow ID (e.g., `polivane_test`).
- `context.variables._triggerSummary`: Human readable reason (e.g., "Trigger #1: Humidity < 40").
- `context.variables._triggerIndex`: The specific trigger index.

## Implementation Plan

### ✅ Phase 1: Planning (Completed)
- [x] Analyze data structure in `temp.md`.
- [x] Identify mapping logic.

### ✅ Phase 2: Implementation (Frontend)
- [x] **Step 2.1:** Update `RunningProgramCard.tsx` logic.
    -   Ensure `executionStatus.dbActiveSession` is the primary source.
    -   Extract `executionStatus.dbActiveSession.context.variables`.
    -   Look for `_triggerSummary`, `_triggerIndex` inside `variables`.
    -   Resolve `flowName` by finding the flow in `fullProgram.flows` that matches `dbActiveSession.programId`.
- [x] **Step 2.2:** Verify UI Rendering.
    -   Ensure "Executing" label shows "Trigger #{index}: {flowName}" or similar.
    -   Handle fallback if no trigger info is present (Manual run).

### Phase 3: Verification
- [ ] Verify with a live test or simulation.

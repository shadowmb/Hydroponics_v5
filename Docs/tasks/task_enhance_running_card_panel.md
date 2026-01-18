# Task: Enhance Running Program Card - Action Panel

## 🎯 Objective
Upgrade the `RunningProgramCard` UI by adding a persistent, attached "Action Panel" below the active window row. This panel will display critical real-time information (Next Check Timer or Running Trigger details) without cluttering the main header.

## 📋 Requirements

### 1. UI Structure (The Attached Panel)
- **Concept:** Split the active row into two parts:
  1.  **Header (Top):** Green theme, Name, Time range, Status Badge (Existing logic).
  2.  **Action Panel (Bottom):** Darker background, smaller text, attached directly to the header (no borders between them).
- **Visibility:** The Action Panel is visible **ONLY** for the `ACTIVE` item.
- **Layout:**
  - **Left Side:** Active Trigger Info (if any).
  - **Right Side:** Next Check Timer & Force Check Button.

### 2. Logic Features

#### A. Next Check Timer (Idle State)
- **Data Source:** `activeProgram.nextCheckTime` (timestamp).
- **Display:** "Next check: MM:SS".
- **Action:** A "Force Check" button (Refresh Icon) next to the timer.
- **Logic:** Calls `activeProgramService.forceCheck()`.

#### B. Active Trigger Indicator (Execution State)
- **Data Source:** Need to derive from `activeProgram.currentTriggerIndex` and `activeProgram.currentFlowId`.
- **Constraint:** If a trigger is currently executing (not just checking), show its details.
- **Display Format:** `⚡ #<Index> → 🌊 <FlowName>`
- **Logic:**
  - Find Trigger Number = `currentTriggerIndex + 1`.
  - Find Flow Name = Lookup `currentFlowId` in `program.flows`.

## 🛠 Execution Plan

### Phase 1: Data Preparation & Types
1.  **Analyze Data:** Inspect the current `activeSession` and `fullProgram` objects to ensure we have access to:
    - `nextCheckTime`
    - `currentTriggerIndex` / `currentAction`
    - `currentFlowId`
2.  **Type Updates:** Update `VisualItem` interface to include these new optional fields (`nextCheck`, `triggerInfo`).

### Phase 2: UI Implementation (The Action Panel)
1.  **Modify Render Loop:**
    - Inside the mapping logic, calculate `nextCheckTime` and `triggerInfo` for the active item.
    - Inside the return JSX, split the active row rendering.
2.  **Build Panel Component:**
    - Create the "Action Panel" div structure.
    - Style it to look "inset" or "attached" (e.g., `bg-green-950/30`, `border-t-0`).
3.  **Implement Timer:**
    - Add a countdown logic (using `date-fns` or custom hook) for `nextCheckTime`.
4.  **Implement Trigger Display:**
    - Render the `⚡ #1 → 🌊 Flow` layout when active.

### Phase 3: Functionality
1.  **Force Check:** Wire up the refresh button to the `forceCheck` API function.
2.  **Testing:**
    - Verify Idle State: Timer shows up.
    - Verify Active State: Trigger info shows up.

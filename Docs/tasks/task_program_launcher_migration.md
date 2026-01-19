# Task: Program Launcher Migration & Configuration Flow

## Objective
Move the "Program Launcher" functionality from the Dashboard Widget to the main `ActiveProgramPage`. Ensure that loading a program triggers the Configuration Wizard instead of immediately starting the program.

## Changes

### 1. Revert Dashboard Widget (`ActiveProgramDashboard.tsx`)
- **Goal:** Simplify the empty state.
- **Content:**
    - Message: "No active program loaded."
    - Action: Button "Go to Active Program" linking to `/active-program`.
- **Reason:** The dashboard should be for monitoring, not complex setup.

### 2. Enhance Active Program Page (`ActiveProgramPage.tsx`)
- **Goal:** Replace the simple "No active program" text with the "Launcher" UI.
- **New Components:**
    - **Program Selector:** Dropdown to choose a program.
    - **Preview Card:** Shows Name, Type, Description, and Schedule Preview.
    - **Action Button:** "Load & Configure" (Primary).
- **Logic:**
    1.  Fetch available programs if no active program is running.
    2.  User selects a program.
    3.  User clicks "Load & Configure".
    4.  Call `activeProgramService.load(id)`.
    5.  Refresh current page state.
    6.  The existing page logic detects `status === 'loaded'` and automatically renders the `ActiveProgramWizard` (or Advanced Wizard).

## Technical Implementation

### ActiveProgramPage.tsx
- Import `Select`, `Card`, `Button`, `Badge` components.
- Import `programService` (or use `fetch('/api/programs')`).
- **State:** `availablePrograms`, `selectedProgramId`, `isLoading`.
- **Render:**
    - If `!activeProgram`: Render "Launcher UI".
    - Else: Render existing Wizard/Manager components (No changes needed to Wizard logic).

## User Workflow
1.  User goes to `/active-program` (or clicks from Dashboard).
2.   Sees "Select Program to Start".
3.  Selects "Summer pH".
4.  Clicks "Load & Configure".
5.  Screen refreshes -> specific "Configuration Wizard" appears (asking for variables, tolerances).
6.  User fills config -> Clicks "Start" (handled by Wizard).

## Verification
- Dashboard empty state is clean.
- `ActiveProgramPage` shows selector.
- Clicking "Load" correctly transitions to the Configuration Wizard.

# Task: Dashboard Program Launcher (Empty State Enhancements)

## Objective
Transform the "Empty State" of the `ActiveProgramDashboard` into a functional "Program Launcher". This allows users to select, preview, and start automation programs directly from the dashboard without navigating to the Programs page.

## Requirements

### 1. Data Fetching
- Fetch the list of all available programs (`programService.getAll()`) upon component mount if no active program is running.
- Store this list locally in the component state.

### 2. UI Components
- **Selector:** A dropdown (`Select` or `Combobox`) to choose a program from the list.
- **Preview Card:** A simplified view of the selected program.
    - **Header:** Program Name + Type Badge (ADVANCED/BASIC).
    - **Description:** Program description text.
    - **Timeline:** A simple list of Windows (Advanced) or Schedule items (Basic), showing only `StartTime` and `Name`.
    - **Exclusions:** Do not show triggers, sensors, or flow logic details.
- **Action:** A primary "Start Program" button.

### 3. Interaction Flow
1.  User sees "No active program" card.
2.  User clicks the Dropdown -> Selects "Summer Routine".
3.  UI reveals the **Preview Card** with 08:00, 12:00, 18:00 schedule.
4.  User clicks **Start Program**.
5.  System calls API to start.
6.  UI refreshes to show the running active program state.

## Implementation Steps

### Step 1: Services & Imports
- Update imports in `ActiveProgramDashboard.tsx` to include `Select`, `SelectItem`, `SelectContent`, `SelectTrigger`, `SelectValue` (from shadcn/ui).
- Ensure `programService` is imported to fetch the list.

### Step 2: State Management
- Add state for `availablePrograms` (Array).
- Add state for `selectedProgramId` (String).
- Add state for `starting` (Boolean, for loading spinner).

### Step 3: "Empty State" Refactoring
- Replace the current "No active program" card content with the new Launcher Layout.
- **Header:** "Start Automation"
- **Body:**
    - Dropdown used for selection.
    - Conditional rendering: If `selectedProgramId` is set -> Show `ProgramPreview` block.
    - `ProgramPreview` block renders the simplified timeline.
- **Footer:** "Start" button (disabled if no selection).

### Step 4: Logic Integration
- Implement `handleStartProgram`:
    - Call `activeProgramService.start(selectedProgramId)`.
    - Handle success (toast, refresh) and error (toast).

## Visual Reference (Mockup)
```markdown
+-------------------------------------------------------------+
|  🚀 Start Automation                                        |
|-------------------------------------------------------------|
|  [ Select a Program... (Dropdown) ▼ ]                       |
|                                                             |
|  +-------------------------------------------------------+  |
|  |  📌 Spring pH Control [ADVANCED]                      |  |
|  |  "Daily routine for pH and Nutrients."                |  |
|  |                                                       |  |
|  |  🕒 Schedule:                                         |  |
|  |  • 08:00 - Morning                                    |  |
|  |  • 20:00 - Evening                                    |  |
|  +-------------------------------------------------------+  |
|                                                             |
|               [ ▶ START PROGRAM ]                           |
+-------------------------------------------------------------+
```

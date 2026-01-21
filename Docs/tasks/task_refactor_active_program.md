
# Task: Refactor Active Program State Management (Single Source of Truth)

This task aims to eliminate duplicate data fetching and state management for the Active Program by centralizing it in the Zustand store. This ensures UI synchronization and reduces network traffic.

## Phase 1: Foundation (Store & Sync)
- [ ] **Extend Zustand Store** <!-- id: 1 -->
    - Update `frontend/src/core/useStore.ts` to include `activeProgram`: `IActiveProgram | null`.
    - Add actions: `setActiveProgram`, `updateActiveProgram` (for partial updates if needed).
- [ ] **Create Headless Sync Hook** <!-- id: 2 -->
    - Create `frontend/src/hooks/useActiveProgramSync.ts`.
    - Implement `fetchActiveProgram` logic (single fetch on mount).
    - Implement Socket Event Listeners:
        - `active:program_updated` -> Update Store
        - `program:paused` -> Refresh/Update Store
        - `program:resumed` -> Refresh/Update Store
        - `active:program_started` -> Refresh/Update Store
        - `active:program_stopped` -> Set Store to null
        - `active:window_completed` -> Refresh/Update Store (optional, for window status)
    - Ensure idempotent listeners (cleanup on unmount).
- [ ] **Integrate into Layout** <!-- id: 3 -->
    - Update `frontend/src/components/layout/Layout.tsx`.
    - Call `useActiveProgramSync()` at the top level.

## Phase 2: Component Migration
- [ ] **Refactor Global Pause Timer** <!-- id: 4 -->
    - Update `frontend/src/components/activeProgram/GlobalPauseTimer.tsx`.
    - Remove local `state`, `fetch`, and `socket` listeners.
    - Connect to `useStore` (use Selector for performance).
- [ ] **Refactor Active Program Dashboard** <!-- id: 5 -->
    - Update `frontend/src/components/dashboard/ActiveProgramDashboard.tsx`.
    - Remove local `state`, `fetch`, and `socket` listeners.
    - Connect to `useStore`.
- [ ] **Refactor Advanced Program Manager (Main Page)** <!-- id: 6 -->
    - Update `frontend/src/components/activeProgram/AdvancedProgramManager.tsx`.
    - Remove local `fetch` calls.
    - Connect to `useStore`.
    - *Note:* This component is complex. Ensure local UI states (like expanding sections) are preserved.

## Phase 3: Verification
- [ ] **Verify Start/Stop Flow** <!-- id: 7 -->
    - Start a program -> Check if Dashboard, Timer, and Page update immediately.
- [ ] **Verify Pause/Resume Flow** <!-- id: 8 -->
    - Pause program -> Check global timer appearance and dashboard badge.
    - Resume program -> Check global timer disappearance.
- [ ] **Verify Page Navigation** <!-- id: 9 -->
    - Navigate away and back -> Ensure data is instant (no loading spinner).

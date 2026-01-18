# Task: Enhance RunningProgramCard Timeline & Statuses

## Status
- [ ] Logic Update: Separate `skipped` vs `completed` status.
- [ ] UI Update: Implement Purple theme for `skipped` items.
- [ ] UI Update: Add explicit right-side status labels (ACTIVE, NEXT, DONE, SKIPPED).
- [ ] Verification: Check against "Advanced" program data structure.

## Context
The `RunningProgramCard` currently merges `skipped` status into `completed`, losing vital information. We need to distinguish them visually, identifying `skipped` items with a Purple color scheme to match the 'Active Programs' detailed view.

## Implementation Steps

1.  **Update `RunningProgramCard.tsx` Logic**:
    -   Expand `VisualItem` interface to include `'skipped'`.
    -   In `Advanced` mapping: Check `windowsState` for `'skipped'` and map directly.
    -   In `Basic` mapping: Check `item.status` for `'skipped'` and map directly.

2.  **Update `RunningProgramCard.tsx` UI**:
    -   Add CSS classes for `'skipped'` status (Purple background/text).
    -   Ensure `'completed'` uses Green (Emerald).
    -   Render text labels on the right side of the timeline row.

3.  **Refine Next Logic**:
    -   Ensure 'Next' logic still picks the first 'pending' item correctly.

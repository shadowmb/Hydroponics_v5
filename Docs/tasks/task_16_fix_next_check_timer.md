# Task 16: Fix Next Check Timer Visibility

**Status:** [ ] To Do
**Branch:** `feat/unconditional-triggers` (Hotfix)

## Overview
The "Next Check" timer appears immediately after midnight reset for all windows, showing "CHECK: Now" (overdue), because the windows are reset to `pending` but retain their old `lastCheck` timestamp. This is confusing as the windows are not actually active.

## Plan
- [x] **1. Fix `NextCheckTimer.tsx`:**
    - [x] Update `isVisible` logic to require `status === 'active'` (exclude 'pending').

## Verification
- [x] **2. User Verification:**
    - [x] Verify timer disappears when window is 'pending' (e.g. after reset).
    - [x] Verify timer appears when window becomes 'active' (inside time window).

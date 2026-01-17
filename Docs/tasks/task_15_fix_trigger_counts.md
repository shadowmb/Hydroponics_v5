# Task 15: Fix Trigger Counts Reset

**Status:** [ ] To Do
**Branch:** `feat/unconditional-triggers` (Hotfix)

## Overview
Trigger execution counts (`triggerCounts`) are not being reset when:
1.  The day rolls over (New Day).
2.  The program is stopped manually.

This causes "Count Limited" triggers to remain "maxed out" (e.g., 3/3) even after a new day starts or the program is restarted, preventing them from running again.

## Plan
- [x] **1. Fix `SchedulerService.ts`:**
    - [x] Add `state.triggerCounts = new Map();` in the "New Day Detected" block.
- [x] **2. Fix `ActiveProgramService.ts`:**
    - [x] Add `ws.triggerCounts = new Map();` in the `stop()` method.
- [x] **3. Analysis of other reset points:**
    - [x] Analyze "Skip Expired" logic. (Result: Preserves state, intentional).
    - [x] Analyze "ActiveProgramService.restoreWindow". (Result: Preserves state, intentional for resume).

## Verification
- [x] **4. User Verification:**
    - [x] Verify counts reset on New Day (Simulation).
    - [x] Verify counts reset on Stop/Start.

# Task 14: Fix Simulation Time Logic

**Status:** [ ] To Do
**Branch:** `feat/unconditional-triggers` (Reusing current branch as it's a hotfix)

## Overview
Periodic checks (intervals) in `SchedulerService` fail to trigger when time simulation is active and set to a future date. This is because `shouldCheck` uses `Date.now()` (real time) to calculate elapsed time against a future `lastCheck` timestamp, resulting in negative elapsed time.

## Plan
- [x] **1. Fix `SchedulerService.ts`:**
    - [x] Replace `Date.now()` with `timeService.now().getTime()` in `shouldCheck` method.
    - [x] Verify no other instances of `Date.now()` are used for logic affecting simulation.

## Verification
- [x] **2. User Verification:**
    - [x] Activate Simulation (jump to future).
    - [x] Confirm periodic window checks occur as expected in logs.

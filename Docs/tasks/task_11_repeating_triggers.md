# Task 11: Repeating Triggers Implementation

**Objective:** Allow triggers in Advanced Programs (specifically with 'Continue' behavior) to be executed multiple times within a single window session using modes: Once, Count, Always.

## Status Legend
- [ ] Todo
- [/] In Progress
- [x] Done

## 1. Analysis & Design
- [x] Define Repeat Modes (Once, Count, Always) <!-- id: 1 -->
- [x] Schema Design (ITrigger interface updates) <!-- id: 2 -->

## 2. Backend Implementation
- [x] Update `Program.schema.ts` (add `repeatMode`, `repeatCount`) <!-- id: 3 -->
- [x] Update `ActiveProgram.schema.ts` (add `triggerCounts` to WindowState) <!-- id: 4 -->
- [x] Update `TriggerEvaluator.ts` logic (Filter pending based on mode & count) <!-- id: 5 -->
- [x] Update `SchedulerService.ts` logic (Increment limits on completion) <!-- id: 6 -->

## 3. Frontend Implementation
- [x] Update `TriggerModal.tsx` (TriggerWizard - Creation Mode) <!-- id: 7 -->
- [x] Update `AdvancedProgramManager.tsx` (Runtime Trigger Editor) <!-- id: 8 -->

## 4. Verification
- [ ] Test "Once" mode (Regression test) <!-- id: 9 -->
- [ ] Test "Count (N)" mode <!-- id: 10 -->
- [ ] Test "Always" mode <!-- id: 11 -->

👉 **See [Verification Walkthrough](../walkthroughs/repeating_triggers_verification.md)**

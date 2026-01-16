# Verification: Repeating Triggers

This walkthrough validates the new "Repetition Logic" for triggers in Advanced Programs.

## Prerequisite
- Ensure the backend and frontend are running.
- Have a simulated sensor (or real one) that you can manipulate to satisfy trigger conditions.

## Test Case 1: Count Limited Trigger
**Goal:** Verify a trigger runs exactly N times.

1.  **Create Program:**
    - Type: Advanced
    - Window: "Test Window", Check Interval: 1 min.
2.  **Add Trigger:**
    - Condition: `TestSensor > 10`
    - Action: Any quick flow (e.g. Log message).
    - **Behavior:** `Continue` (allows multiple runs in parallel or sequence) or `Break` (stops check, but repeats next time).
    - **Repeat Mode:** `Count`
    - **Repeat Limit:** `3`
3.  **Run Program.**
    - Ensure `TestSensor > 10`.
4.  **Observe:**
    - Trigger should fire at Minute 0. Log count: 1. Badge: "Count: 1 / 3"
    - Trigger should fire at Minute 1. Log count: 2. Badge: "Count: 2 / 3"
    - Trigger should fire at Minute 2. Log count: 3. Badge: "Count: 3 / 3" -> "✓ Executed"
    - Trigger should NOT fire at Minute 3.

## Test Case 2: Always Trigger
**Goal:** Verify a trigger runs indefinitely while condition matches.

1.  **Edit Program (or Create New):**
    - Change Trigger to **Repeat Mode:** `Always`.
2.  **Run Program.**
3.  **Observe:**
    - The trigger badge should show "🔄 Always".
    - It should execute every check interval (e.g. every minute) as long as `TestSensor > 10`.
    - It should NEVER eventually show "✓ Executed".

## Test Case 3: Runtime Editing
**Goal:** Verify we can change the logic while the program is running.

1.  **Start** a program with a trigger set to **Once**.
2.  **Trigger it:** Let it execute once. Status becomes "✓ Executed".
3.  **Edit:**
    - Click the Edit (pencil) icon on the active trigger.
    - Change **Repeat Mode** to `Count` (Limit: 2).
    - **Save.**
4.  **Observe:**
    - The "✓ Executed" status should disappear (if internal logic clears it? *Note: Logic check needed*).
    - *Correction:* The backend `triggersExecuted` list contains the ID. If we change mode to `Count`, we need to ensure the backend re-evaluates.
    - **Verification Step:** Check if increasing the count allows it to run again.
    - Badge should update to "Count: 1 / 2" (assuming historical count is preserved or 1).
5.  **Trigger it again:** It should execute one more time, then become "✓ Executed" again.

## Notes on Implementation
- **Visuals:** Look for the new blue badges in the "Time Windows" live view card.
- **Safety:** "Always" mode with short intervals can spam logs/actions. Use with caution.

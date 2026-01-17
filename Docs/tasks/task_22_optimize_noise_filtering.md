# Task 22: Optimize Noise Filtering UI & Defaults

**Status:** Completed
**Assignee:** Antigravity
**Created:** 2026-01-17

## 🎯 Objective
Improve the reliability and user experience of sensor readings by enforcing "Safe by Default" noise filtering settings while providing transparent and easy-to-use overrides in the UI.

## 🔍 Context
Ultrasonic sensors in hydroponics (water tanks) are susceptible to noise from ripples and echoes. The current system supports "Median Filtering" via `sampling` config, but:
1.  Defaults might be suboptimal (too low).
2.  The UI allows editing but doesn't offer quick "Disable" or "Restore Recommended" actions, making it harder for users to debug or revert to safe settings.

## 🛠️ Implementation Strategy ("Safe by Default")
1.  **Backend:** Update sensor templates (specifically `dfrobot_a02yyuw.json`) to use `count: 5` and `delayMs: 50` as the robust default.
2.  **Frontend:** Update `DeviceValidationSettings.tsx` to:
    *   Show current status (Filtering Active vs Raw).
    *   Add a **"Disable Filtering"** button (for debugging 1:1 raw signal).
    *   Add a **"Restore Recommended"** button (to reload template defaults).

## 📋 Action Items

### 1. Configuration (Templates)
- [x] **Review & Update Defaults:**
    - [x] `backend/config/devices/water/sensors/dfrobot_a02yyuw.json` -> Set `count: 5`, `delayMs: 50`.
    - [x] Check other relevant sensors (pH, EC) if they need specific defaults.

### 2. Frontend Development
- [x] **Modify `DeviceValidationSettings.tsx`:**
    - [x] Import `RotateCcw` (Restore) and `PowerOff` (Disable) icons.
    - [x] Implement `handleDisable()`: Sets `count: 1`, `delayMs: 0`.
    - [x] Implement `handleRestore()`: Sets `count: defaults.count`, `delayMs: defaults.delayMs`.
    - [x] Add visual badge for "Filtering Active" vs "Raw Signal".
    - [x] Add the control buttons to the UI layout.

### 3. Verification
- [x] **Test Flow:**
    - Open Device Test Dialog.
    - Verify defaults are loaded.
    - Click "Disable" -> Verify inputs change to 1/0.
    - Click "Restore" -> Verify inputs return to defaults.
    - Save and check Backend logs for correct execution.

## 📝 Notes
- User previously toggled `count` between 3 and 5. We will standardize on **5** for safety as agreed in analysis.

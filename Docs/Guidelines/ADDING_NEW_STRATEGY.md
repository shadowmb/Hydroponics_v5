# How to Add a New Hardware Strategy

This guide describes the complete process of adding a new Control Strategy (Sensor or Actuator) to the Hydroponics v5 system.

## Overview of the Architecture

The system uses a **Strategy Pattern** to decouple the "What" (Logic) from the "How" (Hardware).
The lifecycle is controlled by the **Strategy Registry**.

| Layer | Component | Responsibility |
|-------|-----------|----------------|
| **Core** | `StrategyRegistry.ts` | Defines the strategy, units, and calibration requirements. |
| **UI** | `PropertiesPanel.tsx` | Auto-generates UI options based on the Registry. |
| **UI** | `DynamicWizard.tsx` | Handles calibration (if defined in Registry). |
| **Backend** | `ActuatorSetBlockExecutor` | Executes the logic (Pulse, Dose, etc.). |

---

## Step-by-Step Implementation

### Step 1: Register the Strategy
**File:** `shared/strategies/StrategyRegistry.ts`

Add your new strategy to the `STRATEGIES` object.

```typescript
'ph_balancing': {
    id: 'ph_balancing',
    label: 'pH Balancing (Auto)',
    type: 'ACTUATOR',
    description: 'Doses Acid/Base to reach target pH.',
    inputUnit: 'ph',      // The target value unit
    outputUnit: 'ml',     // The actuator action unit
    calibration: {        // Optional: If hardware needs calibration
        calibrationKey: 'ph_pump_curve',
        component: 'MultiPointTable', 
        xLabel: 'pH Error',
        yLabel: 'Dose Amount (ml)'
    }
}
```

### Step 2: Implement Backend Logic
**File:** `backend/src/modules/automation/blocks/ActuatorSetBlockExecutor.ts` (or `SensorReadBlockExecutor.ts`)

Update the execution logic to handle your new Strategy ID.

*   **Actuators:** Handle the `action` and calculate duration/state using `device.config.calibrations`.
*   **Sensors:** Transform the raw reading using the calibration data.

> **Future Goal:** We aim to move this logic into isolated "Handler" classes mapped in the Registry, replacing the large switch statements.

### Step 3: Frontend Visibility (Optional)
**File:** `frontend/src/components/editor/node-definitions.ts` & `PropertiesPanel.tsx`

If your strategy requires specific fields (like "Target pH"), make sure they are:
1.  Defined in `block-definitions.ts`.
2.  Visible in `PropertiesPanel.tsx` (using logic checking `formData.strategy`).

### Step 4: Validation
**File:** `shared/strategies/StrategyRegistry.ts`

Ensure `validateBlockStrategy` covers your use case.
*   Does it check if the device has the required calibration?
*   Does it check if the variable unit matches the strategy output?

---

## Common Patterns

### Dosing Pump (Volumetric)
*   **Strategy:** `volumetric_flow`
*   **Calibration:** `flowRate` (ml/sec)
*   **Logic:** `Duration = Amount / FlowRate`

### PWM Fan (Temperature Control)
*   **Strategy:** `pid_temp`
*   **Calibration:** PID Constants
*   **Logic:** `PID(Target - Current) -> PWM Duty Cycle`

---

## checklist
- [ ] Added to `StrategyRegistry.ts`
- [ ] Added/Updated Backend Executor Logic
- [ ] Verified UI Options appear in Editor
- [ ] Verified Validation works (Red error if uncalibrated)

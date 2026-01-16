# Implemention Plan - Refine Units and Actuator State

The goal is to eliminate logical conflicts in unit conversion (Sensors) and state reporting (Actuators) by making the database an unambiguous Source of Truth.

## User Review Required
> [!IMPORTANT]
> **Actuator Value Change:** For actuators (e.g., Dosing Pumps), `lastReading.value` will now strictly be `0` (OFF) or `1` (ON).
> Any flow rate or volume data calculated by strategies (e.g., 0.005 L) will be moved to `lastReading.details`.
> This ensures the UI always correctly displays ON/OFF status.

## Proposed Changes

### Backend Logic (`SensorProcessor.ts`)
#### [MODIFY] [SensorProcessor.ts](file:///c:/Projects/Hydroponics_v5/backend/src/modules/hardware/SensorProcessor.ts)
- Modify `processRawToBasic`:
    - **Sensors:** Ensure `smartResult.unit` (from strategy) takes precedence over `baseUnit`.
    - **Actuators:**
        - Check `if (device.type === 'ACTUATOR')`.
        - Force `val` (the reported value) to be `0` or `1`.
        - Force `unit` to be `'boolean'`.
        - Persist the original calculated value (e.g., flow rate) in `details`.

### Service Layer (`ConversionService.ts`)
#### [MODIFY] [ConversionService.ts](file:///c:/Projects/Hydroponics_v5/backend/src/services/conversion/ConversionService.ts)
- Review `convertSmart` to ensure it always returns the correct unit if the strategy dictates one.

## Verification Plan

### Automated/Manual Verification
1.  **Sensor Unit Verification:**
    - Configure a sensor with a conversion strategy that changes units (e.g., `tank_volume` mm -> L).
    - Trigger a read.
    - Inspect DB: `lastReading` should show `unit: 'L'`.
2.  **Actuator State Verification:**
    - Trigger `TEST_DOSING` (or similar command) for a pump.
    - Inspect DB: `lastReading` should show `value: 1` and `unit: 'boolean'`.
    - Check UI: Should show Green/ON.

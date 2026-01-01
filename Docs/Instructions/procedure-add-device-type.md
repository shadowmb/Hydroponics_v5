
# Procedure: Add New Device Type

## 1. Goal
Add a new sensor or actuator type to the Hydroponics v5 system so it can be selected in the UI, communicate with firmware, and report data.

## 2. Scope
*   **Included:** Creating the Device Driver (JSON), configuring metrics, and verifying UI availability.
*   **Excluded:** Implementing new firmware commands (see `procedure-add-firmware-command.md`).

## 3. Definitions & Dependencies
*   **Device Driver:** A JSON file in `backend/config/devices/` that defines capabilities and commands.
*   **Device Template:** The database representation of the driver, synced automatically on startup.
*   **Reference Schema:** `Docs/Reference/device-template-schema.md` - **Full definition of all fields.**
*   **Metric Config:** Frontend configuration (`frontend/src/config/MetricConfig.ts`) for charts and history.
*   **Firmware Command:** Low-level protocol command (e.g., `ANALOG`, `DHT_READ`) must already exist.

## 4. Steps (Algorithm)

### Step 1: Verify Firmware Support
1.  Check `Docs/Reference/firmware-commands.md`.
2.  Ensure a command exists for your hardware protocol (e.g., `ANALOG` for pH, `I2C_READ` for sensors).
3.  **If NO:** Stop. Go to `procedure-add-firmware-command.md`.

### Step 2: Create Device Driver
1.  Choose the correct folder based on **Environment** and **Type**:
    *   `backend/config/devices/water/sensors/`
    *   `backend/config/devices/water/actuators/`
    *   `backend/config/devices/air/sensors/`
    *   ... (light, power)
2.  Create a new file: `<device_id>.json`.
3.  Use `lowercase_underscores` for the filename.

**Template Reference:**
```json
{
    "id": "unique_device_id",          // REQUIRED: Must match filename (without .json)
    "name": "Human Readable Name",     // REQUIRED: Displayed in UI
    "category": "SENSOR",              // REQUIRED: SENSOR, ACTUATOR, or HYBRID
    "supportedStrategies": ["linear"], // REQUIRED: List of valid calibration strategies
    "capabilities": ["READ"],          // REQUIRED: List of supported commands
    "commands": {
        "READ": {                      // Must match a capability
            "hardwareCmd": "ANALOG",   // Must match firmware command
            "valuePath": "val",        // Key in firmware response
            "sourceUnit": "V",         // REQUIRED: Unit returned by hardware
            "outputs": [
                {
                    "key": "ph",       // REQUIRED: Must be an Allowed Key from UnitRegistry
                    "label": "pH",
                    "unit": "pH"       // Base Unit from UnitRegistry
                }
            ]
        }
    },
    "pins": [
        { "name": "Signal", "type": "ANALOG_IN" }
    ],
    "uiConfig": {
        "icon": "activity"             // Lucide icon name (lowercase)
        // NOTE: "category" is NO LONGER required here. It is inferred from the folder name.
    },
    "initialState": { "value": 0 }
}
```

**Advanced: Variants (Control Modes)**
For devices that support multiple control modes (e.g., a Pump that can be ON/OFF or PWM), use the `variants` array:

```json
"variants": [
    {
        "id": "relay",
        "label": "Relay Control",
        "description": "Simple ON/OFF control via Relay",
        "requirements": { "interface": "digital", "pin_count": { "digital": 1 } },
        "commands": { ... },
        "pins": [ { "name": "Control", "type": "DIGITAL_OUT" } ]
    },
    {
        "id": "pwm",
        "label": "PWM Control",
        "description": "Variable speed control",
        "requirements": { "interface": "pwm", "pin_count": { "pwm": 1 } },
        "commands": { ... },
        "pins": [ { "name": "PWM", "type": "PWM_OUT" } ]
    }
]
```

**Key Fields Explained:**
*   **`supportedStrategies`**: Defines which calibration wizards are available in the UI. See `backend/config/calibration_strategies.json` for IDs.
*   **`sourceUnit`**: The unit the *hardware* speaks. Backend uses this to normalize data.
*   **`conversionStrategy`**:
    *   **Omit** if the sensor returns the final value directly (e.g., DHT22 returns °C).
    *   **Include** if the sensor returns raw data (e.g., Analog 0-5V) that needs a formula to become the final value (e.g., pH).
*   **`outputs.key`**: MUST be a valid key from `Docs/Reference/units-and-metrics.md`.
> *   **Firmware:** Returns `{"val": 123}` -> **Config:** `"valuePath": "val"`
> *   **Firmware:** Returns `{"temp": 24}` -> **Config:** `"outputs": [{"key": "temp"}]`
>
> **Do NOT** use the metric name (e.g., `distance_mm`) if the firmware returns `distance`. The mapping happens in the UI, not here.

### Step 2.1: Define Calibration Strategies
Choose appropriate strategies from `backend/config/calibration_strategies.json`:

*   **Sensors:**
    *   `linear`: Standard y=mx+c (Analog sensors).
    *   `two_point_linear`: pH, EC, DO.
    *   `offset_only`: Temperature, Scale.
*   **Actuators:**
    *   `volumetric_flow`: Pumps, Dosers.
    *   `duration_position`: Motorized Valves.
    *   `range_linear`: Servos.

### Step 2.2: Special Considerations for Actuators
If you are adding an **ACTUATOR** (e.g., Pump, Fan, Light):

1.  **Capabilities:** Always include `"DIGITAL_WRITE"` in `capabilities`. This ensures the firmware includes the basic pin control logic, which is required for both direct connection and relay routing.
2.  **Commands:**
    *   **ON/OFF:** Map your command (e.g., `RELAY_SET`) to `DIGITAL_WRITE` if possible.
    *   **Parameters:** Use `state: "number"` (0 for OFF, 1 for ON) instead of `boolean`. Firmware parsers handle integers more reliably than booleans.
3.  **Example:**
    ```json
    "commands": {
        "RELAY_SET": {
            "hardwareCmd": "DIGITAL_WRITE",
            "params": { "state": "number" }
        }
    }
    ```

### Step 3: Configure Metrics (Frontend)
**Only if using a new metric type (e.g., "Wind Speed").**
1.  **Check `shared/UnitRegistry.ts`:** Ensure the new metric key is added to the `keys` array of the appropriate Unit Family.
2.  **Open `frontend/src/config/MetricConfig.ts`:**
3.  Add the new metric key to the `METRICS` object.
4.  **CRITICAL:** The `unit` in MetricConfig MUST match the **Base Unit** defined in `UnitRegistry` (unless client-side conversion is implemented).

### Step 4: Sync to Database
1.  Save the JSON file.
2.  Restart the backend server (`npm run dev` or wait for auto-reload).
3.  The system will automatically load and upsert the template.

## 5. File Structure
```
backend/
└── config/
    └── devices/
        ├── water/
        │   ├── sensors/
        │   │   └── dfrobot_ph_pro.json
        │   └── actuators/
        │       └── pump_generic.json
        ├── air/
        └── ...
frontend/
└── src/
    └── config/
        └── MetricConfig.ts         <-- EDIT (Optional)
shared/
└── UnitRegistry.ts                 <-- EDIT (If new key needed)
```

## 6. Validations & Constraints
*   **Unique ID:** The `id` in JSON must be unique across all devices.
*   **Reserved Keys:** Use standard keys for `outputs`/`valuePath` where possible:
    *   `temp` (°C), `humidity` (%RH), `ph` (pH), `ec` (µS/cm), `co2` (ppm).
*   **Multi-Value:** If the sensor returns multiple values (e.g., DHT22), use `outputs` array instead of `valuePath`.

## 7. Expected Outcome
*   The new device appears in the "Add Device" wizard in the Frontend.
*   Selecting the device populates the correct pins and settings.
*   Data received from the device is correctly parsed and displayed.

## 8. Test Scenarios
1.  **UI Availability:** Go to "Controllers" -> "Add Device". Verify the new type is listed.
2.  **Creation:** Create a device instance. Verify it saves without errors.
3.  **Data Flow:** Connect hardware (or mock). Verify "Monitor & Test" shows live readings.

## 9. Advanced: Creating a New Category

If you are adding a folder that does not yet exist (e.g., `soil/`), additional steps are required:

### Step A: Update Backend Model
The `Device` model restricts the `group` field to specific values.
1.  Open `backend/src/models/Device.ts`.
2.  Add your new category (e.g., `Soil`) to the `IDevice` interface and the `group` schema enum.
3.  **Failure to do this will result in a 500 Internal Server Error during device creation.**

### Step B: Update UI Wizard
New categories must be explicitly registered in the frontend wizard.
1.  Open `frontend/src/components/hardware/DeviceWizard.tsx`.
2.  Add your category to `categoryConfig` (assign a color).
3.  Add an icon helper in `getIcon()`.
4.  Add the category object to the `categories` array in Step 1.

## 10. Advanced: Custom Logic & UI
**Only required if the device needs a custom formula (non-linear) or specific calibration UI.**

### Step A: Create Conversion Strategy
1.  Create `backend/src/services/conversion/strategies/<StrategyName>.ts`.
2.  Implement `IConversionStrategy`.

    ```typescript
    // Reference: IConversionStrategy
    export interface IConversionStrategy {
        convert(raw: number, device: IDevice): number;
    }

    // Example Implementation
    import { IConversionStrategy } from './IConversionStrategy';
    import { IDevice } from '../../../models/Device';

    export class MyStrategy implements IConversionStrategy {
        convert(raw: number, device: IDevice): number {
            // Your custom logic here
            return raw * (device.config.calibration?.multiplier || 1);
        }
    }
    ```
3.  Register it in `backend/src/services/conversion/ConversionService.ts`.
4.  Add definition to `backend/config/calibration_strategies.json`.

### Step B: Update Calibration UI
1.  Open `frontend/src/components/devices/test/calibration/ECCalibration.tsx` (or create new).
2.  Add your strategy to the `<Select>` dropdown.
3.  Add a conditional block to render your strategy's inputs (e.g., Coefficients).

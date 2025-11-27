# Add New Device Type - Procedure

This guide describes how to add a new device type (Sensor or Actuator) to the Hydroponics v5 system.

## 5 Required Steps

### STEP 0: Verify Firmware Command Availability (CRITICAL)

Before adding a device, you must ensure the firmware knows how to talk to it.

1.  **Check Reference:** Open [Firmware Command Reference](../Reference/firmware-commands.md).
2.  **Verify:** Does a command exist for your sensor's protocol?
    *   *Example:* If adding a pH sensor, `ANALOG` exists. Good.
    *   *Example:* If adding a new I2C sensor, check if `I2C_READ` supports it or if a specific command is needed.
3.  **Action:**
    *   **If YES:** Proceed to Step 1.
    *   **If NO:** STOP. You must first implement the firmware command. See [Add New Firmware Command Procedure](../Instructions/procedure-add-firmware-command.md).

---

### STEP 1: Create Device Driver (Template)

**File:** `backend/config/devices/<device_id>.json`

This JSON file acts as the **Device Driver**. It tells the system how to map high-level actions to the firmware commands verified in Step 0.

**Naming Convention:** `<device_id>` should be `lowercase_underscores` (e.g., `dfrobot_ph_pro`).

```json
{
    "id": "dfrobot_ec_k1",              // Must match filename (without .json)
    "name": "DFRobot EC Sensor (K=1.0)",
    "category": "SENSOR",               // "SENSOR" or "ACTUATOR"
    "conversionStrategy": "ec-dfr-analog", // Optional: Default strategy ID
    "capabilities": [
        "READ"                          // "READ" for sensors, "WRITE" for actuators
    ],
    "commands": {
        "READ": {
            "hardwareCmd": "ANALOG",     // Maps abstract READ to firmware command
            "valuePath": "val"           // Optional: Path to value in response (e.g. "registers.0", "temp")
        }
    },
    "pins": [
        {
            "name": "Signal",
            "type": "ANALOG_IN"         // "ANALOG_IN", "DIGITAL_OUT", etc.
        }
    ],
    "initialState": {
        "value": 0
    }
}
```

**Key Fields:**
*   `commands`: Maps high-level actions (`READ`, `TOGGLE`) to low-level firmware commands.
*   `valuePath`: (Single Value) Path to the value in the response (e.g., `"registers.0"`).
*   `outputs`: (Multi-Value) Array of output definitions if the sensor returns multiple values (e.g., Temp & Humidity).
    *   Example: `[{"key": "temp", "label": "Temperature", "unit": "°C"}, ...]`
*   `conversionStrategy`: The default strategy to use (see Step 3).

### Metric Key Standardization (CRITICAL)
To ensure data consistency across the system (e.g., for Analytics Dashboard), you **MUST** use the following reserved keys for `outputs` or `valuePath`. Do NOT use custom keys like `t`, `Temperature`, or `val` if a standard key exists.

| Metric | Reserved Key | Unit | Description |
| :--- | :--- | :--- | :--- |
| **Air** | | | |
| Temperature | `temp` | °C | Air Temperature |
| Humidity | `humidity` | %RH | Relative Humidity |
| CO2 | `co2` | ppm | Carbon Dioxide |
| Pressure | `pressure` | hPa | Atmospheric Pressure |
| **Water / Solution** | | | |
| Water Temperature | `water_temp` | °C | Solution Temperature |
| Acidity | `ph` | pH | pH Level |
| Conductivity | `ec` | µS/cm | Electrical Conductivity |
| Water Level | `level` | % or cm | Tank Level |
| Flow Rate | `flow` | L/min | Flow Rate |
| Volume | `volume` | L | Total Volume |
| Dissolved Oxygen | `do` | mg/L | Dissolved Oxygen |
| **Soil / Substrate** | | | |
| Soil Moisture | `soil_moisture` | % | Volumetric Water Content |
| Soil Temperature | `soil_temp` | °C | Root Zone Temperature |
| **Light** | | | |
| Illuminance | `light` | lux | Visible Light |
| PAR | `par` | µmol/m²/s | Photosynthetically Active Radiation |
| **Other** | | | |
| Distance | `distance` | cm | Ultrasonic/Laser Distance |
| Generic Voltage | `voltage` | V | Battery/System Voltage |
| Generic Current | `current` | A | Power Consumption |

#### Adding New Metrics
If your device requires a metric **NOT** listed above (e.g., "Radiation", "Wind Speed"):
1.  Choose a unique, lowercase key (e.g., `wind_speed`).
2.  **CRITICAL:** You must register this key in the Frontend configuration to ensure it displays correctly in the History page and Charts.
    *   **File:** `frontend/src/config/MetricConfig.ts`
    *   Add an entry to the `METRICS` object:
        ```typescript
        wind_speed: { 
            label: 'Wind Speed', 
            unit: 'km/h', 
            color: '#82ca9d' // Choose a unique color for charts
        },
        ```
3.  Use this key in your device template's `outputs` or `valuePath`.

#### Example: Multi-Value Sensor (e.g., DHT22)
For sensors that return multiple values (like Temperature and Humidity), use the `outputs` array instead of `valuePath`.

```json
{
    "id": "dht22",
    "name": "DHT22 (Temp/Humidity)",
    "category": "SENSOR",
    "capabilities": ["READ"],
    "commands": {
        "READ": {
            "hardwareCmd": "DHT_READ",
            "params": { "type": 22 },
            "outputs": [
                { "key": "temp", "label": "Temperature", "unit": "°C" },
                { "key": "humidity", "label": "Humidity", "unit": "%RH" }
            ]
        }
    }
}
```

---

### STEP 2: Database Seed (UI Listing)

**File:** `backend/src/utils/seedDeviceTemplates.ts`

Add an entry to the `templates` array. This makes the device appear in the "Add Device" dropdown in the Frontend.

```typescript
{
    _id: 'dfrobot_ec_k1',               // MUST match JSON "id" from Step 1
    name: 'DFRobot EC Sensor (K=1.0)',
    description: 'Analog Electrical Conductivity sensor',
    physicalType: 'ec',                 // 'ph', 'temp', 'relay', etc.
    requiredCommand: 'ANALOG',          // Primary command type
    defaultUnits: ['mS/cm'],
    portRequirements: [{ type: 'analog', count: 1, description: 'Analog Pin (A0-A5)' }],
    executionConfig: {
        commandType: 'ANALOG',
        responseMapping: { conversionMethod: 'ec_dfrobot_k1' } // Legacy field, kept for reference
    },
    uiConfig: { category: 'Sensors', icon: 'activity' }
}
```

**Action:** Run `npm run seed` (or restart backend if auto-seed is enabled) to apply changes.

---

### STEP 3: Conversion Strategy (Backend Logic)

If the device requires a custom formula (not just Linear Interpolation), create a strategy.

**1. Create Strategy Class**
**File:** `backend/src/services/conversion/strategies/<StrategyName>.ts`

```typescript
import { IConversionStrategy } from './IConversionStrategy';
import { IDevice } from '../../../models/Device';

export class MyCustomStrategy implements IConversionStrategy {
    convert(raw: number, device: IDevice): number {
        // Implement formula
        // Access config via: device.config.calibration.multiplier
        return raw * 2; 
    }
}
```

**2. Register Strategy**
**File:** `backend/src/services/conversion/ConversionService.ts`

```typescript
import { MyCustomStrategy } from './strategies/MyCustomStrategy';

// Inside constructor:
this.registerStrategy('my-custom-strategy', new MyCustomStrategy());
```

**3. Auto-Detect (Optional)**
Update `convert` method in `ConversionService.ts` to set this strategy as default for your `driverId` if needed.

---

### STEP 4: Frontend Calibration (UI)

**File:** `frontend/src/components/devices/test/calibration/ECCalibration.tsx`

*Note: Ideally, this should be refactored to a generic `CalibrationSettings.tsx`, but for now we modify `ECCalibration` or create a new component.*

1.  **Add Strategy to Dropdown:**
    ```tsx
    <SelectItem value="my-custom-strategy">My Custom Strategy</SelectItem>
    ```

2.  **Add Configuration UI:**
    Render specific inputs (like K-Value, Offset) when your strategy is selected.

3.  **State & Persistence:**
    Ensure new fields (like `multiplier`) are saved to `device.config.calibration`.

---

### STEP 5: Firmware & Transport (Advanced)

**Only required if the device uses a new protocol (e.g., Modbus, I2C, Custom Serial).**

#### 1. Firmware Command (`.ino`)
**File:** `firmware/templates/commands/<command_name>.ino`
*   Create a new `.ino` file implementing the protocol.
*   **Protocol Contract:** Define clearly what the firmware expects (e.g., `CMD|PIN|ARG`).
*   **Example:** `MODBUS_RTU_READ|D2|D3|{"addr":1...}`

#### 2. Transport Logic (`SerialTransport.ts`)
**File:** `backend/src/modules/hardware/transports/SerialTransport.ts`
*   If the command requires special formatting (e.g., extracting multiple pins, inserting delimiters), update the `send()` method.
*   **Critical:** Ensure pin names (e.g., "RX", "TX") are correctly extracted from `packet.pins` and formatted (e.g., prefixed with 'D').

#### 3. Response Parsing (`HardwareService.ts`)
**File:** `backend/src/modules/hardware/HardwareService.ts`
*   **New in v5:** You generally DO NOT need to modify this file anymore.
*   Instead, use the `valuePath` property in your Device Driver (Step 1) to tell the backend how to extract the value from the response.
*   Only modify this file if the response format is so unique that `valuePath` cannot handle it.

---

## Verification Checklist

1.  [ ] **JSON Created**: File exists in `backend/config/devices/`.
2.  [ ] **DB Seeded**: Device appears in "Add Device" list.
3.  [ ] **Strategy Registered**: Backend does not throw "Strategy not found".
4.  [ ] **Calibration UI**: Can select strategy and save settings.
5.  [ ] **Firmware/Transport**: (If Advanced) Command is formatted correctly and response is parsed.

## Troubleshooting

*   **ERR_INVALID_FORMAT**: Check `SerialTransport.ts`. Is the command string constructed exactly as the `.ino` file expects (delimiters, pin prefixes)?
*   **500 Error (Read Once)**: Check `HardwareService.ts`. Is the raw response being parsed correctly? (Log the `rawResponse` type).
*   **Strategy Not Found**: Check `ConversionService.ts`. Is the strategy registered in the constructor?


---

## Reference: Available Commands

For a complete list of supported commands, parameters, and usage examples, please refer to:

👉 **[Firmware Command Reference](../Reference/firmware-commands.md)**

Common commands include: `ANALOG`, `DIGITAL_READ`, `SET_PIN` (Relay), `DHT_READ`, and `ONEWIRE_READ_TEMP`.


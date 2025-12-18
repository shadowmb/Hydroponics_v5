# Device Template Schema Reference

## 1. Goal
Complete reference for creating and understanding device templates in Hydroponics v5.

## 2. Scope
- **Included:** All template fields, their purpose, and which components use them.
- **Excluded:** Calibration logic, strategy implementation.

## 3. File Location
- **Path:** `backend/config/devices/<environment>/<type>/<device_id>.json`
- **Example:** `backend/config/devices/water/sensors/hc_sr04.json`
- **Naming:** `id` field MUST match filename (lowercase snake_case).

## 4. Schema Validation
Templates are validated by:
1. **Zod Schema:** `DeviceTemplateManager.ts` → `DeviceTemplateSchema`
2. **Mongoose Schema:** `models/DeviceTemplate.ts`

> **Critical:** New fields MUST be added to BOTH schemas.

---

## 5. Field Reference

### 5.1. Identity Fields

| Field | Type | Required | Used By |
|-------|------|----------|---------|
| `id` | string | ✅ | System-wide unique ID |
| `name` | string | ✅ | UI display name |
| `description` | string | ❌ | UI tooltip/help |
| `category` | enum | ✅ | `SENSOR` \| `ACTUATOR` \| `CONTROLLER` |

---

### 5.2. measurements Block
Defines raw→base unit conversion for physical readings.

```json
"measurements": {
    "distance": {
        "rawUnit": "cm",
        "baseUnit": "mm"
    }
}
```

| Field | Description |
|-------|-------------|
| `rawUnit` | Unit returned by firmware |
| `baseUnit` | Normalized unit for calibration/storage |

**Used By:** `HardwareService.readSensorValue()` → normalizes before strategy execution.

---

### 5.3. roles Block
Defines device operating modes.

```json
"roles": {
    "distance": {
        "label": "Distance Monitor",
        "description": "Measure linear distance.",
        "defaultStrategy": "linear",
        "strategies": ["linear", "offset"],
        "units": ["mm", "cm", "m"]
    },
    "volume": {
        "label": "Tank Volume",
        "source": "distance",
        "defaultStrategy": "tank_volume",
        "strategies": ["tank_volume"],
        "units": ["L", "gal"]
    }
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `label` | ✅ | UI display name |
| `description` | ❌ | Role explanation |
| `source` | ❌ | Source measurement for derived roles |
| `defaultStrategy` | ❌ | Default conversion strategy |
| `strategies` | ✅ | Available strategies |
| `units` | ❌ | Available display units |

**Used By:** `HardwareService` → determines `measurementKey` via `source` field.

---

### 5.4. commands Block
Defines hardware operations.

```json
"commands": {
    "READ": {
        "hardwareCmd": "ULTRASONIC_TRIG_ECHO",
        "valuePath": "distance",
        "sourceUnit": "cm",
        "outputs": [
            { "key": "distance", "label": "Distance", "unit": "mm" }
        ]
    }
}
```

| Field | Description | Used By |
|-------|-------------|---------|
| `hardwareCmd` | Firmware command name | `DeviceTemplateManager.getDriver()` |
| `valuePath` | JSON path to extract value from response | `HardwareService:306` |
| `sourceUnit` | Fallback unit if no `measurements` block | `HardwareService:559` |
| `outputs` | Output definitions for multi-value sensors | Events, UI |

---

### 5.5. capabilities
Array of hardware capabilities this device supports.

```json
"capabilities": ["ULTRASONIC_TRIG_ECHO"]
```

**Used By:** Port assignment, device wizard.

---

### 5.6. requirements Block
Hardware requirements for device creation.

```json
"requirements": {
    "interface": "digital",
    "voltage": [5.0],
    "pin_count": { "digital": 2 }
}
```

| Field | Description |
|-------|-------------|
| `interface` | `analog` \| `digital` \| `i2c` \| `uart` \| `pwm` |
| `voltage` | Supported voltages |
| `pin_count` | Number of pins per type |

---

### 5.7. pins Block
Pin configuration for device.

```json
"pins": [
    { "name": "TRIG", "type": "DIGITAL_OUT" },
    { "name": "ECHO", "type": "DIGITAL_IN" }
]
```

| Field | Description |
|-------|-------------|
| `name` | Pin identifier |
| `type` | `ANALOG_IN` \| `DIGITAL_IN` \| `DIGITAL_OUT` \| `PWM_OUT` |

---

### 5.8. sampling Block
Burst read configuration.

```json
"sampling": {
    "count": 5,
    "delayMs": 30
}
```

| Field | Range | Description |
|-------|-------|-------------|
| `count` | 1-10 | Number of samples per read |
| `delayMs` | 0-500 | Delay between samples (ms) |

**Used By:** `HardwareService:228-231` → averages multiple readings.

---

### 5.9. hardwareLimits Block
Physical sensor range.

```json
"hardwareLimits": {
    "min": 20,
    "max": 4000,
    "unit": "mm"
}
```

| Field | Description |
|-------|-------------|
| `min` | Minimum readable value |
| `max` | Maximum readable value |
| `unit` | Unit for min/max |

**Used By:** Validation logic (future).

---

### 5.10. initialState Block
Default device state on creation.

```json
"initialState": { "value": 0 }
```

**Used By:** `HardwareService:75` → sets initial device state.

---

### 5.11. uiConfig Block
Frontend display configuration.

```json
"uiConfig": {
    "icon": "ruler",
    "units": ["mm", "cm", "m", "L"],
    "tags": ["Distance", "Water"],
    "category": "Water",
    "recommendedPins": [],
    "capabilities": {
        "ULTRASONIC_TRIG_ECHO": {
            "label": "Distance",
            "icon": "ruler",
            "tooltip": "Range: 2cm - 400cm"
        }
    }
}
```

| Field | Description |
|-------|-------------|
| `icon` | Lucide icon name |
| `units` | All available display units |
| `tags` | Searchable tags |
| `category` | UI category |
| `recommendedPins` | Suggested pins |
| `capabilities` | Per-capability UI config |

---

## 6. Creating a New Template

1. Create JSON file in `backend/config/devices/<env>/<type>/<id>.json`
2. Define all required fields (id, name, category, capabilities, commands, pins)
3. Add `measurements` block for unit conversion
4. Add `roles` block for operating modes
5. Restart backend → auto-sync to database

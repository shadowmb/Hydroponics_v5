# Measurements Block Reference

## 1. Goal
Describes the `measurements` block in device templates and how `HardwareService` uses it for unit normalization.

## 2. Scope
- **Included:** `measurements` block, `roles.source`, normalization flow
- **Excluded:** Strategy execution, calibration logic

## 3. Definitions

### 3.1. measurements Block
Defined in device template JSON. Maps physical quantities to unit conversion rules.

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
| `baseUnit` | System's normalized unit (used for calibration, storage, strategy input) |

### 3.2. roles Block
Defines device operating modes.

```json
"roles": {
    "volume": {
        "label": "Tank Volume",
        "unit": "L",
        "source": "distance",
        "defaultStrategy": "tank_volume"
    }
}
```

| Field | Description |
|-------|-------------|
| `source` | Points to the measurement key to use for unit lookup |

## 4. Data Flow in HardwareService

```
┌─────────────────────────────────────────────────────────────┐
│  1. RAW from sensor: 17.7 (firmware returns cm)             │
├─────────────────────────────────────────────────────────────┤
│  2. MEASUREMENTS NORMALIZATION (rawUnit → baseUnit)         │
│     - Read template.measurements[measurementKey]            │
│     - For derived roles: measurementKey = roleConfig.source │
│     - Convert: 17.7 cm → 177 mm                             │
│     - Set: validPhysicalBaseValue = 177                     │
│     - Set: usedMeasurementsBlock = true                     │
│     - Update: sourceUnit = "mm"                             │
├─────────────────────────────────────────────────────────────┤
│  3. STRATEGY EXECUTION                                      │
│     - Input: smartInput = 177 (baseValue)                   │
│     - Linear: pass-through (177 → 177)                      │
│     - tank_volume: calibration interpolation (177 → 0 L)    │
├─────────────────────────────────────────────────────────────┤
│  4. SKIP OLD NORMALIZATION                                  │
│     - if (usedMeasurementsBlock) → skip UnitRegistry        │
├─────────────────────────────────────────────────────────────┤
│  5. DISPLAY UNIT CONVERSION                                 │
│     - 177 mm → 0.177 m (if displayUnit = "m")               │
├─────────────────────────────────────────────────────────────┤
│  6. RETURN                                                  │
│     { raw: 17.7, value: 0.177, unit: "m",                   │
│       details: { baseValue: 177, baseUnit: "mm" } }         │
└─────────────────────────────────────────────────────────────┘
```

## 5. Key Variables

| Variable | Type | Description |
|----------|------|-------------|
| `validPhysicalBaseValue` | `number` | Value after measurements normalization |
| `validPhysicalBaseUnit` | `string` | The baseUnit (e.g., `mm`) |
| `usedMeasurementsBlock` | `boolean` | Flag to skip old normalization |
| `sourceUnit` | `string` | Updated to baseUnit after normalization |
| `smartInput` | `number` | Input to strategy (always baseValue) |

## 6. Files

| File | Role |
|------|------|
| `DeviceTemplateManager.ts` | Parses and validates `measurements` and `roles` |
| `HardwareService.ts` | Executes normalization logic |
| Device template JSON | Defines `measurements` and `roles` blocks |

## 7. Adding measurements to a New Device

1. Add `measurements` block defining `rawUnit` and `baseUnit`
2. If device has derived roles (e.g., volume from distance), add `source` to `roles` block
3. Update `DeviceTemplateSchema` in `DeviceTemplateManager.ts` if adding new fields

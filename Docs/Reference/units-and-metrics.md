# Unified Unit System & Metric Keys Reference

## 1. Overview
This document serves as the **Single Source of Truth** for the Hydroponics v5 Unit System and Metric Keys. It defines how physical units are handled, stored, and visualized across the entire stack, incorporating the **Strategy Registry** for complex transformations.

## 2. Core Architecture

### 2.1. The "Source of Truth" (`shared/UnitRegistry.ts`)
The `UnitRegistry` is the central authority. It defines:
1.  **Unit Families:** Logical groups of measurements (e.g., DISTANCE, TEMP).
2.  **Base Units:** The **immutable** unit used for database storage.
3.  **Allowed Keys:** The specific metric keys (e.g., `distance`, `temp`) that belong to each family.

### 2.2. The "Transformation Layer" (`shared/strategies/StrategyRegistry.ts`)
The `StrategyRegistry` mediates between raw hardware units and high-level logical units.
1.  **Strategies:** Define `inputUnit` (requirement) and `outputUnit` (result).
2.  **Validation:** Ensures hardware capabilities match flow requirements.
3.  **Calibration:** Defines strictly typed transformation rules (e.g. `cm` -> `l`).

---

## 3. Data Flow & Normalization

### 3.1. Measurements Block Flow (Current)
The `measurements` block in device templates defines explicit unit conversion.

| Step | Component | Value | Unit |
|:-----|:----------|:------|:-----|
| 1 | **Sensor** | Raw reading | `17.7 cm` |
| 2 | **Measurements Block** | `rawUnit → baseUnit` | `177 mm` |
| 3 | **Strategy** | `linear` or calibration | `177 mm` or `0 L` |
| 4 | **Display Conversion** | User's displayUnit | `0.177 m` |

### 3.2. Key Variables in HardwareService

| Variable | Description |
|:---------|:------------|
| `validPhysicalBaseValue` | Value after measurements normalization (baseUnit) |
| `validPhysicalBaseUnit` | The baseUnit from measurements block |
| `usedMeasurementsBlock` | Flag to skip old normalization if true |
| `sourceUnit` | Updated to baseUnit after measurements normalization |
| `smartInput` | Input to strategy (always in baseUnit) |

### 3.3. Derived Roles (e.g., Volume from Distance)
For roles with `source` field, the system uses the source measurement's units.

```
activeRole: "volume"
↓
roleConfig.source: "distance"
↓
measurementKey: "distance"
↓
measurements["distance"]: { rawUnit: "cm", baseUnit: "mm" }
```


---

## 4. Unit Definitions (Base Units)

### 4.1. DISTANCE
*   **Base Unit:** `mm` (Millimeters)
*   **Allowed Keys:** `distance`, `depth`, `height`, `level`

### 4.2. TEMP (Temperature)
*   **Base Unit:** `C` (Celsius)
*   **Allowed Keys:** `temp`, `water_temp`, `soil_temp`, `air_temp`

### 4.3. VOLUME (Liquid)
*   **Base Unit:** `ml` (Milliliters) - *pending conf.*
*   **Allowed Keys:** `volume`, `tank_level`

### 4.4. DURATION (Time)
*   **Base Unit:** `ms` (Milliseconds)
*   **Allowed Keys:** `duration`, `interval`

---

## 5. Strategy Implementation Rules

### 5.1. Strategy Definition (`StrategyDefinition`)
| Property | Description | Rules |
| :--- | :--- | :--- |
| `inputUnit` | Hardware requirement | `any` (accepts whatever driver gives) or Specific (`cm`). |
| `outputUnit` | Logical result | `any` (mirrors input) or Specific (`l`). |

### 5.2. Validation Logic (`validateBlockStrategy`)
When connecting a Block to a Variable:
1.  **Resolve Strategy Output:**
    *   If `outputUnit !== 'any'`, use it.
    *   If `outputUnit === 'any'`, use `Device.template.commands.READ.sourceUnit`.
2.  **Compare:** Check `areUnitsCompatible(StrategyOutput, VariableUnit)`.
3.  **Result:**
    *   **Mismatch:** Block Error (Red Border). Save Blocked.
    *   **Match:** Allowed. Auto-conversion handles storage.

### 5.3. Frontend Logic (`PropertiesPanel`)
*   **Listing:** All supported strategies from `DeviceTemplate` are shown.
*   **Availability:** Strategies requiring calibration (e.g. `tank_volume`) are **selectable** but trigger a "Missing Calibration" warning if config is absent.
*   **Disabling:** Strategies are only functionally disabled if hardware lacks prerequisite capabilities (e.g. wrong interface), though currently implemented as always visible for supported lists.

---

## 6. Database Storage Contract
*   The Database **ALWAYS** stores values in the **Base Unit** of the resulting key.
*   The Database **NEVER** stores unit metadata per record.
*   **Interpretation:** Value -> Key -> UnitRegistry -> Base Unit.

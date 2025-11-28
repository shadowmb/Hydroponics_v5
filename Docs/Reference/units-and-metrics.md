# Unified Unit System & Metric Keys Reference

## 1. Overview
This document serves as the **Single Source of Truth** for the Hydroponics v5 Unit System and Metric Keys. It defines how physical units are handled, stored, and visualized across the entire stack (Firmware -> Backend -> Database -> Frontend).

## 2. Core Architecture

### 2.1. The "Source of Truth" (`shared/UnitRegistry.ts`)
The `UnitRegistry` is the central authority. It defines:
1.  **Unit Families:** Logical groups of measurements (e.g., DISTANCE, TEMP).
2.  **Base Units:** The **immutable** unit used for database storage.
3.  **Allowed Keys:** The specific metric keys (e.g., `distance`, `temp`) that belong to each family.

### 2.2. Data Flow & Normalization
| Component | Role | Example State |
| :--- | :--- | :--- |
| **Sensor** | Measures raw physical phenomenon | `1662` (cm) |
| **Driver** | Defines `sourceUnit` and `key` | `sourceUnit: "cm"`, `key: "distance"` |
| **Backend** | Normalizes to **Base Unit** | `1662 cm` -> `16620 mm` |
| **Database** | Stores normalized value | `{ distance: 16620 }` (Implicitly mm) |
| **Frontend** | Visualizes based on `MetricConfig` | Displays `16620 mm` |

## 3. Unit Definitions

### 3.1. DISTANCE
*   **Base Unit:** `mm` (Millimeters)
*   **Allowed Keys:** `distance`, `depth`, `height`, `level`
*   **Derived Units:** `cm`, `m`, `inch`, `ft`

### 3.2. TEMP (Temperature)
*   **Base Unit:** `C` (Celsius)
*   **Allowed Keys:** `temp`, `water_temp`, `soil_temp`, `air_temp`
*   **Derived Units:** `F`, `K`

### 3.3. EC (Electrical Conductivity)
*   **Base Unit:** `uS_cm` (Microsiemens per cm)
*   **Allowed Keys:** `ec`
*   **Derived Units:** `mS_cm`

### 3.4. HUMIDITY
*   **Base Unit:** `pct` (%)
*   **Allowed Keys:** `humidity`, `soil_moisture`
*   **Derived Units:** None

### 3.5. PH
*   **Base Unit:** `ph`
*   **Allowed Keys:** `ph`
*   **Derived Units:** None

### 3.6. LIGHT (PAR)
*   **Base Unit:** `umol_m2_s` (µmol/m²/s)
*   **Allowed Keys:** `par`
*   **Derived Units:** None

## 4. Implementation Rules

### 4.1. Adding a New Sensor
When creating a device driver (`.json`):
1.  **Select a Key:** Must be one of the **Allowed Keys** from `UnitRegistry` (e.g., `water_temp`).
2.  **Define Source Unit:** Must specify the unit the hardware returns (e.g., `"sourceUnit": "F"`).
3.  **Do NOT** invent new keys (e.g., `temp_f` is forbidden).

### 4.2. Frontend Visualization
*   **`MetricConfig.ts`** defines the default display unit.
*   It must align with the **Base Unit** unless client-side conversion is implemented.
*   **Example:** `distance` key -> `unit: 'mm'`.

## 5. Database Storage Contract
*   The Database **ALWAYS** stores values in the **Base Unit**.
*   The Database **NEVER** stores unit metadata per record (for efficiency).
*   To interpret a value, check the key in `UnitRegistry`.
    *   *Example:* `distance: 500` -> Check Registry -> DISTANCE Base is `mm` -> Value is 500mm.

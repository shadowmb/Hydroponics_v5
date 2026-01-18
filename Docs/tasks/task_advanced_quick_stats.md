# Task: Advanced Quick Stats Dashboard (Sensor Intelligence)

## 🎯 Goal
Upgrade the "Quick Stats" section in Dashboard 1 to a professional monitoring tool.
Transform simple value displays into intelligent indicators with:
1.  **Custom Aliases** (Rename sensors for clarity).
2.  **Traffic Light Color Logic** (Green/Orange/Red based on user-defined ranges).
3.  **Trend Indicators** (Up/Down arrows based on real-time changes).
4.  **Staleness Detection** ("No recent data" warning).

## 🧠 Architecture Strategy: "Hybrid Config"
To minimize backend impact and risk, we will split the responsibility:
*   **Backend:** Provides the raw data and the list of pinned sensors.
*   **Frontend (LocalStorage):** Stores the *visual configuration* (Aliases, Thresholds, Ranges).

## 📋 Implementation Plan

### Phase 1: Configuration Management (The Brains)
Create the data structures and hooks to manage the new settings.

- [ ] **Create `useDashboardConfig` Hook**
    - Logic to store/retrieve settings from `localStorage`.
    - Key: `hydro_dashboard_sensor_config`.
    - Structure:
      ```typescript
      Record<string, { // deviceId
        alias?: string;
        min?: number;
        max?: number;
        tolerance?: number;
      }>
      ```

- [ ] **Upgrade `DashboardSettingsDialog` UI**
    - Keep the checkbox list for selecting sensors.
    - Add a "Configure (⚙️)" button next to each selected sensor.
    - Implement a sub-form (Inline or Popover) for:
        - `Alias` (Input)
        - `Target Range` (Min - Max Inputs)
        - `Tolerance` (Input)

### Phase 2: Intelligent Visualization (The Face)
Update the display components to interpret the configuration.

- [ ] **Enhance `SensorCard.tsx`**
    - Add props for `status` ('normal' | 'warning' | 'critical').
    - Add visual styles for each status (Border colors, Icon colors).
    - Add `trend` indicator logic (compare `currentValue` vs `previousValue`).
        - *Note:* Trend requires local state tracking in the parent component.
    - Implement "Staleness" logic: compare `lastUpdated` vs `Date.now()`.
        - If > 1 minute old -> Show "⚠️ No recent data".
        - If < 1 minute -> Show "X seconds ago".

- [ ] **Update `PinnedSensorsGrid.tsx`**
    - Integrate `useDashboardConfig`.
    - Apply logic to calculate `status` based on Config vs. Live Value.
        - `Green`: Min <= Val <= Max
        - `Orange`: (Min-Tol) <= Val < Min OR Max < Val <= (Max+Tol)
        - `Red`: Everything else.

### Phase 3: Integration & Polish
- [ ] **Connect the Dots**
    - Ensure saving settings immediately updates the dashboard (React State sync).
    - Verify responsiveness on mobile.
- [ ] **Test Scenarios**
    - "What happens if I set Min > Max?" (Validation).
    - "Does the trend arrow flip correctly when value changes?"

## 🚀 Execution Order
1.  **Phase 1 (Config Hook & Settings UI)** - *Fundamental structure.*
2.  **Phase 2 (Visualization Logic)** - *Making it look good.*
3.  **Phase 3 (Testing)** - *Quality assurance.*

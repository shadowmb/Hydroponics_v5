# Hydroponics v5 - UI/UX Flows Specification

**Status**: Draft
**Framework**: React + TailwindCSS + Shadcn/ui
**Theme**: Dark Mode / Nature-inspired Accents

## 1. Design System Principles
*   **Simplicity**: Clean interfaces, minimal clutter.
*   **Feedback**: Immediate visual response to all actions (toasts, loading states).
*   **Mobile-First**: All critical controls must be usable on a phone.
*   **Real-time**: Data updates without page reload (Socket.io).

---

## 2. Core User Journeys

### 2.1. The Dashboard (Mission Control)
*Goal: Instant visibility of system health.*

1.  **Landing**: User opens app.
2.  **View**: Grid of widgets (customizable).
    *   **Sensor Cards**: Live value (pH, Temp) + Sparkline chart.
    *   **Active Program**: Progress bar of current cycle.
    *   **System Status**: Connection status of controllers.
    *   **Quick Actions**: "Emergency Stop", "Lights On/Off".
3.  **Interaction**:
    *   Click "Edit Layout" -> Drag & Drop widgets.
    *   Click Sensor -> Opens detailed history chart.

### 2.2. Device Management (The Hardware Lab)
*Goal: Add and configure hardware without coding.*

1.  **List View**: Table of all devices with Status (Online/Offline).
2.  **Add Device**:
    *   Click "Add Device".
    *   **Wizard Step 1**: Select Category (Sensor / Actuator).
    *   **Wizard Step 2**: Select Driver (e.g., "DHT11").
    *   **Wizard Step 3**: Select Pin (Visual GPIO map if possible).
    *   **Wizard Step 4**: Test (Click "Read" or "Toggle").
    *   **Save**: Device appears in list.

### 2.3. Automation Editor (The Logic Studio)
*Goal: Create complex logic visually.*

1.  **Library**: List of ActionTemplates.
2.  **Editor**:
    *   **Canvas**: Infinite grid (React Flow).
    *   **Sidebar**: Draggable blocks (Sensor, If, Loop, Set Var).
    *   **Action**: Drag "Sensor Read" to canvas -> Connect to "If".
3.  **Configuration**:
    *   Click Block -> Sidebar shows properties (Pin selection, Thresholds).
4.  **Validation**: Real-time error checking (e.g., "Missing connection").
5.  **Simulation**: "Dry Run" button to test logic without hardware.

### 2.4. Program Scheduler (The Conductor)
*Goal: Orchestrate templates into a recipe.*

1.  **View**: Calendar or Timeline view.
2.  **Create Program**:
    *   Name: "Grow Cycle A".
    *   **Sequence**: Add "Fill Tank" (Template) -> "Mix Nutrients" (Template) -> "Water" (Template).
    *   **Triggers**: Set start time or recurrence (Cron).
3.  **Monitor**: See which step is currently active in the timeline.

---

## 3. Navigation Structure
*   **Sidebar (Desktop) / Bottom Bar (Mobile)**
    *   📊 **Dashboard**
    *   ⚡ **Control** (Manual overrides)
    *   🧩 **Automation** (Flows & Programs)
    *   🔌 **Devices** (Hardware config)
    *   ⚙️ **Settings** (System config)

---

## 4. Key UI Components (Shadcn/ui)
*   **Card**: For widgets and lists.
*   **Sheet**: For side-panels (Block configuration).
*   **Dialog**: For critical confirmations (Delete, Stop).
*   **Toast**: For notifications ("Saved", "Error").
*   **Switch**: For toggling relays.
*   **Slider**: For PWM/Dimming control.

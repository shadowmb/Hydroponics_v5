# Device Template Schema Reference

## 1. Overview
The **Device Template** is the single source of truth for a hardware device in Hydroponics v5. It defines:
1.  **Identity:** Name, Category, Icon.
2.  **Hardware:** Which firmware command to use (`hardwareCmd`) and which pins are required.
3.  **Data:** How to parse the firmware response (`valuePath`) and what units to use (`sourceUnit`).
4.  **UI:** How to display it in the frontend (`uiConfig`).

## 2. File Location
*   **Path:** `backend/config/devices/<device_id>.json`
*   **Naming:** `<device_id>` must match the `id` field inside the JSON. Use lowercase snake_case (e.g., `dht22.json`).

## 3. JSON Structure (Full)

```json
{
    "id": "unique_id_snake_case",
    "name": "Human Readable Name",
    "category": "SENSOR",
    "capabilities": ["FIRMWARE_COMMAND_ID"],
    "commands": {
        "READ": {
            "hardwareCmd": "FIRMWARE_COMMAND_ID",
            "params": { "optional_param": 123 },
            "valuePath": "key_in_firmware_response",
            "sourceUnit": "hardware_unit",
            "outputs": [
                {
                    "key": "metric_key",
                    "label": "Label",
                    "unit": "display_unit"
                }
            ]
        }
    },
    "pins": [
        { "name": "Label", "type": "DIGITAL_IN" }
    ],
    "uiConfig": {
        "category": "Sensors",
        "icon": "activity"
    },
    "initialState": { "value": 0 }
}
```

## 4. Field Definitions

### 4.1. Identity & Metadata
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | **YES** | Unique identifier. Must match filename. Used in DB as `_id`. |
| `name` | String | **YES** | Display name in the UI. |
| `category` | Enum | **YES** | System Type: `SENSOR`, `ACTUATOR`, `CONTROLLER`. Used for backend logic. |
| `capabilities` | Array | **YES** | List of Firmware Command IDs this device supports (e.g., `["DHT_READ"]`). |

### 4.2. UI Configuration (`uiConfig`)
Controls how the device appears in the "Add Device" Wizard and Lists.

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `category` | String | **YES** | The visual category header in the UI (e.g., "Sensors", "Actuators", "Water"). |
| `icon` | String | **YES** | Lucide React icon name (lowercase, e.g., `thermometer`, `activity`, `droplet`). |

### 4.3. Commands (`commands`)
Maps high-level actions (like `READ`) to low-level firmware commands.

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `hardwareCmd` | String | **YES** | The **EXACT** ID of the command in `firmware/definitions/commands/`. Case-insensitive match. |
| `params` | Object | No | Static parameters to send with every command (e.g., `{"dhtType": 22}`). |
| `valuePath` | String | No | The JSON key in the firmware response containing the main value (e.g., `temp`). |
| `sourceUnit` | String | No | The unit returned by the hardware. Used for normalization. |

### 4.4. Outputs (`outputs`)
Defines the metrics this device produces.

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `key` | String | **YES** | The metric ID (e.g., `temp`, `ph`). Must match `UnitRegistry.ts`. |
| `label` | String | **YES** | Human-readable label for the metric. |
| `unit` | String | **YES** | The display unit. |

### 4.5. Pins (`pins`)
Defines the physical connections required.

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | String | **YES** | Label for the pin (e.g., "Signal", "TX", "SDA"). |
| `type` | Enum | **YES** | `DIGITAL_IN`, `DIGITAL_OUT`, `ANALOG_IN`, `PWM_OUT`. |

## 5. Example: HC-SR04
```json
{
    "id": "hc_sr04",
    "name": "HC-SR04 Ultrasonic",
    "category": "SENSOR",
    "capabilities": ["READ"],
    "commands": {
        "READ": {
            "hardwareCmd": "ULTRASONIC_TRIG_ECHO",
            "valuePath": "distance",
            "sourceUnit": "cm",
            "outputs": [
                { "key": "distance", "label": "Distance", "unit": "mm" }
            ]
        }
    },
    "pins": [
        { "name": "TRIG", "type": "DIGITAL_OUT" },
        { "name": "ECHO", "type": "DIGITAL_IN" }
    ],
    "uiConfig": {
        "category": "Sensors",
        "icon": "activity"
    }
}
```

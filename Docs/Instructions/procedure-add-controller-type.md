# Procedure: Add New Controller Type

## 1. Goal
Add a new microcontroller board (e.g., Arduino Mega, ESP32) to the system, enabling firmware generation and backend management.

## 2. Scope
*   **Included:** Firmware Generator config, Backend Template definition, Frontend UI mapping.
*   **Excluded:** Adding new sensors or commands.

## 3. Definitions & Dependencies
*   **Firmware Config:** `firmware/config/controllers.json` - Defines hardware capabilities for the generator.
*   **Backend Template:** `backend/src/data/controller-templates.json` - Defines ports and UI representation.
*   **Frontend Map:** `frontend/src/components/hardware/ControllerWizard.tsx` - Links the two above.

## 4. Steps (Algorithm)

### Step 1: Configure Firmware Generator
1.  Open `firmware/config/controllers.json`.
2.  Add a new object to the `controllers` array.

```json
{
    "id": "arduino_mega",               // Unique ID (lowercase)
    "displayName": "Arduino Mega 2560",
    "chipset": "atmega2560",
    "communicationTypes": ["serial"],
    "capabilities": {
        "analogPins": 16,
        "digitalPins": 54,
        "uartCount": 4,
        "hasHardwareUART": true,
        "hasRS485": false,
        "flashMemory": 253952,
        "sram": 8192
    },
    "commandCompatibility": {
        "compatible": ["ANALOG", "DHT", "ONE_WIRE"]
    },
    "baseTemplates": {
        "serial": "controller_serial_base.ino"
    },
    "isActive": true
}
```

### Step 2: Define Backend Template
1.  Open `backend/src/data/controller-templates.json`.
2.  Add a new top-level key (PascalCase).

```json
{
    "Arduino_Mega": {                  // Template Key
        "label": "Arduino Mega 2560",
        "communication_by": ["serial"],
        "communication_type": ["raw_serial"],
        "ports": [
            {"id": "D0", "label": "RX0", "type": "digital", "reserved": true},
            {"id": "D1", "label": "TX0", "type": "digital", "reserved": true},
            {"id": "D2", "label": "D2 (PWM)", "type": "digital", "pwm": true},
            {"id": "A0", "label": "Analog 0", "type": "analog"}
        ]
    }
}
```

### Step 3: Map in Frontend
1.  Open `frontend/src/components/hardware/ControllerWizard.tsx`.
2.  Locate `MODEL_MAP` constant.
3.  Add the mapping entry.

```typescript
const MODEL_MAP: Record<string, string> = {
    // 'firmware_id': 'Backend_Key'
    'arduino_mega': 'Arduino_Mega'
};
```

### Step 4: Apply Changes
1.  Restart the Backend (`npm run dev`).
2.  Templates are automatically seeded on startup.

## 5. File Structure
```
firmware/
└── config/
    └── controllers.json           <-- Step 1
backend/
└── src/
    └── data/
        └── controller-templates.json <-- Step 2
frontend/
└── src/
    └── components/
        └── hardware/
            └── ControllerWizard.tsx <-- Step 3
```

## 6. Validations & Constraints
*   **Port IDs:** Must match physical labels (e.g., `D0`, `A0`).
*   **Reserved Pins:** Mark UART (TX/RX), I2C (SDA/SCL), and SPI pins as `"reserved": true`.
*   **PWM:** Verify PWM capability against the datasheet.

## 7. Integration Mapping Verification (CRITICAL)
You **MUST** ensure the IDs link correctly across the three files.

| System | File | Key/Property | Value Example |
| :--- | :--- | :--- | :--- |
| **Firmware** | `controllers.json` | `id` | `"arduino_mega"` |
| **Frontend** | `ControllerWizard.tsx` | `MODEL_MAP` (Key) | `'arduino_mega'` |
| **Frontend** | `ControllerWizard.tsx` | `MODEL_MAP` (Value) | `'Arduino_Mega'` |
| **Backend** | `controller-templates.json` | Root Key | `"Arduino_Mega"` |

> [!IMPORTANT]
> **Broken Link Risk**
> If the `MODEL_MAP` value does not EXACTLY match the `controller-templates.json` key, the UI will fail to load ports for the selected controller.

## 8. Test Scenarios
1.  **Wizard:** Open "Add Controller". Select the new type.
2.  **Port Load:** Verify the "Ports" step shows the correct number of D/A pins.
3.  **Generation:** Click "Generate Firmware". Verify the correct chipset is selected in the download.

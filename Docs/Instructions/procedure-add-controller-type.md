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
*   **Validation Schema:** `backend/src/modules/hardware/ControllerTemplateManager.ts` - Zod schema for validating JSON templates.

## 4. Steps (Algorithm)

### Step 1: Configure Firmware Generator
1.  Open `firmware/config/controllers.json`.
2.  Add a new object to the `controllers` array.

> [!IMPORTANT]
> **Schema Updates**
> If you are adding new fields to the JSON template that are not yet defined, you **MUST** update the Zod schema in `backend/src/modules/hardware/ControllerTemplateManager.ts` and the Mongoose schema in `backend/src/models/ControllerTemplate.ts`. Otherwise, the new fields will be stripped during validation.

```json
{
    "id": "arduino_mega",               // Unique ID (lowercase)
    "displayName": "Arduino Mega 2560",
    "chipset": "atmega2560",
    "communicationTypes": ["serial"],
    "capabilities": {
        "analogPins": 16,
        "digitalPins": 54,
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

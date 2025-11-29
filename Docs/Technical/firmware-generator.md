# Firmware Generator v5 Technical Documentation

## 1. Goal
To generate a compilable `.ino` firmware file for a specific hardware controller by combining a Board definition, a Transport method, and a set of selected Commands, ensuring all dependencies and capabilities are correctly included.

## 2. Scope
- **Included:**
    - Selection of Board (e.g., Wemos D1 Mini, Arduino Uno).
    - Selection of Transport (e.g., Serial, WiFi).
    - Selection of Commands (e.g., `DHT_READ`, `RELAY_SET`).
    - Dynamic generation of C++ code (includes, globals, setup, loop, dispatchers).
    - Automatic inclusion of capabilities in the `INFO` command.
    - **Device Compatibility Checks:** Validation of voltage, interface, and pin availability.
- **Excluded:**
    - Compilation of the firmware (done by user in Arduino IDE/PlatformIO).
    - Uploading to the device.

## 3. Definitions & Dependencies
- **FirmwareBuilder Service:** `backend/src/services/FirmwareBuilder.ts` - Core logic.
- **Definitions Repository:** `firmware/definitions/` - JSON templates for boards, transports, and commands.
- **Source Code:** `firmware/definitions/commands/src/` - C++ implementation files.
- **Frontend Wizard:** `frontend/src/components/firmware-builder/FirmwareBuilderWizard.tsx`.
- **Validation Logic:** `frontend/src/utils/firmwareValidation.ts`.

## 4. Architecture & Logic

### 4.1. Multi-Architecture Support
The system supports multiple hardware architectures (AVR, ESP8266, ESP32, Renesas) by dynamically resolving implementation files.
- **JSON Mapping:** Command definitions (e.g., `system_commands.json`) use a `functions` object to map architectures to files.
    ```json
    "functions": {
        "avr": "@file:commands/src/sys_avr.cpp",
        "renesas_uno": "@file:commands/src/sys_renesas.cpp",
        "esp8266": "@file:commands/src/sys_esp.cpp",
        "esp32": "@file:commands/src/sys_esp.cpp",
        "*": "@file:commands/src/sys_stub.cpp"
    }
    ```
- **Common Logic:** Shared code is extracted to `sys_common.cpp` and included where needed.

### 4.2. Device Compatibility & Validation
**File:** `frontend/src/utils/firmwareValidation.ts`

The system prevents invalid hardware configurations by validating three key constraints:

#### A. Voltage Compatibility
- **Source:** `BoardDefinition.electrical_specs.logic_voltage` (e.g., "5V").
- **Requirement:** `DeviceTemplate.requirements.voltage` (e.g., "3.3V", "3.3V-5V").
- **Logic:** Strict equality check, unless device supports a range. Mismatch disables the device.

#### B. Interface Availability
- **Source:** `BoardDefinition.interfaces` (e.g., `i2c: true`, `serial: { hardware: [...] }`).
- **Requirement:** `DeviceTemplate.requirements.interface` ("i2c", "uart").
- **Logic:**
    - **I2C:** Checks if board supports I2C.
    - **UART:** Checks if board has free Hardware UART ports. **Fallback:** If HW UARTs are full, checks for 2 free Digital Pins (SoftwareSerial).

#### C. Pin Budgeting
- **Source:** `BoardDefinition.pins` (counts for digital, analog).
- **Requirement:** `DeviceTemplate.requirements.pin_count` (e.g., `{ digital: 1 }`).
- **Logic:**
    - Tracks cumulative usage of `digital`, `analog`, `uart`, `i2c`.
    - **SoftwareSerial Fallback:** If a UART device uses SoftwareSerial, it consumes **2 Digital Pins**.
    - If usage > total available, device is disabled.

### 4.3. Recommended Pins
**File:** `backend/src/models/DeviceTemplate.ts`
- **Field:** `uiConfig.recommendedPins` (Array of strings, e.g., `["D0", "D1"]`).
- **Purpose:** Guides the user to optimal pins (e.g., Hardware UART pins) via the UI.

## 5. Steps (Algorithm)

### 5.1. Discovery & Selection Logic (Frontend)
1.  **Fetch Templates:** Frontend calls `/api/hardware/device-templates`.
2.  **Validate Compatibility:** Runs `checkCompatibility` for each device against the selected board.
3.  **Extract Commands:** Extracts `hardwareCmd` from compatible, selected devices.
4.  **Send Configuration:** Sends unique command IDs to backend.

### 5.2. Template Loading (Backend)
1.  **Load Board & Transport:** Reads JSON definitions.
2.  **Load Commands:** Reads command JSONs based on IDs.
3.  **Load System Commands:** Always loads `system_commands.json`.

### 5.3. Code Assembly (Backend)
1.  **Architecture Resolution:** Resolves `@file:` references based on board architecture.
2.  **Content Resolution:** Replaces placeholders (`{{BAUD_RATE}}`).
3.  **Capabilities Generation:** Generates `CAPABILITIES[]` array.
4.  **Skeleton Injection:** Injects code into `skeleton.ino`.

## 6. File Structure
```
firmware/
├── definitions/
│   ├── boards/             # Board definitions
│   ├── transports/         # Transport definitions
│   └── commands/           # Command definitions
│       ├── src/            # C++ implementation files
│       │   ├── sys_avr.cpp
│       │   ├── sys_renesas.cpp
│       │   ├── sys_common.cpp
│       │   └── ...
│       ├── system_commands.json
│       └── ...
backend/src/services/
└── FirmwareBuilder.ts      # Builder Logic
frontend/src/utils/
└── firmwareValidation.ts   # Validation Logic
```

## 7. Validations & Constraints (Nuances)
1.  **Case Sensitivity:** Command IDs must be **lowercase**. Capabilities are **UPPERCASE**.
2.  **SoftwareSerial:** Uno R3 has 1 HW UART (shared with USB). Sensors MUST use SoftwareSerial (Digital Pins) if USB is used. The validation logic accounts for this by allowing "spillover" to digital pins.
3.  **System Commands:** Must be processed last to ensure dispatcher visibility.

## 8. Integration Mapping Verification

| Concept | Frontend (UI) | Backend (Builder) | Firmware (C++) | Backend (HardwareService) |
| :--- | :--- | :--- | :--- | :--- |
| **Command ID** | `modbus_rtu_read` | `modbus_rtu_read` | N/A | `modbus_rtu_read` |
| **Capability** | N/A | `MODBUS_RTU_READ` | `CAPABILITIES[]` | `modbus_rtu_read` (Normalized) |
| **Baud Rate** | User Input | `{{BAUD_RATE}}` | `Serial.begin(115200)` | `controller.connection.baudRate` |
| **Requirements**| `requirements` obj| N/A | N/A | `DeviceTemplate.requirements` |

## 9. Critical Dependency: Device Templates
- **Requirement:** `requiredCommand` in `DeviceTemplate` MUST match Command Definition ID.
- **Requirement:** `requirements` object MUST be present for validation to work.

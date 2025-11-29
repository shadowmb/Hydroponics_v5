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
- **Excluded:**
    - Compilation of the firmware (done by user in Arduino IDE/PlatformIO).
    - Uploading to the device.

## 3. Definitions & Dependencies
- **FirmwareBuilder Service:** `backend/src/services/FirmwareBuilder.ts` - Core logic.
- **Definitions Repository:** `firmware/definitions/` - JSON templates for boards, transports, and commands.
- **Source Code:** `firmware/definitions/commands/src/` - C++ implementation files.
- **Frontend Wizard:** `frontend/src/components/firmware-builder/FirmwareBuilderWizard.tsx`.

## 4. Steps (Algorithm)

### 4.1. Discovery & Selection Logic (Frontend)
1.  **Fetch Templates:** Frontend calls `/api/hardware/device-templates` to get all available device types.
2.  **Extract Commands:**
    - Iterates through selected devices.
    - Extracts `requiredCommand` (e.g., `dht_read`) from the template.
    - Extracts `hardwareCmd` from `commands` object (e.g., `RELAY_SET`).
    - **Normalization:** Converts all extracted IDs to **lowercase**.
3.  **Send Configuration:** Sends the list of unique, lowercase command IDs to the backend.

### 4.2. Template Loading (Backend)
**File:** `backend/src/services/FirmwareBuilder.ts`
1.  **Load Board:** Reads `firmware/definitions/boards/<boardId>.json`.
2.  **Load Transport:** Reads `firmware/definitions/transports/<transportId>.json`.
3.  **Load Commands:**
    - Iterates through `commandIds`.
    - Reads `firmware/definitions/commands/<commandId>.json`.
    - **Error Handling:** If a file is missing, it logs a warning and skips it (preventing crash).
4.  **Load System Commands:** Always loads `firmware/definitions/commands/system_commands.json` (contains `PING`, `INFO`, `RESET`).

### 4.3. Code Assembly (Backend)
**File:** `backend/src/services/FirmwareBuilder.ts` -> `processCodeBlock()`

1.  **Architecture Resolution:**
    - For each code block (`includes`, `globals`, etc.), checks if it's an object.
    - **Priority:** 1. Exact Architecture Match (e.g., `esp8266`) -> 2. Wildcard (`*`) -> 3. Skip.

2.  **Content Resolution:**
    - **`@file:` Directive:** If a line starts with `@file:`, it reads the content from `firmware/definitions/<path>`.
    - **Placeholders:** Replaces `{{BAUD_RATE}}`, `{{WIFI_SSID}}`, etc., with values from `settings`.

3.  **Capabilities Generation:**
    - Filters out `system_commands`.
    - Maps remaining IDs to **UPPERCASE**.
    - Generates C++ code: `const char* CAPABILITIES[] = { "CMD1", "CMD2" };`

4.  **Skeleton Injection:**
    - Reads `firmware/templates/base/skeleton.ino`.
    - Injects accumulated code into `{{INCLUDES}}`, `{{GLOBALS}}`, `{{SETUP_CODE}}`, `{{LOOP_CODE}}`.
    - **Dispatcher Injection:** Injects `{{COMMAND_DISPATCHERS}}` into the `functions` block (specifically into `processCommand` function).

### 4.4. Response Generation
**Backend → Frontend**
1.  Return JSON: `{ success: true, data: { filename: string, content: string } }`.

## 5. File Structure
```
firmware/
├── definitions/
│   ├── boards/             # Board definitions (pins, architecture)
│   │   ├── wemos_d1_mini.json
│   │   └── ...
│   ├── transports/         # Communication logic (Serial, WiFi)
│   │   ├── serial_standard.json
│   │   └── ...
│   └── commands/           # Command definitions
│       ├── src/            # C++ implementation files (.cpp)
│       │   ├── system_commands.cpp
│       │   └── ...
│       ├── dht_read.json   # JSON metadata & file references
│       ├── system_commands.json
│       └── ...
backend/src/services/
└── FirmwareBuilder.ts      # Builder Logic
```

## 6. Validations & Constraints (Nuances)
1.  **Case Sensitivity (CRITICAL):**
    - **JSON Definitions:** Command IDs must be **lowercase** (e.g., `modbus_rtu_read.json`).
    - **Firmware Capabilities:** Generated as **UPPERCASE** in `INFO` response (e.g., `"MODBUS_RTU_READ"`).
    - **Backend Storage:** `HardwareService` normalizes `INFO` capabilities to **lowercase** before saving to DB.
2.  **File References:**
    - `@file:` paths in JSON must be relative to `firmware/definitions/`.
    - Example: `@file:commands/src/my_command.cpp`.
3.  **System Commands:**
    - `system_commands` must always be processed **last** by the builder.
    - This ensures the `processCommand` function (in `system_commands.cpp`) can see all other dispatcher functions declared before it.

## 7. Integration Mapping Verification

| Concept | Frontend (UI) | Backend (Builder) | Firmware (C++) | Backend (HardwareService) |
| :--- | :--- | :--- | :--- | :--- |
| **Command ID** | `modbus_rtu_read` | `modbus_rtu_read` | N/A | `modbus_rtu_read` |
| **Capability** | N/A | `MODBUS_RTU_READ` | `CAPABILITIES[]` | `modbus_rtu_read` (Normalized) |
| **Baud Rate** | User Input | `{{BAUD_RATE}}` | `Serial.begin(115200)` | `controller.connection.baudRate` |

## 8. Expected Outcome
- A valid `.ino` file containing a complete C++ program.
- The `INFO` command returns `{"capabilities": ["COMMAND_1", "COMMAND_2"]}`.
- The firmware compiles without errors in Arduino IDE.

## 9. Test Scenarios
1.  **Generate & Build:**
    - Select Wemos D1 Mini + Serial + DHT_READ.
    - Generate firmware.
    - Verify `CAPABILITIES` array contains `"DHT_READ"`.
2.  **Capabilities Check:**
    - Flash firmware.
    - Send `INFO` via Serial Monitor.
    - Expect: `{"ok":1, ..., "capabilities":["DHT_READ"]}`.
3.  **Backend Sync:**
    - Connect Controller to Backend.
    - Backend logs: `✨ [HardwareService] Capabilities Updated`.
    - DB Record: `capabilities: ["dht_read"]`.

## 10. Critical Dependency: Device Templates
The Firmware Builder relies on `DeviceTemplate` configurations to determine which commands to include.
- **Requirement:** The `requiredCommand` (or `commands.*.hardwareCmd`) in the `DeviceTemplate` (DB/Seed) **MUST** match the `id` of the Command Definition JSON file.
- **Example:**
    - If `firmware/definitions/commands/dht_read.json` exists (ID: `dht_read`).
    - Then `backend/src/utils/seedDeviceTemplates.ts` MUST use `requiredCommand: 'dht_read'`.
    - **Failure to match (e.g., using legacy `SINGLE_WIRE_PULSE`) will cause the device to appear as "Disabled" in the Builder UI.**

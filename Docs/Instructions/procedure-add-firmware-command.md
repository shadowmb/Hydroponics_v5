# Procedure: Add New Firmware Command (v5)

## 1. Goal
Implement a new low-level command (e.g., `modbus_rtu_read`) in the C++ firmware generator and enable the backend to send it.

## 2. Scope
*   **Included:** C++ implementation, JSON Definition, Backend serialization.
*   **Excluded:** Creating the Device Driver (see `procedure-add-device-type.md`).

## 3. Definitions & Dependencies
*   **Command Definition:** A `.json` file in `firmware/definitions/commands/` defining the command metadata and code structure.
*   **Source Code:** A `.cpp` file in `firmware/definitions/commands/src/` containing the actual logic.
*   **FirmwareBuilder:** `backend/src/services/FirmwareBuilder.ts` which assembles these files.
*   **Technical Reference:** `Docs/Technical/firmware-generator.md` - **READ THIS** for deep details on how the generator processes these files (case sensitivity, placeholders, etc.).

## 4. Steps (Algorithm)

### Step 1: Create C++ Implementation
1.  Create `firmware/definitions/commands/src/<command_name>.cpp`.
2.  Implement the logic. You can use standard C++ functions.
3.  **Dispatcher:** You must create a function that handles the command parsing.

```cpp
// firmware/definitions/commands/src/my_command.cpp

#include <Arduino.h>

// Helper function (optional)
int myHelper(int val) {
    return val * 2;
}

// Main Handler
String handleMyCommand(char* params) {
    // params contains everything AFTER the command name and pipe
    // e.g. "MY_CMD|123" -> params = "123"
    
    if (!params) return "{\"ok\":0,\"error\":\"MISSING_PARAMS\"}";
    
    int val = atoi(params);
    return "{\"ok\":1,\"val\":" + String(myHelper(val)) + "}";
}

// TIP: If your command accepts a PIN, use the global helper:
// int pin = parsePin(String(params)); // Handles "D2", "D2_25", "A0" etc.
// if (pin == -1) return "{\"ok\":0,\"error\":\"ERR_INVALID_PIN\"}";
```

### Step 2: Create JSON Definition
1.  Create `firmware/definitions/commands/<command_name>.json`.
2.  **CRITICAL:** The filename (minus extension) is the **Command ID**. Use **lowercase** (e.g., `my_command.json`).
3.  Define the code blocks. Use `@file:` to reference your C++ file.

```json
{
    "id": "my_command",
    "name": "My Command",
    "description": "Reads data from My Sensor",
    "code": {
        "includes": [
            "// My Command Includes",
            "#include <Wire.h>"
        ],
        "globals": "int myGlobalVar = 0;",
        "functions": "@file:commands/src/my_command.cpp",
        "dispatcher": "else if (strcmp(cmd, \"MY_COMMAND\") == 0) { return handleMyCommand(delimiter ? delimiter + 1 : NULL); }"
    }
}
```

> [!IMPORTANT]
> **Dispatcher Logic**
> The `dispatcher` string is injected into the main `processCommand` function.
> *   `cmd`: The command string (e.g., "MY_COMMAND").
> *   `delimiter`: Pointer to the first `|` character.
> *   `cmdBuffer`: The full raw buffer.
>
> Ensure your `strcmp` matches the **UPPERCASE** command name sent by the backend.

### Step 3: Implement Backend Serialization
1.  **Serial:** Open `backend/src/modules/hardware/transports/SerialTransport.ts`.
2.  **UDP:** Open `backend/src/modules/hardware/transports/UdpTransport.ts`.
3.  Locate the `send(packet)` method in **BOTH** files.
4.  Add logic to format the command string.

```typescript
else if (packet.cmd === 'MY_COMMAND') {
    // Format: "MY_COMMAND|PARAM1"
    if (!packet.param1) throw new Error('Missing Param1');
    message += `|${packet.param1}`; 
}
```

## 5. File Structure
```
firmware/definitions/
├── commands/
│   ├── src/
│   │   └── my_command.cpp       <-- NEW (Implementation)
│   └── my_command.json          <-- NEW (Definition)
backend/src/modules/hardware/transports/
├── SerialTransport.ts           <-- EDIT (Serialization)
└── UdpTransport.ts              <-- EDIT (Serialization)
```

## 6. Validations & Constraints
1.  **Case Sensitivity:**
    - **Filename/ID:** Lowercase (`my_command`).
    - **Dispatcher Check:** Uppercase (`"MY_COMMAND"`).
    - **Backend Packet Cmd:** Uppercase (`'MY_COMMAND'`).
2.  **File Paths:** `@file:` paths are relative to `firmware/definitions/`.
3.  **JSON Validity:** Ensure the `.json` file is valid. Use a linter.

## 7. Integration Mapping Verification (CRITICAL)

| Parameter | Backend Source (`SerialTransport.ts`) | Firmware Dispatcher (`.json`) | Firmware Implementation (`.cpp`) |
| :--- | :--- | :--- | :--- |
| **Command** | `packet.cmd` ('MY_CMD') | `strcmp(cmd, "MY_CMD")` | N/A |
| **Payload** | `message += "\|123"` | `delimiter ? delimiter + 1 : NULL` | `handleMyCommand("123")` |

## 8. Test Scenarios
1.  **Generation:**
    - Add a device using this command.
    - Generate firmware.
    - Verify `my_command.cpp` content is included in the `.ino` file.
    - Verify `dispatcher` logic is present in `processCommand`.
2.  **Compilation:** Verify firmware compiles in Arduino IDE.
3.  **Execution:** Send `MY_COMMAND|123` via Serial Monitor. Verify JSON response.

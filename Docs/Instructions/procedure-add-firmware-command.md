# Procedure: Add New Firmware Command

## 1. Goal
Implement a new low-level command (e.g., `MY_PROTOCOL_READ`) in the C++ firmware generator and enable the backend to send it.

## 2. Scope
*   **Included:** C++ implementation, Generator configuration, Backend serialization.
*   **Excluded:** Creating the Device Driver JSON (see `procedure-add-device-type.md`).

## 3. Definitions & Dependencies
*   **Command Module:** A `.ino` file in `firmware/templates/commands/` containing the C++ logic.
*   **Generator Config:** `firmware/config/commands.json` registry.
*   **SerialTransport:** `backend/src/modules/hardware/transports/SerialTransport.ts` handles string formatting.

## 4. Steps (Algorithm)

### Step 1: Create C++ Implementation
1.  Create `firmware/templates/commands/<command_name>.ino`.
2.  **CRITICAL:** Use the exact structure below (Regex depends on it).

```cpp
/*
 * MY_COMMAND Command Module
 */

// === INCLUDES ===
// #include <Wire.h>

// === GLOBALS ===
// int myGlobal = 0;

// === DISPATCHER ===
else if (strcmp(cmd, "MY_COMMAND") == 0) {
  return handleMyCommand(delimiter ? delimiter + 1 : NULL);
}

// === FUNCTIONS ===
String handleMyCommand(const char* params) {
  // Use global parsePin(String) for pins!
  // int pin = parsePin(paramString);
  return "{\"ok\":1,\"val\":100}";
}
```

> [!CAUTION]
> **Strict Section Markers Required**
> The Firmware Generator uses Regex to extract code. You **MUST** use these exact markers (case-sensitive, with spaces):
> 1. `// === INCLUDES ===`
> 2. `// === GLOBALS ===`
> 3. `// === DISPATCHER ===`
> 4. `// === FUNCTIONS ===`
>
> **Do NOT use:** `// === HELPER FUNCTIONS ===`, `//===INCLUDES===`, or any other variation. The generator will fail silently or produce broken firmware.

### Step 2: Register in Generator
1.  Open `firmware/config/commands.json`.
2.  Add a new object to the `commands` array:

```json
{
    "name": "MY_COMMAND",
    "displayName": "My Command",
    "category": "sensors",
    "syntax": "MY_COMMAND|{pin}",
    "templateFile": { "serial": "my_command.ino", "wifi": "my_command.ino" },
    "isActive": true
}
```

### Step 3: Implement Backend Serialization
1.  **Serial:** Open `backend/src/modules/hardware/transports/SerialTransport.ts`.
2.  **UDP:** Open `backend/src/modules/hardware/transports/UdpTransport.ts`.
3.  Locate the `send(packet)` method in **BOTH** files.
4.  Add logic to format the command string.

```typescript
else if (packet.cmd === 'MY_COMMAND') {
    // MUST match C++ expectation: "MY_COMMAND|PIN"
    if (!packet.pins || packet.pins.length === 0) throw new Error('Missing Pin');
    const pin = packet.pins[0];
    message += `|${pin.portId}_${pin.gpio}`; 
}
```

## 5. File Structure
```
firmware/
├── config/
│   └── commands.json
└── templates/
    └── commands/
        └── <command_name>.ino  <-- NEW
backend/
└── src/
    └── modules/
        └── hardware/
            └── transports/
                └── SerialTransport.ts <-- EDIT
```

## 6. Validations & Constraints
*   **Pin Parsing:** Always use `parsePin()` in C++. Do NOT use `atoi()`.
*   **JSON Response:** Firmware MUST return valid JSON (e.g., `{"ok":1}`).
*   **Unique Name:** Command name must be unique in `commands.json`.

## 7. Integration Mapping Verification (CRITICAL)
You **MUST** verify that the string constructed in Backend matches the C++ parser.

| Parameter | Backend Source (`SerialTransport.ts`) | C++ Expectation (`.ino`) |
| :--- | :--- | :--- |
| **Command** | `packet.cmd` ('MY_CMD') | `strcmp(cmd, "MY_CMD")` |
| **Arg 1** | `packet.pins[0]` ('D2_2') | `parsePin(params)` |
| **Arg 2** | `packet.param1` | `strtok(params, "|")` |

> [!WARNING]
> **Serialization Mismatch**
> If `SerialTransport` sends `MY_CMD|123` but C++ expects `MY_CMD|PIN|123`, the command will fail silently or return garbage. **Check the delimiters!**

## 8. Test Scenarios
1.  **Generation:** Create a controller with the new command. Download firmware. Check `.ino` for injected code.
2.  **Compilation:** Verify firmware compiles in Arduino IDE.
3.  **Execution:** Send command via Serial Monitor (`MY_CMD|...`). Verify JSON response.

# Add New Firmware Command - Procedure

This guide describes how to add a new low-level command to the firmware generator and backend system.
Use this when you need to support a new hardware protocol or sensor type that isn't covered by existing commands (like `ANALOG`, `DHT`, `I2C`).

## 3 Required Steps

### STEP 1: C++ Implementation (Firmware Template)

**File:** `firmware/templates/commands/<command_name>.ino`

Create a new `.ino` file. This file **MUST** follow a strict structure with specific comment markers, as the generator uses Regex to extract sections.

**Structure:**

```cpp
/*
 * MY_COMMAND Command Module
 * Description of what it does.
 */

// === INCLUDES ===
// Add libraries here, e.g.:
// #include <SomeLibrary.h>

// === GLOBALS ===
// Add global variables here (use unique names to avoid collisions)
// SomeLibrary mySensor;

// === DISPATCHER ===
// This snippet is injected into the main loop's command parser.
// 'cmd' is the command string (e.g., "MY_COMMAND")
// 'delimiter' points to the first pipe '|' character
else if (strcmp(cmd, "MY_COMMAND") == 0) {
  return handleMyCommand(delimiter ? delimiter + 1 : NULL);
}

// === FUNCTIONS ===
// Implement your logic here.
String handleMyCommand(const char* params) {
  // 1. Parse Parameters (if any)
  // params string will be "PARAM1|PARAM2"
  
  // 2. Execute Logic
  int result = 42;

  // 3. Return JSON Response
  // Must return a String with JSON
  return "{\"ok\":1,\"value\":" + String(result) + "}";
}
```

---

### STEP 2: Configuration (Generator Metadata)

**File:** `firmware/config/commands.json`

Add a new entry to the `commands` array. This tells the generator how to use your template.

```json
{
    "name": "MY_COMMAND",               // MUST match the string in strcmp() in Step 1
    "displayName": "My Custom Command",
    "description": "Does something cool",
    "category": "sensors",
    "commandFormat": "delimited",
    "syntax": "MY_COMMAND|{param1}",
    "example": "MY_COMMAND|123",
    "response": {
        "success": "{\"ok\":1,\"value\":42}",
        "error": "{\"ok\":0,\"error\":\"ERR_FAIL\"}"
    },
    "parameters": [
        {
            "name": "param1",
            "type": "integer",
            "required": true,
            "description": "Some parameter",
            "validation": "^[0-9]+$",
            "example": "123"
        }
    ],
    "memoryFootprint": {
        "flash": 500,                   // Estimate in bytes
        "sram": 50
    },
    "requiredLibraries": [],            // e.g. ["Wire"]
    "sensorFamily": "CUSTOM",
    "primitives": ["MY_PRIMITIVE"],
    "templateFile": {
        "serial": "my_command.ino",     // Filename from Step 1
        "wifi": "my_command.ino"
    },
    "isActive": true
}
```

---

### STEP 3: Backend Serialization (Transport Layer)

**File:** `backend/src/modules/hardware/transports/SerialTransport.ts`

You must teach the backend how to format the command string before sending it to the serial port.
Locate the `send(packet)` method and add your command to the serialization logic.

```typescript
// Inside send() method:

else if (packet.cmd === 'MY_COMMAND') {
    // Format: MY_COMMAND|PARAM1
    if (packet.param1 !== undefined) message += `|${packet.param1}`;
}
```

---

## Verification

1.  **Regenerate Firmware:**
    *   Go to the Frontend -> Controllers -> Create New.
    *   Select a controller and add a device that uses your new command.
    *   Download the firmware.
2.  **Inspect Code:**
    *   Open the downloaded `.ino` file.
    *   Verify your `// === FUNCTIONS ===` are at the bottom.
    *   Verify your `// === DISPATCHER ===` logic is inside `processCommand()`.
3.  **Test:**
    *   Upload to Arduino.
    *   Send `MY_COMMAND|123` via Serial Monitor.
    *   Verify JSON response.

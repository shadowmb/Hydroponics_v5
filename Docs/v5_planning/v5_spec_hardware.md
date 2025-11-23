# Hydroponics v5 - Hardware Specification

**Status**: Draft
**Protocol**: JSON-over-Serial (Newline Delimited)
**Baud Rate**: 115200

## 1. Communication Protocol (Serial)

### 1.1. Request Format (Host -> MCU)
Every command sent to the Arduino must follow this JSON structure.

```json
{
  "id": "req_123",      // Correlation ID (Optional but recommended)
  "cmd": "RELAY",       // Command Name (Mapped to C++ function)
  "pin": 13,            // Target Pin (Optional)
  "state": 1,           // Value (0/1 for Digital, 0-255 for PWM)
  "params": {           // Extra parameters for complex drivers
    "addr": "0x27"
  }
}
```

### 1.2. Response Format (MCU -> Host)
Every line received from the Arduino is parsed as JSON.

```json
{
  "id": "req_123",      // Matches Request ID
  "status": "ok",       // "ok" or "error"
  "data": {             // Result payload
    "value": 24.5,
    "unit": "C"
  },
  "error": "Invalid Pin" // Only if status="error"
}
```

### 1.3. System Messages
Asynchronous messages sent by the MCU (not in response to a request).

*   **Boot**: `{"type":"boot", "msg":"Hydroponics v5 Ready", "caps":["RELAY", "DHT"]}`
*   **Log**: `{"type":"log", "level":"info", "msg":"Pump started"}`

---

## 2. Device Templates (Drivers)
JSON files that define how to talk to specific hardware. Located in `/config/devices/`.

### 2.1. Structure (`relay_active_low.json`)
```json
{
  "id": "relay_active_low",
  "name": "Relay Module (Active Low)",
  "category": "ACTUATOR",
  "capabilities": ["DIGITAL_WRITE"],
  "commands": {
    "ON": {
      "hardwareCmd": "DIGITAL_WRITE",
      "params": { "state": 0 } // Inverted logic defined here
    },
    "OFF": {
      "hardwareCmd": "DIGITAL_WRITE",
      "params": { "state": 1 }
    }
  },
  "pins": [
    { "name": "Signal", "type": "DIGITAL_OUT" }
  ]
}
```

### 2.2. Structure (`dht11.json`)
```json
{
  "id": "dht11",
  "name": "DHT11 Temp/Humidity",
  "category": "SENSOR",
  "capabilities": ["DHT_READ"],
  "commands": {
    "READ": {
      "hardwareCmd": "DHT_READ",
      "params": { "type": 11 }
    }
  },
  "pins": [
    { "name": "Data", "type": "DIGITAL_IN" }
  ]
}
```

---

## 3. Command Mapping (The Translation Layer)
How the system translates a high-level "Business Command" to a "Hardware Command".

**Scenario**: User clicks "Turn On Pump" (Device ID: `pump_1`).

1.  **Lookup**: System finds `pump_1`.
    *   `driverId`: `relay_active_low`
    *   `pin`: 4
2.  **Template**: System loads `relay_active_low.json`.
3.  **Translation**:
    *   Business Command: `ON`
    *   Template Mapping: `ON` -> `DIGITAL_WRITE` with `state: 0`.
4.  **Execution**:
    *   Construct JSON: `{"cmd": "DIGITAL_WRITE", "pin": 4, "state": 0}`
    *   Send to Serial Port.

---

## 4. Firmware Modules (C++)
The Arduino firmware is composed of small modules corresponding to `capabilities`.

*   **Core**: `main.ino` (JSON Parser, Serial Loop).
*   **Module**: `cmd_digital.ino` (Handles `DIGITAL_WRITE`, `DIGITAL_READ`).
*   **Module**: `cmd_dht.ino` (Handles `DHT_READ`).

The **Firmware Generator** will combine `main.ino` + selected modules based on the connected devices.

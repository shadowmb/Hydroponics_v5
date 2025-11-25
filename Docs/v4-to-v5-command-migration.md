# v4 to v5 Command Migration Map

## Command Renaming

| v4 Command | v5 Command | Reason | Format Change |
|------------|------------|--------|---------------|
| `SINGLE_WIRE_PULSE` | `DHT_READ` | More descriptive, protocol-agnostic name | JSON → Delimited |
| `SINGLE_WIRE_ONEWIRE` | `ONEWIRE_READ_TEMP` | Clearer purpose (temperature reading) | JSON → Delimited |
| `PULSE_MEASURE` | `ULTRASONIC_TRIG_ECHO` | Describes the protocol, not the measurement | JSON → Delimited |
| `PULSE_COUNT` | `MEASURE_PULSE_RATE` | Matches MCU primitive naming | JSON → Delimited |
| `UART_STREAM_READ` | `UART_READ_DISTANCE` | Specific to distance sensors (main use case) | JSON → Delimited |
| `ANALOG` | `ANALOG` | ✅ No change | JSON → Delimited |
| `ANALOG_ALL` | `ANALOG_ALL` | ✅ No change | JSON → Delimited |
| `SET_PIN` | `SET_PIN` | ✅ No change | JSON → Delimited |
| `READ` | `READ` | ✅ No change | JSON → Delimited |
| `MODBUS_RTU_READ` | `MODBUS_RTU_READ` | ✅ No change | JSON (complex params) |

## Command Format Changes

### Simple Commands (JSON → Delimited Text)

#### ANALOG
**v4:**
```json
{"cmd": "ANALOG", "pin": "A0"}
```

**v5:**
```
ANALOG|A0
```

**Response (unchanged):**
```json
{"ok": 1, "value": 512}
```

---

#### DHT_READ (was SINGLE_WIRE_PULSE)
**v4:**
```json
{
  "cmd": "SINGLE_WIRE_PULSE",
  "dataPin": 4,
  "startLowDuration": 18000,
  "startHighDuration": 40,
  "bitThreshold": 40,
  "numBits": 40,
  "timeout": 5000
}
```

**v5:**
```
DHT_READ|D4
```

**Response:**
```json
{"ok": 1, "temp": 22.5, "humidity": 65.3}
```

**Note:** Default parameters are built into firmware. Backend handles DHT22 data parsing.

---

#### ONEWIRE_READ_TEMP (was SINGLE_WIRE_ONEWIRE)
**v4:**
```json
{
  "cmd": "SINGLE_WIRE_ONEWIRE",
  "dataPin": 5,
  "timeout": 5000
}
```

**v5:**
```
ONEWIRE_READ_TEMP|D5
```

**Response:**
```json
{"ok": 1, "temp": 18.75}
```

**Note:** Backend handles DS18B20 scratchpad parsing and temperature conversion.

---

#### ULTRASONIC_TRIG_ECHO (was PULSE_MEASURE)
**v4:**
```json
{
  "cmd": "PULSE_MEASURE",
  "triggerPin": 7,
  "echoPin": 8
}
```

**v5:**
```
ULTRASONIC_TRIG_ECHO|D7
```

**Response:**
```json
{"ok": 1, "distance": 245}
```

**Note:** Single pin for both trigger and echo (multiplexed). Backend converts pulse duration to cm.

---

#### MEASURE_PULSE_RATE (was PULSE_COUNT)
**v4:**
```json
{
  "cmd": "PULSE_COUNT",
  "pin": 3,
  "measurementTime": 5000,
  "pullupEnabled": true,
  "timeout": 10000
}
```

**v5:**
```
MEASURE_PULSE_RATE|D3|1000
```

**Response:**
```json
{"ok": 1, "pulses": 150}
```

**Note:** Format is `pin|duration_ms`. Backend converts pulses to L/h.

---

#### UART_READ_DISTANCE (was UART_STREAM_READ)
**v4:**
```json
{
  "cmd": "UART_STREAM_READ",
  "rxPin": 2,
  "txPin": 3,
  "baudRate": 9600,
  "frameLength": 4,
  "headerByte": 255,
  "checksumType": "sum",
  "timeout": 1000
}
```

**v5:**
```
UART_READ_DISTANCE|1
```

**Response:**
```json
{"ok": 1, "distance": 245}
```

**Note:** UART port number (1, 2, 3...). Sensor-specific parameters are built into firmware template.

---

### Complex Commands (Keep JSON)

#### MODBUS_RTU_READ
**v4:**
```json
{
  "cmd": "MODBUS_RTU_READ",
  "rxPin": 2,
  "txPin": 3,
  "baudRate": 4800,
  "deviceAddress": 1,
  "functionCode": 3,
  "registerAddress": 0,
  "registerCount": 2,
  "timeout": 500
}
```

**v5:**
```
MODBUS_RTU_READ|{"deviceAddress":1,"functionCode":3,"registerAddress":0,"registerCount":2}
```

**Response (unchanged):**
```json
{"ok": 1, "registers": [1234, 5678]}
```

**Note:** Hardware UART pins are configured in firmware. Only Modbus parameters are sent at runtime.

---

## Error Response Changes

### v4 Error Format
```json
{"ok": 0, "error": "Invalid analog pin (use A0-A5)"}
```

### v5 Error Format
```json
{"ok": 0, "error": "ERR_INVALID_PIN"}
```

**Optional details:**
```json
{"ok": 0, "error": "ERR_INVALID_PIN", "details": "A0-A5"}
```

---

## Pin Naming Standardization

### v4 (Mixed)
- Analog commands: String (`"A0"`)
- Digital commands: Integer (`4`)

### v5 (Unified)
- **All commands: String format**
  - Analog: `"A0"`, `"A1"`, ..., `"A5"`
  - Digital: `"D2"`, `"D3"`, ..., `"D13"`

---

## Backward Compatibility

**v5 firmware will NOT be backward compatible with v4 backend.**

Migration path:
1. Update backend to v5 command format
2. Generate and upload v5 firmware to controllers
3. Test each controller individually before full deployment

**No dual-mode support** – cleaner codebase, easier maintenance.

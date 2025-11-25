# v5 Firmware Generator: Quick Reference

## UI Location
**Hardware Management Page** → "Generate Firmware" button (next to "Scan Network")

---

## Wizard Flow

### Step 1: Controller Selection
- Select controller type (Arduino Uno, NodeMCU, ESP32, etc.)
- Choose communication (Serial/WiFi)
- ✅ Base template validation (auto-disable unavailable options)

### Step 2: Command Selection
- Checkbox list with compatibility indicators:
  - ✅ **Compatible** - Enabled, recommended
  - ⚠️ **Not Recommended** - Enabled with warning tooltip
  - ❌ **Incompatible** - Disabled with reason tooltip
- Real-time memory usage display
- Optional preset configurations

### Step 3: Generate & Download
- Preview filename
- Download .ino file
- Copy to clipboard option
- Upload instructions

---

## Command Compatibility Rules

### Arduino Uno R3/R4
- ✅ ANALOG, DHT_READ, ONEWIRE_READ_TEMP, ULTRASONIC_TRIG_ECHO
- ⚠️ MEASURE_PULSE_RATE (OK for 1-2 sensors)
- ❌ UART_READ_DISTANCE (needs dedicated UART)
- ❌ MODBUS_RTU_READ (SoftwareSerial unreliable)

### ESP32 / FireBeetle 2
- ✅ All commands supported
- Recommended for UART_READ_DISTANCE and MODBUS_RTU_READ

### NodeMCU Amica V2
- ✅ Most commands
- ⚠️ DHT_READ (timing sensitive, test thoroughly)

---

## Backend API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/firmware/controllers` | GET | List controllers with compatibility |
| `/api/firmware/commands` | GET | List commands with metadata |
| `/api/firmware/validate` | POST | Validate controller+commands |
| `/api/firmware/generate` | POST | Generate .ino file |

---

## File Structure

```
backend/config/
├── sensor-families.json    # Sensor family → command mapping
├── error-codes.json        # Standardized error codes
├── controllers.json        # Controller definitions + compatibility
└── commands.json           # Command metadata

_legacy_v4/Arduino/templates/
├── base/
│   ├── arduino_uno_serial_base.ino
│   ├── nodemcu_amica_v2_wifi_base.ino
│   └── ...
└── commands/
    ├── serial/
    │   ├── analog.ino
    │   ├── dht_read.ino
    │   └── ...
    └── wifi/
        └── (same commands)
```

---

## Memory Footprint Reference

| Command | Flash (bytes) | SRAM (bytes) |
|---------|---------------|--------------|
| ANALOG | ~200 | ~50 |
| DHT_READ | ~800 | ~150 |
| ONEWIRE_READ_TEMP | ~600 | ~100 |
| ULTRASONIC_TRIG_ECHO | ~300 | ~60 |
| MEASURE_PULSE_RATE | ~400 | ~80 |
| UART_READ_DISTANCE | ~1200 | ~200 |
| MODBUS_RTU_READ | ~2500 | ~400 |

**Base template overhead:** ~3000 bytes Flash, ~800 bytes SRAM

---

## Next Steps After Generation

1. Open Arduino IDE
2. Install required libraries (if any)
3. Select correct board and port
4. Upload firmware
5. Return to Hardware Management
6. Add controller to system
7. Test commands via Serial Monitor or UDP

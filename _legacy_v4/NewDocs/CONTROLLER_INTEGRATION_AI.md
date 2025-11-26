# Physical Controller Integration - Complete Guide
*For AI Assistant - Internal Documentation*
*Generated: 2025-10-06 | Universal Controller Integration*

## Quick Integration Checklist

**Adding new physical controller type (e.g., Arduino Uno R4 WiFi):**
1. Research controller specifications (datasheet/wiki)
2. Add controller pins to `controller-templates.json` (frontend)
3. Add controller type to `PhysicalController.ts` model (backend)
4. Add controller to `generator-config.json` (Arduino generator)
5. Verify adapter compatibility (HTTP/Serial)

## Step-by-Step Integration Process

### Step 0: Research Controller Specifications

**Action**: Locate and extract pin layout and technical specifications

**Sources**:
- Official manufacturer datasheet
- Product wiki pages (e.g., wiki.dfrobot.com)
- Arduino pinout diagrams
- Community documentation

**Required Information**:
- All GPIO pin numbers and their Arduino aliases (D2, A0, etc.)
- Pin capabilities: digital, analog (ADC), PWM, special functions
- Reserved/strapping pins (boot, flash, USB)
- Communication pins: I2C (SDA/SCL), SPI (MISO/MOSI/SCK), UART (TX/RX)
- Input-only pins (common on ESP32: GPIO34-39)
- Onboard components using pins (LEDs, buttons, RGB LEDs)
- Communication methods supported (WiFi, Bluetooth, Serial)
- Chipset information (ATmega328P, ESP32, ESP8266, etc.)

**Note**: For ESP32 boards, watch for input-only analog pins (GPIO34-39) - mark these as `"type": "analog"` NOT `"type": "digital"`.

### Step 1: Define Controller Pin Configuration
**File**: `/frontend/src/pages/assets/data/controller-templates.json`

**Action**: Add new controller entry with complete pin mapping

**Template Structure**:
```json
{
  "Controller_Type_Name": {
    "label": "Human Readable Name",
    "communication_by": ["wifi", "serial", "bluetooth"],
    "communication_type": ["http", "raw_serial", "mqtt", "websocket"],
    "ports": [
      {
        "id": "D2",
        "label": "Digital Pin 2",
        "type": "digital",
        "reserved": false,
        "pwm": false
      },
      {
        "id": "A0",
        "label": "Analog Pin A0",
        "type": "analog",
        "max_voltage": 5.0
      }
    ]
  }
}
```

**Port Configuration Rules**:
- `id`: Pin identifier used in system (e.g., "D2", "A0", "GPIO5")
- `label`: Display name in UI
- `type`: "digital" or "analog"
- `reserved`: true if pin unavailable for user devices (TX/RX, I2C, etc.)
- `pwm`: true if pin supports PWM (optional)
- `max_voltage`: Analog reference voltage (optional, default 5V)

**Pin Naming Convention**:
- Arduino boards: Use "D" prefix for digital (D2, D13), "A" prefix for analog (A0, A5)
- ESP32 boards: Use "GPIO" prefix (GPIO0, GPIO21, GPIO34)
- ESP8266 boards: Use "D" notation (D0, D1, D8)

**Common Reserved Pins**:
- Serial/USB: D0 (RX), D1 (TX) or GPIO1 (TX), GPIO3 (RX)
- I2C: A4 (SDA), A5 (SCL) for Arduino / GPIO21 (SDA), GPIO22 (SCL) for ESP32
- SPI: MISO, MOSI, SCK, SS pins
- Boot/Flash/Strapping: GPIO0 (ESP32/ESP8266), other controller-specific pins
- Onboard components: LEDs, buttons, RGB LEDs (e.g., GPIO5 on FireBeetle ESP32-E)

**Special Pin Types**:
- **Input-only pins** (ESP32 GPIO34-39): Set `"type": "analog"`, cannot be outputs or use PWM
- **Touch sensor pins**: Can be used as digital but have capacitive touch capability
- **DAC pins**: Can output analog voltage (ESP32 GPIO25, GPIO26)

### Step 2: Update Backend Model
**File**: `/backend/src/models/PhysicalController.ts`

**Action**: Add controller type to TypeScript interface and MongoDB schema

**Interface Update** (line ~5):
```typescript
type: 'Arduino_Uno' | 'ESP32' | 'WeMos_D1_R2' | 'New_Controller_Type'
```

**Schema Enum Update** (line ~54):
```typescript
enum: ['Arduino_Uno', 'ESP32', 'WeMos_D1_R2', 'New_Controller_Type']
```

### Step 3: Verify Adapter Compatibility
**Directory**: `/backend/src/adapters/`
**Existing Adapters**:
- `SerialControllerAdapter.ts` - For `communicationType: 'raw_serial'`
- `HttpControllerAdapter.ts` - For `communicationType: 'http'`

**Action**: Determine which adapter to use based on controller communication

**HTTP Controllers** (WiFi-based):
- Uses `HttpControllerAdapter`
- Requires controller firmware with HTTP API endpoints
- Example: WeMos D1 R2, Arduino Uno R4 WiFi
- Communication config: `{ ip_address: '192.168.x.x', port: 80 }`

**Serial Controllers** (USB/UART):
- Uses `SerialControllerAdapter`
- Direct serial communication (9600/115200 baud)
- Example: Arduino Uno R3, Arduino Nano
- Communication config: `{ port: '/dev/ttyUSB0', baudRate: 9600 }`

**No adapter changes needed** if controller uses existing protocols. System automatically routes based on `communicationType`.

### Step 4: Update Arduino Generator Config
**File**: `/Arduino/generator-config.json`

**Action**: Add controller entry to enable Arduino code generation

**Template Structure**:
```json
{
  "id": "controller_id",
  "displayName": "Human Readable Name",
  "communicationTypes": ["serial", "wifi"],
  "chipset": "ATmega328P",
  "isActive": true
}
```

**Configuration Fields**:
- `id`: Unique identifier in snake_case (e.g., "arduino_nano", "firebeetle_esp32_e")
- `displayName`: Human-readable name shown in generator UI
- `communicationTypes`: Array of supported communication methods
  - `"serial"` for USB/UART controllers
  - `"wifi"` for WiFi-enabled controllers
  - Can include both if controller supports multiple modes
- `chipset`: Processor/module name (e.g., "ATmega328P", "ESP32-WROOM-32E", "ESP8266")
- `isActive`: Set to `true` to enable in generator, `false` to hide
- `incompatibleCommands`: Array of command names that cannot run on this controller architecture

**Example Entries**:
```json
// Arduino Nano (AVR - no ESP macros)
{
  "id": "arduino_nano",
  "displayName": "Arduino Nano V3",
  "communicationTypes": ["serial"],
  "chipset": "ATmega328P",
  "isActive": true,
  "incompatibleCommands": ["PULSE_COUNT"]
}

// FireBeetle ESP32-E (all commands work)
{
  "id": "firebeetle_esp32_e",
  "displayName": "FireBeetle 2 ESP32-E",
  "communicationTypes": ["wifi", "serial"],
  "chipset": "ESP32-WROOM-32E",
  "isActive": true,
  "incompatibleCommands": []
}

// Arduino Uno R4 WiFi (Renesas - no SoftwareSerial, no ESP macros)
{
  "id": "arduino_uno_r4_wifi",
  "displayName": "Arduino Uno R4 WiFi",
  "communicationTypes": ["wifi", "serial"],
  "chipset": "Renesas RA4M1 + ESP32-S3",
  "isActive": true,
  "incompatibleCommands": ["PULSE_COUNT", "MODBUS_RTU_READ", "UART_STREAM_READ"]
}
```

**Platform Compatibility Analysis**:

When adding new controller, analyze command compatibility based on architecture:

**AVR Platform** (Arduino Uno, Nano, Mega):
- ❌ ESP-specific macros: `IRAM_ATTR`, `NOT_AN_INTERRUPT`
- ✅ SoftwareSerial library works
- **Incompatible**: `PULSE_COUNT` (uses ESP macros)

**ESP8266/ESP32 Platform** (WeMos, NodeMCU, FireBeetle, ESP32):
- ✅ ESP macros work (`IRAM_ATTR`, `NOT_AN_INTERRUPT`)
- ✅ SoftwareSerial available (but hardware Serial preferred)
- **All commands compatible**

**Renesas Platform** (Arduino Uno R4 WiFi):
- ❌ No SoftwareSerial library
- ❌ No ESP macros
- ✅ Hardware Serial1 available
- **Incompatible**: `PULSE_COUNT`, `MODBUS_RTU_READ`, `UART_STREAM_READ`

**How to determine incompatible commands**:
1. Check command template files in `/Arduino/templates/commands/`
2. Look for platform-specific code: `IRAM_ATTR`, `SoftwareSerial`, `NOT_AN_INTERRUPT`
3. Research if controller's architecture supports these features
4. Add command names to `incompatibleCommands` array if unsupported

**Note**: Controller must be added to this config for Arduino generator to create firmware templates.

## Arduino Firmware Requirements

### HTTP-based Controllers
**Required Endpoints**:
```cpp
// POST /api/command - Execute commands
// Response: {"ok": 1, "value": 123, ...}

// GET /health - Health check
// Response: {"ok": 1, "status": "online", ...}
```

**Supported Commands** (JSON format):
- `PING` - Controller health check
- `SET_PIN` - Digital pin control
- `READ` - Digital pin read
- `ANALOG` - Analog pin read
- `PULSE_MEASURE` - HC-SR04 distance sensor
- `SINGLE_WIRE_BIT_TIMING` - DHT22 sensor
- `SINGLE_WIRE_ONEWIRE` - DS18B20 sensor
- `PULSE_COUNT` - Flow sensors

Reference: `/Docs/Arduino_Command_Reference.md`

### Serial-based Controllers
**Protocol**: JSON commands over serial (newline-terminated)
**Baud Rate**: 9600 or 115200 (configurable)
**Format**: Same JSON commands as HTTP controllers

## Frontend Integration

### Automatic UI Integration
**No frontend code changes needed** - system automatically:
1. Loads controller templates from JSON
2. Generates pin selection dropdowns
3. Creates controller type selector
4. Maps pins to device ports

**Validation**: Frontend validates:
- Reserved pins are marked unavailable
- Occupied pins shown as in-use
- Pin types match device requirements (digital/analog)

## Testing and Validation

### 1. Frontend Template Validation
**Action**: Start frontend and verify controller appears in dropdown
```bash
cd frontend
npm run dev
# Navigate to Controllers → Add Controller
# Verify new controller in type dropdown
# Check pin list shows correct pins with labels
```

### 2. Backend Type Validation
**Action**: Run TypeScript type check
```bash
cd backend
npm run types:check
# Should complete without errors
```

### 3. Controller Creation Test
**Steps**:
1. Create controller via UI
2. Assign pins to devices
3. Verify pin states save correctly
4. Test device commands execute properly

### 4. Adapter Connection Test
**HTTP Controllers**:
```bash
# Test Arduino responds to commands
curl -X POST http://<controller-ip>/api/command \
  -H "Content-Type: application/json" \
  -d '{"cmd":"PING"}'
# Expected: {"ok":1,"version":"..."}
```

**Serial Controllers**:
```bash
# Test serial communication
echo '{"cmd":"PING"}' > /dev/ttyUSB0
# Monitor response on serial console
```

## Real-World Integration Example

### Arduino Uno R4 WiFi Integration
**Context**: Adding WiFi-enabled Arduino variant

**Step 1 - controller-templates.json**:
```json
"Arduino_Uno_R4_WiFi": {
  "label": "Arduino Uno R4 WiFi",
  "communication_by": ["wifi", "serial"],
  "communication_type": ["http", "raw_serial"],
  "ports": [
    { "id": "D0", "label": "RX (Serial)", "type": "digital", "reserved": true },
    { "id": "D1", "label": "TX (Serial)", "type": "digital", "reserved": true },
    { "id": "D2", "label": "Digital Pin 2", "type": "digital", "reserved": false },
    ...
    { "id": "A0", "label": "Analog Pin A0", "type": "analog" },
    ...
  ]
}
```

**Step 2 - PhysicalController.ts**:
```typescript
// Interface
type: 'Arduino_Uno' | 'ESP32' | 'WeMos_D1_R2' | 'Arduino_Uno_R4_WiFi'

// Schema
enum: ['Arduino_Uno', 'ESP32', 'WeMos_D1_R2', 'Arduino_Uno_R4_WiFi']
```

**Step 3 - Arduino Firmware**:
- Upload `/Arduino/arduino_uno_r4_wifi_foundation_v4_2.ino`
- Configure WiFi credentials
- Test HTTP endpoints

**Result**: Controller fully integrated, uses `HttpControllerAdapter` for WiFi communication

## Troubleshooting Common Issues

### Controller Not Appearing in Dropdown
**Problem**: New controller type not showing in UI
**Solutions**:
1. Check JSON syntax in `controller-templates.json`
2. Clear browser cache and reload
3. Restart frontend dev server

### Type Error in Backend
**Problem**: TypeScript compilation fails
**Solutions**:
1. Verify type added to interface AND schema enum
2. Check spelling consistency (exact match required)
3. Run `npm run types:check` for details

### Adapter Not Connecting
**Problem**: Controller shows offline
**Solutions**:
1. Verify `communicationType` matches adapter (http/raw_serial)
2. Check network connectivity (HTTP) or serial port (Serial)
3. Test Arduino firmware responds to PING command
4. Review logs: `UnifiedLoggingService` shows connection attempts

### Reserved Pins Not Working
**Problem**: System allows assigning reserved pins
**Solutions**:
1. Set `"reserved": true` in controller template
2. Frontend automatically filters reserved pins
3. Verify template loaded correctly (browser console)

## Architecture Notes

**Controller-Device Relationship**:
- One controller has many devices
- Each device occupies specific pins
- System tracks pin occupation in `availablePorts` array
- Pin states persisted and restored on startup

**Adapter Pattern Benefits**:
- New controllers don't need new adapters (reuse existing)
- HTTP and Serial protocols fully supported
- Easy to extend with MQTT/WebSocket adapters if needed

**Template-Driven UI**:
- Adding controller requires NO frontend code changes
- JSON template fully defines UI behavior
- Type-safe integration with backend

## Integration Success Criteria
✅ **Research**: Controller specifications documented (pins, capabilities, reserved pins)
✅ **Template**: Controller entry in `controller-templates.json` with all pins
✅ **Model**: Type added to TypeScript interface and MongoDB enum
✅ **Generator**: Controller added to `generator-config.json` with correct chipset
✅ **Adapter**: Correct adapter selected based on communication type
✅ **Validation**: TypeScript compilation successful (`npm run types:check`)
✅ **Testing**: Controller appears in UI dropdown, pin assignment works

**Result**: New controller fully integrated and ready for production use

## Common Integration Mistakes to Avoid
❌ **Forgetting generator-config.json** - Controller won't appear in Arduino generator
❌ **Mismatching type names** - Must be identical in controller-templates.json and PhysicalController.ts
❌ **Wrong pin types for ESP32 input-only** - GPIO34-39 must be "analog" not "digital"
❌ **Missing reserved flags** - I2C/SPI/UART/USB pins must have `"reserved": true`
❌ **Incorrect pin IDs** - Use "D2" for Arduino, "GPIO2" for ESP32, not mixed
❌ **Not marking onboard components** - LEDs, buttons occupy pins and should be reserved

---

*This guide contains minimal essential information for integrating physical controllers into Hydroponics v4 system.*

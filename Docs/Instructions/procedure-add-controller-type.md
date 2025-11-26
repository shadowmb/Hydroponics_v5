# Add New Controller Type - Streamlined Procedure

## 3 Required Steps

### STEP 1: Firmware Configuration

**File:** `firmware/config/controllers.json`

Add to `controllers` array:

```json
{
    "id": "controller_id",              // lowercase_underscores (used in discovery)
    "displayName": "Display Name",
    "chipset": "Chipset Name",
    "communicationTypes": ["serial"],   // or ["serial", "wifi"]
    "capabilities": {
        "analogPins": 6,
        "digitalPins": 14,
        "uartCount": 1,
        "hasHardwareUART": true,
        "hasRS485": false,
        "flashMemory": 32768,
        "sram": 2048
    },
    "commandCompatibility": {
        "compatible": ["ANALOG", "DHT", "ONE_WIRE"]  // from sensor-families.json
    },
    "baseTemplates": {
        "serial": "controller_serial_base.ino"
    },
    "isActive": true
}
```

---

### STEP 2: Database Seed

**File:** `backend/src/data/controller-templates.json`

Add top-level key:

```json
{
    "Controller_Key": {                // PascalCase_With_Underscores
        "label": "Display Name",
        "communication_by": ["serial"],
        "communication_type": ["raw_serial"],
        "ports": [
            {"id": "D0", "label": "Pin Label", "type": "digital", "reserved": true},
            {"id": "D1", "label": "Pin Label", "type": "digital", "pwm": true},
            {"id": "A0", "label": "Pin Label", "type": "analog"}
        ]
    }
}
```

**Port Rules:**
- `id`: `D0-DXX` (digital), `A0-AXX` (analog)
- `type`: `"digital"` or `"analog"`
- `reserved`: `true` for UART/I2C/SPI pins
- `pwm`: `true` if PWM capable

**Get PWM pins from:** Controller datasheet or Arduino reference

**Reserved pins:**
- UART: TX/RX pins
- I2C: SDA/SCL pins
- SPI: MISO/MOSI/SCK/SS pins

---

### STEP 3: Frontend Mapping

**File:** `frontend/src/components/hardware/ControllerWizard.tsx`

**Line ~52**, add to `MODEL_MAP`:

```typescript
const MODEL_MAP: Record<string, string> = {
    'existing_entries': 'Values',
    'controller_id': 'Controller_Key'  // Add this
};
```

**Mapping Rules:**
- **Left** = `id` from STEP 1 (exact match, case-sensitive)
- **Right** = key from STEP 2 (exact match)

---

## Apply Changes

**Restart backend** - templates auto-seed on startup

---

## Quick Reference

| Item | Format | Example |
|------|--------|---------|
| Firmware `id` | lowercase_underscores | `arduino_leonardo` |
| Seed key | PascalCase_Underscores | `Arduino_Leonardo` |
| Digital port | `D` + number | `D0`, `D13` |
| Analog port | `A` + number | `A0`, `A5` |

**CRITICAL:** All three identifiers must match exactly as shown in mapping rules.

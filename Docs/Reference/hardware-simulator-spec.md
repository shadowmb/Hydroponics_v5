# Hardware Controller Simulator — Specification

> **Status:** Approved and ready for implementation  
> **Created:** 2026-01-05  
> **Last Updated:** 2026-01-05

## 1. Goal

Create a **standalone Hardware Simulator** that mimics physical ESP32/Arduino controllers over UDP network. This enables:

- **Demo without hardware** — Sales, presentations
- **Onboarding** — New users learn without risk
- **QA Testing** — Automated tests with scenarios
- **Development** — Test new Flows without physical sensors

---

## 2. Architecture

```
┌───────────────────────────────────────────────────────────┐
│               HYDROPONICS SYSTEM (unchanged)              │
│  ┌──────────┐    ┌──────────┐    ┌────────────────────┐  │
│  │ Frontend │◄──►│ Backend  │◄──►│ Real Controllers   │  │
│  └──────────┘    └────┬─────┘    └────────────────────┘  │
│                       │                                   │
│                       │ UDP (port 8888)                   │
│                       ▼                                   │
│            ┌────────────────────┐                        │
│            │  SIMULATOR SERVICE │ ◄── Standalone app     │
│            │  ┌──────────────┐  │                        │
│            │  │ Control UI   │  │ ◄── Web interface      │
│            │  └──────────────┘  │                        │
│            └────────────────────┘                        │
└───────────────────────────────────────────────────────────┘
```

**Key Principle:** The main system DOES NOT know it's talking to a simulator.

---

## 3. Protocol Reference

### 3.1 Command Format (Backend → Simulator)

```
CMD|PARAM1|PARAM2|...
```

Terminated with `\n` for Serial, or as-is for UDP.

### 3.2 Response Format (Simulator → Backend)

```json
{
  "ok": 1,
  "data": { ... }
}
```

Or on error:
```json
{
  "ok": 0,
  "error": "ERR_CODE"
}
```

### 3.3 System Commands

| Command | Response Example |
|---------|------------------|
| `PING` | `{"ok":1,"pong":1}` |
| `STATUS` | `{"ok":1,"status":"running","up":12345}` |
| `INFO` | `{"ok":1,"up":12345,"mem":4096,"ver":"1.0-v5","capabilities":[...]}` |
| `RESET` | `{"ok":1,"msg":"Resetting..."}` |
| `HYDROPONICS_DISCOVERY` | `{"type":"ANNOUNCE","mac":"AA:BB:CC:DD:EE:FF","ip":"192.168.1.100","model":"ESP32","firmware":"1.0-v5","capabilities":[...]}` |

### 3.4 Sensor Commands

| Command | Format | Response |
|---------|--------|----------|
| `ANALOG` | `ANALOG\|A0_14` | `{"ok":1,"value":512}` |
| `DIGITAL_READ` | `DIGITAL_READ\|D2_2` | `{"ok":1,"value":0}` |
| `DHT_READ` | `DHT_READ\|D4_4` | `{"ok":1,"temp":24.5,"humidity":60}` |
| `ONEWIRE_READ_TEMP` | `ONEWIRE_READ_TEMP\|D5_5` | `{"ok":1,"value":22.3}` |
| `ULTRASONIC_TRIG_ECHO` | `ULTRASONIC_TRIG_ECHO\|D2_2\|D3_3` | `{"ok":1,"value":45.2}` |
| `UART_READ_DISTANCE` | `UART_READ_DISTANCE\|D2_2\|D3_3` | `{"ok":1,"value":123}` |
| `I2C_READ` | `I2C_READ\|0x23\|2` | `{"ok":1,"data":[0x12,0x34]}` |
| `MODBUS_RTU_READ` | `MODBUS_RTU_READ\|{"slaveId":1,...}` | `{"ok":1,"registers":[1234]}` |

### 3.5 Actuator Commands

| Command | Format | Response |
|---------|--------|----------|
| `RELAY_SET` | `RELAY_SET\|D4_4\|1` | `{"ok":1}` |
| `DIGITAL_WRITE` | `DIGITAL_WRITE\|D2_2\|1` | `{"ok":1}` |
| `PWM_WRITE` | `PWM_WRITE\|D3_3\|128` | `{"ok":1}` |
| `SERVO_WRITE` | `SERVO_WRITE\|D9_9\|90` | `{"ok":1}` |

---

## 4. Implementation Phases

### Phase 1: Shared Types Refactoring (~30 min)

**Files to modify:**
- `shared/types.ts` — Add `HardwarePacket`, `HardwareResponse`
- `backend/src/modules/hardware/interfaces.ts` — Import from shared

### Phase 2: Project Setup (~30 min)

Create `simulator/` directory:
```
simulator/
├── package.json
├── tsconfig.json
├── src/
│   ├── server.ts
│   ├── UdpProtocolHandler.ts
│   ├── DeviceState.ts
│   └── ScenarioEngine.ts
├── public/
│   └── index.html
└── scenarios/
    └── ph_drift.json
```

### Phase 3: Core Implementation (~3-4 hours)

1. **UDP Listener** — Port 8888, receives commands
2. **Protocol Parser** — Splits `CMD|PARAMS`
3. **Command Handlers** — All commands from section 3
4. **Device State** — In-memory sensor values, relay states
5. **Scenario Engine** — Loads JSON, updates state over time

### Phase 4: Simple UI (~1-2 hours)

HTML dashboard served by Express:
- Sensor sliders
- Relay toggles
- Scenario selector
- Command log

---

## 5. Scenario System

### 5.1 JSON Format

```json
{
  "name": "pH Drift Test",
  "duration": 300,
  "actions": [
    { "sensor": "pH", "type": "linear", "from": 7.0, "to": 5.5, "duration": 300 },
    { "sensor": "EC", "type": "constant", "value": 1.8 },
    { "type": "error_timeout", "commands": ["PING"], "startAt": 120, "duration": 10 }
  ]
}
```

### 5.2 Scenario Types

| Type | Description |
|------|-------------|
| `linear` | Value changes linearly over time |
| `constant` | Fixed value for duration |
| `random` | Fluctuates within min/max range |
| `error_timeout` | Stop responding to specified commands |
| `error_invalid` | Return malformed/invalid responses |
| `error_offline` | Simulate controller disconnect |

---

## 6. Code Reference

### Key Backend Files

| File | Purpose |
|------|---------|
| [interfaces.ts](file:///c:/Project/Hydroponics_v4-main/backend/src/modules/hardware/interfaces.ts) | `HardwarePacket`, `HardwareResponse` interfaces |
| [UdpTransport.ts](file:///c:/Project/Hydroponics_v4-main/backend/src/modules/hardware/transports/UdpTransport.ts) | UDP protocol serialization |
| [SerialTransport.ts](file:///c:/Project/Hydroponics_v4-main/backend/src/modules/hardware/transports/SerialTransport.ts) | Serial protocol serialization |
| [HardwareTransportManager.ts](file:///c:/Project/Hydroponics_v4-main/backend/src/modules/hardware/HardwareTransportManager.ts) | Connection management |

### Firmware Command Definitions

| File | Commands |
|------|----------|
| [system_commands.json](file:///c:/Project/Hydroponics_v4-main/firmware/definitions/commands/system_commands.json) | PING, STATUS, INFO, RESET, DISCOVERY |
| [analog.json](file:///c:/Project/Hydroponics_v4-main/firmware/definitions/commands/analog.json) | ANALOG |
| [dht_read.json](file:///c:/Project/Hydroponics_v4-main/firmware/definitions/commands/dht_read.json) | DHT_READ |
| [relay_set.json](file:///c:/Project/Hydroponics_v4-main/firmware/definitions/commands/relay_set.json) | RELAY_SET |

### Documentation

| File | Content |
|------|---------|
| [firmware-commands.md](file:///c:/Project/Hydroponics_v4-main/Docs/Reference/firmware-commands.md) | Full command reference |
| [procedure-add-firmware-command.md](file:///c:/Project/Hydroponics_v4-main/Docs/Instructions/procedure-add-firmware-command.md) | How to add new commands |

---

## 7. Estimated Effort

| Phase | Time |
|-------|------|
| Phase 1: Shared Types | 30 min |
| Phase 2: Project Setup | 30 min |
| Phase 3: Core Implementation | 3-4 hours |
| Phase 4: UI | 1-2 hours |
| **Total** | **5-7 hours** |

---

## 8. Decisions Made

1. ✅ **Standalone UDP Server** — Zero changes to main system
2. ✅ **Full command support** — All firmware commands from day one
3. ✅ **JSON scenarios** — Easy to write and edit
4. ✅ **Error injection** — Test error handling logic
5. ✅ **Simple HTML UI** — Avoid React build complexity for dev tool

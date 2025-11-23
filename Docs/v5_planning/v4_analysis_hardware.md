# Hydroponics v4 Deep Dive: Hardware & Communication

**Status**: Draft
**Domain**: Hardware Layer
**Modules**: HardwareCommunicationService, DeviceCommandService, ArduinoGeneratorService, UdpDiscoveryService

## 1. Introduction
This document details the "Physical Layer" of the system. It describes how the software talks to the hardware (Arduino/ESP), the protocols used, and how firmware is generated.

---

## 2. Module Analysis

## 2. Module Analysis

### 2.1. HardwareCommunicationService (The Transport Layer)
*Responsible for the physical connection and raw protocol.*

#### 🔍 Logic & Flow
*   **Protocol**: JSON-over-Serial (Newline delimited).
*   **Handshake**: None explicit, but relies on `STATUS` command.
*   **Concurrency**: Uses `SerialPort` with a basic queue (in v5 we need a real queue).
*   **Error Handling**: 3-second timeout per command.

#### 📝 Protocol Specification (Blueprint)
*Exact JSON payload sent to Arduino.*

**Request:**
```typescript
interface ArduinoCommand {
  cmd: string       // e.g., "SET_PIN", "READ_SENSOR"
  pin?: number      // Arduino Pin Number
  state?: number    // 0 or 1 (for Digital Write)
  value?: number    // 0-255 (for PWM)
  // ... other specific params
}
```

**Response:**
```typescript
interface ArduinoResponse {
  status: 'ok' | 'error'
  data?: any
  error?: string
}
```

#### 🚀 V5 Strategy
*   **Keep**: The JSON protocol is simple and debuggable. Keep it for now.
*   **Improve**: Add a `messageId` to every packet to match Request-Response asynchronously.
*   **Refactor**: Extract `SerialPort` management into a dedicated `TransportAdapter` interface to support WiFi/Bluetooth easily.

---

### 2.2. DeviceCommandService (The Driver Layer)
*Translates high-level "Business Commands" into low-level "Hardware Commands".*

#### 🔍 Logic & Flow
*   **Input**: `Device` (DB Model) + `Command` (String).
*   **Process**:
    1.  Looks up `DeviceTemplate` for the device type.
    2.  Checks `ExecutionStrategy`:
        *   `single_command`: Direct mapping (e.g., `RELAY_ON` -> `SET_PIN HIGH`).
        *   `multi_step`: Sequence of commands (e.g., HC-SR04: `TRIGGER` -> `WAIT` -> `READ`).
        *   `arduino_native`: Sends a complex command handled by C++ firmware (e.g., `PULSE_MEASURE`).
    3.  Sends result to `HardwareCommunicationService`.

#### 🧬 Data Structures (Blueprint)
*The "Driver" definition.*

```typescript
interface DeviceTemplate {
  type: string // 'HC-SR04', 'RELAY_MODULE'
  portRequirements: {
    role: string // 'trigger', 'echo'
    type: 'digital' | 'analog'
  }[]
  executionConfig: {
    strategy: 'single_command' | 'multi_step' | 'arduino_native'
    commandSequence?: {
      command: string
      parameters: Record<string, any>
      delay?: number
    }[]
  }
}
```

#### 🚀 V5 Strategy
*   **KEEP**. This is a very strong design pattern. It decouples the backend from hardware specifics.
*   **Improve**: Move `DeviceTemplate` definitions to JSON files instead of MongoDB for version control (GitOps).

---

### 2.3. ArduinoGeneratorService (The Firmware Builder)
*Generates C++ code (.ino) dynamically.*

#### 🔍 Logic & Flow
*   **Concept**: "Modular Firmware".
*   **Components**:
    *   `Base Template`: The `loop()` and `setup()` skeleton.
    *   `Command Modules`: Snippets of C++ for specific features (e.g., `dht_read.ino`).
*   **Algorithm**:
    1.  Read `Base Template`.
    2.  Find all active `Commands` in DB.
    3.  Load corresponding `.ino` snippets.
    4.  Parse snippets into `INCLUDES`, `GLOBALS`, `FUNCTIONS`, `DISPATCHER`.
    5.  Inject into Base Template using string replacement.
    6.  Generate `CAPABILITIES` array.

#### ⚠️ Pain Points
*   **Fragile**: String replacement (`// GENERATOR_PLACEHOLDER`) is error-prone.
*   **Validation**: No compile-time check until you try to upload.

#### 🚀 V5 Strategy
*   **REFACTOR**.
*   **New Approach**: Use a proper template engine (Handlebars/EJS).
*   **Validation**: Integrate `arduino-cli` to verify compilation *before* offering the download.

---

## 3. Cross-Module Dependencies
*   `DeviceCommandService` -> `DeviceTemplate` (Model)
*   `DeviceCommandService` -> `HardwareCommunicationService`
*   `HardwareCommunicationService` -> `SerialPort` (Node Driver)

## 4. Summary & Migration Plan
The Hardware Domain is well-structured with a clear separation of concerns:
1.  **Transport** (HardwareCommunicationService)
2.  **Driver/Logic** (DeviceCommandService)
3.  **Firmware Generation** (ArduinoGeneratorService)

**Migration Steps:**
1.  Port `DeviceTemplate` logic as-is (it's good).
2.  Rewrite `HardwareCommunicationService` to be event-driven (RxJS or EventEmitter).
3.  Refactor `ArduinoGenerator` to use a robust templating engine.

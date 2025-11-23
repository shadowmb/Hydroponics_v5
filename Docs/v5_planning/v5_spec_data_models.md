# Hydroponics v5 - Data Models Specification

**Status**: Draft
**Database**: MongoDB (Mongoose)
**Validation**: Zod (Runtime) + TypeScript (Static)

## 1. Device Management (Хардуер)

### 1.1. Device (Controller/Peripheral)
*Represents a physical entity (Arduino, ESP32) or a connected peripheral (Sensor, Relay).*

```typescript
// Enum for device types
enum DeviceType {
  CONTROLLER = 'CONTROLLER', // The main board (Arduino Uno/Mega)
  SENSOR = 'SENSOR',         // DHT11, DS18B20, pH Meter
  ACTUATOR = 'ACTUATOR'      // Relay, Pump, Fan
}

// Enum for connection status
enum ConnectionStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  ERROR = 'ERROR'
}

interface IDevice {
  _id: string; // UUID or ObjectId
  name: string;
  type: DeviceType;
  isEnabled: boolean;
  
  // Hardware Configuration
  hardware: {
    boardType?: string;      // 'arduino_uno', 'esp32' (Only for CONTROLLER)
    port?: string;           // 'COM3', '/dev/ttyUSB0' (Only for CONTROLLER)
    pin?: number;            // GPIO Pin (Only for SENSOR/ACTUATOR)
    parentId?: string;       // ID of the CONTROLLER this device is attached to
  };

  // Driver / Capability Config
  config: {
    driverId: string;        // 'dht11', 'relay_active_low' (Matches DeviceTemplate)
    pollInterval?: number;   // ms (For Sensors)
    calibration?: {          // Linear calibration (y = mx + c)
      multiplier: number;
      offset: number;
    };
  };

  // Runtime State (Not persisted in DB, but part of the runtime model)
  state?: {
    value: number | boolean; // Current reading or state
    lastSeen: Date;
    status: ConnectionStatus;
    error?: string;
  };

  metadata: {
    createdAt: Date;
    updatedAt: Date;
    description?: string;
  };
}
```

---

## 2. Automation (Автоматизация)

### 2.1. ActionTemplate (Reusable Logic Block)
*Represents a reusable automation script (formerly just "Flow"). Can be parameterized.*

```typescript
interface IActionTemplate {
  _id: string;
  name: string;
  description?: string;
  version: number;
  
  // The visual graph definition (Nodes & Edges)
  definition: {
    nodes: Array<IFlowNode>;
    edges: Array<IFlowEdge>;
  };

  // Input parameters this template accepts (e.g., "Target pH", "Duration")
  parameters: Array<{
    key: string;
    type: 'NUMBER' | 'BOOLEAN' | 'STRING';
    defaultValue?: any;
    label: string;
  }>;

  metadata: {
    createdAt: Date;
    updatedAt: Date;
    tags: string[];
  };
}
```

### 2.2. Program (The Schedule / Recipe)
*A high-level recipe that orchestrates multiple ActionTemplates over time (Cycles).*

```typescript
interface IProgram {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;

  // The sequence of actions to execute
  schedule: Array<{
    actionTemplateId: string; // Reference to ActionTemplate
    order: number;
    
    // Overrides for the template's parameters
    parameterOverrides: Record<string, any>;
    
    // Execution constraints
    trigger: {
      type: 'TIME' | 'EVENT' | 'MANUAL';
      cron?: string;
      condition?: string; // e.g. "SensorA > 50"
    };
  }>;
}
```

### 2.3. ActiveProgram (Runtime State)
*The current running instance of a Program.*

```typescript
interface IActiveProgram {
  _id: string;
  programId: string;
  startTime: Date;
  status: 'RUNNING' | 'PAUSED' | 'STOPPED' | 'ERROR';
  
  // Current progress
  currentStepIndex: number;
  currentActionId?: string; // ID of the currently running ActionTemplate instance
  
  // Runtime variables
  variables: Record<string, any>;
}
```

### 2.4. ExecutionSession (Detailed Trace)
*A detailed session log for a single execution run of an ActionTemplate.*

```typescript
interface IExecutionSession {
  _id: string;
  parentProgramId?: string; // If part of a Program
  actionTemplateId: string;
  startTime: Date;
  endTime?: Date;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  
  // The exact snapshot of parameters used
  parametersSnapshot: Record<string, any>;

  // Detailed step-by-step log
  logs: Array<{
    timestamp: Date;
    nodeId: string;
    level: 'INFO' | 'WARN' | 'ERROR';
    message: string;
    data?: any; // Input/Output of the block
  }>;
}
```

---

## 3. System Configuration (Настройки)

### 3.1. SystemSettings
*Global system-wide settings.*

```typescript
interface ISystemSettings {
  _id: string; // Singleton (usually 'global')
  
  general: {
    systemName: string;
    language: 'bg' | 'en';
    timezone: string;
  };

  notifications: {
    email?: {
      enabled: boolean;
      host: string;
      port: number;
      user: string;
      // Password should be encrypted or stored in ENV, not plain text here ideally
      // but for v4 parity we might store it here.
      fromAddress: string;
    };
    telegram?: {
      enabled: boolean;
      botToken: string;
      chatId: string;
    };
  };

  backup: {
    enabled: boolean;
    intervalHours: number;
    retentionCount: number;
  };
}
```

---

## 4. Sensor Data (История)

### 4.1. SensorReading
*Time-series data for sensor readings.*

```typescript
interface ISensorReading {
  _id: string;
  deviceId: string; // Reference to Device
  value: number;
  timestamp: Date;
  
  // Optional: Aggregation tags
  metadata?: {
    unit: string;
    quality?: 'GOOD' | 'BAD';
  };
}
// Indexes: { deviceId: 1, timestamp: -1 }
```

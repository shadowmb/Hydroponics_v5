# Hydroponics v5 - Flow & Automation Specification

**Status**: Draft
**Engine**: XState (State Machine)
**Format**: JSON (React Flow Compatible)

## 1. ActionTemplate Structure (The Graph)
This JSON structure defines a reusable logic block.

```json
{
  "id": "template_uuid",
  "name": "pH Adjustment",
  "version": 1,
  "nodes": [
    {
      "id": "node_1",
      "type": "SENSOR_READ",
      "position": { "x": 100, "y": 100 },
      "data": {
        "deviceId": "sensor_ph_1",
        "variableName": "current_ph"
      }
    },
    {
      "id": "node_2",
      "type": "IF",
      "position": { "x": 100, "y": 200 },
      "data": {
        "condition": "current_ph < target_ph"
      }
    }
  ],
  "edges": [
    { "id": "e1-2", "source": "node_1", "target": "node_2" },
    { "id": "e2-3", "source": "node_2", "target": "node_3", "sourceHandle": "TRUE" }
  ]
}
```

---

## 2. Block Definitions (The Bricks)

### 2.1. Standard Blocks
| Type | Inputs (Params) | Outputs (Variables) | Logic |
| :--- | :--- | :--- | :--- |
| **SENSOR_READ** | `deviceId` (Device ID) | `value` (Number) | Reads value from sensor and stores in variable. |
| **ACTUATOR_SET** | `deviceId`, `state` (ON/OFF) | - | Sends command to hardware. |
| **SET_VARIABLE** | `variableName`, `valueExpression` | - | Sets a runtime variable (e.g. `target_ph = 6.0`). |
| **WAIT** | `duration` (ms) | - | Pauses execution. |
| **IF** | `condition` (Expression) | - | Evaluates expression (e.g. `ph < 6.0`). Routes to TRUE/FALSE handle. |
| **LOG** | `message` (String), `level` | - | Writes to system log. |
| **CALCULATE** | `expression` | `result` | Performs math (e.g. `(a + b) / 2`). |

### 2.2. Advanced Blocks
| Type | Inputs | Outputs | Logic |
| :--- | :--- | :--- | :--- |
| **LOOP** | `mode` ('ITERATIONS'/'CONDITION'), `count`, `condition` | `loopBody`, `flowOut` | Repeats connected blocks. Has two exit paths. |
| **HTTP_REQUEST** | `url`, `method`, `body` | `response` | Calls external API. |
| **NOTIFICATION** | `message`, `channel` | - | Sends Email/Telegram. |
| **ERROR_HANDLER** | `action` ('PAUSE'/'STOP'/'RETRY'), `retryCount`, `notify` | - | Catches errors from connected blocks. |

---

## 3. v5 Block Types Summary

| Category | Block Type | Description |
| :--- | :--- | :--- |
| **I/O** | `SENSOR_READ` | Read data from hardware sensors. |
| | `ACTUATOR_SET` | Control hardware relays/motors. |
| | `HTTP_REQUEST` | External API calls. |
| | `NOTIFICATION` | Send alerts (Email/Telegram). |
| **Logic** | `IF` | Conditional branching. |
| | `LOOP` | Repetition (Count or Condition). |
| | `WAIT` | Time delay. |
| **Data** | `SET_VARIABLE` | Store values in memory. |
| | `CALCULATE` | Math operations. |
| **System** | `LOG` | Write to system logs. |
| | `ERROR_HANDLER` | Error recovery logic. |

---

## 4. Execution Context (The Memory)
The state object passed between blocks during execution.

```typescript
interface ExecutionContext {
  // Static Context (From Program)
  programId: string;
  actionTemplateId: string;
  
  // Runtime Variables (Read/Write)
  variables: {
    [key: string]: any; // e.g. { "current_ph": 5.8, "target_ph": 6.0 }
  };

  // Hardware State Cache (Read-Only)
  devices: {
    [deviceId: string]: {
      value: number;
      lastUpdated: number;
    };
  };

  // Execution Metadata
  stepCount: number;
  startTime: number;
  errors: string[];
}
```

---

## 4. Event Model (The Nervous System)
How the engine talks to the outside world.

1.  **Block Start**: Emitted before a block executes.
    *   `{ type: 'BLOCK_START', nodeId: 'node_1', timestamp: 1234567890 }`
2.  **Block End**: Emitted after execution.
    *   `{ type: 'BLOCK_END', nodeId: 'node_1', result: { ... } }`
3.  **Variable Change**: Emitted when a variable is updated.
    *   `{ type: 'VAR_UPDATE', key: 'current_ph', value: 5.8 }`
4.  **Error**: Emitted on failure.
    *   `{ type: 'ERROR', nodeId: 'node_1', message: 'Sensor timeout' }`

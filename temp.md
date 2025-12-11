[2025-12-12 01:23:44.921 +0200] INFO: ЁЯМ▒ Loading Controller Templates from...
    env: "development"
    dir: "D:\Hydroponics\Hydroponics v5\backend\config\controllers"
    files: [
      "arduino_uno.json",
      "arduino_uno_r4_wifi.json",
      "wemos_d1_r2.json"
    ]
[2025-12-12 01:23:44.990 +0200] INFO: ЁЯМ▒ Controller Templates Loaded
    env: "development"
    count: 3
    keys: [
      "Arduino_Uno",
      "Arduino_Uno_R4_WiFi",
      "WeMos_D1_R2"
    ]
[2025-12-12 01:23:44.991 +0200] INFO: ЁЯЪА [HardwareService] Initializing...
    env: "development"
[2025-12-12 01:23:44.991 +0200] INFO: ЁЯУВ Loading Device Templates...
    env: "development"
    dir: "D:\Hydroponics\Hydroponics v5\backend\config\devices"
[2025-12-12 01:23:45.027 +0200] INFO: ЁЯУВ Device Templates Loaded
    env: "development"
    count: 8
    ids: [
      "dht22",
      "dfrobot_par_rs485",
      "pump_generic",
      "valve_motorized_generic",
      "dfrobot_a02yyuw",
      "dfrobot_ec_k1",
      "ds18b20",
      "hc_sr04"
    ]
[2025-12-12 01:23:45.038 +0200] INFO: ЁЯУЬ [HistoryService] Initializing...
    env: "development"
[2025-12-12 01:23:45.215 +0200] INFO: ЁЯЪА Socket.io Initialized
    env: "development"
[2025-12-12 01:23:45.279 +0200] INFO: ЁЯХТ Scheduler Service Started
    env: "development"
[2025-12-12 01:23:45.281 +0200] INFO: ЁЯЪА Server running on port 3000
    env: "development"
[2025-12-12 01:23:46.963 +0200] INFO: ЁЯФМ Client Connected to WebSocket
    env: "development"
    socketId: "z-s2jlugdmk-LGuDAAAB"
[2025-12-12 01:23:47.511 +0200] INFO: тЪб Cycle Force Started (Time updated to Now)
    env: "development"
    itemId: "693b5267391efe8f6652447f"
    newTime: "01:23"
[2025-12-12 01:23:47.515 +0200] INFO: Attempting to start cycle with sanitized steps
    env: "development"
    cycleId: "6932b9a147564095227cf802"
    steps: [
      {
        "flowId": "testerror",
        "overrides": {}
      }
    ]
[2025-12-12 01:23:47.520 +0200] INFO: ЁЯЪА Starting Cycle (Trace Overrides)
    env: "development"
    cycleId: "6932b9a147564095227cf802"
    sessionId: "693b5283a7c413d378f91872"
    stepsCount: 1
    overrides: {
      "Global 2": 90,
      "Global 2_tolerance_mode": "lower",
      "Global 2_tolerance": 3
    }
[2025-12-12 01:23:47.520 +0200] INFO: тЦ╢я╕П Executing Cycle Step
    env: "development"
    step: 0
    flowId: "testerror"
[2025-12-12 01:23:47.520 +0200] INFO: ЁЯФз Cycle Step Overrides Resolution
    env: "development"
    step: 0
    sessionOverrides: {
      "Global 2": 90,
      "Global 2_tolerance_mode": "lower",
      "Global 2_tolerance": 3
    }
    finalOverrides: {
      "Global 2": 90,
      "Global 2_tolerance_mode": "lower",
      "Global 2_tolerance": 3
    }
[2025-12-12 01:23:47.522 +0200] INFO: тЬи AutomationEngine Actor Initialized/Reset (Session: none)
    env: "development"
[2025-12-12 01:23:47.541 +0200] INFO: ЁЯзй AutomationEngine: Input Resolution
    env: "development"
    overrides: {
      "Global 2": 90,
      "Global 2_tolerance_mode": "lower",
      "Global 2_tolerance": 3
    }
    variablesResolved: {}
[2025-12-12 01:23:47.543 +0200] INFO: ЁЯУе Loading Program Session
    env: "development"
    sessionId: "693b5283a7c413d378f91878"
    programId: "testerror"
    variables: {
      "global_2": 90,
      "Global 2": 90,
      "Global 2_tolerance": 3,
      "global_2_tolerance": 3,
      "Global 2_tolerance_mode": "lower",
      "global_2_tolerance_mode": "lower"
    }
[2025-12-12 01:23:47.553 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "start"
    edgeFound: true
    nextBlockId: "SENSOR_READ_1765271435543"
[2025-12-12 01:23:47.575 +0200] INFO: ЁЯФМ [HardwareService] Creating Serial Transport
    env: "development"
    controllerId: "693134db23b1320394ed43b5"
    port: "COM3"
[2025-12-12 01:23:47.575 +0200] INFO: ЁЯФМ [SerialTransport] Connecting...
    env: "development"
    path: "COM3"
    baudRate: 9600
[2025-12-12 01:23:47.628 +0200] INFO: тЬЕ [SerialTransport] Port Opened
    env: "development"
    path: "COM3"
[2025-12-12 01:23:49.709 +0200] INFO: ЁЯУК [HardwareService] Burst Read Mode
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    sampleCount: 4
    sampleDelay: 50
[SensorRead] ✔️ Saved to 'var_1': 4 l
[IfBlock DEBUG] Params: {
  "label": "Condition (IF)",
  "operator": ">=",
  "onFailure": "STOP",
  "errorNotification": false,
  "hasError": false,
  "variable": "var_1",
  "value": "{{global_2}}",
  "_blockId": "IF_1765301518579"
}
[IfBlock DEBUG] Checking Left Tolerance for: 'var_1'
[IfBlock DEBUG] Checking Right Tolerance for: {{global_2}}
[IfBlock Tolerance] Applied for 'global_2': 3 (Mode: lower)
[2025-12-12 01:23:50.178 +0200] INFO: тЬЕ [HardwareService] Median Calculated
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    samples: [
      18.1,
      18.1,
      18.1,
      18.1
    ]
    median: 18.1
    min: 18.1
    max: 18.1
[2025-12-12 01:23:50.209 +0200] INFO: ЁЯФД [HardwareService] Smart Strategy Switched Unit
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    strategy: "tank_volume"
    oldUnit: "cm"
    newUnit: "l"
[2025-12-12 01:23:50.209 +0200] INFO: ЁЯФН [HardwareService] Checking Normalization
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    driverId: "hc_sr04"
    sourceUnit: "l"
    raw: 18.1
    value: 4
[2025-12-12 01:23:50.210 +0200] INFO: ЁЯФН [HardwareService] Normalization Result
    env: "development"
    normalized: {
      "value": 4000,
      "baseUnit": "ml"
    }
[2025-12-12 01:23:50.210 +0200] INFO: ЁЯУП [HardwareService] Normalized Value
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    from: "l"
    to: "ml"
    original: 4
    normalized: 4000
[2025-12-12 01:23:50.210 +0200] WARN: тЪая╕П [HardwareService] Sensor value out of valid range
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    value: 4000
    unit: "ml"
    min: 20
    max: 2000
[2025-12-12 01:23:50.210 +0200] ERROR: тЭМ [HardwareService] Failed to load UnitRegistry
    env: "development"
    sourceUnit: "ml"
    err: {
      "type": "Error",
      "message": "Sensor value 4000 ml is out of valid range [20 - 2000]",
      "stack":
          Error: Sensor value 4000 ml is out of valid range [20 - 2000]
              at HardwareService.readSensorValue (D:\Hydroponics\Hydroponics v5\backend\src\modules\hardware\HardwareService.ts:423:31)
              at SensorReadBlockExecutor.execute (D:\Hydroponics\Hydroponics v5\backend\src\modules\automation\blocks\SensorReadBlockExecutor.ts:26:28)
              at AutomationEngine.executeBlock (D:\Hydroponics\Hydroponics v5\backend\src\modules\automation\AutomationEngine.ts:399:32)
    }
[2025-12-12 01:23:50.220 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "SENSOR_READ_1765271435543"
    edgeFound: true
    nextBlockId: "IF_1765301518579"
[2025-12-12 01:23:50.222 +0200] INFO: тЭУ IF Block Navigation Trace
    env: "development"
    blockId: "IF_1765301518579"
    result: false
    expectedHandle: "false"
    nextBlockId: "ACTUATOR_SET_1765301557224"
[ActuatorSet] ✔️ Set 'ON' (State: 1)
[LoopBlock Debug] Block: LOOP_1765301551341 | Interval: 2 (number) | Iteration: 1 | Mode: TIME
[2025-12-12 01:23:50.292 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "ACTUATOR_SET_1765301557224"
    edgeFound: true
    nextBlockId: "LOOP_1765301551341"
[2025-12-12 01:23:50.375 +0200] INFO: ЁЯУК [HardwareService] Burst Read Mode
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    sampleCount: 4
    sampleDelay: 50
[SensorRead] ✔️ Saved to 'var_1': 4 l
[2025-12-12 01:23:50.825 +0200] INFO: тЬЕ [HardwareService] Median Calculated
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    samples: [
      18.1,
      18.1,
      18.1,
      18.1
    ]
    median: 18.1
    min: 18.1
    max: 18.1
[LoopBlock Debug] Block: LOOP_1765301551341 | Interval: 2 (number) | Iteration: 2 | Mode: TIME
[2025-12-12 01:23:50.825 +0200] INFO: ЁЯФД [HardwareService] Smart Strategy Switched Unit
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    strategy: "tank_volume"
    oldUnit: "cm"
    newUnit: "l"
[2025-12-12 01:23:50.825 +0200] INFO: ЁЯФН [HardwareService] Checking Normalization
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    driverId: "hc_sr04"
    sourceUnit: "l"
    raw: 18.1
    value: 4
[2025-12-12 01:23:50.825 +0200] INFO: ЁЯФН [HardwareService] Normalization Result
    env: "development"
    normalized: {
      "value": 4000,
      "baseUnit": "ml"
    }
[2025-12-12 01:23:50.825 +0200] INFO: ЁЯУП [HardwareService] Normalized Value
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    from: "l"
    to: "ml"
    original: 4
    normalized: 4000
[2025-12-12 01:23:50.825 +0200] WARN: тЪая╕П [HardwareService] Sensor value out of valid range
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    value: 4000
    unit: "ml"
    min: 20
    max: 2000
[2025-12-12 01:23:50.825 +0200] ERROR: тЭМ [HardwareService] Failed to load UnitRegistry
    env: "development"
    sourceUnit: "ml"
    err: {
      "type": "Error",
      "message": "Sensor value 4000 ml is out of valid range [20 - 2000]",
      "stack":
          Error: Sensor value 4000 ml is out of valid range [20 - 2000]
              at HardwareService.readSensorValue (D:\Hydroponics\Hydroponics v5\backend\src\modules\hardware\HardwareService.ts:423:31)
              at SensorReadBlockExecutor.execute (D:\Hydroponics\Hydroponics v5\backend\src\modules\automation\blocks\SensorReadBlockExecutor.ts:26:28)
              at AutomationEngine.executeBlock (D:\Hydroponics\Hydroponics v5\backend\src\modules\automation\AutomationEngine.ts:399:32)
    }
[2025-12-12 01:23:50.829 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "generic_1765301602942"
    edgeFound: true
    nextBlockId: "FLOW_CONTROL_1765301625104"
[2025-12-12 01:23:52.922 +0200] INFO: ЁЯУК [HardwareService] Burst Read Mode
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    sampleCount: 4
    sampleDelay: 50
[SensorRead] ✔️ Saved to 'var_1': 4 l
[LoopBlock Debug] Block: LOOP_1765301551341 | Interval: 2 (number) | Iteration: 3 | Mode: TIME
[2025-12-12 01:23:53.367 +0200] INFO: тЬЕ [HardwareService] Median Calculated
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    samples: [
      18.1,
      18.1,
      18.1,
      18.1
    ]
    median: 18.1
    min: 18.1
    max: 18.1
[2025-12-12 01:23:53.367 +0200] INFO: ЁЯФД [HardwareService] Smart Strategy Switched Unit
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    strategy: "tank_volume"
    oldUnit: "cm"
    newUnit: "l"
[2025-12-12 01:23:53.367 +0200] INFO: ЁЯФН [HardwareService] Checking Normalization
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    driverId: "hc_sr04"
    sourceUnit: "l"
    raw: 18.1
    value: 4
[2025-12-12 01:23:53.367 +0200] INFO: ЁЯФН [HardwareService] Normalization Result
    env: "development"
    normalized: {
      "value": 4000,
      "baseUnit": "ml"
    }
[2025-12-12 01:23:53.367 +0200] INFO: ЁЯУП [HardwareService] Normalized Value
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    from: "l"
    to: "ml"
    original: 4
    normalized: 4000
[2025-12-12 01:23:53.367 +0200] WARN: тЪая╕П [HardwareService] Sensor value out of valid range
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    value: 4000
    unit: "ml"
    min: 20
    max: 2000
[2025-12-12 01:23:53.367 +0200] ERROR: тЭМ [HardwareService] Failed to load UnitRegistry
    env: "development"
    sourceUnit: "ml"
    err: {
      "type": "Error",
      "message": "Sensor value 4000 ml is out of valid range [20 - 2000]",
      "stack":
          Error: Sensor value 4000 ml is out of valid range [20 - 2000]
              at HardwareService.readSensorValue (D:\Hydroponics\Hydroponics v5\backend\src\modules\hardware\HardwareService.ts:423:31)
              at SensorReadBlockExecutor.execute (D:\Hydroponics\Hydroponics v5\backend\src\modules\automation\blocks\SensorReadBlockExecutor.ts:26:28)
              at AutomationEngine.executeBlock (D:\Hydroponics\Hydroponics v5\backend\src\modules\automation\AutomationEngine.ts:399:32)
    }
[2025-12-12 01:23:53.371 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "generic_1765301602942"
    edgeFound: true
    nextBlockId: "FLOW_CONTROL_1765301625104"
[2025-12-12 01:23:55.464 +0200] INFO: ЁЯУК [HardwareService] Burst Read Mode
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    sampleCount: 4
    sampleDelay: 50
[SensorRead] ✔️ Saved to 'var_1': 2.509316770186331 l
[2025-12-12 01:23:55.927 +0200] INFO: тЬЕ [HardwareService] Median Calculated
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    samples: [
      18.1,
      18.1,
      18.6,
      18.6
    ]
    median: 18.35
    min: 18.1
    max: 18.6
[LoopBlock Debug] Block: LOOP_1765301551341 | Interval: 2 (number) | Iteration: 4 | Mode: TIME
[2025-12-12 01:23:55.928 +0200] INFO: ЁЯФД [HardwareService] Smart Strategy Switched Unit
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    strategy: "tank_volume"
    oldUnit: "cm"
    newUnit: "l"
[2025-12-12 01:23:55.928 +0200] INFO: ЁЯФН [HardwareService] Checking Normalization
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    driverId: "hc_sr04"
    sourceUnit: "l"
    raw: 18.35
    value: 2.509316770186331
[2025-12-12 01:23:55.928 +0200] INFO: ЁЯФН [HardwareService] Normalization Result
    env: "development"
    normalized: {
      "value": 2509.316770186331,
      "baseUnit": "ml"
    }
[2025-12-12 01:23:55.928 +0200] INFO: ЁЯУП [HardwareService] Normalized Value
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    from: "l"
    to: "ml"
    original: 2.509316770186331
    normalized: 2509.316770186331
[2025-12-12 01:23:55.928 +0200] WARN: тЪая╕П [HardwareService] Sensor value out of valid range
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    value: 2509.316770186331
    unit: "ml"
    min: 20
    max: 2000
[2025-12-12 01:23:55.928 +0200] ERROR: тЭМ [HardwareService] Failed to load UnitRegistry
    env: "development"
    sourceUnit: "ml"
    err: {
      "type": "Error",
      "message": "Sensor value 2509.316770186331 ml is out of valid range [20 - 2000]",
      "stack":
          Error: Sensor value 2509.316770186331 ml is out of valid range [20 - 2000]
              at HardwareService.readSensorValue (D:\Hydroponics\Hydroponics v5\backend\src\modules\hardware\HardwareService.ts:423:31)
              at SensorReadBlockExecutor.execute (D:\Hydroponics\Hydroponics v5\backend\src\modules\automation\blocks\SensorReadBlockExecutor.ts:26:28)
              at AutomationEngine.executeBlock (D:\Hydroponics\Hydroponics v5\backend\src\modules\automation\AutomationEngine.ts:399:32)
    }
[2025-12-12 01:23:55.933 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "generic_1765301602942"
    edgeFound: true
    nextBlockId: "FLOW_CONTROL_1765301625104"
[2025-12-12 01:23:58.027 +0200] INFO: ЁЯУК [HardwareService] Burst Read Mode
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    sampleCount: 4
    sampleDelay: 50
[SensorRead] ✔️ Saved to 'var_1': 4 l
[LoopBlock Debug] Block: LOOP_1765301551341 | Interval: 2 (number) | Iteration: 5 | Mode: TIME
[2025-12-12 01:23:58.472 +0200] INFO: тЬЕ [HardwareService] Median Calculated
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    samples: [
      18.1,
      18.1,
      18.1,
      58.7
    ]
    median: 18.1
    min: 18.1
    max: 58.7
[2025-12-12 01:23:58.472 +0200] INFO: ЁЯФД [HardwareService] Smart Strategy Switched Unit
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    strategy: "tank_volume"
    oldUnit: "cm"
    newUnit: "l"
[2025-12-12 01:23:58.472 +0200] INFO: ЁЯФН [HardwareService] Checking Normalization
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    driverId: "hc_sr04"
    sourceUnit: "l"
    raw: 18.1
    value: 4
[2025-12-12 01:23:58.472 +0200] INFO: ЁЯФН [HardwareService] Normalization Result
    env: "development"
    normalized: {
      "value": 4000,
      "baseUnit": "ml"
    }
[2025-12-12 01:23:58.472 +0200] INFO: ЁЯУП [HardwareService] Normalized Value
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    from: "l"
    to: "ml"
    original: 4
    normalized: 4000
[2025-12-12 01:23:58.472 +0200] WARN: тЪая╕П [HardwareService] Sensor value out of valid range
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    value: 4000
    unit: "ml"
    min: 20
    max: 2000
[2025-12-12 01:23:58.472 +0200] ERROR: тЭМ [HardwareService] Failed to load UnitRegistry
    env: "development"
    sourceUnit: "ml"
    err: {
      "type": "Error",
      "message": "Sensor value 4000 ml is out of valid range [20 - 2000]",
      "stack":
          Error: Sensor value 4000 ml is out of valid range [20 - 2000]
              at HardwareService.readSensorValue (D:\Hydroponics\Hydroponics v5\backend\src\modules\hardware\HardwareService.ts:423:31)
              at SensorReadBlockExecutor.execute (D:\Hydroponics\Hydroponics v5\backend\src\modules\automation\blocks\SensorReadBlockExecutor.ts:26:28)
              at AutomationEngine.executeBlock (D:\Hydroponics\Hydroponics v5\backend\src\modules\automation\AutomationEngine.ts:399:32)
    }
[2025-12-12 01:23:58.476 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "generic_1765301602942"
    edgeFound: true
    nextBlockId: "FLOW_CONTROL_1765301625104"
[01:24] INFO: ЁЯХТ Scheduler Tick
    env: "development"
[2025-12-12 01:24:00.575 +0200] INFO: ЁЯУК [HardwareService] Burst Read Mode
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    sampleCount: 4
    sampleDelay: 50
[SensorRead] ✔️ Saved to 'var_1': 4 l
[LoopBlock Debug] Block: LOOP_1765301551341 | Interval: 2 (number) | Iteration: 6 | Mode: TIME
[2025-12-12 01:24:01.031 +0200] INFO: тЬЕ [HardwareService] Median Calculated
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    samples: [
      18.1,
      18.1,
      18.1,
      18.6
    ]
    median: 18.1
    min: 18.1
    max: 18.6
[2025-12-12 01:24:01.031 +0200] INFO: ЁЯФД [HardwareService] Smart Strategy Switched Unit
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    strategy: "tank_volume"
    oldUnit: "cm"
    newUnit: "l"
[2025-12-12 01:24:01.031 +0200] INFO: ЁЯФН [HardwareService] Checking Normalization
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    driverId: "hc_sr04"
    sourceUnit: "l"
    raw: 18.1
    value: 4
[2025-12-12 01:24:01.031 +0200] INFO: ЁЯФН [HardwareService] Normalization Result
    env: "development"
    normalized: {
      "value": 4000,
      "baseUnit": "ml"
    }
[2025-12-12 01:24:01.031 +0200] INFO: ЁЯУП [HardwareService] Normalized Value
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    from: "l"
    to: "ml"
    original: 4
    normalized: 4000
[2025-12-12 01:24:01.031 +0200] WARN: тЪая╕П [HardwareService] Sensor value out of valid range
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    value: 4000
    unit: "ml"
    min: 20
    max: 2000
[2025-12-12 01:24:01.031 +0200] ERROR: тЭМ [HardwareService] Failed to load UnitRegistry
    env: "development"
    sourceUnit: "ml"
    err: {
      "type": "Error",
      "message": "Sensor value 4000 ml is out of valid range [20 - 2000]",
      "stack":
          Error: Sensor value 4000 ml is out of valid range [20 - 2000]
              at HardwareService.readSensorValue (D:\Hydroponics\Hydroponics v5\backend\src\modules\hardware\HardwareService.ts:423:31)
              at SensorReadBlockExecutor.execute (D:\Hydroponics\Hydroponics v5\backend\src\modules\automation\blocks\SensorReadBlockExecutor.ts:26:28)
              at AutomationEngine.executeBlock (D:\Hydroponics\Hydroponics v5\backend\src\modules\automation\AutomationEngine.ts:399:32)
    }
[2025-12-12 01:24:01.035 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "generic_1765301602942"
    edgeFound: true
    nextBlockId: "FLOW_CONTROL_1765301625104"
[2025-12-12 01:24:03.124 +0200] INFO: ЁЯУК [HardwareService] Burst Read Mode
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    sampleCount: 4
    sampleDelay: 50
[SensorRead] ✔️ Saved to 'var_1': 4 l
[LoopBlock Debug] Block: LOOP_1765301551341 | Interval: 2 (number) | Iteration: 7 | Mode: TIME
[2025-12-12 01:24:03.567 +0200] INFO: тЬЕ [HardwareService] Median Calculated
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    samples: [
      18.1,
      18.1,
      18.1,
      18.1
    ]
    median: 18.1
    min: 18.1
    max: 18.1
[2025-12-12 01:24:03.567 +0200] INFO: ЁЯФД [HardwareService] Smart Strategy Switched Unit
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    strategy: "tank_volume"
    oldUnit: "cm"
    newUnit: "l"
[2025-12-12 01:24:03.567 +0200] INFO: ЁЯФН [HardwareService] Checking Normalization
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    driverId: "hc_sr04"
    sourceUnit: "l"
    raw: 18.1
    value: 4
[2025-12-12 01:24:03.567 +0200] INFO: ЁЯФН [HardwareService] Normalization Result
    env: "development"
    normalized: {
      "value": 4000,
      "baseUnit": "ml"
    }
[2025-12-12 01:24:03.567 +0200] INFO: ЁЯУП [HardwareService] Normalized Value
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    from: "l"
    to: "ml"
    original: 4
    normalized: 4000
[2025-12-12 01:24:03.567 +0200] WARN: тЪая╕П [HardwareService] Sensor value out of valid range
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    value: 4000
    unit: "ml"
    min: 20
    max: 2000
[2025-12-12 01:24:03.567 +0200] ERROR: тЭМ [HardwareService] Failed to load UnitRegistry
    env: "development"
    sourceUnit: "ml"
    err: {
      "type": "Error",
      "message": "Sensor value 4000 ml is out of valid range [20 - 2000]",
      "stack":
          Error: Sensor value 4000 ml is out of valid range [20 - 2000]
              at HardwareService.readSensorValue (D:\Hydroponics\Hydroponics v5\backend\src\modules\hardware\HardwareService.ts:423:31)
              at SensorReadBlockExecutor.execute (D:\Hydroponics\Hydroponics v5\backend\src\modules\automation\blocks\SensorReadBlockExecutor.ts:26:28)
              at AutomationEngine.executeBlock (D:\Hydroponics\Hydroponics v5\backend\src\modules\automation\AutomationEngine.ts:399:32)
    }
[2025-12-12 01:24:03.571 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "generic_1765301602942"
    edgeFound: true
    nextBlockId: "FLOW_CONTROL_1765301625104"
[2025-12-12 01:24:05.656 +0200] INFO: ЁЯУК [HardwareService] Burst Read Mode
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    sampleCount: 4
    sampleDelay: 50
[SensorRead] ✔️ Saved to 'var_1': 1.0186335403726616 l
[LoopBlock Debug] Block: LOOP_1765301551341 | Interval: 2 (number) | Iteration: 8 | Mode: TIME
[2025-12-12 01:24:06.168 +0200] INFO: тЬЕ [HardwareService] Median Calculated
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    samples: [
      18.1,
      18.6,
      18.6,
      58.6
    ]
    median: 18.6
    min: 18.1
    max: 58.6
[2025-12-12 01:24:06.168 +0200] INFO: ЁЯФД [HardwareService] Smart Strategy Switched Unit
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    strategy: "tank_volume"
    oldUnit: "cm"
    newUnit: "l"
[2025-12-12 01:24:06.168 +0200] INFO: ЁЯФН [HardwareService] Checking Normalization
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    driverId: "hc_sr04"
    sourceUnit: "l"
    raw: 18.6
    value: 1.0186335403726616
[2025-12-12 01:24:06.168 +0200] INFO: ЁЯФН [HardwareService] Normalization Result
    env: "development"
    normalized: {
      "value": 1018.6335403726616,
      "baseUnit": "ml"
    }
[2025-12-12 01:24:06.168 +0200] INFO: ЁЯУП [HardwareService] Normalized Value
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    from: "l"
    to: "ml"
    original: 1.0186335403726616
    normalized: 1018.6335403726616
[2025-12-12 01:24:06.168 +0200] INFO: ЁЯСА [HardwareService] Converted Primary to Display Unit
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    from: "ml"
    to: "l"
    original: 1018.6335403726616
    converted: 1.0186335403726616
[2025-12-12 01:24:06.171 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "generic_1765301602942"
    edgeFound: true
    nextBlockId: "FLOW_CONTROL_1765301625104"
[2025-12-12 01:24:08.250 +0200] INFO: ЁЯУК [HardwareService] Burst Read Mode
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    sampleCount: 4
    sampleDelay: 50
[SensorRead] ✔️ Saved to 'var_1': 4 l
[LoopBlock Debug] Block: LOOP_1765301551341 | Interval: 2 (number) | Iteration: 9 | Mode: TIME
[2025-12-12 01:24:08.699 +0200] INFO: тЬЕ [HardwareService] Median Calculated
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    samples: [
      18.1,
      18.1,
      18.1,
      18.6
    ]
    median: 18.1
    min: 18.1
    max: 18.6
[2025-12-12 01:24:08.699 +0200] INFO: ЁЯФД [HardwareService] Smart Strategy Switched Unit
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    strategy: "tank_volume"
    oldUnit: "cm"
    newUnit: "l"
[2025-12-12 01:24:08.699 +0200] INFO: ЁЯФН [HardwareService] Checking Normalization
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    driverId: "hc_sr04"
    sourceUnit: "l"
    raw: 18.1
    value: 4
[2025-12-12 01:24:08.700 +0200] INFO: ЁЯФН [HardwareService] Normalization Result
    env: "development"
    normalized: {
      "value": 4000,
      "baseUnit": "ml"
    }
[2025-12-12 01:24:08.700 +0200] INFO: ЁЯУП [HardwareService] Normalized Value
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    from: "l"
    to: "ml"
    original: 4
    normalized: 4000
[2025-12-12 01:24:08.700 +0200] WARN: тЪая╕П [HardwareService] Sensor value out of valid range
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    value: 4000
    unit: "ml"
    min: 20
    max: 2000
[2025-12-12 01:24:08.700 +0200] ERROR: тЭМ [HardwareService] Failed to load UnitRegistry
    env: "development"
    sourceUnit: "ml"
    err: {
      "type": "Error",
      "message": "Sensor value 4000 ml is out of valid range [20 - 2000]",
      "stack":
          Error: Sensor value 4000 ml is out of valid range [20 - 2000]
              at HardwareService.readSensorValue (D:\Hydroponics\Hydroponics v5\backend\src\modules\hardware\HardwareService.ts:423:31)
              at SensorReadBlockExecutor.execute (D:\Hydroponics\Hydroponics v5\backend\src\modules\automation\blocks\SensorReadBlockExecutor.ts:26:28)
              at AutomationEngine.executeBlock (D:\Hydroponics\Hydroponics v5\backend\src\modules\automation\AutomationEngine.ts:399:32)
    }
[2025-12-12 01:24:08.706 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "generic_1765301602942"
    edgeFound: true
    nextBlockId: "FLOW_CONTROL_1765301625104"
[ActuatorSet] ✔️ Set 'OFF' (State: 0)
[2025-12-12 01:24:10.723 +0200] WARN: Block execution failed
    env: "development"
    blockId: "LOOP_1765301551341"
    attempt: 1
    err: "Loop timed out after 20.4s (Limit: 20s)"
[2025-12-12 01:24:10.723 +0200] ERROR: All retries exhausted.
    env: "development"
    blockId: "LOOP_1765301551341"
    policy: "CONTINUE"
[2025-12-12 01:24:10.798 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "generic_1765301584742"
    edgeFound: true
    nextBlockId: "end"
[2025-12-12 01:24:10.803 +0200] INFO: тЬЕ Cycle Step Completed
    env: "development"
    cycleId: "6932b9a147564095227cf802"
    step: 0
[2025-12-12 01:24:10.803 +0200] INFO: ЁЯПБ Cycle Completed Successfully
    env: "development"
    sessionId: "693b5283a7c413d378f91872"
[2025-12-12 01:24:10.811 +0200] INFO: тЬЕ Active Program Cycle Marked Completed
    env: "development"
    cycleId: "6932b9a147564095227cf802"
[01:25] INFO: ЁЯХТ Scheduler Tick
[2025-12-10 12:44:18.483 +0200] INFO: ЁЯЧСя╕П Active Program Unloaded
    env: "development"
GET /api/active-program/variables called
Variables found: {
  '6932b9a147564095227cf802': [
    {
      name: 'Global 2',
      type: 'number',
      default: undefined,
      unit: '',
      hasTolerance: true,
      description: undefined,
      cycleId: '6932b9a147564095227cf802',
      flowId: 'testerror',
      flowName: 'TestError',
      flowDescription: ''
    }
  ]
}
GET /api/active-program/variables called
Variables found: {
  '6932b9a147564095227cf802': [
    {
      name: 'Global 2',
      type: 'number',
      default: undefined,
      unit: '',
      hasTolerance: true,
      description: undefined,
      cycleId: '6932b9a147564095227cf802',
      flowId: 'testerror',
      flowName: 'TestError',
      flowDescription: ''
    }
  ]
}
[2025-12-10 12:44:22.781 +0200] INFO: ЁЯУе Active Program Loaded
    env: "development"
    program: "╨Я╤А╨╛╨│╤А╨░╨╝╨░ 01 ╨в╨Х╨б╨в"
[2025-12-10 12:44:35.313 +0200] INFO: ЁЯУЭ Active Program Updated
    env: "development"
GET /api/active-program/variables called
Variables found: {
  '6932b9a147564095227cf802': [
    {
      name: 'Global 2',
      type: 'number',
      default: undefined,
      unit: '',
      hasTolerance: true,
      description: undefined,
      cycleId: '6932b9a147564095227cf802',
      flowId: 'testerror',
      flowName: 'TestError',
      flowDescription: ''
    }
  ]
}
GET /api/active-program/variables called
Variables found: {
  '6932b9a147564095227cf802': [
    {
      name: 'Global 2',
      type: 'number',
      default: undefined,
      unit: '',
      hasTolerance: true,
      description: undefined,
      cycleId: '6932b9a147564095227cf802',
      flowId: 'testerror',
      flowName: 'TestError',
      flowDescription: ''
    }
  ]
}
[2025-12-10 12:44:37.158 +0200] INFO: тЦ╢я╕П Active Program Started
    env: "development"
[2025-12-10 12:44:38.657 +0200] INFO: тЪб Cycle Force Started (Time updated to Now)
    env: "development"
    itemId: "69394f06cf9e07fd1f1704d8"
    newTime: "12:44"
[2025-12-10 12:44:38.660 +0200] INFO: Attempting to start cycle with sanitized steps
    env: "development"
    cycleId: "6932b9a147564095227cf802"
    steps: [
      {
        "flowId": "testerror",
        "overrides": {}
      }
    ]
[2025-12-10 12:44:38.662 +0200] INFO: ЁЯЪА Starting Cycle (Trace Overrides)
    env: "development"
    cycleId: "6932b9a147564095227cf802"
    sessionId: "69394f16cf9e07fd1f17052b"
    stepsCount: 1
    overrides: {
      "Global 2": 100,
      "Global 2_tolerance": 20
    }
[2025-12-10 12:44:38.662 +0200] INFO: тЦ╢я╕П Executing Cycle Step
    env: "development"
    step: 0
    flowId: "testerror"
[2025-12-10 12:44:38.662 +0200] INFO: ЁЯФз Cycle Step Overrides Resolution
    env: "development"
    step: 0
    sessionOverrides: {
      "Global 2": 100,
      "Global 2_tolerance": 20
    }
    finalOverrides: {
      "Global 2": 100,
      "Global 2_tolerance": 20
    }
[2025-12-10 12:44:38.665 +0200] INFO: тЬи AutomationEngine Actor Initialized/Reset (Session: none)
    env: "development"
[2025-12-10 12:44:38.674 +0200] INFO: ЁЯзй AutomationEngine: Input Resolution
    env: "development"
    overrides: {
      "Global 2": 100,
      "Global 2_tolerance": 20
    }
    variablesResolved: {}
[2025-12-10 12:44:38.676 +0200] INFO: ЁЯУе Loading Program Session
    env: "development"
    sessionId: "69394f16cf9e07fd1f170531"
    programId: "testerror"
    variables: {
      "global_2": 100,
      "Global 2": 100,
      "Global 2_tolerance": 20,
      "global_2_tolerance": 20
    }
[2025-12-10 12:44:38.686 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "start"
    edgeFound: true
    nextBlockId: "SENSOR_READ_1765271435543"
[2025-12-10 12:44:38.709 +0200] INFO: ЁЯФМ [HardwareService] Creating Serial Transport
    env: "development"
    controllerId: "693134db23b1320394ed43b5"
    port: "COM3"
[2025-12-10 12:44:38.710 +0200] INFO: ЁЯФМ [SerialTransport] Connecting...
    env: "development"
    path: "COM3"
    baudRate: 9600
[2025-12-10 12:44:38.807 +0200] INFO: тЬЕ [SerialTransport] Port Opened
    env: "development"
    path: "COM3"
[SensorRead] ✔️ Saved to 'var_1': 0 l
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
[IfBlock Tolerance] Applied for 'global_2': 20 (Mode: symmetric)
[2025-12-10 12:44:40.971 +0200] INFO: ЁЯФД [HardwareService] Strategy Changed Output Unit
    env: "development"
    deviceId: "693695d9585420702157d812"
    strategy: "tank_volume"
    driverUnit: "cm"
    newUnit: "l"
[2025-12-10 12:44:40.971 +0200] INFO: ЁЯФН [HardwareService] Checking Normalization
    env: "development"
    deviceId: "693695d9585420702157d812"
    driverId: "hc_sr04"
    sourceUnit: "l"
    raw: 18.6
    value: 0
[2025-12-10 12:44:40.971 +0200] INFO: ЁЯФН [HardwareService] Normalization Result
    env: "development"
    normalized: {
      "value": 0,
      "baseUnit": "ml"
    }
[2025-12-10 12:44:40.971 +0200] INFO: ЁЯУП [HardwareService] Normalized Value
    env: "development"
    deviceId: "693695d9585420702157d812"
    from: "l"
    to: "ml"
    original: 0
    normalized: 0
[2025-12-10 12:44:40.976 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "SENSOR_READ_1765271435543"
    edgeFound: true
    nextBlockId: "IF_1765301518579"
[2025-12-10 12:44:40.978 +0200] INFO: тЭУ IF Block Navigation Trace
    env: "development"
    blockId: "IF_1765301518579"
    result: false
    expectedHandle: "false"
    nextBlockId: "ACTUATOR_SET_1765301557224"
[ActuatorSet] ✔️ Set 'ON' (State: 1)
[LoopBlock Debug] Block: LOOP_1765301551341 | Interval: 2 (number) | Iteration: 1 | Mode: TIME
[2025-12-10 12:44:41.050 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "ACTUATOR_SET_1765301557224"
    edgeFound: true
    nextBlockId: "LOOP_1765301551341"
[SensorRead] ✔️ Saved to 'var_1': 0 l
[LoopBlock Debug] Block: LOOP_1765301551341 | Interval: 2 (number) | Iteration: 2 | Mode: TIME
[2025-12-10 12:44:41.131 +0200] INFO: ЁЯФД [HardwareService] Strategy Changed Output Unit
    env: "development"
    deviceId: "693695d9585420702157d812"
    strategy: "tank_volume"
    driverUnit: "cm"
    newUnit: "l"
[2025-12-10 12:44:41.131 +0200] INFO: ЁЯФН [HardwareService] Checking Normalization
    env: "development"
    deviceId: "693695d9585420702157d812"
    driverId: "hc_sr04"
    sourceUnit: "l"
    raw: 18.6
    value: 0
[2025-12-10 12:44:41.131 +0200] INFO: ЁЯФН [HardwareService] Normalization Result
    env: "development"
    normalized: {
      "value": 0,
      "baseUnit": "ml"
    }
[2025-12-10 12:44:41.131 +0200] INFO: ЁЯУП [HardwareService] Normalized Value
    env: "development"
    deviceId: "693695d9585420702157d812"
    from: "l"
    to: "ml"
    original: 0
    normalized: 0
[2025-12-10 12:44:41.135 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "generic_1765301602942"
    edgeFound: true
    nextBlockId: "FLOW_CONTROL_1765301625104"
[SensorRead] ✔️ Saved to 'var_1': 0 l
[LoopBlock Debug] Block: LOOP_1765301551341 | Interval: 2 (number) | Iteration: 3 | Mode: TIME
[2025-12-10 12:44:43.216 +0200] INFO: ЁЯФД [HardwareService] Strategy Changed Output Unit
    env: "development"
    deviceId: "693695d9585420702157d812"
    strategy: "tank_volume"
    driverUnit: "cm"
    newUnit: "l"
[2025-12-10 12:44:43.216 +0200] INFO: ЁЯФН [HardwareService] Checking Normalization
    env: "development"
    deviceId: "693695d9585420702157d812"
    driverId: "hc_sr04"
    sourceUnit: "l"
    raw: 18.6
    value: 0
[2025-12-10 12:44:43.217 +0200] INFO: ЁЯФН [HardwareService] Normalization Result
    env: "development"
    normalized: {
      "value": 0,
      "baseUnit": "ml"
    }
[2025-12-10 12:44:43.217 +0200] INFO: ЁЯУП [HardwareService] Normalized Value
    env: "development"
    deviceId: "693695d9585420702157d812"
    from: "l"
    to: "ml"
    original: 0
    normalized: 0
[2025-12-10 12:44:43.220 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "generic_1765301602942"
    edgeFound: true
    nextBlockId: "FLOW_CONTROL_1765301625104"
[SensorRead] ✔️ Saved to 'var_1': 0 l
[LoopBlock Debug] Block: LOOP_1765301551341 | Interval: 2 (number) | Iteration: 4 | Mode: TIME
[2025-12-10 12:44:45.311 +0200] INFO: ЁЯФД [HardwareService] Strategy Changed Output Unit
    env: "development"
    deviceId: "693695d9585420702157d812"
    strategy: "tank_volume"
    driverUnit: "cm"
    newUnit: "l"
[2025-12-10 12:44:45.311 +0200] INFO: ЁЯФН [HardwareService] Checking Normalization
    env: "development"
    deviceId: "693695d9585420702157d812"
    driverId: "hc_sr04"
    sourceUnit: "l"
    raw: 18.6
    value: 0
[2025-12-10 12:44:45.311 +0200] INFO: ЁЯФН [HardwareService] Normalization Result
    env: "development"
    normalized: {
      "value": 0,
      "baseUnit": "ml"
    }
[2025-12-10 12:44:45.311 +0200] INFO: ЁЯУП [HardwareService] Normalized Value
    env: "development"
    deviceId: "693695d9585420702157d812"
    from: "l"
    to: "ml"
    original: 0
    normalized: 0
[2025-12-10 12:44:45.315 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "generic_1765301602942"
    edgeFound: true
    nextBlockId: "FLOW_CONTROL_1765301625104"
[2025-12-10 12:44:47.325 +0200] WARN: Block execution failed
    env: "development"
    blockId: "LOOP_1765301551341"
    attempt: 1
    err: "Loop timed out after 6.3s (Limit: 6s)"
[2025-12-10 12:44:47.326 +0200] ERROR: All retries exhausted.
    env: "development"
    blockId: "LOOP_1765301551341"
    policy: "GOTO_LABEL"
[2025-12-10 12:44:47.331 +0200] INFO: тЬЕ Cycle Step Completed
    env: "development"
    cycleId: "6932b9a147564095227cf802"
    step: 0
[2025-12-10 12:44:47.332 +0200] INFO: ЁЯПБ Cycle Completed Successfully
    env: "development"
    sessionId: "69394f16cf9e07fd1f17052b"
[2025-12-10 12:44:47.344 +0200] INFO: тЬЕ Active Program Cycle Marked Completed
    env: "development"
    cycleId: "6932b9a147564095227cf802"
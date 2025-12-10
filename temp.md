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
[2025-12-10 11:44:40.682 +0200] INFO: ЁЯУе Active Program Loaded
    env: "development"
    program: "╨Я╤А╨╛╨│╤А╨░╨╝╨░ 01 ╨в╨Х╨б╨в"
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
[2025-12-10 11:44:45.830 +0200] INFO: ЁЯУЭ Active Program Updated
    env: "development"
[2025-12-10 11:44:47.153 +0200] INFO: тЦ╢я╕П Active Program Started
    env: "development"
[2025-12-10 11:44:47.973 +0200] INFO: тЪб Cycle Force Started (Time updated to Now)
    env: "development"
    itemId: "69394108d1a52a6cffa855d7"
    newTime: "11:44"
[2025-12-10 11:44:47.981 +0200] INFO: Attempting to start cycle with sanitized steps
    env: "development"
    cycleId: "6932b9a147564095227cf802"
    steps: [
      {
        "flowId": "testerror",
        "overrides": {}
      }
    ]
[2025-12-10 11:44:47.989 +0200] INFO: ЁЯЪА Starting Cycle (Trace Overrides)
    env: "development"
    cycleId: "6932b9a147564095227cf802"
    sessionId: "6939410fd1a52a6cffa85624"
    stepsCount: 1
    overrides: {
      "Global 2": 98,
      "Global 2_tolerance": 20
    }
[2025-12-10 11:44:47.989 +0200] INFO: тЦ╢я╕П Executing Cycle Step
    env: "development"
    step: 0
    flowId: "testerror"
[2025-12-10 11:44:47.989 +0200] INFO: ЁЯФз Cycle Step Overrides Resolution
    env: "development"
    step: 0
    sessionOverrides: {
      "Global 2": 98,
      "Global 2_tolerance": 20
    }
    finalOverrides: {
      "Global 2": 98,
      "Global 2_tolerance": 20
    }
[2025-12-10 11:44:47.995 +0200] INFO: тЬи AutomationEngine Actor Initialized/Reset (Session: none)
    env: "development"
[2025-12-10 11:44:48.019 +0200] INFO: ЁЯзй AutomationEngine: Input Resolution
    env: "development"
    overrides: {
      "Global 2": 98,
      "Global 2_tolerance": 20
    }
    variablesResolved: {}
[2025-12-10 11:44:48.022 +0200] INFO: ЁЯУе Loading Program Session
    env: "development"
    sessionId: "69394110d1a52a6cffa8562a"
    programId: "testerror"
    variables: {
      "global_2": 98,
      "Global 2": 98,
      "Global 2_tolerance": 20
    }
[2025-12-10 11:44:48.034 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "start"
    edgeFound: true
    nextBlockId: "SENSOR_READ_1765271435543"
[2025-12-10 11:44:48.054 +0200] INFO: ЁЯФМ [HardwareService] Creating Serial Transport
    env: "development"
    controllerId: "693134db23b1320394ed43b5"
    port: "COM3"
[2025-12-10 11:44:48.055 +0200] INFO: ЁЯФМ [SerialTransport] Connecting...
    env: "development"
    path: "COM3"
    baudRate: 9600
[2025-12-10 11:44:48.103 +0200] INFO: тЬЕ [SerialTransport] Port Opened
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
[IfBlock DEBUG] Tolerance 'var_1_tolerance' NOT found. Available keys (4): global_2, Global 2, Global 2_tolerance, var_1
[IfBlock DEBUG] Checking Right Tolerance for: {{global_2}}
[IfBlock DEBUG] Fuzzy match found: 'global_2_tolerance' -> 'Global 2_tolerance'
[IfBlock DEBUG] FOUND Tolerance: 20 (Mode: undefined)
[ActuatorSet] ✔️ Set 'ON' (State: 1)
[LoopBlock Debug] Block: LOOP_1765301551341 | Interval: 2 (number) | Iteration: 1 | Mode: TIME
[SensorRead] ✔️ Saved to 'var_1': 0 l
[LoopBlock Debug] Block: LOOP_1765301551341 | Interval: 2 (number) | Iteration: 2 | Mode: TIME
[2025-12-10 11:44:50.218 +0200] INFO: ЁЯФД [HardwareService] Strategy Changed Output Unit
    env: "development"
    deviceId: "693695d9585420702157d812"
    strategy: "tank_volume"
    driverUnit: "cm"
    newUnit: "l"
[2025-12-10 11:44:50.218 +0200] INFO: ЁЯФН [HardwareService] Checking Normalization
    env: "development"
    deviceId: "693695d9585420702157d812"
    driverId: "hc_sr04"
    sourceUnit: "l"
    raw: 18.6
    value: 0
[2025-12-10 11:44:50.219 +0200] INFO: ЁЯФН [HardwareService] Normalization Result
    env: "development"
    normalized: {
      "value": 0,
      "baseUnit": "ml"
    }
[2025-12-10 11:44:50.219 +0200] INFO: ЁЯУП [HardwareService] Normalized Value
    env: "development"
    deviceId: "693695d9585420702157d812"
    from: "l"
    to: "ml"
    original: 0
    normalized: 0
[2025-12-10 11:44:50.224 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "SENSOR_READ_1765271435543"
    edgeFound: true
    nextBlockId: "IF_1765301518579"
[2025-12-10 11:44:50.227 +0200] INFO: тЭУ IF Block Navigation Trace
    env: "development"
    blockId: "IF_1765301518579"
    result: false
    expectedHandle: "false"
    nextBlockId: "ACTUATOR_SET_1765301557224"
[2025-12-10 11:44:50.301 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "ACTUATOR_SET_1765301557224"
    edgeFound: true
    nextBlockId: "LOOP_1765301551341"
[2025-12-10 11:44:50.380 +0200] INFO: ЁЯФД [HardwareService] Strategy Changed Output Unit
    env: "development"
    deviceId: "693695d9585420702157d812"
    strategy: "tank_volume"
    driverUnit: "cm"
    newUnit: "l"
[2025-12-10 11:44:50.380 +0200] INFO: ЁЯФН [HardwareService] Checking Normalization
    env: "development"
    deviceId: "693695d9585420702157d812"
    driverId: "hc_sr04"
    sourceUnit: "l"
    raw: 18.6
    value: 0
[2025-12-10 11:44:50.381 +0200] INFO: ЁЯФН [HardwareService] Normalization Result
    env: "development"
    normalized: {
      "value": 0,
      "baseUnit": "ml"
    }
[2025-12-10 11:44:50.381 +0200] INFO: ЁЯУП [HardwareService] Normalized Value
    env: "development"
    deviceId: "693695d9585420702157d812"
    from: "l"
    to: "ml"
    original: 0
    normalized: 0
[2025-12-10 11:44:50.386 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "generic_1765301602942"
    edgeFound: true
    nextBlockId: "FLOW_CONTROL_1765301625104"
[SensorRead] ✔️ Saved to 'var_1': -241.56626506024094 l
[LoopBlock Debug] Block: LOOP_1765301551341 | Interval: 2 (number) | Iteration: 3 | Mode: TIME
[2025-12-10 11:44:52.487 +0200] INFO: ЁЯФД [HardwareService] Strategy Changed Output Unit
    env: "development"
    deviceId: "693695d9585420702157d812"
    strategy: "tank_volume"
    driverUnit: "cm"
    newUnit: "l"
[2025-12-10 11:44:52.487 +0200] INFO: ЁЯФН [HardwareService] Checking Normalization
    env: "development"
    deviceId: "693695d9585420702157d812"
    driverId: "hc_sr04"
    sourceUnit: "l"
    raw: 58.7
    value: -241.56626506024094
[2025-12-10 11:44:52.487 +0200] INFO: ЁЯФН [HardwareService] Normalization Result
    env: "development"
    normalized: {
      "value": -241566.26506024093,
      "baseUnit": "ml"
    }
[2025-12-10 11:44:52.487 +0200] INFO: ЁЯУП [HardwareService] Normalized Value
    env: "development"
    deviceId: "693695d9585420702157d812"
    from: "l"
    to: "ml"
    original: -241.56626506024094
    normalized: -241566.26506024093
[2025-12-10 11:44:52.490 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "generic_1765301602942"
    edgeFound: true
    nextBlockId: "FLOW_CONTROL_1765301625104"
[SensorRead] ✔️ Saved to 'var_1': -241.56626506024094 l
[LoopBlock Debug] Block: LOOP_1765301551341 | Interval: 2 (number) | Iteration: 4 | Mode: TIME
[2025-12-10 11:44:54.580 +0200] INFO: ЁЯФД [HardwareService] Strategy Changed Output Unit
    env: "development"
    deviceId: "693695d9585420702157d812"
    strategy: "tank_volume"
    driverUnit: "cm"
    newUnit: "l"
[2025-12-10 11:44:54.580 +0200] INFO: ЁЯФН [HardwareService] Checking Normalization
    env: "development"
    deviceId: "693695d9585420702157d812"
    driverId: "hc_sr04"
    sourceUnit: "l"
    raw: 58.7
    value: -241.56626506024094
[2025-12-10 11:44:54.581 +0200] INFO: ЁЯФН [HardwareService] Normalization Result
    env: "development"
    normalized: {
      "value": -241566.26506024093,
      "baseUnit": "ml"
    }
[2025-12-10 11:44:54.581 +0200] INFO: ЁЯУП [HardwareService] Normalized Value
    env: "development"
    deviceId: "693695d9585420702157d812"
    from: "l"
    to: "ml"
    original: -241.56626506024094
    normalized: -241566.26506024093
[2025-12-10 11:44:54.583 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "generic_1765301602942"
    edgeFound: true
    nextBlockId: "FLOW_CONTROL_1765301625104"
[2025-12-10 11:44:56.585 +0200] WARN: Block execution failed
    env: "development"
    blockId: "LOOP_1765301551341"
    attempt: 1
    err: "Loop timed out after 6.3s (Limit: 6s)"
[2025-12-10 11:44:56.586 +0200] ERROR: All retries exhausted.
    env: "development"
    blockId: "LOOP_1765301551341"
    policy: "GOTO_LABEL"
[2025-12-10 11:44:56.591 +0200] INFO: тЬЕ Cycle Step Completed
    env: "development"
    cycleId: "6932b9a147564095227cf802"
    step: 0
[2025-12-10 11:44:56.591 +0200] INFO: ЁЯПБ Cycle Completed Successfully
    env: "development"
    sessionId: "6939410fd1a52a6cffa85624"
[2025-12-10 11:44:56.607 +0200] INFO: тЬЕ Active Program Cycle Marked Completed
    env: "development"
    cycleId: "6932b9a147564095227cf802"
[2025-12-09 23:15:40.533 +0200] INFO: ЁЯУЬ [HistoryService] Initializing...
    env: "development"
[2025-12-09 23:15:40.724 +0200] INFO: ЁЯЪА Socket.io Initialized
    env: "development"
[2025-12-09 23:15:40.790 +0200] INFO: ЁЯХТ Scheduler Service Started
    env: "development"
[2025-12-09 23:15:40.793 +0200] INFO: ЁЯЪА Server running on port 3000
    env: "development"
[2025-12-09 23:15:42.667 +0200] INFO: ЁЯФМ Client Connected to WebSocket
    env: "development"
    socketId: "_giBwVAkWf752we7AAAB"
[2025-12-09 23:15:43.921 +0200] INFO: тЪб Cycle Force Started (Time updated to Now)
    env: "development"
    itemId: "6938916dbb826d2ab2fb4160"
    newTime: "23:15"
[2025-12-09 23:15:43.924 +0200] INFO: Attempting to start cycle with sanitized steps
    env: "development"
    cycleId: "6932b9a147564095227cf802"
    steps: [
      {
        "flowId": "testerror",
        "overrides": {}
      }
    ]
[2025-12-09 23:15:43.928 +0200] INFO: ЁЯЪА Starting Cycle (Trace Overrides)
    env: "development"
    cycleId: "6932b9a147564095227cf802"
    sessionId: "6938917faa2e64918aa6aa7a"
    stepsCount: 1
    overrides: {
      "Global 2": 99,
      "Global 2_tolerance": 3
    }
[2025-12-09 23:15:43.928 +0200] INFO: тЦ╢я╕П Executing Cycle Step
    env: "development"
    step: 0
    flowId: "testerror"
[2025-12-09 23:15:43.928 +0200] INFO: ЁЯФз Cycle Step Overrides Resolution
    env: "development"
    step: 0
    sessionOverrides: {
      "Global 2": 99,
      "Global 2_tolerance": 3
    }
    finalOverrides: {
      "Global 2": 99,
      "Global 2_tolerance": 3
    }
[2025-12-09 23:15:43.930 +0200] INFO: тЬи AutomationEngine Actor Initialized/Reset (Session: none)
    env: "development"
[2025-12-09 23:15:43.953 +0200] INFO: ЁЯзй AutomationEngine: Input Resolution
    env: "development"
    overrides: {
      "Global 2": 99,
      "Global 2_tolerance": 3
    }
    variablesResolved: {}
[2025-12-09 23:15:43.956 +0200] INFO: ЁЯУе Loading Program Session
    env: "development"
    sessionId: "6938917faa2e64918aa6aa80"
    programId: "testerror"
    variables: {
      "global_2": 99,
      "Global 2": 99
    }
[2025-12-09 23:15:43.956 +0200] INFO: ЁЯЫая╕П AutomationEngine LOAD Payload
    env: "development"
    execContextKeys: [
      "variables",
      "variableDefinitions",
      "resumeState"
    ]
    resumeState: {}
[2025-12-09 23:15:43.966 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "start"
    edgeFound: true
    nextBlockId: "SENSOR_READ_1765271435543"
[2025-12-09 23:15:43.987 +0200] INFO: ЁЯФМ [HardwareService] Creating Serial Transport
    env: "development"
    controllerId: "693134db23b1320394ed43b5"
    port: "COM3"
[2025-12-09 23:15:43.987 +0200] INFO: ЁЯФМ [SerialTransport] Connecting...
    env: "development"
    path: "COM3"
    baudRate: 9600
[2025-12-09 23:15:44.046 +0200] INFO: тЬЕ [SerialTransport] Port Opened
    env: "development"
    path: "COM3"
[SensorRead] ✔️ Saved to 'var_1': -241.56626506024094 l
[2025-12-09 23:15:46.155 +0200] INFO: ЁЯФД [HardwareService] Strategy Changed Output Unit
    env: "development"
    deviceId: "693695d9585420702157d812"
    strategy: "tank_volume"
    driverUnit: "cm"
    newUnit: "l"
[2025-12-09 23:15:46.155 +0200] INFO: ЁЯФН [HardwareService] Checking Normalization
    env: "development"
    deviceId: "693695d9585420702157d812"
    driverId: "hc_sr04"
    sourceUnit: "l"
    raw: 58.7
    value: -241.56626506024094
[2025-12-09 23:15:46.155 +0200] INFO: ЁЯФН [HardwareService] Normalization Result
    env: "development"
    normalized: {
      "value": -241566.26506024093,
      "baseUnit": "ml"
    }
[2025-12-09 23:15:46.155 +0200] INFO: ЁЯУП [HardwareService] Normalized Value
    env: "development"
    deviceId: "693695d9585420702157d812"
    from: "l"
    to: "ml"
    original: -241.56626506024094
    normalized: -241566.26506024093
[2025-12-09 23:15:46.160 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "SENSOR_READ_1765271435543"
    edgeFound: true
    nextBlockId: "IF_1765301518579"
[2025-12-09 23:15:46.162 +0200] INFO: тЭУ IF Block Navigation Trace
    env: "development"
    blockId: "IF_1765301518579"
    result: false
    expectedHandle: "false"
    nextBlockId: "ACTUATOR_SET_1765301557224"
[ActuatorSet] ✔️ Set 'ON' (State: 1)
[2025-12-09 23:15:46.235 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "ACTUATOR_SET_1765301557224"
    edgeFound: true
    nextBlockId: "LOOP_1765301551341"
[2025-12-09 23:15:46.236 +0200] INFO: ЁЯФД LoopBlock Debug Trace
    env: "development"
    blockId: "LOOP_1765301551341"
    iteration: 1
    interval: 2
    limitMode: "TIME"
    allResumeState: {}
[SensorRead] ✔️ Saved to 'var_1': 0 l
[2025-12-09 23:15:46.354 +0200] INFO: ЁЯФД [HardwareService] Strategy Changed Output Unit
    env: "development"
    deviceId: "693695d9585420702157d812"
    strategy: "tank_volume"
    driverUnit: "cm"
    newUnit: "l"
[2025-12-09 23:15:46.354 +0200] INFO: ЁЯФН [HardwareService] Checking Normalization
    env: "development"
    deviceId: "693695d9585420702157d812"
    driverId: "hc_sr04"
    sourceUnit: "l"
    raw: 18.6
    value: 0
[2025-12-09 23:15:46.354 +0200] INFO: ЁЯФН [HardwareService] Normalization Result
    env: "development"
    normalized: {
      "value": 0,
      "baseUnit": "ml"
    }
[2025-12-09 23:15:46.354 +0200] INFO: ЁЯУП [HardwareService] Normalized Value
    env: "development"
    deviceId: "693695d9585420702157d812"
    from: "l"
    to: "ml"
    original: 0
    normalized: 0
[2025-12-09 23:15:46.359 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "generic_1765301602942"
    edgeFound: true
    nextBlockId: "FLOW_CONTROL_1765301625104"
[2025-12-09 23:15:46.362 +0200] INFO: ЁЯФД LoopBlock Debug Trace
    env: "development"
    blockId: "LOOP_1765301551341"
    iteration: 2
    interval: 2
    limitMode: "TIME"
    resumeState: {
      "iteration": 1,
      "startTime": 1765314946236
    }
    allResumeState: {
      "LOOP_1765301551341": {
        "iteration": 1,
        "startTime": 1765314946236
      }
    }
[SensorRead] ✔️ Saved to 'var_1': -2.4096385542168544 l
[2025-12-09 23:15:48.444 +0200] INFO: ЁЯФД [HardwareService] Strategy Changed Output Unit
    env: "development"
    deviceId: "693695d9585420702157d812"
    strategy: "tank_volume"
    driverUnit: "cm"
    newUnit: "l"
[2025-12-09 23:15:48.444 +0200] INFO: ЁЯФН [HardwareService] Checking Normalization
    env: "development"
    deviceId: "693695d9585420702157d812"
    driverId: "hc_sr04"
    sourceUnit: "l"
    raw: 19
    value: -2.409638554216855
[2025-12-09 23:15:48.444 +0200] INFO: ЁЯФН [HardwareService] Normalization Result
    env: "development"
    normalized: {
      "value": -2409.6385542168546,
      "baseUnit": "ml"
    }
[2025-12-09 23:15:48.444 +0200] INFO: ЁЯУП [HardwareService] Normalized Value
    env: "development"
    deviceId: "693695d9585420702157d812"
    from: "l"
    to: "ml"
    original: -2.409638554216855
    normalized: -2409.6385542168546
[2025-12-09 23:15:48.447 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "generic_1765301602942"
    edgeFound: true
    nextBlockId: "FLOW_CONTROL_1765301625104"
[2025-12-09 23:15:48.448 +0200] INFO: ЁЯФД LoopBlock Debug Trace
    env: "development"
    blockId: "LOOP_1765301551341"
    iteration: 3
    interval: 2
    limitMode: "TIME"
    resumeState: {
      "iteration": 2,
      "startTime": 1765314946236
    }
    allResumeState: {
      "LOOP_1765301551341": {
        "iteration": 2,
        "startTime": 1765314946236
      }
    }
[SensorRead] ✔️ Saved to 'var_1': 0 l
[2025-12-09 23:15:50.537 +0200] INFO: ЁЯФД [HardwareService] Strategy Changed Output Unit
    env: "development"
    deviceId: "693695d9585420702157d812"
    strategy: "tank_volume"
    driverUnit: "cm"
    newUnit: "l"
[2025-12-09 23:15:50.537 +0200] INFO: ЁЯФН [HardwareService] Checking Normalization
    env: "development"
    deviceId: "693695d9585420702157d812"
    driverId: "hc_sr04"
    sourceUnit: "l"
    raw: 18.6
    value: 0
[2025-12-09 23:15:50.537 +0200] INFO: ЁЯФН [HardwareService] Normalization Result
    env: "development"
    normalized: {
      "value": 0,
      "baseUnit": "ml"
    }
[2025-12-09 23:15:50.537 +0200] INFO: ЁЯУП [HardwareService] Normalized Value
    env: "development"
    deviceId: "693695d9585420702157d812"
    from: "l"
    to: "ml"
    original: 0
    normalized: 0
[2025-12-09 23:15:50.542 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "generic_1765301602942"
    edgeFound: true
    nextBlockId: "FLOW_CONTROL_1765301625104"
[2025-12-09 23:15:50.544 +0200] INFO: ЁЯФД LoopBlock Debug Trace
    env: "development"
    blockId: "LOOP_1765301551341"
    iteration: 4
    interval: 2
    limitMode: "TIME"
    resumeState: {
      "iteration": 3,
      "startTime": 1765314946236
    }
    allResumeState: {
      "LOOP_1765301551341": {
        "iteration": 3,
        "startTime": 1765314946236
      }
    }
[SensorRead] ✔️ Saved to 'var_1': -240.96385542168673 l
[2025-12-09 23:15:52.622 +0200] INFO: ЁЯФД [HardwareService] Strategy Changed Output Unit
    env: "development"
    deviceId: "693695d9585420702157d812"
    strategy: "tank_volume"
    driverUnit: "cm"
    newUnit: "l"
[2025-12-09 23:15:52.622 +0200] INFO: ЁЯФН [HardwareService] Checking Normalization
    env: "development"
    deviceId: "693695d9585420702157d812"
    driverId: "hc_sr04"
    sourceUnit: "l"
    raw: 58.6
    value: -240.96385542168673
[2025-12-09 23:15:52.623 +0200] INFO: ЁЯФН [HardwareService] Normalization Result
    env: "development"
    normalized: {
      "value": -240963.85542168672,
      "baseUnit": "ml"
    }
[2025-12-09 23:15:52.623 +0200] INFO: ЁЯУП [HardwareService] Normalized Value
    env: "development"
    deviceId: "693695d9585420702157d812"
    from: "l"
    to: "ml"
    original: -240.96385542168673
    normalized: -240963.85542168672
[2025-12-09 23:15:52.626 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "generic_1765301602942"
    edgeFound: true
    nextBlockId: "FLOW_CONTROL_1765301625104"
[2025-12-09 23:15:52.628 +0200] INFO: ЁЯФД LoopBlock Debug Trace
    env: "development"
    blockId: "LOOP_1765301551341"
    iteration: 5
    interval: 2
    limitMode: "TIME"
    resumeState: {
      "iteration": 4,
      "startTime": 1765314946236
    }
    allResumeState: {
      "LOOP_1765301551341": {
        "iteration": 4,
        "startTime": 1765314946236
      }
    }
[2025-12-09 23:15:54.638 +0200] WARN: Block execution failed
    env: "development"
    blockId: "LOOP_1765301551341"
    attempt: 1
    err: "Loop timed out after 8.4s (Limit: 8s)"
[2025-12-09 23:15:54.639 +0200] ERROR: All retries exhausted.
    env: "development"
    blockId: "LOOP_1765301551341"
    policy: "GOTO_LABEL"
[2025-12-09 23:15:54.643 +0200] INFO: тЬЕ Cycle Step Completed
    env: "development"
    cycleId: "6932b9a147564095227cf802"
    step: 0
[2025-12-09 23:15:54.643 +0200] INFO: ЁЯПБ Cycle Completed Successfully
    env: "development"
    sessionId: "6938917faa2e64918aa6aa7a"
[2025-12-09 23:15:54.654 +0200] INFO: тЬЕ Active Program Cycle Marked Completed
    env: "development"
    cycleId: "6932b9a147564095227cf802"
[23:16] INFO: ЁЯХТ Scheduler Tick
    env: "development"
[2025-12-09 23:16:12.524 +0200] INFO: тП╣я╕П Active Program Stopped (Statuses Reset)
    env: "development"
[2025-12-09 23:16:14.323 +0200] INFO: ЁЯЧСя╕П Active Program Unloaded
    env: "development"
[2025-12-09 23:16:16.756 +0200] INFO: ЁЯУе Active Program Loaded
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
[2025-12-09 23:16:22.877 +0200] INFO: ЁЯУЭ Active Program Updated
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
[2025-12-09 23:16:24.470 +0200] INFO: тЦ╢я╕П Active Program Started
    env: "development"
[2025-12-09 23:16:25.726 +0200] INFO: тЪб Cycle Force Started (Time updated to Now)
    env: "development"
    itemId: "693891a0aa2e64918aa6ab13"
    newTime: "23:16"
[2025-12-09 23:16:25.731 +0200] INFO: Attempting to start cycle with sanitized steps
    env: "development"
    cycleId: "6932b9a147564095227cf802"
    steps: [
      {
        "flowId": "testerror",
        "overrides": {}
      }
    ]
[2025-12-09 23:16:25.734 +0200] INFO: ЁЯЪА Starting Cycle (Trace Overrides)
    env: "development"
    cycleId: "6932b9a147564095227cf802"
    sessionId: "693891a9aa2e64918aa6ab60"
    stepsCount: 1
    overrides: {
      "Global 2": 89,
      "Global 2_tolerance": 5
    }
[2025-12-09 23:16:25.734 +0200] INFO: тЦ╢я╕П Executing Cycle Step
    env: "development"
    step: 0
    flowId: "testerror"
[2025-12-09 23:16:25.734 +0200] INFO: ЁЯФз Cycle Step Overrides Resolution
    env: "development"
    step: 0
    sessionOverrides: {
      "Global 2": 89,
      "Global 2_tolerance": 5
    }
    finalOverrides: {
      "Global 2": 89,
      "Global 2_tolerance": 5
    }
[2025-12-09 23:16:25.735 +0200] INFO: тЬи AutomationEngine Actor Initialized/Reset (Session: none)
    env: "development"
[2025-12-09 23:16:25.738 +0200] INFO: ЁЯзй AutomationEngine: Input Resolution
    env: "development"
    overrides: {
      "Global 2": 89,
      "Global 2_tolerance": 5
    }
    variablesResolved: {}
[2025-12-09 23:16:25.741 +0200] INFO: ЁЯУе Loading Program Session
    env: "development"
    sessionId: "693891a9aa2e64918aa6ab66"
    programId: "testerror"
    variables: {
      "global_2": 89,
      "Global 2": 89
    }
[2025-12-09 23:16:25.741 +0200] INFO: ЁЯЫая╕П AutomationEngine LOAD Payload
    env: "development"
    execContextKeys: [
      "variables",
      "variableDefinitions",
      "resumeState"
    ]
    resumeState: {}
[2025-12-09 23:16:25.747 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "start"
    edgeFound: true
    nextBlockId: "SENSOR_READ_1765271435543"
[SensorRead] ✔️ Saved to 'var_1': 0 l
[2025-12-09 23:16:25.829 +0200] INFO: ЁЯФД [HardwareService] Strategy Changed Output Unit
    env: "development"
    deviceId: "693695d9585420702157d812"
    strategy: "tank_volume"
    driverUnit: "cm"
    newUnit: "l"
[2025-12-09 23:16:25.829 +0200] INFO: ЁЯФН [HardwareService] Checking Normalization
    env: "development"
    deviceId: "693695d9585420702157d812"
    driverId: "hc_sr04"
    sourceUnit: "l"
    raw: 18.6
    value: 0
[2025-12-09 23:16:25.830 +0200] INFO: ЁЯФН [HardwareService] Normalization Result
    env: "development"
    normalized: {
      "value": 0,
      "baseUnit": "ml"
    }
[2025-12-09 23:16:25.830 +0200] INFO: ЁЯУП [HardwareService] Normalized Value
    env: "development"
    deviceId: "693695d9585420702157d812"
    from: "l"
    to: "ml"
    original: 0
    normalized: 0
[2025-12-09 23:16:25.834 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "SENSOR_READ_1765271435543"
    edgeFound: true
    nextBlockId: "IF_1765301518579"
[2025-12-09 23:16:25.835 +0200] INFO: тЭУ IF Block Navigation Trace
    env: "development"
    blockId: "IF_1765301518579"
    result: false
    expectedHandle: "false"
    nextBlockId: "ACTUATOR_SET_1765301557224"
[ActuatorSet] ✔️ Set 'ON' (State: 1)
[2025-12-09 23:16:25.906 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "ACTUATOR_SET_1765301557224"
    edgeFound: true
    nextBlockId: "LOOP_1765301551341"
[2025-12-09 23:16:25.907 +0200] INFO: ЁЯФД LoopBlock Debug Trace
    env: "development"
    blockId: "LOOP_1765301551341"
    iteration: 5
    interval: 2
    limitMode: "TIME"
    resumeState: {
      "iteration": 4,
      "startTime": 1765314946236
    }
    allResumeState: {
      "LOOP_1765301551341": {
        "iteration": 4,
        "startTime": 1765314946236
      }
    }
[2025-12-09 23:16:27.919 +0200] WARN: Block execution failed
    env: "development"
    blockId: "LOOP_1765301551341"
    attempt: 1
    err: "Loop timed out after 41.7s (Limit: 8s)"
[2025-12-09 23:16:27.919 +0200] ERROR: All retries exhausted.
    env: "development"
    blockId: "LOOP_1765301551341"
    policy: "GOTO_LABEL"
[2025-12-09 23:16:27.923 +0200] INFO: тЬЕ Cycle Step Completed
    env: "development"
    cycleId: "6932b9a147564095227cf802"
    step: 0
[2025-12-09 23:16:27.923 +0200] INFO: ЁЯПБ Cycle Completed Successfully
    env: "development"
    sessionId: "693891a9aa2e64918aa6ab60"
[2025-12-09 23:16:27.931 +0200] INFO: тЬЕ Active Program Cycle Marked Completed
    env: "development"
    cycleId: "6932b9a147564095227cf802"
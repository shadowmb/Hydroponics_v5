[2025-12-10 10:10:39.175 +0200] INFO: ЁЯФМ Client Connected to WebSocket
    env: "development"
    socketId: "68v5QCtIYfhm0QarAAAB"
GET /api/active-program/variables called
Variables found: {
  '6937e322a171a54cf8810a54': [
    {
      name: 'Количество ГР',
      type: 'number',
      default: undefined,
      unit: 'l',
      hasTolerance: true,
      description: 'Желаното количество в ГР',
      cycleId: '6937e322a171a54cf8810a54',
      flowId: 'test_gr',
      flowName: 'Test GR',
      flowDescription: ''
    }
  ]
}
GET /api/active-program/variables called
Variables found: {
  '6937e322a171a54cf8810a54': [
    {
      name: 'Количество ГР',
      type: 'number',
      default: undefined,
      unit: 'l',
      hasTolerance: true,
      description: 'Желаното количество в ГР',
      cycleId: '6937e322a171a54cf8810a54',
      flowId: 'test_gr',
      flowName: 'Test GR',
      flowDescription: ''
    }
  ]
}
[2025-12-10 10:10:40.872 +0200] INFO: ЁЯУе Active Program Loaded
    env: "development"
    program: "╨У╨а "
GET /api/active-program/variables called
Variables found: {
  '6937e322a171a54cf8810a54': [
    {
      name: 'Количество ГР',
      type: 'number',
      default: undefined,
      unit: 'l',
      hasTolerance: true,
      description: 'Желаното количество в ГР',
      cycleId: '6937e322a171a54cf8810a54',
      flowId: 'test_gr',
      flowName: 'Test GR',
      flowDescription: ''
    }
  ]
}
GET /api/active-program/variables called
Variables found: {
  '6937e322a171a54cf8810a54': [
    {
      name: 'Количество ГР',
      type: 'number',
      default: undefined,
      unit: 'l',
      hasTolerance: true,
      description: 'Желаното количество в ГР',
      cycleId: '6937e322a171a54cf8810a54',
      flowId: 'test_gr',
      flowName: 'Test GR',
      flowDescription: ''
    }
  ]
}
[2025-12-10 10:10:56.196 +0200] INFO: ЁЯУЭ Active Program Updated
    env: "development"
[2025-12-10 10:10:57.939 +0200] INFO: тЦ╢я╕П Active Program Started
    env: "development"
[SensorRead] ✔️ Saved to 'var_1': 0.8515815085158067 l
[ActuatorSet] ✔️ Set 'ON' (State: 1)
[LoopBlock Debug] Block: LOOP_1765270134972 | Interval: 2 (number) | Iteration: 1 | Mode: COUNT
[2025-12-10 10:10:59.927 +0200] INFO: тЪб Cycle Force Started (Time updated to Now)
    env: "development"
    itemId: "69392b0042e4ff697b29700d"
    newTime: "10:10"
[2025-12-10 10:10:59.933 +0200] INFO: Attempting to start cycle with sanitized steps
    env: "development"
    cycleId: "6937e322a171a54cf8810a54"
    steps: [
      {
        "flowId": "test_gr",
        "overrides": {}
      }
    ]
[2025-12-10 10:10:59.938 +0200] INFO: ЁЯЪА Starting Cycle (Trace Overrides)
    env: "development"
    cycleId: "6937e322a171a54cf8810a54"
    sessionId: "69392b1342e4ff697b297054"
    stepsCount: 1
    overrides: {
      "╨Ъ╨╛╨╗╨╕╤З╨╡╤Б╤В╨▓╨╛ ╨У╨а": 100,
      "╨Ъ╨╛╨╗╨╕╤З╨╡╤Б╤В╨▓╨╛ ╨У╨а_tolerance_mode": "lower",
      "╨Ъ╨╛╨╗╨╕╤З╨╡╤Б╤В╨▓╨╛ ╨У╨а_tolerance": 20
    }
[2025-12-10 10:10:59.939 +0200] INFO: тЦ╢я╕П Executing Cycle Step
    env: "development"
    step: 0
    flowId: "test_gr"
[2025-12-10 10:10:59.939 +0200] INFO: ЁЯФз Cycle Step Overrides Resolution
    env: "development"
    step: 0
    sessionOverrides: {
      "╨Ъ╨╛╨╗╨╕╤З╨╡╤Б╤В╨▓╨╛ ╨У╨а": 100,
      "╨Ъ╨╛╨╗╨╕╤З╨╡╤Б╤В╨▓╨╛ ╨У╨а_tolerance_mode": "lower",
      "╨Ъ╨╛╨╗╨╕╤З╨╡╤Б╤В╨▓╨╛ ╨У╨а_tolerance": 20
    }
    finalOverrides: {
      "╨Ъ╨╛╨╗╨╕╤З╨╡╤Б╤В╨▓╨╛ ╨У╨а": 100,
      "╨Ъ╨╛╨╗╨╕╤З╨╡╤Б╤В╨▓╨╛ ╨У╨а_tolerance_mode": "lower",
      "╨Ъ╨╛╨╗╨╕╤З╨╡╤Б╤В╨▓╨╛ ╨У╨а_tolerance": 20
    }
[2025-12-10 10:10:59.942 +0200] INFO: тЬи AutomationEngine Actor Initialized/Reset (Session: none)
    env: "development"
[2025-12-10 10:10:59.960 +0200] INFO: ЁЯзй AutomationEngine: Input Resolution
    env: "development"
    overrides: {
      "╨Ъ╨╛╨╗╨╕╤З╨╡╤Б╤В╨▓╨╛ ╨У╨а": 100,
      "╨Ъ╨╛╨╗╨╕╤З╨╡╤Б╤В╨▓╨╛ ╨У╨а_tolerance_mode": "lower",
      "╨Ъ╨╛╨╗╨╕╤З╨╡╤Б╤В╨▓╨╛ ╨У╨а_tolerance": 20
    }
    variablesResolved: {}
[2025-12-10 10:10:59.965 +0200] INFO: ЁЯУе Loading Program Session
    env: "development"
    sessionId: "69392b1342e4ff697b29705a"
    programId: "test_gr"
    variables: {
      "var_1": 100,
      "╨Ъ╨╛╨╗╨╕╤З╨╡╤Б╤В╨▓╨╛ ╨У╨а": 100,
      "global_2": 100
    }
[2025-12-10 10:10:59.983 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "start"
    edgeFound: true
    nextBlockId: "SENSOR_READ_1765268250648"
[10:11] INFO: ЁЯХТ Scheduler Tick
    env: "development"
[2025-12-10 10:11:00.039 +0200] INFO: ЁЯФМ [HardwareService] Creating UDP Transport
    env: "development"
    controllerId: "6932a965cb81d56e0343a42c"
    ip: "10.1.10.253"
[2025-12-10 10:11:00.039 +0200] INFO: ЁЯФМ [UdpTransport] Initializing...
    env: "development"
    ip: "10.1.10.253"
    port: 8888
[2025-12-10 10:11:00.040 +0200] INFO: тЬЕ [UdpTransport] Listening
    env: "development"
    address: {
      "address": "0.0.0.0",
      "family": "IPv4",
      "port": 55077
    }
[2025-12-10 10:11:00.335 +0200] INFO: ЁЯФД [HardwareService] Strategy Changed Output Unit
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    strategy: "tank_volume"
    driverUnit: "mm"
    newUnit: "l"
[2025-12-10 10:11:00.335 +0200] INFO: ЁЯФН [HardwareService] Checking Normalization
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    driverId: "dfrobot_a02yyuw"
    sourceUnit: "l"
    raw: 1671
    value: 0.8515815085158067
[2025-12-10 10:11:00.336 +0200] INFO: ЁЯФН [HardwareService] Normalization Result
    env: "development"
    normalized: {
      "value": 851.5815085158067,
      "baseUnit": "ml"
    }
[2025-12-10 10:11:00.336 +0200] INFO: ЁЯУП [HardwareService] Normalized Value
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    from: "l"
    to: "ml"
    original: 0.8515815085158067
    normalized: 851.5815085158067
[2025-12-10 10:11:00.348 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "SENSOR_READ_1765268250648"
    edgeFound: true
    nextBlockId: "IF_1765268300863"
[2025-12-10 10:11:00.351 +0200] INFO: тЭУ IF Block Navigation Trace
    env: "development"
    blockId: "IF_1765268300863"
    result: false
    expectedHandle: "false"
    nextBlockId: "ACTUATOR_SET_1765270055740"
[2025-12-10 10:11:00.465 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "ACTUATOR_SET_1765270055740"
    edgeFound: true
    nextBlockId: "LOOP_1765270134972"
[SensorRead] ✔️ Saved to 'var_1': 0.8515815085158067 l
[LoopBlock Debug] Block: LOOP_1765270134972 | Interval: 2 (number) | Iteration: 2 | Mode: COUNT
[2025-12-10 10:11:00.620 +0200] INFO: ЁЯФД [HardwareService] Strategy Changed Output Unit
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    strategy: "tank_volume"
    driverUnit: "mm"
    newUnit: "l"
[2025-12-10 10:11:00.620 +0200] INFO: ЁЯФН [HardwareService] Checking Normalization
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    driverId: "dfrobot_a02yyuw"
    sourceUnit: "l"
    raw: 1671
    value: 0.8515815085158067
[2025-12-10 10:11:00.621 +0200] INFO: ЁЯФН [HardwareService] Normalization Result
    env: "development"
    normalized: {
      "value": 851.5815085158067,
      "baseUnit": "ml"
    }
[2025-12-10 10:11:00.621 +0200] INFO: ЁЯУП [HardwareService] Normalized Value
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    from: "l"
    to: "ml"
    original: 0.8515815085158067
    normalized: 851.5815085158067
[2025-12-10 10:11:00.627 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "generic_1765270081073"
    edgeFound: true
    nextBlockId: "FLOW_CONTROL_1765270111054"
[SensorRead] ✔️ Saved to 'var_1': 78.52798053527981 l
[LoopBlock Debug] Block: LOOP_1765270134972 | Interval: 2 (number) | Iteration: 3 | Mode: COUNT
[2025-12-10 10:11:02.715 +0200] INFO: ЁЯФД [HardwareService] Strategy Changed Output Unit
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    strategy: "tank_volume"
    driverUnit: "mm"
    newUnit: "l"
[2025-12-10 10:11:02.715 +0200] INFO: ЁЯФН [HardwareService] Checking Normalization
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    driverId: "dfrobot_a02yyuw"
    sourceUnit: "l"
    raw: 394
    value: 78.52798053527981
[2025-12-10 10:11:02.715 +0200] INFO: ЁЯФН [HardwareService] Normalization Result
    env: "development"
    normalized: {
      "value": 78527.98053527981,
      "baseUnit": "ml"
    }
[2025-12-10 10:11:02.715 +0200] INFO: ЁЯУП [HardwareService] Normalized Value
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    from: "l"
    to: "ml"
    original: 78.52798053527981
    normalized: 78527.98053527981
[2025-12-10 10:11:02.721 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "generic_1765270081073"
    edgeFound: true
    nextBlockId: "FLOW_CONTROL_1765270111054"
[SensorRead] ✔️ Saved to 'var_1': 84.85401459854015 l
[LoopBlock Debug] Block: LOOP_1765270134972 | Interval: 2 (number) | Iteration: 4 | Mode: COUNT
[2025-12-10 10:11:04.917 +0200] INFO: ЁЯФД [HardwareService] Strategy Changed Output Unit
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    strategy: "tank_volume"
    driverUnit: "mm"
    newUnit: "l"
[2025-12-10 10:11:04.917 +0200] INFO: ЁЯФН [HardwareService] Checking Normalization
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    driverId: "dfrobot_a02yyuw"
    sourceUnit: "l"
    raw: 290
    value: 84.85401459854015
[2025-12-10 10:11:04.919 +0200] INFO: ЁЯФН [HardwareService] Normalization Result
    env: "development"
    normalized: {
      "value": 84854.01459854015,
      "baseUnit": "ml"
    }
[2025-12-10 10:11:04.919 +0200] INFO: ЁЯУП [HardwareService] Normalized Value
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    from: "l"
    to: "ml"
    original: 84.85401459854015
    normalized: 84854.01459854015
[2025-12-10 10:11:04.933 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "generic_1765270081073"
    edgeFound: true
    nextBlockId: "FLOW_CONTROL_1765270111054"
[SensorRead] ✔️ Saved to 'var_1': 93.55231143552311 l
[2025-12-10 10:11:07.216 +0200] INFO: ЁЯФД [HardwareService] Strategy Changed Output Unit
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    strategy: "tank_volume"
    driverUnit: "mm"
    newUnit: "l"
[LoopBlock Debug] Block: LOOP_1765270134972 | Interval: 2 (number) | Iteration: 5 | Mode: COUNT
[2025-12-10 10:11:07.216 +0200] INFO: ЁЯФН [HardwareService] Checking Normalization
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    driverId: "dfrobot_a02yyuw"
    sourceUnit: "l"
    raw: 147
    value: 93.55231143552311
[2025-12-10 10:11:07.216 +0200] INFO: ЁЯФН [HardwareService] Normalization Result
    env: "development"
    normalized: {
      "value": 93552.31143552311,
      "baseUnit": "ml"
    }
[2025-12-10 10:11:07.216 +0200] INFO: ЁЯУП [HardwareService] Normalized Value
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    from: "l"
    to: "ml"
    original: 93.55231143552311
    normalized: 93552.31143552311
[2025-12-10 10:11:07.232 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "generic_1765270081073"
    edgeFound: true
    nextBlockId: "FLOW_CONTROL_1765270111054"
[SensorRead] ✔️ Saved to 'var_1': 98.41849148418491 l
[LoopBlock Debug] Block: LOOP_1765270134972 | Interval: 2 (number) | Iteration: 6 | Mode: COUNT
[2025-12-10 10:11:09.406 +0200] INFO: ЁЯФД [HardwareService] Strategy Changed Output Unit
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    strategy: "tank_volume"
    driverUnit: "mm"
    newUnit: "l"
[2025-12-10 10:11:09.406 +0200] INFO: ЁЯФН [HardwareService] Checking Normalization
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    driverId: "dfrobot_a02yyuw"
    sourceUnit: "l"
    raw: 67
    value: 98.41849148418491
[2025-12-10 10:11:09.406 +0200] INFO: ЁЯФН [HardwareService] Normalization Result
    env: "development"
    normalized: {
      "value": 98418.49148418491,
      "baseUnit": "ml"
    }
[2025-12-10 10:11:09.406 +0200] INFO: ЁЯУП [HardwareService] Normalized Value
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    from: "l"
    to: "ml"
    original: 98.41849148418491
    normalized: 98418.49148418491
[2025-12-10 10:11:09.412 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "generic_1765270081073"
    edgeFound: true
    nextBlockId: "FLOW_CONTROL_1765270111054"
[SensorRead] ✔️ Saved to 'var_1': 101.52068126520682 l
[2025-12-10 10:11:11.613 +0200] INFO: ЁЯФД [HardwareService] Strategy Changed Output Unit
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    strategy: "tank_volume"
    driverUnit: "mm"
    newUnit: "l"
[2025-12-10 10:11:11.613 +0200] INFO: ЁЯФН [HardwareService] Checking Normalization
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    driverId: "dfrobot_a02yyuw"
    sourceUnit: "l"
    raw: 16
    value: 101.52068126520682
[2025-12-10 10:11:11.613 +0200] INFO: ЁЯФН [HardwareService] Normalization Result
    env: "development"
    normalized: {
      "value": 101520.68126520682,
      "baseUnit": "ml"
    }
[2025-12-10 10:11:11.613 +0200] INFO: ЁЯУП [HardwareService] Normalized Value
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    from: "l"
    to: "ml"
    original: 101.52068126520682
    normalized: 101520.68126520682
[LoopBlock Debug] Block: LOOP_1765270134972 | Interval: 2 (number) | Iteration: 7 | Mode: COUNT
[2025-12-10 10:11:11.620 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "generic_1765270081073"
    edgeFound: true
    nextBlockId: "FLOW_CONTROL_1765270111054"
[SensorRead] ✔️ Saved to 'var_1': 100.48661800486617 l
[LoopBlock Debug] Block: LOOP_1765270134972 | Interval: 2 (number) | Iteration: 8 | Mode: COUNT
[2025-12-10 10:11:13.805 +0200] INFO: ЁЯФД [HardwareService] Strategy Changed Output Unit
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    strategy: "tank_volume"
    driverUnit: "mm"
    newUnit: "l"
[2025-12-10 10:11:13.805 +0200] INFO: ЁЯФН [HardwareService] Checking Normalization
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    driverId: "dfrobot_a02yyuw"
    sourceUnit: "l"
    raw: 33
    value: 100.48661800486617
[2025-12-10 10:11:13.805 +0200] INFO: ЁЯФН [HardwareService] Normalization Result
    env: "development"
    normalized: {
      "value": 100486.61800486618,
      "baseUnit": "ml"
    }
[2025-12-10 10:11:13.805 +0200] INFO: ЁЯУП [HardwareService] Normalized Value
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    from: "l"
    to: "ml"
    original: 100.48661800486617
    normalized: 100486.61800486618
[2025-12-10 10:11:13.810 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "generic_1765270081073"
    edgeFound: true
    nextBlockId: "FLOW_CONTROL_1765270111054"
[SensorRead] ✔️ Saved to 'var_1': 99.45255474452554 l
[LoopBlock Debug] Block: LOOP_1765270134972 | Interval: 2 (number) | Iteration: 9 | Mode: COUNT
[2025-12-10 10:11:16.007 +0200] INFO: ЁЯФД [HardwareService] Strategy Changed Output Unit
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    strategy: "tank_volume"
    driverUnit: "mm"
    newUnit: "l"
[2025-12-10 10:11:16.007 +0200] INFO: ЁЯФН [HardwareService] Checking Normalization
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    driverId: "dfrobot_a02yyuw"
    sourceUnit: "l"
    raw: 50
    value: 99.45255474452554
[2025-12-10 10:11:16.007 +0200] INFO: ЁЯФН [HardwareService] Normalization Result
    env: "development"
    normalized: {
      "value": 99452.55474452554,
      "baseUnit": "ml"
    }
[2025-12-10 10:11:16.007 +0200] INFO: ЁЯУП [HardwareService] Normalized Value
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    from: "l"
    to: "ml"
    original: 99.45255474452554
    normalized: 99452.55474452554
[2025-12-10 10:11:16.012 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "generic_1765270081073"
    edgeFound: true
    nextBlockId: "FLOW_CONTROL_1765270111054"
[SensorRead] ✔️ Saved to 'var_1': 83.75912408759123 l
[LoopBlock Debug] Block: LOOP_1765270134972 | Interval: 2 (number) | Iteration: 10 | Mode: COUNT
[2025-12-10 10:11:18.307 +0200] INFO: ЁЯФД [HardwareService] Strategy Changed Output Unit
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    strategy: "tank_volume"
    driverUnit: "mm"
    newUnit: "l"
[2025-12-10 10:11:18.307 +0200] INFO: ЁЯФН [HardwareService] Checking Normalization
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    driverId: "dfrobot_a02yyuw"
    sourceUnit: "l"
    raw: 308
    value: 83.75912408759123
[2025-12-10 10:11:18.307 +0200] INFO: ЁЯФН [HardwareService] Normalization Result
    env: "development"
    normalized: {
      "value": 83759.12408759123,
      "baseUnit": "ml"
    }
[2025-12-10 10:11:18.307 +0200] INFO: ЁЯУП [HardwareService] Normalized Value
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    from: "l"
    to: "ml"
    original: 83.75912408759123
    normalized: 83759.12408759123
[2025-12-10 10:11:18.313 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "generic_1765270081073"
    edgeFound: true
    nextBlockId: "FLOW_CONTROL_1765270111054"
[SensorRead] ✔️ Saved to 'var_1': 76.94647201946472 l
[LoopBlock Debug] Block: LOOP_1765270134972 | Interval: 2 (number) | Iteration: 11 | Mode: COUNT
[2025-12-10 10:11:20.502 +0200] INFO: ЁЯФД [HardwareService] Strategy Changed Output Unit
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    strategy: "tank_volume"
    driverUnit: "mm"
    newUnit: "l"
[2025-12-10 10:11:20.502 +0200] INFO: ЁЯФН [HardwareService] Checking Normalization
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    driverId: "dfrobot_a02yyuw"
    sourceUnit: "l"
    raw: 420
    value: 76.94647201946472
[2025-12-10 10:11:20.502 +0200] INFO: ЁЯФН [HardwareService] Normalization Result
    env: "development"
    normalized: {
      "value": 76946.47201946472,
      "baseUnit": "ml"
    }
[2025-12-10 10:11:20.502 +0200] INFO: ЁЯУП [HardwareService] Normalized Value
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    from: "l"
    to: "ml"
    original: 76.94647201946472
    normalized: 76946.47201946472
[2025-12-10 10:11:20.507 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "generic_1765270081073"
    edgeFound: true
    nextBlockId: "FLOW_CONTROL_1765270111054"
[ActuatorSet] ✔️ Set 'OFF' (State: 0)
[2025-12-10 10:11:22.697 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "generic_1765280669388"
    edgeFound: true
    nextBlockId: "end"
[2025-12-10 10:11:22.705 +0200] INFO: тЬЕ Cycle Step Completed
    env: "development"
    cycleId: "6937e322a171a54cf8810a54"
    step: 0
[2025-12-10 10:11:22.705 +0200] INFO: ЁЯПБ Cycle Completed Successfully
    env: "development"
    sessionId: "69392b1342e4ff697b297054"
[2025-12-10 10:11:22.721 +0200] INFO: тЬЕ Active Program Cycle Marked Completed
    env: "development"
    cycleId: "6937e322a171a54cf8810a54"
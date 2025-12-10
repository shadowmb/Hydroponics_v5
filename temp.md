[2025-12-10 13:02:28.294 +0200] INFO: тЦ╢я╕П Active Program Started
    env: "development"
[2025-12-10 13:02:33.617 +0200] INFO: тЪб Cycle Force Started (Time updated to Now)
    env: "development"
    itemId: "6939533a32f8d6a4fbbd549b"
    newTime: "13:02"
[2025-12-10 13:02:33.622 +0200] INFO: Attempting to start cycle with sanitized steps
    env: "development"
    cycleId: "6937e322a171a54cf8810a54"
    steps: [
      {
        "flowId": "test_gr",
        "overrides": {}
      }
    ]
[2025-12-10 13:02:33.626 +0200] INFO: ЁЯЪА Starting Cycle (Trace Overrides)
    env: "development"
    cycleId: "6937e322a171a54cf8810a54"
    sessionId: "6939534932f8d6a4fbbd54e2"
    stepsCount: 1
    overrides: {
      "╨Ъ╨╛╨╗╨╕╤З╨╡╤Б╤В╨▓╨╛ ╨У╨а": 98,
      "╨Ъ╨╛╨╗╨╕╤З╨╡╤Б╤В╨▓╨╛ ╨У╨а_tolerance": 20,
      "╨Ъ╨╛╨╗╨╕╤З╨╡╤Б╤В╨▓╨╛ ╨У╨а_tolerance_mode": "lower"
    }
[2025-12-10 13:02:33.627 +0200] INFO: тЦ╢я╕П Executing Cycle Step
    env: "development"
    step: 0
    flowId: "test_gr"
[2025-12-10 13:02:33.627 +0200] INFO: ЁЯФз Cycle Step Overrides Resolution
    env: "development"
    step: 0
    sessionOverrides: {
      "╨Ъ╨╛╨╗╨╕╤З╨╡╤Б╤В╨▓╨╛ ╨У╨а": 98,
      "╨Ъ╨╛╨╗╨╕╤З╨╡╤Б╤В╨▓╨╛ ╨У╨а_tolerance": 20,
      "╨Ъ╨╛╨╗╨╕╤З╨╡╤Б╤В╨▓╨╛ ╨У╨а_tolerance_mode": "lower"
    }
    finalOverrides: {
      "╨Ъ╨╛╨╗╨╕╤З╨╡╤Б╤В╨▓╨╛ ╨У╨а": 98,
      "╨Ъ╨╛╨╗╨╕╤З╨╡╤Б╤В╨▓╨╛ ╨У╨а_tolerance": 20,
      "╨Ъ╨╛╨╗╨╕╤З╨╡╤Б╤В╨▓╨╛ ╨У╨а_tolerance_mode": "lower"
    }
[2025-12-10 13:02:33.628 +0200] INFO: тЬи AutomationEngine Actor Initialized/Reset (Session: none)
    env: "development"
[2025-12-10 13:02:33.633 +0200] INFO: ЁЯзй AutomationEngine: Input Resolution
    env: "development"
    overrides: {
      "╨Ъ╨╛╨╗╨╕╤З╨╡╤Б╤В╨▓╨╛ ╨У╨а": 98,
      "╨Ъ╨╛╨╗╨╕╤З╨╡╤Б╤В╨▓╨╛ ╨У╨а_tolerance": 20,
      "╨Ъ╨╛╨╗╨╕╤З╨╡╤Б╤В╨▓╨╛ ╨У╨а_tolerance_mode": "lower"
    }
    variablesResolved: {}
[2025-12-10 13:02:33.638 +0200] INFO: ЁЯУе Loading Program Session
    env: "development"
    sessionId: "6939534932f8d6a4fbbd54e8"
    programId: "test_gr"
    variables: {
      "var_1": 98,
      "╨Ъ╨╛╨╗╨╕╤З╨╡╤Б╤В╨▓╨╛ ╨У╨а": 98,
      "╨Ъ╨╛╨╗╨╕╤З╨╡╤Б╤В╨▓╨╛ ╨У╨а_tolerance": 20,
      "var_1_tolerance": 20,
      "╨Ъ╨╛╨╗╨╕╤З╨╡╤Б╤В╨▓╨╛ ╨У╨а_tolerance_mode": "lower",
      "var_1_tolerance_mode": "lower",
      "global_2": 98,
      "global_2_tolerance": 20,
      "global_2_tolerance_mode": "lower"
    }
[2025-12-10 13:02:33.645 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "start"
    edgeFound: true
    nextBlockId: "SENSOR_READ_1765268250648"
[SensorRead] ✔️ Saved to 'var_1': 0.48661800486617324 l
[IfBlock DEBUG] Params: {
  "label": "Condition (IF)",
  "operator": ">=",
  "onFailure": "STOP",
  "errorNotification": false,
  "hasError": false,
  "variable": "var_1",
  "value": "{{global_2}}",
  "_blockId": "IF_1765268300863"
}
[IfBlock DEBUG] Checking Left Tolerance for: 'var_1'
[IfBlock Tolerance] Applied for 'var_1': 20 (Mode: lower)
[2025-12-10 13:02:33.795 +0200] INFO: ЁЯФД [HardwareService] Strategy Changed Output Unit
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    strategy: "tank_volume"
    driverUnit: "mm"
    newUnit: "l"
[2025-12-10 13:02:33.795 +0200] INFO: ЁЯФН [HardwareService] Checking Normalization
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    driverId: "dfrobot_a02yyuw"
    sourceUnit: "l"
    raw: 1677
    value: 0.48661800486617324
[2025-12-10 13:02:33.795 +0200] INFO: ЁЯФН [HardwareService] Normalization Result
    env: "development"
    normalized: {
      "value": 486.61800486617324,
      "baseUnit": "ml"
    }
[2025-12-10 13:02:33.795 +0200] INFO: ЁЯУП [HardwareService] Normalized Value
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    from: "l"
    to: "ml"
    original: 0.48661800486617324
    normalized: 486.61800486617324
[2025-12-10 13:02:33.800 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "SENSOR_READ_1765268250648"
    edgeFound: true
    nextBlockId: "IF_1765268300863"
[2025-12-10 13:02:33.802 +0200] INFO: тЭУ IF Block Navigation Trace
    env: "development"
    blockId: "IF_1765268300863"
    result: false
    expectedHandle: "false"
    nextBlockId: "ACTUATOR_SET_1765270055740"
[ActuatorSet] ✔️ Set 'ON' (State: 1)
[LoopBlock Debug] Block: LOOP_1765270134972 | Interval: 2 (number) | Iteration: 1 | Mode: COUNT
[2025-12-10 13:02:33.990 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "ACTUATOR_SET_1765270055740"
    edgeFound: true
    nextBlockId: "LOOP_1765270134972"
[SensorRead] ✔️ Saved to 'var_1': 0.5474452554744431 l
[LoopBlock Debug] Block: LOOP_1765270134972 | Interval: 2 (number) | Iteration: 2 | Mode: COUNT
[2025-12-10 13:02:34.165 +0200] INFO: ЁЯФД [HardwareService] Strategy Changed Output Unit
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    strategy: "tank_volume"
    driverUnit: "mm"
    newUnit: "l"
[2025-12-10 13:02:34.165 +0200] INFO: ЁЯФН [HardwareService] Checking Normalization
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    driverId: "dfrobot_a02yyuw"
    sourceUnit: "l"
    raw: 1676
    value: 0.5474452554744431
[2025-12-10 13:02:34.166 +0200] INFO: ЁЯФН [HardwareService] Normalization Result
    env: "development"
    normalized: {
      "value": 547.4452554744431,
      "baseUnit": "ml"
    }
[2025-12-10 13:02:34.166 +0200] INFO: ЁЯУП [HardwareService] Normalized Value
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    from: "l"
    to: "ml"
    original: 0.5474452554744431
    normalized: 547.4452554744431
[2025-12-10 13:02:34.184 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "generic_1765270081073"
    edgeFound: true
    nextBlockId: "FLOW_CONTROL_1765270111054"
[SensorRead] ✔️ Saved to 'var_1': 74.69586374695864 l
[LoopBlock Debug] Block: LOOP_1765270134972 | Interval: 2 (number) | Iteration: 3 | Mode: COUNT
[2025-12-10 13:02:36.360 +0200] INFO: ЁЯФД [HardwareService] Strategy Changed Output Unit
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    strategy: "tank_volume"
    driverUnit: "mm"
    newUnit: "l"
[2025-12-10 13:02:36.360 +0200] INFO: ЁЯФН [HardwareService] Checking Normalization
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    driverId: "dfrobot_a02yyuw"
    sourceUnit: "l"
    raw: 457
    value: 74.69586374695864
[2025-12-10 13:02:36.361 +0200] INFO: ЁЯФН [HardwareService] Normalization Result
    env: "development"
    normalized: {
      "value": 74695.86374695864,
      "baseUnit": "ml"
    }
[2025-12-10 13:02:36.361 +0200] INFO: ЁЯУП [HardwareService] Normalized Value
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    from: "l"
    to: "ml"
    original: 74.69586374695864
    normalized: 74695.86374695864
[2025-12-10 13:02:36.367 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "generic_1765270081073"
    edgeFound: true
    nextBlockId: "FLOW_CONTROL_1765270111054"
[2025-12-10 13:02:38.653 +0200] INFO: ЁЯФД [HardwareService] Strategy Changed Output Unit
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    strategy: "tank_volume"
    driverUnit: "mm"
    newUnit: "l"
[2025-12-10 13:02:38.653 +0200] INFO: ЁЯФН [HardwareService] Checking Normalization
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    driverId: "dfrobot_a02yyuw"
    sourceUnit: "l"
    raw: 445
    value: 75.4257907542579
[2025-12-10 13:02:38.654 +0200] INFO: ЁЯФН [HardwareService] Normalization Result
    env: "development"
    normalized: {
      "value": 75425.7907542579,
      "baseUnit": "ml"
    }
[2025-12-10 13:02:38.654 +0200] INFO: ЁЯУП [HardwareService] Normalized Value
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    from: "l"
    to: "ml"
    original: 75.4257907542579
    normalized: 75425.7907542579
[SensorRead] ✔️ Saved to 'var_1': 75.4257907542579 l
[LoopBlock Debug] Block: LOOP_1765270134972 | Interval: 2 (number) | Iteration: 4 | Mode: COUNT
[2025-12-10 13:02:38.680 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "generic_1765270081073"
    edgeFound: true
    nextBlockId: "FLOW_CONTROL_1765270111054"
[SensorRead] ✔️ Saved to 'var_1': 88.62530413625304 l
[LoopBlock Debug] Block: LOOP_1765270134972 | Interval: 2 (number) | Iteration: 5 | Mode: COUNT
[2025-12-10 13:02:40.855 +0200] INFO: ЁЯФД [HardwareService] Strategy Changed Output Unit
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    strategy: "tank_volume"
    driverUnit: "mm"
    newUnit: "l"
[2025-12-10 13:02:40.855 +0200] INFO: ЁЯФН [HardwareService] Checking Normalization
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    driverId: "dfrobot_a02yyuw"
    sourceUnit: "l"
    raw: 228
    value: 88.62530413625304
[2025-12-10 13:02:40.855 +0200] INFO: ЁЯФН [HardwareService] Normalization Result
    env: "development"
    normalized: {
      "value": 88625.30413625303,
      "baseUnit": "ml"
    }
[2025-12-10 13:02:40.855 +0200] INFO: ЁЯУП [HardwareService] Normalized Value
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    from: "l"
    to: "ml"
    original: 88.62530413625304
    normalized: 88625.30413625303
[2025-12-10 13:02:40.864 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "generic_1765270081073"
    edgeFound: true
    nextBlockId: "FLOW_CONTROL_1765270111054"
[SensorRead] ✔️ Saved to 'var_1': 89.29440389294403 l
[LoopBlock Debug] Block: LOOP_1765270134972 | Interval: 2 (number) | Iteration: 6 | Mode: COUNT
[2025-12-10 13:02:43.149 +0200] INFO: ЁЯФД [HardwareService] Strategy Changed Output Unit
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    strategy: "tank_volume"
    driverUnit: "mm"
    newUnit: "l"
[2025-12-10 13:02:43.149 +0200] INFO: ЁЯФН [HardwareService] Checking Normalization
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    driverId: "dfrobot_a02yyuw"
    sourceUnit: "l"
    raw: 217
    value: 89.29440389294403
[2025-12-10 13:02:43.150 +0200] INFO: ЁЯФН [HardwareService] Normalization Result
    env: "development"
    normalized: {
      "value": 89294.40389294403,
      "baseUnit": "ml"
    }
[2025-12-10 13:02:43.150 +0200] INFO: ЁЯУП [HardwareService] Normalized Value
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    from: "l"
    to: "ml"
    original: 89.29440389294403
    normalized: 89294.40389294403
[2025-12-10 13:02:43.165 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "generic_1765270081073"
    edgeFound: true
    nextBlockId: "FLOW_CONTROL_1765270111054"
[ActuatorSet] ✔️ Set 'OFF' (State: 0)
[2025-12-10 13:02:45.307 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "generic_1765280669388"
    edgeFound: true
    nextBlockId: "end"
[2025-12-10 13:02:45.328 +0200] INFO: тЬЕ Cycle Step Completed
    env: "development"
    cycleId: "6937e322a171a54cf8810a54"
    step: 0
[2025-12-10 13:02:45.328 +0200] INFO: ЁЯПБ Cycle Completed Successfully
    env: "development"
    sessionId: "6939534932f8d6a4fbbd54e2"
[2025-12-10 13:02:45.347 +0200] INFO: тЬЕ Active Program Cycle Marked Completed
    env: "development"
    cycleId: "6937e322a171a54cf8810a54"
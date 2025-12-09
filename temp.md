[2025-12-09 20:49:55.531 +0200] INFO: ЁЯУЭ Active Program Updated
    env: "development"
[2025-12-09 20:49:57.059 +0200] INFO: тЦ╢я╕П Active Program Started
    env: "development"
[SensorRead] ✔️ Saved to 'var_1': 0 l
[IfBlock] Variable 'global_2' not found in context. Keys: var_1
[IfBlock] Comparison involves NaN/undefined: 0 >= undefined
[ActuatorSet] ✔️ Set 'ON' (State: 1)
[2025-12-09 20:49:58.295 +0200] INFO: тЪб Cycle Force Started (Time updated to Now)
    env: "development"
    itemId: "69386f4edc05e3438651915e"
    newTime: "20:49"
[2025-12-09 20:49:58.298 +0200] INFO: Attempting to start cycle with sanitized steps
    env: "development"
    cycleId: "6932b9a147564095227cf802"
    steps: [
      {
        "flowId": "testerror",
        "overrides": {}
      }
    ]
[2025-12-09 20:49:58.302 +0200] INFO: ЁЯЪА Starting Cycle (Trace Overrides)
    env: "development"
    cycleId: "6932b9a147564095227cf802"
    sessionId: "69386f56dc05e343865191ab"
    stepsCount: 1
    overrides: {
      "Global 2": 100,
      "Global 2_tolerance": 10
    }
[2025-12-09 20:49:58.302 +0200] INFO: тЦ╢я╕П Executing Cycle Step
    env: "development"
    step: 0
    flowId: "testerror"
[2025-12-09 20:49:58.302 +0200] INFO: ЁЯФз Cycle Step Overrides Resolution
    env: "development"
    step: 0
    sessionOverrides: {
      "Global 2": 100,
      "Global 2_tolerance": 10
    }
    finalOverrides: {
      "Global 2": 100,
      "Global 2_tolerance": 10
    }
[2025-12-09 20:49:58.305 +0200] INFO: ЁЯзй AutomationEngine: Input Resolution
    env: "development"
    overrides: {
      "Global 2": 100,
      "Global 2_tolerance": 10
    }
    variablesResolved: {}
[2025-12-09 20:49:58.308 +0200] INFO: ЁЯУе Loading Program Session
    env: "development"
    sessionId: "69386f56dc05e343865191b1"
    programId: "testerror"
    variables: {
      "global_2": 100,
      "Global 2": 100
    }
[2025-12-09 20:49:58.317 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "start"
    edgeFound: true
    nextBlockId: "SENSOR_READ_1765271435543"
[2025-12-09 20:49:58.404 +0200] INFO: ЁЯФД [HardwareService] Strategy Changed Output Unit
    env: "development"
    deviceId: "693695d9585420702157d812"
    strategy: "tank_volume"
    driverUnit: "cm"
    newUnit: "l"
[2025-12-09 20:49:58.404 +0200] INFO: ЁЯФН [HardwareService] Checking Normalization
    env: "development"
    deviceId: "693695d9585420702157d812"
    driverId: "hc_sr04"
    sourceUnit: "l"
    raw: 18.6
    value: 0
[2025-12-09 20:49:58.404 +0200] INFO: ЁЯФН [HardwareService] Normalization Result
    env: "development"
    normalized: {
      "value": 0,
      "baseUnit": "ml"
    }
[2025-12-09 20:49:58.404 +0200] INFO: ЁЯУП [HardwareService] Normalized Value
    env: "development"
    deviceId: "693695d9585420702157d812"
    from: "l"
    to: "ml"
    original: 0
    normalized: 0
[2025-12-09 20:49:58.407 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "SENSOR_READ_1765271435543"
    edgeFound: true
    nextBlockId: "IF_1765301518579"
[2025-12-09 20:49:58.409 +0200] INFO: тЭУ IF Block Navigation Trace
    env: "development"
    blockId: "IF_1765301518579"
    result: false
    expectedHandle: "false"
    nextBlockId: "ACTUATOR_SET_1765301557224"
[2025-12-09 20:49:58.477 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "ACTUATOR_SET_1765301557224"
    edgeFound: true
    nextBlockId: "LOOP_1765301551341"
[20:50] INFO: ЁЯХТ Scheduler Tick
    env: "development"
[2025-12-09 20:50:00.491 +0200] WARN: Block execution failed
    env: "development"
    blockId: "LOOP_1765301551341"
    attempt: 1
    err: "Loop timed out after 286.2s (Limit: 10s)"
[2025-12-09 20:50:00.491 +0200] ERROR: All retries exhausted.
    env: "development"
    blockId: "LOOP_1765301551341"
    policy: "STOP"
[2025-12-09 20:50:00.495 +0200] ERROR: тЭМ Cycle Step Failed
    env: "development"
    cycleId: "6932b9a147564095227cf802"
    error: "Loop timed out after 286.2s (Limit: 10s)"
[2025-12-09 20:50:00.495 +0200] ERROR: тЭМ Cycle Failed
    env: "development"
    sessionId: "69386f56dc05e343865191ab"
    reason: "Flow execution failed: Loop timed out after 286.2s (Limit: 10s)"
[2025-12-09 20:50:00.511 +0200] INFO: тЭМ Active Program Cycle Marked Failed
    env: "development"
    cycleId: "6932b9a147564095227cf802"
    reason: "Flow execution failed: Loop timed out after 286.2s (Limit: 10s)"
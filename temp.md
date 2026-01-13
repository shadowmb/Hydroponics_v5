[2026-01-13 16:27:48.841 +0200] INFO: ⏸️ Active Program Paused
    env: "development"
[16:27] INFO: 🕒 Scheduler Tick
    env: "development"
[16:28] INFO: 🕒 Scheduler Tick
    env: "development"
[16:28] INFO: 🕒 Scheduler Tick
    env: "development"
[16:28] INFO: 🕒 Scheduler Tick
    env: "development"
[16:28] INFO: 🕒 Scheduler Tick
    env: "development"
[16:28] INFO: 🕒 Scheduler Tick
    env: "development"
[16:28] INFO: 🕒 Scheduler Tick
    env: "development"
[16:29] INFO: 🕒 Scheduler Tick
    env: "development"
[2026-01-13 16:29:06.232 +0200] INFO: 🕵️ Resume Check: Inspecting Window
    env: "development"
    windowId: "tw_1768252562493_r09hajzbh"
    status: "active"
    winDefFound: true
    currentMin: 989
    endTime: "16:28"
[2026-01-13 16:29:06.232 +0200] INFO: ⚠️ Resume Check: Found Expired Window
    env: "development"
    window: "Прозорец 1"
    endMin: 988
    currentMin: 989
[2026-01-13 16:29:06.232 +0200] INFO: ⏸️ Resume Check: Confirmation Required for Expired Windows
    env: "development"
    expiredCount: 1
✅ DEBUG LISTENER: automation:block_end received! start
[ActuatorSet] ⏳ Starting Pulse: 2s (2000ms)...
[2026-01-13 16:29:07.966 +0200] INFO: 🕵️ Resume Check: Inspecting Window
    env: "development"
    windowId: "tw_1768252562493_r09hajzbh"
    status: "active"
    winDefFound: true
    currentMin: 989
    endTime: "16:28"
[2026-01-13 16:29:07.966 +0200] INFO: ⚠️ Resume Check: Found Expired Window
    env: "development"
    window: "Прозорец 1"
    endMin: 988
    currentMin: 989
[2026-01-13 16:29:07.966 +0200] INFO: ⚡ Resume Strategy: Force running expired windows
    env: "development"
[2026-01-13 16:29:07.966 +0200] INFO: ⚡ Force Evaluating Window (Resume)
    env: "development"
    window: "Прозорец 1"
[2026-01-13 16:29:07.967 +0200] INFO: 🔍 [TriggerEvaluator] Reading sensor...
    env: "development"
    sensorId: "695d8a1e7dff83164c8abdab"
    source: "live"
[2026-01-13 16:29:07.968 +0200] INFO: 📡 [TriggerEvaluator] Starting LIVE read...
    env: "development"
    sensorId: "695d8a1e7dff83164c8abdab"
[2026-01-13 16:29:07.974 +0200] INFO: 📤 [UdpTransport] Sending Raw Message
    env: "development"
    ip: "172.21.128.1"
    port: 8888
    message: "MODBUS_RTU_READ|{\"slaveId\":1,\"funcCode\":3,\"startAddr\":0,\"len\":1,\"baudRate\":9600,\"rxPin\":0,\"txPin\":1}"
[2026-01-13 16:29:07.978 +0200] INFO: 📊 [TriggerEvaluator] Live value received
    env: "development"
    sensorId: "695d8a1e7dff83164c8abdab"
    value: 60
[2026-01-13 16:29:07.978 +0200] INFO: 🎯 [TriggerEvaluator] Evaluation Result
    env: "development"
    triggerId: "tr_1768252574948_0bg4zhaeh"
    triggerIndex: 1
    logicalOp: "AND"
    conditions: [
      {
        "sensorId": "695d8a1e7dff83164c8abdab",
        "operator": "between",
        "value": 100,
        "valueMax": 300,
        "sensorName": "PAR SIM",
        "sensorValue": 60
      }
    ]
    results: [
      false
    ]
    isTriggered: false
[2026-01-13 16:29:07.978 +0200] INFO: 🛡️ No trigger matched during Resume. Executing Fallback.
    env: "development"
[2026-01-13 16:29:07.979 +0200] INFO: 🛡️ Executing fallback flow(s)
    env: "development"
    windowId: "tw_1768252562493_r09hajzbh"
    fallbackFlowIds: [
      "polivane"
    ]
[2026-01-13 16:29:07.982 +0200] INFO: 🚀 Starting Cycle (Trace Overrides)
    env: "development"
    cycleId: "fallback-tw_1768252562493_r09hajzbh"
    cycleName: "Fallback: Прозорец 1"
    sessionId: "696656b39f3f64ae0a2b8991"
    stepsCount: 1
    overrides: {
      "activeProgramId": "prog_test_neveve",
      "windowId": "tw_1768252562493_r09hajzbh",
      "windowName": "Прозорец 1",
      "executionType": "fallback"
    }
[2026-01-13 16:29:07.982 +0200] INFO: ▶️ Executing Cycle Step
    env: "development"
    step: 0
    flowId: "polivane"
[2026-01-13 16:29:07.982 +0200] INFO: 🔧 Cycle Step Overrides Resolution
    env: "development"
    step: 0
    sessionOverrides: {
      "activeProgramId": "prog_test_neveve",
      "windowId": "tw_1768252562493_r09hajzbh",
      "windowName": "Прозорец 1",
      "executionType": "fallback",
      "cycleName": "Fallback: Прозорец 1"
    }
    finalOverrides: {
      "activeProgramId": "prog_test_neveve",
      "windowId": "tw_1768252562493_r09hajzbh",
      "windowName": "Прозорец 1",
      "executionType": "fallback",
      "Поливане Време": 2,
      "cycleName": "Fallback: Прозорец 1",
      "_parentCycleSessionId": "696656b39f3f64ae0a2b8991"
    }
[2026-01-13 16:29:07.985 +0200] INFO: ✨ AutomationEngine Actor Initialized/Reset (Session: none)
    env: "development"
[2026-01-13 16:29:07.992 +0200] INFO: 🧩 AutomationEngine: Input Resolution
    env: "development"
    overrides: {
      "activeProgramId": "prog_test_neveve",
      "windowId": "tw_1768252562493_r09hajzbh",
      "windowName": "Прозорец 1",
      "executionType": "fallback",
      "Поливане Време": 2,
      "cycleName": "Fallback: Прозорец 1",
      "_parentCycleSessionId": "696656b39f3f64ae0a2b8991"
    }
    variablesResolved: {}
[2026-01-13 16:29:07.994 +0200] INFO: 📥 Loading Program Session
    env: "development"
    sessionId: "696656b39f3f64ae0a2b899a"
    programId: "polivane"
    variables: {
      "global_1": 2,
      "Поливане Време": 2,
      "_parentCycleSessionId": "696656b39f3f64ae0a2b8991"
    }
[2026-01-13 16:29:08.003 +0200] INFO: 📝 [ProgramLogService] logEvent called
    env: "development"
    programId: "prog_test_neveve"
    type: "FLOW_EXECUTED"
    message: "Стартиран поток (Fallback): Поливане"
[2026-01-13 16:29:08.004 +0200] INFO: 📋 [ProgramLogService] Received block_end event
    env: "development"
    activeProgramId: "prog_test_neveve"
    blockType: "START"
    blockId: "start"
[2026-01-13 16:29:08.004 +0200] INFO: 🔔 NotificationService: Received Block Event with Config
    env: "development"
    blockId: "start"
    config: {
      "config": {
        "label": "Start",
        "hasError": false
      }
    }
[2026-01-13 16:29:08.004 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "start"
    edgeFound: true
    nextBlockId: "ACTUATOR_SET_1767345602688"
[2026-01-13 16:29:08.008 +0200] INFO: 🛡️ Fallback started
    env: "development"
    flowSessionId: "696656b39f3f64ae0a2b8991"
[2026-01-13 16:29:08.009 +0200] INFO: ▶️ Active Program Started
    env: "development"
[2026-01-13 16:29:08.018 +0200] INFO: ✅ [ProgramLogService] Event saved to DB
    env: "development"
    programId: "prog_test_neveve"
    type: "FLOW_EXECUTED"
[2026-01-13 16:29:08.026 +0200] INFO: 🔍 Scheduler: Processing Window Step
    env: "development"
    window: "Прозорец 1"
    status: "active"
    lastCheck: "2026-01-13T14:27:47.882Z"
[2026-01-13 16:29:08.027 +0200] INFO: 📨 Sending Notification: "ℹ️ Event: CYCLE_START"
    env: "development"
    provider: "Telegram"
    type: "telegram"
[2026-01-13 16:29:08.030 +0200] INFO: 📨 Sending Notification: "🚀 Program Started"
    env: "development"
    provider: "Telegram"
    type: "telegram"
[2026-01-13 16:29:08.033 +0200] INFO: 📤 [UdpTransport] Sending Raw Message
    env: "development"
    ip: "172.21.128.1"
    port: 8888
    message: "DIGITAL_WRITE|D8_8|1"
[ActuatorSet] ✔️ Pulsed 'PULSE_ON' for 2.00s
✅ DEBUG LISTENER: automation:block_end received! ACTUATOR_SET_1767345602688
[SensorRead] ✔️ Saved to 'var_4': 100 L
✅ DEBUG LISTENER: automation:block_end received! SENSOR_READ_1767738725540
✅ DEBUG LISTENER: automation:block_end received! end
[16:29] INFO: 🕒 Scheduler Tick
    env: "development"
[2026-01-13 16:29:10.005 +0200] INFO: 🔍 Scheduler: Processing Window Step
    env: "development"
    window: "Прозорец 1"
    status: "active"
    lastCheck: "2026-01-13T14:27:47.882Z"
[2026-01-13 16:29:10.044 +0200] INFO: 📤 [UdpTransport] Sending Raw Message
    env: "development"
    ip: "172.21.128.1"
    port: 8888
    message: "DIGITAL_WRITE|D8_8|0"
[2026-01-13 16:29:10.045 +0200] INFO: 📋 [ProgramLogService] Received block_end event
    env: "development"
    activeProgramId: "prog_test_neveve"
    blockType: "ACTUATOR_SET"
    blockId: "ACTUATOR_SET_1767345602688"
[2026-01-13 16:29:10.045 +0200] INFO: 📝 [ProgramLogService] logEvent called
    env: "development"
    programId: "prog_test_neveve"
    type: "INFO"
    message: "⚡ Set Actuator: Pulsed ON for 2.0s"
[2026-01-13 16:29:10.045 +0200] INFO: 🔔 NotificationService: Received Block Event with Config
    env: "development"
    blockId: "ACTUATOR_SET_1767345602688"
    config: {
      "channelId": "",
      "mode": "AUTO",
      "config": {
        "label": "Set Actuator",
        "strategy": "actuator_manual",
        "durationUnit": "min",
        "amountMode": "VOLUME",
        "amountUnit": "ml",
        "retryCount": 3,
        "retryDelay": 1000,
        "onFailure": "STOP",
        "errorNotification": false,
        "notificationChannelId": "",
        "notificationMode": "AUTO",
        "revertOnStop": true,
        "hasError": false,
        "action": "PULSE_ON",
        "duration": "{{global_1}}",
        "deviceId": "695d8bf67dff83164c8ac16e"
      }
    }
[2026-01-13 16:29:10.046 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "ACTUATOR_SET_1767345602688"
    edgeFound: true
    nextBlockId: "SENSOR_READ_1767738725540"
[2026-01-13 16:29:10.053 +0200] INFO: ✅ [ProgramLogService] Event saved to DB
    env: "development"
    programId: "prog_test_neveve"
    type: "INFO"
[2026-01-13 16:29:10.058 +0200] INFO: 📤 [UdpTransport] Sending Raw Message
    env: "development"
    ip: "172.21.128.1"
    port: 8888
    message: "UART_READ_DISTANCE|10|11"
[2026-01-13 16:29:10.065 +0200] INFO: 📋 [ProgramLogService] Received block_end event
    env: "development"
    activeProgramId: "prog_test_neveve"
    blockType: "SENSOR_READ"
    blockId: "SENSOR_READ_1767738725540"
[2026-01-13 16:29:10.065 +0200] INFO: 📝 [ProgramLogService] logEvent called
    env: "development"
    programId: "prog_test_neveve"
    type: "INFO"
    message: "📊 Сензор Ниво ГР: Read 100 L"
[2026-01-13 16:29:10.065 +0200] INFO: 🔔 NotificationService: Received Block Event with Config
    env: "development"
    blockId: "SENSOR_READ_1767738725540"
    config: {
      "channelId": "",
      "mode": "AUTO",
      "config": {
        "label": "Сензор Ниво ГР",
        "readingType": "tank_volume",
        "retryCount": 3,
        "retryDelay": 1000,
        "onFailure": "STOP",
        "errorNotification": false,
        "notificationChannelId": "",
        "notificationMode": "AUTO",
        "hasError": false,
        "deviceId": "695d88347dff83164c8abaf5",
        "variable": "var_4"
      }
    }
[2026-01-13 16:29:10.065 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "SENSOR_READ_1767738725540"
    edgeFound: true
    nextBlockId: "end"
[2026-01-13 16:29:10.066 +0200] INFO: 📋 [ProgramLogService] Received block_end event
    env: "development"
    activeProgramId: "prog_test_neveve"
    blockType: "END"
    blockId: "end"
[2026-01-13 16:29:10.066 +0200] INFO: 🔔 NotificationService: Received Block Event with Config
    env: "development"
    blockId: "end"
    config: {
      "config": {
        "label": "End",
        "hasError": false
      }
    }
[2026-01-13 16:29:10.070 +0200] INFO: ✅ [ProgramLogService] Event saved to DB
    env: "development"
    programId: "prog_test_neveve"
    type: "INFO"
[2026-01-13 16:29:10.070 +0200] INFO: ✅ Cycle Step Completed
    env: "development"
    cycleId: "fallback-tw_1768252562493_r09hajzbh"
    step: 0
[2026-01-13 16:29:10.070 +0200] INFO: 🏁 Cycle Completed Successfully
    env: "development"
    sessionId: "696656b39f3f64ae0a2b8991"
[2026-01-13 16:29:10.079 +0200] INFO: 📨 Sending Notification: "🛑 Program Stopped"
    env: "development"
    provider: "Telegram"
    type: "telegram"
[2026-01-13 16:29:10.085 +0200] INFO: 📨 Sending Notification: "ℹ️ Event: CYCLE_COMPLETE"
    env: "development"
    provider: "Telegram"
    type: "telegram"
[16:29] INFO: 🕒 Scheduler Tick
    env: "development"
[2026-01-13 16:29:20.004 +0200] INFO: 🔍 Scheduler: Processing Window Step
    env: "development"
    window: "Прозорец 1"
    status: "active"
    lastCheck: "2026-01-13T14:27:47.882Z"
[16:29] INFO: 🕒 Scheduler Tick
    env: "development"
[2026-01-13 16:29:30.003 +0200] INFO: 🔍 Scheduler: Processing Window Step
    env: "development"
    window: "Прозорец 1"
    status: "active"
    lastCheck: "2026-01-13T14:27:47.882Z"
[16:29] INFO: 🕒 Scheduler Tick
    env: "development"
[2026-01-13 16:29:40.007 +0200] INFO: 🔍 Scheduler: Processing Window Step
    env: "development"
    window: "Прозорец 1"
    status: "active"
    lastCheck: "2026-01-13T14:27:47.882Z"
[16:29] INFO: 🕒 Scheduler Tick
    env: "development"
[2026-01-13 16:29:50.003 +0200] INFO: 🔍 Scheduler: Processing Window Step
    env: "development"
    window: "Прозорец 1"
    status: "active"
    lastCheck: "2026-01-13T14:27:47.882Z"
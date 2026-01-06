✅ DEBUG LISTENER: automation:block_end received! start
[SensorRead] ✔️ Saved to 'var_1': 100 L
✅ DEBUG LISTENER: automation:block_end received! SENSOR_READ_1767702436022
[IfBlock DEBUG] Params: {
  "operator": ">=",
  "onFailure": "STOP",
  "errorNotification": false,
  "notificationChannelId": "",
  "notificationMode": "AUTO",
  "label": "Condition (IF)",
  "hasError": false,
  "variable": "var_1",
  "value": "{{global_2}}",
  "_blockId": "IF_1767702486445"
}
[IfBlock DEBUG] Checking Left Tolerance for: 'var_1'
[IfBlock DEBUG] Checking Right Tolerance for: {{global_2}}
[IfBlock Tolerance] Applied for 'global_2': 1 (Mode: symmetric)
✅ DEBUG LISTENER: automation:block_end received! IF_1767702486445
✅ DEBUG LISTENER: automation:block_end received! end
✅ DEBUG LISTENER: automation:block_end received! start
[SensorRead] ✔️ Saved to 'var_1': 100 L
✅ DEBUG LISTENER: automation:block_end received! SENSOR_READ_1767702436022
[IfBlock DEBUG] Params: {
  "operator": ">=",
  "onFailure": "STOP",
  "errorNotification": false,
  "notificationChannelId": "",
  "notificationMode": "AUTO",
  "label": "Condition (IF)",
  "hasError": false,
  "variable": "var_1",
  "value": "{{global_2}}",
  "_blockId": "IF_1767702486445"
}
[IfBlock DEBUG] Checking Left Tolerance for: 'var_1'
[IfBlock DEBUG] Checking Right Tolerance for: {{global_2}}
[IfBlock Tolerance] Applied for 'global_2': 1 (Mode: symmetric)
✅ DEBUG LISTENER: automation:block_end received! IF_1767702486445
✅ DEBUG LISTENER: automation:block_end received! end
[2026-01-06 23:45:44.275 +0200] INFO: ⚡ Cycle Force Started (Time updated to Now)
    env: "development"
    itemId: "695d81fb7b68430690acc6e5"
    newTime: "23:45"
[2026-01-06 23:45:44.280 +0200] INFO: Attempting to start cycle with sanitized steps
    env: "development"
    cycleId: "695d055809a10176b8960b0c"
    steps: [
      {
        "flowId": "rezervoar",
        "overrides": {
          "Резервоар Пълен": 1,
          "Резервоар Пълен_tolerance": 1
        }
      },
      {
        "flowId": "rezervoar",
        "overrides": {
          "Резервоар Пълен": 1,
          "Резервоар Пълен_tolerance": 1
        }
      }
    ]
[2026-01-06 23:45:44.285 +0200] INFO: 🚀 Starting Cycle (Trace Overrides)
    env: "development"
    cycleId: "695d055809a10176b8960b0c"
    cycleName: "695d055809a10176b8960b0c"
    sessionId: "695d82887b68430690acc964"
    stepsCount: 2
    overrides: {
      "activeProgramId": "prog_testph_sim"
    }
[2026-01-06 23:45:44.285 +0200] INFO: ▶️ Executing Cycle Step
    env: "development"
    step: 0
    flowId: "rezervoar"
[2026-01-06 23:45:44.285 +0200] INFO: 🔧 Cycle Step Overrides Resolution
    env: "development"
    step: 0
    sessionOverrides: {
      "activeProgramId": "prog_testph_sim",
      "cycleName": "695d055809a10176b8960b0c"
    }
    finalOverrides: {
      "Резервоар Пълен": 1,
      "Резервоар Пълен_tolerance": 1,
      "activeProgramId": "prog_testph_sim",
      "cycleName": "695d055809a10176b8960b0c",
      "_parentCycleSessionId": "695d82887b68430690acc964"
    }
[2026-01-06 23:45:44.286 +0200] INFO: ✨ AutomationEngine Actor Initialized/Reset (Session: none)
    env: "development"
[2026-01-06 23:45:44.290 +0200] INFO: 🧩 AutomationEngine: Input Resolution
    env: "development"
    overrides: {
      "Резервоар Пълен": 1,
      "Резервоар Пълен_tolerance": 1,
      "activeProgramId": "prog_testph_sim",
      "cycleName": "695d055809a10176b8960b0c",
      "_parentCycleSessionId": "695d82887b68430690acc964"
    }
    variablesResolved: {}
[2026-01-06 23:45:44.293 +0200] INFO: 📥 Loading Program Session
    env: "development"
    sessionId: "695d82887b68430690acc96b"
    programId: "rezervoar"
    variables: {
      "global_2": 1,
      "Резервоар Пълен": 1,
      "Резервоар Пълен_tolerance": 1,
      "global_2_tolerance": 1,
      "_parentCycleSessionId": "695d82887b68430690acc964"
    }
[2026-01-06 23:45:44.303 +0200] INFO: 📝 [ProgramLogService] logEvent called
    env: "development"
    programId: "prog_testph_sim"
    type: "FLOW_EXECUTED"
    message: "Стартиран поток: Резервоар"
[2026-01-06 23:45:44.303 +0200] INFO: 📋 [ProgramLogService] Received block_end event
    env: "development"
    activeProgramId: "prog_testph_sim"
    blockType: "START"
    blockId: "start"
[2026-01-06 23:45:44.303 +0200] INFO: 🔔 NotificationService: Received Block Event with Config
    env: "development"
    blockId: "start"
    config: {
      "config": {
        "label": "Start",
        "hasError": false
      }
    }
[2026-01-06 23:45:44.305 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "start"
    edgeFound: true
    nextBlockId: "SENSOR_READ_1767702436022"
[2026-01-06 23:45:44.331 +0200] INFO: ✅ [ProgramLogService] Event saved to DB
    env: "development"
    programId: "prog_testph_sim"
    type: "FLOW_EXECUTED"
[2026-01-06 23:45:44.342 +0200] INFO: 📤 [UdpTransport] Sending Raw Message
    env: "development"
    ip: "10.1.10.200"
    port: 8888
    message: "UART_READ_DISTANCE|10|11"
[2026-01-06 23:45:44.343 +0200] INFO: 📨 Sending Notification: "🚀 Application Started: Резервоар"
    env: "development"
    provider: "Telegram Bot"
    type: "telegram"
[2026-01-06 23:45:44.378 +0200] INFO: 📋 [ProgramLogService] Received block_end event
    env: "development"
    activeProgramId: "prog_testph_sim"
    blockType: "SENSOR_READ"
    blockId: "SENSOR_READ_1767702436022"
[2026-01-06 23:45:44.378 +0200] INFO: 📝 [ProgramLogService] logEvent called
    env: "development"
    programId: "prog_testph_sim"
    type: "INFO"
    message: "📊 Сензор Ниво ГР: Read 100 L"
[2026-01-06 23:45:44.379 +0200] INFO: 🔔 NotificationService: Received Block Event with Config
    env: "development"
    blockId: "SENSOR_READ_1767702436022"
    config: {
      "channelId": "",
      "mode": "AUTO",
      "config": {
        "readingType": "tank_volume",
        "retryCount": 3,
        "retryDelay": 1000,
        "onFailure": "STOP",
        "errorNotification": false,
        "notificationChannelId": "",
        "notificationMode": "AUTO",
        "label": "Сензор Ниво ГР",
        "hasError": false,
        "deviceId": "695cf9d709a10176b895f66d",
        "variable": "var_1"
      }
    }
[2026-01-06 23:45:44.380 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "SENSOR_READ_1767702436022"
    edgeFound: true
    nextBlockId: "IF_1767702486445"
[2026-01-06 23:45:44.385 +0200] INFO: 📋 [ProgramLogService] Received block_end event
    env: "development"
    activeProgramId: "prog_testph_sim"
    blockType: "IF"
    blockId: "IF_1767702486445"
[2026-01-06 23:45:44.385 +0200] INFO: 📝 [ProgramLogService] logEvent called
    env: "development"
    programId: "prog_testph_sim"
    type: "INFO"
    message: "❓ Condition (IF): 100.00 >= [0.00–2.00] => TRUE"
[2026-01-06 23:45:44.385 +0200] INFO: 🔔 NotificationService: Received Block Event with Config
    env: "development"
    blockId: "IF_1767702486445"
    config: {
      "channelId": "",
      "mode": "AUTO",
      "config": {
        "operator": ">=",
        "onFailure": "STOP",
        "errorNotification": false,
        "notificationChannelId": "",
        "notificationMode": "AUTO",
        "label": "Condition (IF)",
        "hasError": false,
        "variable": "var_1",
        "value": "{{global_2}}"
      }
    }
[2026-01-06 23:45:44.385 +0200] INFO: ❓ IF Block Navigation Trace
    env: "development"
    blockId: "IF_1767702486445"
    result: true
    expectedHandle: "true"
    nextBlockId: "end"
[2026-01-06 23:45:44.386 +0200] INFO: 📋 [ProgramLogService] Received block_end event
    env: "development"
    activeProgramId: "prog_testph_sim"
    blockType: "END"
    blockId: "end"
[2026-01-06 23:45:44.386 +0200] INFO: 🔔 NotificationService: Received Block Event with Config
    env: "development"
    blockId: "end"
    config: {
      "config": {
        "label": "End",
        "hasError": false
      }
    }
[2026-01-06 23:45:44.408 +0200] INFO: ✅ Cycle Step Completed
    env: "development"
    cycleId: "695d055809a10176b8960b0c"
    step: 0
[2026-01-06 23:45:44.408 +0200] INFO: ▶️ Executing Cycle Step
    env: "development"
    step: 1
    flowId: "rezervoar"
[2026-01-06 23:45:44.408 +0200] INFO: 🔧 Cycle Step Overrides Resolution
    env: "development"
    step: 1
    sessionOverrides: {
      "activeProgramId": "prog_testph_sim",
      "cycleName": "695d055809a10176b8960b0c"
    }
    finalOverrides: {
      "Резервоар Пълен": 1,
      "Резервоар Пълен_tolerance": 1,
      "activeProgramId": "prog_testph_sim",
      "cycleName": "695d055809a10176b8960b0c",
      "_parentCycleSessionId": "695d82887b68430690acc964"
    }
[2026-01-06 23:45:44.409 +0200] INFO: ✨ AutomationEngine Actor Initialized/Reset (Session: none)
    env: "development"
[2026-01-06 23:45:44.414 +0200] INFO: ✅ [ProgramLogService] Event saved to DB
    env: "development"
    programId: "prog_testph_sim"
    type: "INFO"
[2026-01-06 23:45:44.414 +0200] INFO: ✅ [ProgramLogService] Event saved to DB
    env: "development"
    programId: "prog_testph_sim"
    type: "INFO"
[2026-01-06 23:45:44.417 +0200] INFO: 🧩 AutomationEngine: Input Resolution
    env: "development"
    overrides: {
      "Резервоар Пълен": 1,
      "Резервоар Пълен_tolerance": 1,
      "activeProgramId": "prog_testph_sim",
      "cycleName": "695d055809a10176b8960b0c",
      "_parentCycleSessionId": "695d82887b68430690acc964"
    }
    variablesResolved: {}
[2026-01-06 23:45:44.424 +0200] INFO: 📥 Loading Program Session
    env: "development"
    sessionId: "695d82887b68430690acc994"
    programId: "rezervoar"
    variables: {
      "global_2": 1,
      "Резервоар Пълен": 1,
      "Резервоар Пълен_tolerance": 1,
      "global_2_tolerance": 1,
      "_parentCycleSessionId": "695d82887b68430690acc964"
    }
[2026-01-06 23:45:44.441 +0200] INFO: 📝 [ProgramLogService] logEvent called
    env: "development"
    programId: "prog_testph_sim"
    type: "FLOW_EXECUTED"
    message: "Стартиран поток: Резервоар"
[2026-01-06 23:45:44.441 +0200] INFO: 📋 [ProgramLogService] Received block_end event
    env: "development"
    activeProgramId: "prog_testph_sim"
    blockType: "START"
    blockId: "start"
[2026-01-06 23:45:44.441 +0200] INFO: 🔔 NotificationService: Received Block Event with Config
    env: "development"
    blockId: "start"
    config: {
      "config": {
        "label": "Start",
        "hasError": false
      }
    }
[2026-01-06 23:45:44.444 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "start"
    edgeFound: true
    nextBlockId: "SENSOR_READ_1767702436022"
[2026-01-06 23:45:44.460 +0200] INFO: ✅ [ProgramLogService] Event saved to DB
    env: "development"
    programId: "prog_testph_sim"
    type: "FLOW_EXECUTED"
[2026-01-06 23:45:44.493 +0200] INFO: 📤 [UdpTransport] Sending Raw Message
    env: "development"
    ip: "10.1.10.200"
    port: 8888
    message: "UART_READ_DISTANCE|10|11"
[2026-01-06 23:45:44.494 +0200] INFO: 📨 Sending Notification: "🚀 Application Started: Резервоар"
    env: "development"
    provider: "Telegram Bot"
    type: "telegram"
[2026-01-06 23:45:44.504 +0200] INFO: 📋 [ProgramLogService] Received block_end event
    env: "development"
    activeProgramId: "prog_testph_sim"
    blockType: "SENSOR_READ"
    blockId: "SENSOR_READ_1767702436022"
[2026-01-06 23:45:44.504 +0200] INFO: 📝 [ProgramLogService] logEvent called
    env: "development"
    programId: "prog_testph_sim"
    type: "INFO"
    message: "📊 Сензор Ниво ГР: Read 100 L"
[2026-01-06 23:45:44.504 +0200] INFO: 🔔 NotificationService: Received Block Event with Config
    env: "development"
    blockId: "SENSOR_READ_1767702436022"
    config: {
      "channelId": "",
      "mode": "AUTO",
      "config": {
        "readingType": "tank_volume",
        "retryCount": 3,
        "retryDelay": 1000,
        "onFailure": "STOP",
        "errorNotification": false,
        "notificationChannelId": "",
        "notificationMode": "AUTO",
        "label": "Сензор Ниво ГР",
        "hasError": false,
        "deviceId": "695cf9d709a10176b895f66d",
        "variable": "var_1"
      }
    }
[2026-01-06 23:45:44.504 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "SENSOR_READ_1767702436022"
    edgeFound: true
    nextBlockId: "IF_1767702486445"
[2026-01-06 23:45:44.509 +0200] INFO: 📋 [ProgramLogService] Received block_end event
    env: "development"
    activeProgramId: "prog_testph_sim"
    blockType: "IF"
    blockId: "IF_1767702486445"
[2026-01-06 23:45:44.509 +0200] INFO: 📝 [ProgramLogService] logEvent called
    env: "development"
    programId: "prog_testph_sim"
    type: "INFO"
    message: "❓ Condition (IF): 100.00 >= [0.00–2.00] => TRUE"
[2026-01-06 23:45:44.509 +0200] INFO: 🔔 NotificationService: Received Block Event with Config
    env: "development"
    blockId: "IF_1767702486445"
    config: {
      "channelId": "",
      "mode": "AUTO",
      "config": {
        "operator": ">=",
        "onFailure": "STOP",
        "errorNotification": false,
        "notificationChannelId": "",
        "notificationMode": "AUTO",
        "label": "Condition (IF)",
        "hasError": false,
        "variable": "var_1",
        "value": "{{global_2}}"
      }
    }
[2026-01-06 23:45:44.510 +0200] INFO: ❓ IF Block Navigation Trace
    env: "development"
    blockId: "IF_1767702486445"
    result: true
    expectedHandle: "true"
    nextBlockId: "end"
[2026-01-06 23:45:44.512 +0200] INFO: 📋 [ProgramLogService] Received block_end event
    env: "development"
    activeProgramId: "prog_testph_sim"
    blockType: "END"
    blockId: "end"
[2026-01-06 23:45:44.512 +0200] INFO: 🔔 NotificationService: Received Block Event with Config
    env: "development"
    blockId: "end"
    config: {
      "config": {
        "label": "End",
        "hasError": false
      }
    }
[2026-01-06 23:45:44.529 +0200] INFO: ✅ Cycle Step Completed
    env: "development"
    cycleId: "695d055809a10176b8960b0c"
    step: 1
[2026-01-06 23:45:44.529 +0200] INFO: 🏁 Cycle Completed Successfully
    env: "development"
    sessionId: "695d82887b68430690acc964"
[2026-01-06 23:45:44.532 +0200] INFO: ✅ [ProgramLogService] Event saved to DB
    env: "development"
    programId: "prog_testph_sim"
    type: "INFO"
[2026-01-06 23:45:44.532 +0200] INFO: ✅ [ProgramLogService] Event saved to DB
    env: "development"
    programId: "prog_testph_sim"
    type: "INFO"
[2026-01-06 23:45:44.570 +0200] INFO: ✅ Active Program Cycle Marked Completed
    env: "development"
    cycleId: "695d055809a10176b8960b0c"
[2026-01-06 23:45:44.593 +0200] INFO: 📨 Sending Notification: "✅ Cycle Finished: 695d055809a10176b8960b0c"
    env: "development"
    provider: "Telegram Bot"
    type: "telegram"
[2026-01-06 23:45:46.348 +0200] INFO: ⏹️ Active Program Stopped (Statuses Reset)
    env: "development"
[23:45] INFO: 🕒 Scheduler Tick
[14:59] INFO: 🕒 Scheduler Tick
    env: "development"
    isSim: true
[2026-01-15 14:00:00.013 +0200] INFO: 🔍 Scheduler: Processing Window Step
    env: "development"
    window: "Сутрин"
    status: "active"
    lastCheck: "2026-01-15T12:59:17.808Z"
✅ DEBUG LISTENER: automation:block_end received! start
[15:00] INFO: 🕒 Scheduler Tick
    env: "development"
    isSim: true
[2026-01-15 14:00:10.004 +0200] INFO: 🔍 Scheduler: Processing Window Step
    env: "development"
    window: "Сутрин"
    status: "active"
    lastCheck: "2026-01-15T12:59:17.808Z"
[2026-01-15 14:00:10.004 +0200] INFO: ⏰ Window time expired - checking fallback
    env: "development"
    windowId: "tw_1768474270033_g1u42j2q2"
[2026-01-15 14:00:10.004 +0200] INFO: 🛡️ Executing fallback flow(s)
    env: "development"
    windowId: "tw_1768474270033_g1u42j2q2"
    fallbackFlowIds: [
      "izmervane"
    ]
[2026-01-15 14:00:10.006 +0200] INFO: 🚀 Starting Cycle (Trace Overrides)
    env: "development"
    cycleId: "fallback-tw_1768474270033_g1u42j2q2"
    cycleName: "Fallback: Сутрин"
    sessionId: "6968d6cae112df1f28925caf"
    stepsCount: 1
    overrides: {
      "activeProgramId": "prog_test_simualtsiya",
      "windowId": "tw_1768474270033_g1u42j2q2",
      "windowName": "Сутрин",
      "executionType": "fallback"
    }
[2026-01-15 14:00:10.006 +0200] INFO: ▶️ Executing Cycle Step
    env: "development"
    step: 0
    flowId: "izmervane"
[2026-01-15 14:00:10.006 +0200] INFO: 🔧 Cycle Step Overrides Resolution
    env: "development"
    step: 0
    sessionOverrides: {
      "activeProgramId": "prog_test_simualtsiya",
      "windowId": "tw_1768474270033_g1u42j2q2",
      "windowName": "Сутрин",
      "executionType": "fallback",
      "cycleName": "Fallback: Сутрин"
    }
    finalOverrides: {
      "activeProgramId": "prog_test_simualtsiya",
      "windowId": "tw_1768474270033_g1u42j2q2",
      "windowName": "Сутрин",
      "executionType": "fallback",
      "cycleName": "Fallback: Сутрин",
      "_parentCycleSessionId": "6968d6cae112df1f28925caf"
    }
[2026-01-15 14:00:10.009 +0200] INFO: ✨ AutomationEngine Actor Initialized/Reset (Session: none)
    env: "development"
[2026-01-15 14:00:10.017 +0200] INFO: 🧩 AutomationEngine: Input Resolution
    env: "development"
    overrides: {
      "activeProgramId": "prog_test_simualtsiya",
      "windowId": "tw_1768474270033_g1u42j2q2",
      "windowName": "Сутрин",
      "executionType": "fallback",
      "cycleName": "Fallback: Сутрин",
      "_parentCycleSessionId": "6968d6cae112df1f28925caf"
    }
    variablesResolved: {}
[2026-01-15 14:00:10.019 +0200] INFO: 📥 Loading Program Session
    env: "development"
    sessionId: "6968d6cae112df1f28925cbb"
    programId: "izmervane"
    variables: {
      "_parentCycleSessionId": "6968d6cae112df1f28925caf"
    }
[2026-01-15 14:00:10.020 +0200] INFO: 💾 Syncing Session Status to DB
    env: "development"
    sessionId: "6968d6cae112df1f28925cbb"
    updates: {
      "status": "loaded"
    }
[2026-01-15 14:00:10.025 +0200] INFO: 💾 Syncing Session Status to DB
    env: "development"
    sessionId: "6968d6cae112df1f28925cbb"
    updates: {
      "status": "running"
    }
[2026-01-15 14:00:10.025 +0200] INFO: 📝 [ProgramLogService] logEvent called
    env: "development"
    programId: "prog_test_simualtsiya"
    type: "FLOW_EXECUTED"
    message: "Стартиран поток (Fallback): Измерване"
[2026-01-15 14:00:10.026 +0200] INFO: 🔔 NotificationService: Received Block Event with Config
    env: "development"
    blockId: "start"
    config: {
      "config": {
        "label": "Start",
        "hasError": false
      }
    }
[2026-01-15 14:00:10.026 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "start"
    edgeFound: true
    nextBlockId: "SENSOR_READ_1768396581977"
[2026-01-15 14:00:10.028 +0200] INFO: 💾 Syncing Session Status to DB
    env: "development"
    sessionId: "6968d6cae112df1f28925cbb"
    updates: {
      "status": "running"
    }
[2026-01-15 14:00:10.029 +0200] INFO: 🛡️ Fallback started
    env: "development"
    flowSessionId: "6968d6cae112df1f28925caf"
[2026-01-15 14:00:10.037 +0200] INFO: ✅ [ProgramLogService] Event saved to DB
    env: "development"
    programId: "prog_test_simualtsiya"
    type: "FLOW_EXECUTED"
⚡ [EcSmart] Raw:205.46952123484783 | V:1004mV | T:25°C | EC_raw:941.7 | EC_25:941.7 uS/cm
[SensorRead] ✔️ Saved to 'var_1': 941.7 µS/cm
✅ DEBUG LISTENER: automation:block_end received! SENSOR_READ_1768396581977
[2026-01-15 14:00:10.046 +0200] INFO: 📨 Sending Notification: "ℹ️ Event: CYCLE_START"
    env: "development"
    provider: "Telegram"
    type: "telegram"
[2026-01-15 14:00:10.049 +0200] INFO: 📨 Sending Notification: "🚀 Program Started"
    env: "development"
    provider: "Telegram"
    type: "telegram"
[2026-01-15 14:00:10.055 +0200] INFO: 📤 [UdpTransport] Sending Raw Message
    env: "development"
    ip: "192.168.1.15"
    port: 8888
    message: "ANALOG|A1_15"
🧪 [PhSmart] Raw:620 | Points:2 | NeutralMV:3421.3 | Polarity:INV | V_Meas:3030.3mV | Temp:25°C | pH:6.2
[SensorRead] ✔️ Saved to 'var_2': 6.2 pH
✅ DEBUG LISTENER: automation:block_end received! SENSOR_READ_1768396716745
[2026-01-15 14:00:10.744 +0200] INFO: 📤 [UdpTransport] Sending Raw Message
    env: "development"
    ip: "192.168.1.15"
    port: 8888
    message: "DHT_READ|D3_3"
[2026-01-15 14:00:10.748 +0200] INFO: 📝 [ProgramLogService] logEvent called
    env: "development"
    programId: "prog_test_simualtsiya"
    type: "INFO"
    message: "📊 С Въздух: Read 25 C"
[2026-01-15 14:00:10.748 +0200] INFO: 🔔 NotificationService: Received Block Event with Config
    env: "development"
    blockId: "SENSOR_READ_1768396837315"
    config: {
      "channelId": "",
      "mode": "AUTO",
      "config": {
        "readingType": "linear",
        "retryCount": 3,
        "retryDelay": 1000,
        "onFailure": "STOP",
        "errorNotification": false,
        "notificationChannelId": "",
        "notificationMode": "AUTO",
        "label": "С Въздух",
        "hasError": false,
        "variable": "var_7",
        "deviceId": "69673901571cb443c36d5699"
      }
    }
[2026-01-15 14:00:10.748 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "SENSOR_READ_1768396837315"
    edgeFound: true
    nextBlockId: "end"
[2026-01-15 14:00:10.749 +0200] INFO: 💾 Syncing Session Status to DB
    env: "development"
    sessionId: "6968d6cae112df1f28925cbb"
    updates: {
      "status": "running"
    }
[2026-01-15 14:00:10.749 +0200] INFO: 🔔 NotificationService: Received Block Event with Config
    env: "development"
    blockId: "end"
    config: {
      "config": {
        "label": "End",
        "hasError": false
      }
    }
[2026-01-15 14:00:10.750 +0200] INFO: 💾 Syncing Session Status to DB
    env: "development"
    sessionId: "6968d6cae112df1f28925cbb"
    updates: {
      "status": "completed",
      "endTime": "2026-01-15T12:00:10.750Z"
    }
[2026-01-15 14:00:10.753 +0200] INFO: ✅ [ProgramLogService] Event saved to DB
    env: "development"
    programId: "prog_test_simualtsiya"
    type: "INFO"
[2026-01-15 14:00:10.753 +0200] INFO: ✅ Cycle Step Completed
    env: "development"
    cycleId: "fallback-tw_1768474270033_g1u42j2q2"
    step: 0
[2026-01-15 14:00:10.753 +0200] INFO: 🏁 Cycle Completed Successfully
    env: "development"
    sessionId: "6968d6cae112df1f28925caf"
[2026-01-15 14:00:10.762 +0200] INFO: 📨 Sending Notification: "🛑 Program Stopped"
    env: "development"
    provider: "Telegram"
    type: "telegram"
[2026-01-15 14:00:10.769 +0200] INFO: 📨 Sending Notification: "ℹ️ Event: CYCLE_COMPLETE"
    env: "development"
    provider: "Telegram"
    type: "telegram"
[15:00] INFO: 🕒 Scheduler Tick
    env: "development"
    isSim: true
[2026-01-15 14:00:20.015 +0200] INFO: 🔍 Scheduler: Processing Window Step
    env: "development"
    window: "Сутрин"
    status: "active"
    lastCheck: "2026-01-15T12:59:17.808Z"
[2026-01-15 14:00:20.016 +0200] INFO: 🔍 Debug: Scheduler detecting flow finish
    env: "development"
    windowId: "tw_1768474270033_g1u42j2q2"
    currentSessionId: "6968d6cae112df1f28925caf"
    snapshotStatus: "completed"
    isSessionMismatch: false
    isStatusFinished: true
[2026-01-15 14:00:20.016 +0200] INFO: ✅ Trigger/Fallback flow finished
    env: "development"
    windowId: "tw_1768474270033_g1u42j2q2"
    sessionId: "6968d6cae112df1f28925caf"
[2026-01-15 14:00:20.016 +0200] INFO: 🛑 Flow finished (Break/Fallback) - closing window
    env: "development"
    windowId: "tw_1768474270033_g1u42j2q2"
    result: "fallback"
[2026-01-15 14:00:20.016 +0200] INFO: 📝 [ProgramLogService] logEvent called
    env: "development"
    programId: "prog_test_simualtsiya"
    type: "WINDOW_EVENT"
    message: "Прозорец \"Сутрин\" завърши (Изтекло време)"
[2026-01-15 14:00:20.017 +0200] ERROR: ❌ Failed to record resource summary
    env: "development"
    err: {
      "type": "TypeError",
      "message": "resourceSummaryService.recordWindowSummary is not a function",
      "stack":
          TypeError: resourceSummaryService.recordWindowSummary is not a function
              at SchedulerService.processAdvancedProgram (C:\Projects\Hydroponics_v5\backend\src\modules\scheduler\SchedulerService.ts:485:58)
              at SchedulerService.tick (C:\Projects\Hydroponics_v5\backend\src\modules\scheduler\SchedulerService.ts:179:32)
              at processTicksAndRejections (node:internal/process/task_queues:103:5)
    }
[2026-01-15 14:00:20.020 +0200] INFO: ✅ [ProgramLogService] Event saved to DB
    env: "development"
    programId: "prog_test_simualtsiya"
    type: "WINDOW_EVENT"
[2026-01-15 14:00:20.021 +0200] INFO: 📊 [ResourceSummaryService] Recording execution summary
    env: "development"
    context: {
      "programId": "prog_test_simualtsiya",
      "programName": "prog_test_simualtsiya",
      "windowId": "tw_1768474270033_g1u42j2q2",
      "windowName": "Сутрин",
      "flowId": "izmervane",
      "flowName": "izmervane",
      "executionType": "WINDOW"
    }
[2026-01-15 14:00:20.022 +0200] INFO: 🏁 All windows completed - Advanced Program finished for today
    env: "development"
[2026-01-15 14:00:20.031 +0200] INFO: ✅ [ResourceSummaryService] Window summary saved
    env: "development"
    summaryId: "6968d6d4e112df1f28925d63"
    measurementCount: 7
    resourceRoles: [
      "ec",
      "ph",
      "temp",
      "soil_moisture",
      "volume",
      "par"
    ]
[15:00] INFO: 🕒 Scheduler Tick
    env: "development"
    isSim: true
[2026-01-15 14:00:30.006 +0200] INFO: 🔍 Scheduler: Processing Window Step
    env: "development"
    window: "Сутрин"
    status: "completed"
    lastCheck: "2026-01-15T12:59:17.808Z"
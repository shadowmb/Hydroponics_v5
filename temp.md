✅ DEBUG LISTENER: automation:block_end received! ACTUATOR_SET_1768600141707
✅ DEBUG LISTENER: automation:block_end received! end
[2026-01-18 18:31:56.011 +0200] INFO: 📤 [UdpTransport] Sending Raw Message
    env: "development"
    ip: "127.0.0.1"
    port: 8888
    message: "DIGITAL_WRITE|D12_12|0"
[2026-01-18 18:31:56.012 +0200] INFO: 📝 [ProgramLogService] logEvent called
    env: "development"
    programId: "prog_test_simualtsiya"
    type: "INFO"
    message: "⚡ Set Actuator: Pulsed ON for 10.0s"
[2026-01-18 18:31:56.012 +0200] INFO: 🔔 NotificationService: Received Block Event with Config
    env: "development"
    blockId: "ACTUATOR_SET_1768600141707"
    config: {
      "channelId": "",
      "mode": "AUTO",
      "config": {
        "strategy": "actuator_manual",
        "durationUnit": "sec",
        "amountMode": "VOLUME",
        "amountUnit": "ml",
        "retryCount": 3,
        "retryDelay": 1000,
        "onFailure": "STOP",
        "errorNotification": false,
        "notificationChannelId": "",
        "notificationMode": "AUTO",
        "revertOnStop": true,
        "label": "Set Actuator",
        "hasError": false,
        "deviceId": "69673c11571cb443c36d58f6",
        "action": "PULSE_ON",
        "duration": "{{global_1}}"
      }
    }
[2026-01-18 18:31:56.013 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "ACTUATOR_SET_1768600141707"
    edgeFound: true
    nextBlockId: "end"
[2026-01-18 18:31:56.013 +0200] INFO: 💾 Syncing Session Status to DB
    env: "development"
    sessionId: "696d0af17f56386012fadabe"
    updates: {
      "status": "running"
    }
[2026-01-18 18:31:56.013 +0200] INFO: 🔔 NotificationService: Received Block Event with Config
    env: "development"
    blockId: "end"
    config: {
      "config": {
        "label": "End",
        "hasError": false
      }
    }
[2026-01-18 18:31:56.014 +0200] INFO: 💾 Syncing Session Status to DB
    env: "development"
    sessionId: "696d0af17f56386012fadabe"
    updates: {
      "status": "completed",
      "endTime": "2026-01-18T16:31:56.014Z"
    }
[2026-01-18 18:31:56.017 +0200] INFO: ✅ [ProgramLogService] Event saved to DB
    env: "development"
    programId: "prog_test_simualtsiya"
    type: "INFO"
[2026-01-18 18:31:56.018 +0200] INFO: ✅ Cycle Step Completed
    env: "development"
    cycleId: "tr_1768645213962_6wjvutbap"
    step: 2
[2026-01-18 18:31:56.018 +0200] INFO: 🏁 Cycle Completed Successfully
    env: "development"
    sessionId: "696d0af17f56386012fada2c"
[2026-01-18 18:31:56.026 +0200] INFO: 📨 Sending Notification: "🛑 Program Stopped"
    env: "development"
    provider: "Telegram"
    type: "telegram"
[2026-01-18 18:31:56.031 +0200] INFO: 📨 Sending Notification: "ℹ️ Event: CYCLE_COMPLETE"
    env: "development"
    provider: "Telegram"
    type: "telegram"
[18:32] INFO: 🕒 Scheduler Tick
    env: "development"
    isSim: false
[2026-01-18 18:32:00.013 +0200] INFO: 🔍 Scheduler: Processing Window Step
    env: "development"
    window: "Сутрин"
    status: "skipped"
    lastCheck: "2026-01-18T16:31:44.776Z"
[2026-01-18 18:32:00.013 +0200] INFO: 🔍 Scheduler: Processing Window Step
    env: "development"
    window: "Обед"
    status: "active"
    lastCheck: "2026-01-18T16:31:45.307Z"
[2026-01-18 18:32:00.013 +0200] INFO: 🔍 Debug: Scheduler detecting flow finish
    env: "development"
    windowId: "tw_1768645161679_cdpz7tdlm"
    currentSessionId: "696d0af17f56386012fada2c"
    snapshotStatus: "completed"
    isSessionMismatch: false
    isStatusFinished: true
[2026-01-18 18:32:00.013 +0200] INFO: ✅ Trigger/Fallback flow finished
    env: "development"
    windowId: "tw_1768645161679_cdpz7tdlm"
    sessionId: "696d0af17f56386012fada2c"
[2026-01-18 18:32:00.014 +0200] INFO: 🛑 Flow finished (Break/Fallback) - closing window
    env: "development"
    windowId: "tw_1768645161679_cdpz7tdlm"
    result: "triggered"
[2026-01-18 18:32:00.014 +0200] INFO: 📝 [ProgramLogService] logEvent called
    env: "development"
    programId: "prog_test_simualtsiya"
    type: "WINDOW_EVENT"
    message: "Прозорец \"Обед\" завърши (Изтекло време)"
[2026-01-18 18:32:00.014 +0200] INFO: 📊 [ResourceSummaryService] Recording execution summary
    env: "development"
    context: {
      "programId": "prog_test_simualtsiya",
      "programName": "Тест Симуалция",
      "windowId": "tw_1768645161679_cdpz7tdlm",
      "windowName": "Обед",
      "flowId": "control_pn",
      "flowName": "control_pn",
      "executionType": "WINDOW"
    }
[2026-01-18 18:32:00.019 +0200] INFO: ✅ [ProgramLogService] Event saved to DB
    env: "development"
    programId: "prog_test_simualtsiya"
    type: "WINDOW_EVENT"
[2026-01-18 18:32:00.020 +0200] INFO: 📊 [ResourceSummaryService] Recording execution summary
    env: "development"
    context: {
      "programId": "prog_test_simualtsiya",
      "programName": "prog_test_simualtsiya",
      "windowId": "tw_1768645161679_cdpz7tdlm",
      "windowName": "Обед",
      "flowId": "control_pn",
      "flowName": "control_pn",
      "executionType": "WINDOW"
    }
[2026-01-18 18:32:00.029 +0200] INFO: ✅ [ResourceSummaryService] Window summary saved
    env: "development"
    summaryId: "696d0b007f56386012fadb26"
    measurementCount: 3
    resourceRoles: [
      "ph",
      "ec",
      "water"
    ]
[2026-01-18 18:32:00.035 +0200] INFO: 🔍 Scheduler: Processing Window Step
    env: "development"
    window: "Следобед"
    status: "pending"
[2026-01-18 18:32:00.036 +0200] INFO: ✅ [ResourceSummaryService] Window summary saved
    env: "development"
    summaryId: "696d0b007f56386012fadb2b"
    measurementCount: 3
    resourceRoles: [
      "ph",
      "ec",
      "water"
    ]
[18:32] INFO: 🕒 Scheduler Tick
    env: "development"
    isSim: false
[2026-01-18 18:32:10.016 +0200] INFO: 🔍 Scheduler: Processing Window Step
    env: "development"
    window: "Сутрин"
    status: "skipped"
    lastCheck: "2026-01-18T16:31:44.776Z"
[2026-01-18 18:32:10.016 +0200] INFO: 🔍 Scheduler: Processing Window Step
    env: "development"
    window: "Обед"
    status: "completed"
    lastCheck: "2026-01-18T16:31:45.307Z"
[2026-01-18 18:32:10.016 +0200] INFO: 🔍 Scheduler: Processing Window Step
    env: "development"
    window: "Следобед"
    status: "pending"
[18:32] INFO: 🕒 Scheduler Tick
    env: "development"
    isSim: false
[2026-01-18 18:32:20.010 +0200] INFO: 🔍 Scheduler: Processing Window Step
    env: "development"
    window: "Сутрин"
    status: "skipped"
    lastCheck: "2026-01-18T16:31:44.776Z"
[2026-01-18 18:32:20.010 +0200] INFO: 🔍 Scheduler: Processing Window Step
    env: "development"
    window: "Обед"
    status: "completed"
    lastCheck: "2026-01-18T16:31:45.307Z"
[2026-01-18 18:32:20.010 +0200] INFO: 🔍 Scheduler: Processing Window Step
    env: "development"
    window: "Следобед"
    status: "pending"
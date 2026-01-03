Това е от "Лог на изпълнение":

09:42:17
Прозорец "Прозорец 1" - Активен
09:42:19
📊 Ultrasonic = 188.6 → ⚡ > 100 ✓
09:42:19
✓ start: Dose TEST
09:42:26
✓ ACTUATOR: Dosed 5doses
09:43:16
✓ generic: Dosed 5doses
09:43:16
✓ end: Total Time: 0m 57.0s
09:43:16
✓ start: Тест темп
09:43:17
✓ SENSOR: Read 21.94 C
09:43:17
✓ end: Total Time: 0m 1.0s
09:43:20
Прозорец "Прозорец 1" - Завършен чрез тригер
09:43:20
🏁 Програмата завърши за днес


това е от лога на backend-a:
[2026-01-03 09:42:17.615 +0200] INFO: ≡ƒöä Evaluating triggers for window
    env: "development"
    windowId: "tw_1767397161163_4sw62wba9"
    windowName: "╨ƒ╤Ç╨╛╨╖╨╛╤Ç╨╡╤å 1"
[2026-01-03 09:42:17.705 +0200] INFO: ≡ƒöî [UdpTransport] Initializing...
    env: "development"
    ip: "192.168.0.43"
    port: 8888
[2026-01-03 09:42:17.706 +0200] INFO: Γ£à [UdpTransport] Listening
    env: "development"
    address: {
      "address": "0.0.0.0",
      "family": "IPv4",
      "port": 50676
    }
[2026-01-03 09:42:17.987 +0200] INFO: ≡ƒôè [SensorProcessor] Starting Burst Read
    env: "development"
    deviceId: "6952bc2a3b5ab4f7e2676f7c"
    count: 5
    delayMs: 100
[2026-01-03 09:42:19.274 +0200] INFO: ΓÜí Trigger condition matched - executing flow(s)
    env: "development"
    triggerId: "tr_1767397178624_2yt9vuv55"
    flowIds: [
      "dose_test",
      "test_temp"
    ]
    flowId: "dose_test"
    behavior: "break"
[2026-01-03 09:42:19.279 +0200] INFO: ≡ƒÜÇ Starting Cycle (Trace Overrides)
    env: "development"
    cycleId: "tr_1767397178624_2yt9vuv55"
    cycleName: "Trigger: tr_1767397178624_2yt9vuv55"
    sessionId: "6958c85bdd7288981cf628d2"
    stepsCount: 2
    overrides: {
      "╨ö╨╛╨╖╨╕": 5
    }
[2026-01-03 09:42:19.279 +0200] INFO: Γû╢∩╕Å Executing Cycle Step
    env: "development"
    step: 0
    flowId: "dose_test"
[2026-01-03 09:42:19.279 +0200] INFO: ≡ƒöº Cycle Step Overrides Resolution
    env: "development"
    step: 0
    sessionOverrides: {
      "╨ö╨╛╨╖╨╕": 5,
      "cycleName": "Trigger: tr_1767397178624_2yt9vuv55"
    }
    finalOverrides: {
      "╨ö╨╛╨╖╨╕": 5,
      "cycleName": "Trigger: tr_1767397178624_2yt9vuv55",
      "_parentCycleSessionId": "6958c85bdd7288981cf628d2"
    }
[2026-01-03 09:42:19.280 +0200] INFO: Γ£¿ AutomationEngine Actor Initialized/Reset (Session: none)
    env: "development"
[2026-01-03 09:42:19.299 +0200] INFO: ≡ƒº⌐ AutomationEngine: Input Resolution
    env: "development"
    overrides: {
      "╨ö╨╛╨╖╨╕": 5,
      "cycleName": "Trigger: tr_1767397178624_2yt9vuv55",
      "_parentCycleSessionId": "6958c85bdd7288981cf628d2"
    }
    variablesResolved: {}
✅ DEBUG LISTENER: automation:block_end received! start
[2026-01-03 09:42:19.302 +0200] INFO: ≡ƒôÑ Loading Program Session
    env: "development"
    sessionId: "6958c85bdd7288981cf628d9"
    programId: "dose_test"
    variables: {
      "global_1": 5,
      "╨ö╨╛╨╖╨╕": 5,
      "_parentCycleSessionId": "6958c85bdd7288981cf628d2"
    }
[ActuatorSet] 💧 Dose conversion: 5 doses × 5ml = 25ml
[ActuatorSet] ⏳ Starting Dose: 5doses (~6.3s)...
[2026-01-03 09:42:19.315 +0200] INFO: ≡ƒöö NotificationService: Received Block Event with Config
    env: "development"
    blockId: "start"
    config: {
      "config": {
        "label": "Start",
        "hasError": false
      }
    }
[2026-01-03 09:42:19.315 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "start"
    edgeFound: true
    nextBlockId: "ACTUATOR_SET_1767385185450"
[2026-01-03 09:42:19.319 +0200] INFO: ≡ƒÜÇ Trigger flow(s) started - waiting for completion
    env: "development"
    windowId: "tw_1767397161163_4sw62wba9"
    triggerId: "tr_1767397178624_2yt9vuv55"
    flowSessionId: "6958c85bdd7288981cf628d2"
    stepsCount: 2
[2026-01-03 09:42:19.344 +0200] INFO: ≡ƒô¿ Sending Notification: "Γä╣∩╕Å Event: CYCLE_START"
    env: "development"
    provider: "Telegram"
    type: "telegram"
[2026-01-03 09:42:19.347 +0200] INFO: ≡ƒô¿ Sending Notification: "≡ƒÜÇ Program Started"
    env: "development"
    provider: "Telegram"
    type: "telegram"
[2026-01-03 09:42:19.357 +0200] INFO: ≡ƒöî [UdpTransport] Initializing...
    env: "development"
    ip: "192.168.0.44"
    port: 8888
[2026-01-03 09:42:19.357 +0200] INFO: Γ£à [UdpTransport] Listening
    env: "development"
    address: {
      "address": "0.0.0.0",
      "family": "IPv4",
      "port": 56904
    }
[09:42] INFO: ≡ƒòÆ Scheduler Tick
    env: "development"
[ActuatorSet] ✔️ Pulsed 'DOSE' for 6.25s
✅ DEBUG LISTENER: automation:block_end received! ACTUATOR_SET_1767385185450
[ActuatorSet] 💧 Dose conversion: 5 doses × 10ml = 50ml
[ActuatorSet] ⏳ Starting Dose: 5doses (~50.0s)...
[2026-01-03 09:42:26.164 +0200] INFO: ≡ƒöö NotificationService: Received Block Event with Config
    env: "development"
    blockId: "ACTUATOR_SET_1767385185450"
    config: {
      "channelId": "",
      "mode": "AUTO",
      "config": {
        "label": "Set Actuator",
        "strategy": "volumetric_flow",
        "amountMode": "DOSES",
        "amountUnit": "gal",
        "retryCount": 3,
        "retryDelay": 1000,
        "onFailure": "STOP",
        "errorNotification": false,
        "notificationChannelId": "",
        "notificationMode": "AUTO",
        "revertOnStop": true,
        "hasError": false,
        "deviceId": "6956db4e06968f74a3d46e18",
        "action": "DOSE",
        "amount": "{{global_1}}"
      }
    }
[2026-01-03 09:42:26.165 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "ACTUATOR_SET_1767385185450"
    edgeFound: true
    nextBlockId: "generic_1767425696340"
[09:42] INFO: ≡ƒòÆ Scheduler Tick
    env: "development"
[09:42] INFO: ≡ƒòÆ Scheduler Tick
    env: "development"
[09:42] INFO: ≡ƒòÆ Scheduler Tick
    env: "development"
[09:43] INFO: ≡ƒòÆ Scheduler Tick
    env: "development"
[09:43] INFO: ≡ƒòÆ Scheduler Tick
    env: "development"
[ActuatorSet] ✔️ Pulsed 'DOSE' for 50.00s
✅ DEBUG LISTENER: automation:block_end received! generic_1767425696340
✅ DEBUG LISTENER: automation:block_end received! end
✅ DEBUG LISTENER: automation:block_end received! start
[2026-01-03 09:43:16.332 +0200] INFO: ≡ƒöö NotificationService: Received Block Event with Config
    env: "development"
    blockId: "generic_1767425696340"
    config: {
      "channelId": "",
      "mode": "AUTO",
      "config": {
        "strategy": "volumetric_flow",
        "durationUnit": "sec",
        "amountMode": "DOSES",
        "amountUnit": "gal",
        "retryCount": 3,
        "retryDelay": 1000,
        "onFailure": "STOP",
        "errorNotification": false,
        "notificationChannelId": "",
        "notificationMode": "AUTO",
        "revertOnStop": true,
        "label": "Set Actuator",
        "hasError": false,
        "deviceId": "695777fd963d1a2f7f7b8b0c",
        "action": "DOSE",
        "amount": "{{global_1}}"
      }
    }
[2026-01-03 09:43:16.332 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "generic_1767425696340"
    edgeFound: true
    nextBlockId: "end"
[2026-01-03 09:43:16.333 +0200] INFO: ≡ƒöö NotificationService: Received Block Event with Config
    env: "development"
    blockId: "end"
    config: {
      "config": {
        "label": "End",
        "hasError": false
      }
    }
[2026-01-03 09:43:16.339 +0200] INFO: Γ£à Cycle Step Completed
    env: "development"
    cycleId: "tr_1767397178624_2yt9vuv55"
    step: 0
[2026-01-03 09:43:16.339 +0200] INFO: Γû╢∩╕Å Executing Cycle Step
    env: "development"
    step: 1
    flowId: "test_temp"
[2026-01-03 09:43:16.339 +0200] INFO: ≡ƒöº Cycle Step Overrides Resolution
    env: "development"
    step: 1
    sessionOverrides: {
      "╨ö╨╛╨╖╨╕": 5,
      "cycleName": "Trigger: tr_1767397178624_2yt9vuv55"
    }
    finalOverrides: {
      "╨ö╨╛╨╖╨╕": 5,
      "cycleName": "Trigger: tr_1767397178624_2yt9vuv55",
      "_parentCycleSessionId": "6958c85bdd7288981cf628d2"
    }
[2026-01-03 09:43:16.339 +0200] INFO: Γ£¿ AutomationEngine Actor Initialized/Reset (Session: none)
    env: "development"
[2026-01-03 09:43:16.345 +0200] INFO: ≡ƒº⌐ AutomationEngine: Input Resolution
    env: "development"
    overrides: {
      "╨ö╨╛╨╖╨╕": 5,
      "cycleName": "Trigger: tr_1767397178624_2yt9vuv55",
      "_parentCycleSessionId": "6958c85bdd7288981cf628d2"
    }
    variablesResolved: {}
[2026-01-03 09:43:16.347 +0200] INFO: ≡ƒôÑ Loading Program Session
    env: "development"
    sessionId: "6958c894dd7288981cf6291e"
    programId: "test_temp"
    variables: {
      "_parentCycleSessionId": "6958c85bdd7288981cf628d2"
    }
[2026-01-03 09:43:16.349 +0200] INFO: ≡ƒô¿ Sending Notification: "≡ƒ¢æ Program Stopped"
    env: "development"
    provider: "Telegram"
    type: "telegram"
[2026-01-03 09:43:16.352 +0200] INFO: ≡ƒöö NotificationService: Received Block Event with Config
    env: "development"
    blockId: "start"
    config: {
      "config": {
        "label": "Start",
        "hasError": false
      }
    }
[2026-01-03 09:43:16.352 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "start"
    edgeFound: true
    nextBlockId: "SENSOR_READ_1767397080404"
[2026-01-03 09:43:16.361 +0200] INFO: ≡ƒô¿ Sending Notification: "≡ƒÜÇ Program Started"
    env: "development"
    provider: "Telegram"
    type: "telegram"
[SensorRead] ✔️ Saved to 'var_1': 21.94 C
✅ DEBUG LISTENER: automation:block_end received! SENSOR_READ_1767397080404
✅ DEBUG LISTENER: automation:block_end received! end
[2026-01-03 09:43:17.343 +0200] INFO: ≡ƒöö NotificationService: Received Block Event with Config
    env: "development"
    blockId: "SENSOR_READ_1767397080404"
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
        "label": "Read Sensor",
        "hasError": false,
        "deviceId": "6956ca27859163d2d9dd770c",
        "variable": "var_1"
      }
    }
[2026-01-03 09:43:17.344 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "SENSOR_READ_1767397080404"
    edgeFound: true
    nextBlockId: "end"
[2026-01-03 09:43:17.344 +0200] INFO: ≡ƒöö NotificationService: Received Block Event with Config
    env: "development"
    blockId: "end"
    config: {
      "config": {
        "label": "End",
        "hasError": false
      }
    }
[2026-01-03 09:43:17.349 +0200] INFO: Γ£à Cycle Step Completed
    env: "development"
    cycleId: "tr_1767397178624_2yt9vuv55"
    step: 1
[2026-01-03 09:43:17.349 +0200] INFO: ≡ƒÅü Cycle Completed Successfully
    env: "development"
    sessionId: "6958c85bdd7288981cf628d2"
[2026-01-03 09:43:17.357 +0200] INFO: ≡ƒô¿ Sending Notification: "≡ƒ¢æ Program Stopped"
    env: "development"
    provider: "Telegram"
    type: "telegram"
[2026-01-03 09:43:17.360 +0200] INFO: ≡ƒô¿ Sending Notification: "Γä╣∩╕Å Event: CYCLE_COMPLETE"
    env: "development"
    provider: "Telegram"
    type: "telegram"
[09:43] INFO: ≡ƒòÆ Scheduler Tick
    env: "development"
[2026-01-03 09:43:20.008 +0200] INFO: ≡ƒöì Debug: Scheduler detecting flow finish
    env: "development"
    windowId: "tw_1767397161163_4sw62wba9"
    currentSessionId: "6958c85bdd7288981cf628d2"
    snapshotStatus: "completed"
    isSessionMismatch: false
    isStatusFinished: true
[2026-01-03 09:43:20.008 +0200] INFO: Γ£à Trigger flow finished
    env: "development"
    windowId: "tw_1767397161163_4sw62wba9"
    sessionId: "6958c85bdd7288981cf628d2"
[2026-01-03 09:43:20.008 +0200] INFO: ≡ƒ¢æ BREAK trigger finished - closing window
    env: "development"
    windowId: "tw_1767397161163_4sw62wba9"
[2026-01-03 09:43:20.010 +0200] INFO: ≡ƒÅü All windows completed - Advanced Program finished for today
    env: "development"
[09:43] INFO: ≡ƒòÆ Scheduler Tick
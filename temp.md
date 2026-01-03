Това е от "Лог на изпълнение":

02:17:15
✓ end: Total Time: 0m 0.9s
02:22:00
Прозорец "Прозорец 1" - Активен
02:22:00
📊 Ultrasonic = 38.8 → > 100 ✗
02:23:10
📊 Ultrasonic = 188.4 → ⚡ > 100 ✓
02:23:10
✓ start
02:23:20
Прозорец "Прозорец 1" - Завършен чрез тригер
02:23:20
🏁 Програмата завърши за днес
02:23:23
✓ ACTUATOR: Dosed 10doses
02:23:23
✓ end: Total Time: 0m 13.3s
02:23:23
✓ start
02:23:24
✓ SENSOR: Read 20.19 C
02:23:24
✓ end: Total Time: 0m 0.9s


това е от лога на backend-a:
[2026-01-03 02:22:00.018 +0200] INFO: ≡ƒöä Evaluating triggers for window
    env: "development"
    windowId: "tw_1767397161163_4sw62wba9"
    windowName: "╨ƒ╤Ç╨╛╨╖╨╛╤Ç╨╡╤å 1"
[2026-01-03 02:22:00.095 +0200] INFO: ≡ƒöî [UdpTransport] Initializing...
    env: "development"
    ip: "192.168.0.43"
    port: 8888
[2026-01-03 02:22:00.096 +0200] INFO: Γ£à [UdpTransport] Listening
    env: "development"
    address: {
      "address": "0.0.0.0",
      "family": "IPv4",
      "port": 61495
    }
[02:22] INFO: ≡ƒòÆ Scheduler Tick
    env: "development"
[02:22] INFO: ≡ƒòÆ Scheduler Tick
    env: "development"
[02:22] INFO: ≡ƒòÆ Scheduler Tick
    env: "development"
[02:22] INFO: ≡ƒòÆ Scheduler Tick
    env: "development"
[02:22] INFO: ≡ƒòÆ Scheduler Tick
    env: "development"
[02:23] INFO: ≡ƒòÆ Scheduler Tick
    env: "development"
✅ DEBUG LISTENER: automation:block_end received! start
[ActuatorSet] 💧 Dose conversion: 10 doses × 5ml = 50ml
[ActuatorSet] ⏳ Starting Dose: 10doses (~12.5s)...
[02:23] INFO: ≡ƒòÆ Scheduler Tick
    env: "development"
[2026-01-03 02:23:10.017 +0200] INFO: ≡ƒöä Evaluating triggers for window
    env: "development"
    windowId: "tw_1767397161163_4sw62wba9"
    windowName: "╨ƒ╤Ç╨╛╨╖╨╛╤Ç╨╡╤å 1"
[2026-01-03 02:23:10.267 +0200] INFO: ΓÜí Trigger condition matched - executing flow(s)
    env: "development"
    triggerId: "tr_1767397178624_2yt9vuv55"
    flowIds: [
      "dose_test",
      "test_temp"
    ]
    flowId: "dose_test"
    behavior: "break"
[2026-01-03 02:23:10.270 +0200] INFO: ≡ƒÜÇ Starting Cycle (Trace Overrides)
    env: "development"
    cycleId: "tr_1767397178624_2yt9vuv55"
    cycleName: "Trigger: tr_1767397178624_2yt9vuv55"
    sessionId: "6958616e13cd47eb0ca8dff9"
    stepsCount: 2
    overrides: {
      "╨ö╨╛╨╖╨╕": 10
    }
[2026-01-03 02:23:10.270 +0200] INFO: Γû╢∩╕Å Executing Cycle Step
    env: "development"
    step: 0
    flowId: "dose_test"
[2026-01-03 02:23:10.270 +0200] INFO: ≡ƒöº Cycle Step Overrides Resolution
    env: "development"
    step: 0
    sessionOverrides: {
      "╨ö╨╛╨╖╨╕": 10,
      "cycleName": "Trigger: tr_1767397178624_2yt9vuv55"
    }
    finalOverrides: {
      "╨ö╨╛╨╖╨╕": 10,
      "cycleName": "Trigger: tr_1767397178624_2yt9vuv55",
      "_parentCycleSessionId": "6958616e13cd47eb0ca8dff9"
    }
[2026-01-03 02:23:10.271 +0200] INFO: Γ£¿ AutomationEngine Actor Initialized/Reset (Session: none)
    env: "development"
[2026-01-03 02:23:10.279 +0200] INFO: ≡ƒº⌐ AutomationEngine: Input Resolution
    env: "development"
    overrides: {
      "╨ö╨╛╨╖╨╕": 10,
      "cycleName": "Trigger: tr_1767397178624_2yt9vuv55",
      "_parentCycleSessionId": "6958616e13cd47eb0ca8dff9"
    }
    variablesResolved: {}
[2026-01-03 02:23:10.280 +0200] INFO: ≡ƒôÑ Loading Program Session
    env: "development"
    sessionId: "6958616e13cd47eb0ca8e000"
    programId: "dose_test"
    variables: {
      "global_1": 10,
      "╨ö╨╛╨╖╨╕": 10
    }
[2026-01-03 02:23:10.287 +0200] INFO: ≡ƒöö NotificationService: Received Block Event with Config
    env: "development"
    blockId: "start"
    config: {
      "config": {
        "label": "Start",
        "hasError": false
      }
    }
[2026-01-03 02:23:10.287 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "start"
    edgeFound: true
    nextBlockId: "ACTUATOR_SET_1767385185450"
[2026-01-03 02:23:10.291 +0200] INFO: ≡ƒÜÇ Trigger flow(s) started - waiting for completion
    env: "development"
    windowId: "tw_1767397161163_4sw62wba9"
    triggerId: "tr_1767397178624_2yt9vuv55"
    flowSessionId: "6958616e13cd47eb0ca8dff9"
    stepsCount: 2
[2026-01-03 02:23:10.307 +0200] INFO: ≡ƒô¿ Sending Notification: "Γä╣∩╕Å Event: CYCLE_START"
    env: "development"
    provider: "Telegram"
    type: "telegram"
[2026-01-03 02:23:10.308 +0200] INFO: ≡ƒô¿ Sending Notification: "≡ƒÜÇ Program Started"
    env: "development"
    provider: "Telegram"
    type: "telegram"
[2026-01-03 02:23:10.318 +0200] INFO: ≡ƒöî [UdpTransport] Initializing...
    env: "development"
    ip: "192.168.0.44"
    port: 8888
[2026-01-03 02:23:10.318 +0200] INFO: Γ£à [UdpTransport] Listening
    env: "development"
    address: {
      "address": "0.0.0.0",
      "family": "IPv4",
      "port": 49475
    }
[02:23] INFO: ≡ƒòÆ Scheduler Tick
    env: "development"
[2026-01-03 02:23:20.017 +0200] INFO: ≡ƒöì Debug: Scheduler detecting flow finish
    env: "development"
    windowId: "tw_1767397161163_4sw62wba9"
    currentSessionId: "6958616e13cd47eb0ca8dff9"
    snapshotStatus: "running"
    isSessionMismatch: true
    isStatusFinished: false
[2026-01-03 02:23:20.017 +0200] INFO: Γ£à Trigger flow finished
    env: "development"
    windowId: "tw_1767397161163_4sw62wba9"
    sessionId: "6958616e13cd47eb0ca8dff9"
[2026-01-03 02:23:20.017 +0200] INFO: ≡ƒ¢æ BREAK trigger finished - closing window
    env: "development"
    windowId: "tw_1767397161163_4sw62wba9"
[2026-01-03 02:23:20.019 +0200] INFO: ≡ƒÅü All windows completed - Advanced Program finished for today
    env: "development"
[ActuatorSet] ✔️ Pulsed 'DOSE' for 12.50s
✅ DEBUG LISTENER: automation:block_end received! ACTUATOR_SET_1767385185450
✅ DEBUG LISTENER: automation:block_end received! end
✅ DEBUG LISTENER: automation:block_end received! start
[2026-01-03 02:23:23.574 +0200] INFO: ≡ƒöö NotificationService: Received Block Event with Config
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
[2026-01-03 02:23:23.575 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "ACTUATOR_SET_1767385185450"
    edgeFound: true
    nextBlockId: "end"
[2026-01-03 02:23:23.575 +0200] INFO: ≡ƒöö NotificationService: Received Block Event with Config
    env: "development"
    blockId: "end"
    config: {
      "config": {
        "label": "End",
        "hasError": false
      }
    }
[2026-01-03 02:23:23.579 +0200] INFO: Γ£à Cycle Step Completed
    env: "development"
    cycleId: "tr_1767397178624_2yt9vuv55"
    step: 0
[2026-01-03 02:23:23.579 +0200] INFO: Γû╢∩╕Å Executing Cycle Step
    env: "development"
    step: 1
    flowId: "test_temp"
[2026-01-03 02:23:23.579 +0200] INFO: ≡ƒöº Cycle Step Overrides Resolution
    env: "development"
    step: 1
    sessionOverrides: {
      "╨ö╨╛╨╖╨╕": 10,
      "cycleName": "Trigger: tr_1767397178624_2yt9vuv55"
    }
    finalOverrides: {
      "╨ö╨╛╨╖╨╕": 10,
      "cycleName": "Trigger: tr_1767397178624_2yt9vuv55",
      "_parentCycleSessionId": "6958616e13cd47eb0ca8dff9"
    }
[2026-01-03 02:23:23.579 +0200] INFO: Γ£¿ AutomationEngine Actor Initialized/Reset (Session: none)
    env: "development"
[2026-01-03 02:23:23.582 +0200] INFO: ≡ƒº⌐ AutomationEngine: Input Resolution
    env: "development"
    overrides: {
      "╨ö╨╛╨╖╨╕": 10,
      "cycleName": "Trigger: tr_1767397178624_2yt9vuv55",
      "_parentCycleSessionId": "6958616e13cd47eb0ca8dff9"
    }
    variablesResolved: {}
[2026-01-03 02:23:23.584 +0200] INFO: ≡ƒôÑ Loading Program Session
    env: "development"
    sessionId: "6958617b13cd47eb0ca8e029"
    programId: "test_temp"
    variables: {}
[2026-01-03 02:23:23.588 +0200] INFO: ≡ƒöö NotificationService: Received Block Event with Config
    env: "development"
    blockId: "start"
    config: {
      "config": {
        "label": "Start",
        "hasError": false
      }
    }
[2026-01-03 02:23:23.589 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "start"
    edgeFound: true
    nextBlockId: "SENSOR_READ_1767397080404"
[2026-01-03 02:23:23.592 +0200] INFO: ≡ƒô¿ Sending Notification: "≡ƒ¢æ Program Stopped"
    env: "development"
    provider: "Telegram"
    type: "telegram"
[2026-01-03 02:23:23.600 +0200] INFO: ≡ƒô¿ Sending Notification: "≡ƒÜÇ Program Started"
    env: "development"
    provider: "Telegram"
    type: "telegram"
[SensorRead] ✔️ Saved to 'var_1': 20.19 C
✅ DEBUG LISTENER: automation:block_end received! SENSOR_READ_1767397080404
✅ DEBUG LISTENER: automation:block_end received! end
[2026-01-03 02:23:24.499 +0200] INFO: ≡ƒöö NotificationService: Received Block Event with Config
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
[2026-01-03 02:23:24.500 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "SENSOR_READ_1767397080404"
    edgeFound: true
    nextBlockId: "end"
[2026-01-03 02:23:24.500 +0200] INFO: ≡ƒöö NotificationService: Received Block Event with Config
    env: "development"
    blockId: "end"
    config: {
      "config": {
        "label": "End",
        "hasError": false
      }
    }
[2026-01-03 02:23:24.504 +0200] INFO: Γ£à Cycle Step Completed
    env: "development"
    cycleId: "tr_1767397178624_2yt9vuv55"
    step: 1
[2026-01-03 02:23:24.504 +0200] INFO: ≡ƒÅü Cycle Completed Successfully
    env: "development"
    sessionId: "6958616e13cd47eb0ca8dff9"
[2026-01-03 02:23:24.508 +0200] INFO: ≡ƒô¿ Sending Notification: "≡ƒ¢æ Program Stopped"
    env: "development"
    provider: "Telegram"
    type: "telegram"
[2026-01-03 02:23:24.512 +0200] INFO: ≡ƒô¿ Sending Notification: "Γä╣∩╕Å Event: CYCLE_COMPLETE"
    env: "development"
    provider: "Telegram"
    type: "telegram"
[02:23] INFO: ≡ƒòÆ Scheduler Tick
    env: "development"
[02:23] INFO: ≡ƒòÆ Scheduler Tick
    env: "development"
[02:23] INFO: ≡ƒòÆ Scheduler Tick
    env: "development"
[02:24] INFO: ≡ƒòÆ Scheduler Tick
    env: "development"
История на изпълнението
Днес


18:48:10
Програмата стартира

18:48:10
Прозорец "Прозорец 1" стартира

18:51:40
Тригер: Ultrasonic (206.2) > 300 - не съвпадна

18:52:00
Стартиран поток: pH

18:52:00
📊 Сензор рН: Read 1.17 pH

18:52:00
❓ Условие 1: 1.17 == [6–8] => FALSE

18:52:00
❓ Условие 2: 1.17 < [6–8] => TRUE

18:52:00
🔄 Цикъл Ниско: Iteration 1: 1.17 < [6–8] => TRUE (Continuing)

18:52:18
⚡ Помпа pH+: Dosed 15doses

18:52:22
❌ Set Actuator: ERR_MISSING_PARAMETER

18:52:30
Прозорец "Прозорец 1" завърши (Изтекло време)

11 събития


✅ DEBUG LISTENER: automation:block_end received! IF_1767341895819
[LoopBlock Debug] Block: LOOP_1767341931585 | Interval: 1s (from 1 sec) | Iteration: 1 | Mode: COUNT
✅ DEBUG LISTENER: automation:block_end received! LOOP_1767341931585
[ActuatorSet] 💧 Dose conversion: 15 doses × 1ml = 15ml
[ActuatorSet] ⏳ Starting Dose: 15doses (~17.3s)...
[18:52] INFO: ≡ƒòÆ Scheduler Tick
    env: "development"
[2026-01-04 18:52:00.013 +0200] INFO: ΓÅ░ Window time expired - checking fallback
    env: "development"
    windowId: "tw_1767397161163_4sw62wba9"
[2026-01-04 18:52:00.013 +0200] INFO: ≡ƒ¢í∩╕Å Executing fallback flow(s)
    env: "development"
    windowId: "tw_1767397161163_4sw62wba9"
    fallbackFlowId: "ph"
    fallbackFlowIds: [
      "ph"
    ]
[2026-01-04 18:52:00.017 +0200] INFO: ≡ƒÜÇ Starting Cycle (Trace Overrides)
    env: "development"
    cycleId: "fallback-tw_1767397161163_4sw62wba9"
    cycleName: "Fallback: ╨ƒ╤Ç╨╛╨╖╨╛╤Ç╨╡╤å 1"
    sessionId: "695a9ab0d33d7a152a558b14"
    stepsCount: 1
    overrides: {
      "╤Ç╨░╨╖╤ü╤é╨╛╨╡╨╜╨╕╨╡": 150,
      "╤Ç╨░╨╖╤ü╤é╨╛╨╡╨╜╨╕╨╡_tolerance": 10,
      "╨ö╨╛╨╖╨╕": 15,
      "╤Ç╨¥ ╨û╨╡╨╗╨░╨╜╨╛": 7,
      "╤Ç╨¥ ╨û╨╡╨╗╨░╨╜╨╛_tolerance": 1,
      "╤Ç╨¥ ╨ö╨╛╨╖╨░": 15,
      "activeProgramId": "prog_test_advansed"
    }
[2026-01-04 18:52:00.017 +0200] INFO: Γû╢∩╕Å Executing Cycle Step
    env: "development"
    step: 0
    flowId: "ph"
[2026-01-04 18:52:00.017 +0200] INFO: ≡ƒöº Cycle Step Overrides Resolution
    env: "development"
    step: 0
    sessionOverrides: {
      "╤Ç╨░╨╖╤ü╤é╨╛╨╡╨╜╨╕╨╡": 150,
      "╤Ç╨░╨╖╤ü╤é╨╛╨╡╨╜╨╕╨╡_tolerance": 10,
      "╨ö╨╛╨╖╨╕": 15,
      "╤Ç╨¥ ╨û╨╡╨╗╨░╨╜╨╛": 7,
      "╤Ç╨¥ ╨û╨╡╨╗╨░╨╜╨╛_tolerance": 1,
      "╤Ç╨¥ ╨ö╨╛╨╖╨░": 15,
      "activeProgramId": "prog_test_advansed",
      "cycleName": "Fallback: ╨ƒ╤Ç╨╛╨╖╨╛╤Ç╨╡╤å 1"
    }
    finalOverrides: {
      "╤Ç╨░╨╖╤ü╤é╨╛╨╡╨╜╨╕╨╡": 150,
      "╤Ç╨░╨╖╤ü╤é╨╛╨╡╨╜╨╕╨╡_tolerance": 10,
      "╨ö╨╛╨╖╨╕": 15,
      "╤Ç╨¥ ╨û╨╡╨╗╨░╨╜╨╛": 7,
      "╤Ç╨¥ ╨û╨╡╨╗╨░╨╜╨╛_tolerance": 1,
      "╤Ç╨¥ ╨ö╨╛╨╖╨░": 15,
      "activeProgramId": "prog_test_advansed",
      "cycleName": "Fallback: ╨ƒ╤Ç╨╛╨╖╨╛╤Ç╨╡╤å 1",
      "_parentCycleSessionId": "695a9ab0d33d7a152a558b14"
    }
[2026-01-04 18:52:00.018 +0200] INFO: Γ£¿ AutomationEngine Actor Initialized/Reset (Session: none)
    env: "development"
[2026-01-04 18:52:00.021 +0200] INFO: ≡ƒº⌐ AutomationEngine: Input Resolution
    env: "development"
    overrides: {
      "╤Ç╨░╨╖╤ü╤é╨╛╨╡╨╜╨╕╨╡": 150,
      "╤Ç╨░╨╖╤ü╤é╨╛╨╡╨╜╨╕╨╡_tolerance": 10,
      "╨ö╨╛╨╖╨╕": 15,
      "╤Ç╨¥ ╨û╨╡╨╗╨░╨╜╨╛": 7,
      "╤Ç╨¥ ╨û╨╡╨╗╨░╨╜╨╛_tolerance": 1,
      "╤Ç╨¥ ╨ö╨╛╨╖╨░": 15,
      "activeProgramId": "prog_test_advansed",
      "cycleName": "Fallback: ╨ƒ╤Ç╨╛╨╖╨╛╤Ç╨╡╤å 1",
      "_parentCycleSessionId": "695a9ab0d33d7a152a558b14"
    }
    variablesResolved: {}
[2026-01-04 18:52:00.022 +0200] INFO: ≡ƒôÑ Loading Program Session
    env: "development"
    sessionId: "695a9ab0d33d7a152a558b1b"
    programId: "ph"
    variables: {
      "global_2": 7,
      "╤Ç╨¥ ╨û╨╡╨╗╨░╨╜╨╛": 7,
      "╤Ç╨¥ ╨û╨╡╨╗╨░╨╜╨╛_tolerance": 1,
      "global_2_tolerance": 1,
      "global_3": 15,
      "╤Ç╨¥ ╨ö╨╛╨╖╨░": 15,
      "_parentCycleSessionId": "695a9ab0d33d7a152a558b14"
    }
[2026-01-04 18:52:00.027 +0200] INFO: ≡ƒöö NotificationService: Received Block Event with Config
    env: "development"
    blockId: "start"
    config: {
      "config": {
        "label": "Start",
        "hasError": false
      }
    }
[2026-01-04 18:52:00.027 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "start"
    edgeFound: true
    nextBlockId: "SENSOR_READ_1767341830216"
[2026-01-04 18:52:00.028 +0200] INFO: ≡ƒ¢í∩╕Å Fallback started
    env: "development"
    flowSessionId: "695a9ab0d33d7a152a558b14"
[2026-01-04 18:52:00.044 +0200] INFO: ≡ƒô¿ Sending Notification: "≡ƒÜÇ Program Started"
    env: "development"
    provider: "Telegram"
    type: "telegram"
[2026-01-04 18:52:00.046 +0200] WARN: ΓÜá∩╕Å [ContextResolver] Stale Temp Data. Polling...
    env: "development"
    deviceId: "6956ca03859163d2d9dd76c5"
    extDev: "Temp18"
    age: 26099093
[2026-01-04 18:52:00.047 +0200] INFO: ≡ƒô¿ Sending Notification: "Γä╣∩╕Å Event: CYCLE_START"
    env: "development"
    provider: "Telegram"
    type: "telegram"
[2026-01-04 18:52:00.052 +0200] INFO: ≡ƒôñ [UdpTransport] Sending Raw Message
    env: "development"
    ip: "192.168.0.43"
    port: 8888
    message: "ONEWIRE_READ_TEMP|7"
[2026-01-04 18:52:00.244 +0200] ERROR: Γ¥î [ContextResolver] Active Poll Failed. Using Default.
    env: "development"
    deviceId: "6956ca03859163d2d9dd76c5"
    err: {
      "type": "Error",
      "message": "ERR_MISSING_PARAMETER",
      "stack":
          Error: ERR_MISSING_PARAMETER
              at HardwareTransportManager.handleMessage (C:\Projects\Hydroponics_v5\backend\src\modules\hardware\HardwareTransportManager.ts:134:28)
              at UdpTransport.messageHandler (C:\Projects\Hydroponics_v5\backend\src\modules\hardware\HardwareTransportManager.ts:77:43)
              at UdpTransport.handleData (C:\Projects\Hydroponics_v5\backend\src\modules\hardware\transports\UdpTransport.ts:206:26)
              at Socket.<anonymous> (C:\Projects\Hydroponics_v5\backend\src\modules\hardware\transports\UdpTransport.ts:50:26)
              at Socket.emit (node:events:508:28)
              at UDP.onMessage (node:dgram:992:8)
    }
[2026-01-04 18:52:00.250 +0200] INFO: ≡ƒôñ [UdpTransport] Sending Raw Message
    env: "development"
    ip: "192.168.0.43"
    port: 8888
    message: "ANALOG|17"
[2026-01-04 18:52:00.305 +0200] INFO: ≡ƒöö AutomationEngine: Prepared Notification Payload
    env: "development"
    blockId: "SENSOR_READ_1767341830216"
    channel: "69547be6c1bd3b33817c39c6"
    mode: "ALWAYS"
[2026-01-04 18:52:00.305 +0200] INFO: ≡ƒöö NotificationService: Received Block Event with Config
    env: "development"
    blockId: "SENSOR_READ_1767341830216"
    config: {
      "channelId": "69547be6c1bd3b33817c39c6",
      "mode": "ALWAYS",
      "config": {
        "readingType": "ph_smart",
        "retryCount": 3,
        "retryDelay": 1000,
        "onFailure": "STOP",
        "errorNotification": false,
        "notificationChannelId": "69547be6c1bd3b33817c39c6",
        "notificationMode": "ALWAYS",
        "label": "╨í╨╡╨╜╨╖╨╛╤Ç ╤Ç╨¥",
        "hasError": false,
        "deviceId": "6956ca03859163d2d9dd76c5",
        "variable": "var_1",
        "comment": "╨í╨╡╨╜╨╖╨╛╤Ç╨░ ╨╕╨╖╨╝╨╡╤Ç╨░ ╤é╨╡╨║╤â╤ë╨╛╤é╨╛ ╨╜╨╕╨▓╨╛ ╨╜╨░ ╤Ç╨¥"
      }
    }
[2026-01-04 18:52:00.306 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "SENSOR_READ_1767341830216"
    edgeFound: true
    nextBlockId: "condition_1767342192686"
[2026-01-04 18:52:00.307 +0200] INFO: ≡ƒöö AutomationEngine: Prepared Notification Payload
    env: "development"
    blockId: "condition_1767342192686"
    channel: "69547be6c1bd3b33817c39c6"
    mode: "ALWAYS"
[2026-01-04 18:52:00.307 +0200] INFO: ≡ƒöö NotificationService: Received Block Event with Config
    env: "development"
    blockId: "condition_1767342192686"
    config: {
      "channelId": "69547be6c1bd3b33817c39c6",
      "mode": "ALWAYS",
      "config": {
        "operator": "==",
        "onFailure": "STOP",
        "errorNotification": false,
        "notificationChannelId": "69547be6c1bd3b33817c39c6",
        "notificationMode": "ALWAYS",
        "label": "╨ú╤ü╨╗╨╛╨▓╨╕╨╡ 1",
        "hasError": false,
        "variable": "var_1",
        "value": "{{global_2}}",
        "comment": "╨ƒ╤Ç╨╛╨▓╨╡╤Ç╤Å╨▓╨░ ╨┤╨░╨╗╨╕ ╨╜╨╕╨▓╤é╨╛ ╨╜╨░ ╤Ç╨¥ ╨╡ = ╨╜╨░ ╨╢╨╡╨╗╨░╨╜╨╛╤é╨╛. ╨É╨║╨╛ ╨╡ =, ╤é╨╛ ╨┐╤Ç╨╡╨║╤è╤ü╨▓╨░ ╨┐╨╛╤é╨╛╨║╨░, ╨░ ╨░╨║╨╛ ╨╜╨╡ ╨╡ ╨┐╤Ç╨╛╨┤╤è╨╗╨╢╨░╨▓╨░ ╤ü╤è╤ü ╤ü╨╗╨╡╨┤╨▓╨░╤ë╨░ ╨┐╤Ç╨╛╨▓╨╡╤Ç╨║╨░"
      }
    }
[2026-01-04 18:52:00.307 +0200] INFO: Γ¥ô IF Block Navigation Trace
    env: "development"
    blockId: "condition_1767342192686"
    result: false
    expectedHandle: "false"
    nextBlockId: "IF_1767341895819"
[2026-01-04 18:52:00.309 +0200] INFO: ≡ƒöö AutomationEngine: Prepared Notification Payload
    env: "development"
    blockId: "IF_1767341895819"
    channel: "69547be6c1bd3b33817c39c6"
    mode: "ALWAYS"
[2026-01-04 18:52:00.309 +0200] INFO: ≡ƒöö NotificationService: Received Block Event with Config
    env: "development"
    blockId: "IF_1767341895819"
    config: {
      "channelId": "69547be6c1bd3b33817c39c6",
      "mode": "ALWAYS",
      "config": {
        "operator": "<",
        "onFailure": "STOP",
        "errorNotification": false,
        "notificationChannelId": "69547be6c1bd3b33817c39c6",
        "notificationMode": "ALWAYS",
        "label": "╨ú╤ü╨╗╨╛╨▓╨╕╨╡ 2",
        "hasError": false,
        "variable": "var_1",
        "value": "{{global_2}}",
        "comment": "╨ó╨╛╨▓╨░ ╤â╤ü╨╗╨╛╨▓╨╕╨╡ ╨┐╤Ç╨╛╨▓╨╡╤Ç╤Å╨▓╨░ ╨┤╨░╨╗╨╕ ╨╜╨╕╨▓╨╛╤é╨╛ ╨╜╨░ ╤Ç╨¥ ╨╡ ╨┐╨╛╨┤ ╨╕╨╗╨╕ ╨╜╨░╨┤ ╨╢╨╡╨╗╨░╨╜╨╛╤é╨╛ ╨╜╨╕╨▓╨╛ ╨╕ ╨▓ ╨╖╨░╨▓╨╕╤ü╨╕╨╝╨╛╤ü╤é ╨╛╤é ╤Ç╨╡╨╖╤â╨╗╤é╨░╤é╨░ ╨╜╨░╤ü╨╛╤ç╨▓╨░ ╨┐╨╛╤é╨╛╨║╨░ ╨▓ ╤Ç╨░╨╖╨╗╨╕╨╜╨╕ ╤ü╤é╤Ç╨░╨╜╨╕."
      }
    }
[2026-01-04 18:52:00.309 +0200] INFO: Γ¥ô IF Block Navigation Trace
    env: "development"
    blockId: "IF_1767341895819"
    result: true
    expectedHandle: "true"
    nextBlockId: "LOOP_1767341931585"
[2026-01-04 18:52:00.310 +0200] INFO: ≡ƒöö AutomationEngine: Prepared Notification Payload
    env: "development"
    blockId: "LOOP_1767341931585"
    channel: "69547be6c1bd3b33817c39c6"
    mode: "ALWAYS"
[2026-01-04 18:52:00.310 +0200] INFO: ≡ƒöö NotificationService: Received Block Event with Config
    env: "development"
    blockId: "LOOP_1767341931585"
    config: {
      "channelId": "69547be6c1bd3b33817c39c6",
      "mode": "ALWAYS",
      "config": {
        "limitMode": "COUNT",
        "interval": 1,
        "intervalUnit": "sec",
        "count": 3,
        "timeout": 60,
        "timeoutUnit": "sec",
        "operator": "<",
        "onFailure": "STOP",
        "errorNotification": false,
        "notificationChannelId": "69547be6c1bd3b33817c39c6",
        "notificationMode": "ALWAYS",
        "label": "╨ª╨╕╨║╤è╨╗ ╨¥╨╕╤ü╨║╨╛",
        "hasError": false,
        "variable": "var_1",
        "value": "{{global_2}}",
        "comment": "╨ó╨╛╨▓╨░ ╨╡ ╤å╨╕╨║╤è╨╗ ╨░╨║╨╛ ╨╜╨╕╤é╨╛╨▓╨╛ ╨╜╨░ ╤Ç╨¥ ╨╡ ╨┐╨╛ ╨╜╨╕╤ü╨║╨╛ ╨╛╤é ╨╢╨╡╨╗╨░╨╜╨╛╤é╨╛, ╨▓ ╨║╨╛╨╣╤é╨╛ ╤å╨╕╨║╤è╨╗ ╤ü╨╡ ╨░╨║╤é╨╕╨▓╨╕╤Ç╨░ ╨┐╨╛╨╝╨┐╨░╤é╨░ ╨╖╨░ ╨┤╨╛╨╗╨╕╨▓╨░╨╜ ╨╜╨╡ ╤Ç╨¥+, ╤ü╨╗╨╡╨┤ ╤é╨╛╨▓╨░ ╤ü╨╡ ╨░╨║╤é╨╕╨▓╨╕╤Ç╨░ ╨┐╨╛╨╝╨┐╨░ ╨╖╨░ ╤Ç╨░╨╖╨▒╤è╤Ç╨║╨▓╨░╨╜╨╡ ╨╜╨░ ╤Ç╨░╨╖╤é╨▓╨╛╤Ç╨░ ╨╕ ╨╜╨░╨║╤Ç╨░╤Å ╤ü╨╡ ╨╕╨╖╨╝╨╡╤Ç╨▓╨░ ╨╜╨╛╨▓╨╛╤é╨╛ ╨╜╨╕╨▓╨╛ ╨╜╨░ ╤Ç╨¥. ╨ó╨╛╨╖╨╕ ╤å╨╕╨║╤è╨╗ ╤ü╨╡ ╨┐╨╛╨▓╤é╨░╤Ç╤Å ╨┤╨╛╨║╨░╤é╨╛ ╨╜╨╡ ╤ü╨╡ ╨┤╨╛╤ü╤é╨╕╨│╨╜╨╡ ╨╢╨╡╨╗╨░╨╜╨╛╤é╨╛ ╨╜╨╕╨▓╨╛ ╨╜╨░ ╤Ç╨¥.\n╨ª╨╕╨║╤è╨╗╨░ ╨╡ ╨╜╨░╤ü╤é╤Ç╨╛╨╡╨╜ ╨╜╨░ 10 ╨╕╤é╨╡╤Ç╨░╤å╨╕╨╕ (╨╛╨┐╨╕╤é╨░) ╨╕ ╨┐╤Ç╨╕ ╨┤╨╛╤ü╤é╨╕╨│╨░╨╜╨╡╤é╨╛ ╨╕╨╝ ╨╕╨╖╨╗╨╕╨╖╨░ ╨╛╤é ╤å╨╕╨║╤è╨╗╨░"
      }
    }
[2026-01-04 18:52:00.324 +0200] INFO: ≡ƒô¿ Sending Notification: "Γ£à Block Executed (SENSOR_READ_1767341830216)
Summary: Read 1.17 pH"
    env: "development"
    provider: "Telegram"
    type: "telegram"
[2026-01-04 18:52:00.324 +0200] INFO: ≡ƒô¿ Sending Notification: "Γ£à Block Executed (condition_1767342192686)
Summary: 1.17 == [6ΓÇô8] => FALSE"
    env: "development"
    provider: "Telegram"
    type: "telegram"
[2026-01-04 18:52:00.325 +0200] INFO: ≡ƒô¿ Sending Notification: "Γ£à Block Executed (IF_1767341895819)
Summary: 1.17 < [6ΓÇô8] => TRUE"
    env: "development"
    provider: "Telegram"
    type: "telegram"
[2026-01-04 18:52:00.331 +0200] INFO: ≡ƒô¿ Sending Notification: "Γ£à Block Executed (LOOP_1767341931585)
Summary: Iteration 1: 1.17 < [6ΓÇô8] => TRUE (Continuing)"
    env: "development"
    provider: "Telegram"
    type: "telegram"
[2026-01-04 18:52:00.340 +0200] INFO: ≡ƒôñ [UdpTransport] Sending Raw Message
    env: "development"
    ip: "192.168.0.44"
    port: 8888
    message: "DIGITAL_WRITE|18|1"
[18:52] INFO: ≡ƒòÆ Scheduler Tick
    env: "development"
[ActuatorSet] ✔️ Pulsed 'DOSE' for 17.31s
✅ DEBUG LISTENER: automation:block_end received! ACTUATOR_SET_1767341926368
[ActuatorSet] ⏳ Starting Pulse: 20s (20000ms)...
[2026-01-04 18:52:18.435 +0200] INFO: ≡ƒôñ [UdpTransport] Sending Raw Message
    env: "development"
    ip: "192.168.0.44"
    port: 8888
    message: "DIGITAL_WRITE|18|0"
[2026-01-04 18:52:18.514 +0200] INFO: ≡ƒöö NotificationService: Received Block Event with Config
    env: "development"
    blockId: "ACTUATOR_SET_1767341926368"
    config: {
      "channelId": "",
      "mode": "AUTO",
      "config": {
        "strategy": "volumetric_flow",
        "durationUnit": "sec",
        "amountMode": "DOSES",
        "amountUnit": "ml",
        "retryCount": 3,
        "retryDelay": 1000,
        "onFailure": "STOP",
        "errorNotification": false,
        "notificationChannelId": "",
        "notificationMode": "AUTO",
        "revertOnStop": true,
        "label": "╨ƒ╨╛╨╝╨┐╨░ pH+",
        "hasError": false,
        "deviceId": "69577839963d1a2f7f7b8b9e",
        "action": "DOSE",
        "amount": "{{global_3}}",
        "comment": "╨ó╨╛╨▓╨░ ╨╡ ╨┐╨╛╨╝╨┐╨░╨░ ╨╖╨░ ╨┤╨╛╨╗╨╕╨▓╨░╨╜╨╡ ╨╜╨░ ╤Ç╨¥+\n╨ö╤Å ╨╡ ╨╜╨░╤ü╤é╤Ç╨╛╨╡╨╜╨░ (╨║╨░╨╗╨╕╨▒╤Ç╨╕╤Ç╨░╨╜╨░) ╨╖╨░ ╨┤╨╛╨╖╨╕, ╨║╨░╤é╨╛ ╨▓╤ü╤Å╨║╨░ ╨┤╨╛╨╖╨░ ╨╡ ╨╛╨┐╤Ç╨╡╨┤╨╡╨╗╨╡╨╜╨╛ ╨║╨╛╨╗╨╕╨╡╤ü╤é╨▓╨╛ ╨╖╨░╨╗╨╛╨╢╨╡╨╜╨╛ ╨▓ ╨╜╨░╤ü╤é╤Ç╨╛╨╣╨║╨╕╤é╨╡ ╨╜╨░ ╨┐╨╛╨╝╨┐╨░╤é╨░. ╨Æ Pump Calibration ╨╝╨╛╨╢╨╡ ╨┤╨░ ╤ü╨╡ ╨▓╨╕╨┤╨╕ 1 ╨┤╨╛╨╖╨░ ╨╜╨░ ╨║╨╛╨╗╨║╨╛ ml ╨╕ ╨║╨╛╨╗╨║╨╛ ╨▓╤Ç╨╡╨╝╨╡ ╤é╤Ç╤Å╨▒╨▓ ╨┤╨░ ╤Ç╨░╨▒╨╛╤é╨╕ ╨┐╨╛╨╝╨┐╨░╤é╨░. ╨É╨║╨╛ ╤ü╨╡ ╨▓╤è╨▓╨╡╨┤╨╡ ╤ü╤é╨╛╨╣╨╜╨╛╤ü╤é ╨╜╨░ ╨┤╨╛╨╖╨╕╤é╨╡, ╨┐╤Ç╨░╨▓╨╕ ╨┐╤Ç╨╕╨▒╨╗╨╕╨╖╨╕╤é╨╡╨╗╨╜╨╛ ╨╕╨╖╤ç╨╕╤ü╨╗╨╡╨╜╨╕╨╡"
      }
    }
[2026-01-04 18:52:18.515 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "ACTUATOR_SET_1767341926368"
    edgeFound: true
    nextBlockId: "ACTUATOR_SET_1767342128576"
[2026-01-04 18:52:18.527 +0200] INFO: ≡ƒôñ [UdpTransport] Sending Raw Message
    env: "development"
    ip: "192.168.0.43"
    port: 8888
    message: "DIGITAL_WRITE|6|1"
[2026-01-04 18:52:18.823 +0200] WARN: Block execution failed
    env: "development"
    blockId: "ACTUATOR_SET_1767342128576"
    attempt: 1
    err: "ERR_MISSING_PARAMETER"
[ActuatorSet] ⏳ Starting Pulse: 20s (20000ms)...
[2026-01-04 18:52:19.848 +0200] INFO: ≡ƒôñ [UdpTransport] Sending Raw Message
    env: "development"
    ip: "192.168.0.43"
    port: 8888
    message: "DIGITAL_WRITE|6|1"
[18:52] INFO: ≡ƒòÆ Scheduler Tick
    env: "development"
[2026-01-04 18:52:20.013 +0200] WARN: Block execution failed
    env: "development"
    blockId: "ACTUATOR_SET_1767342128576"
    attempt: 2
    err: "ERR_MISSING_PARAMETER"
[ActuatorSet] ⏳ Starting Pulse: 20s (20000ms)...
[2026-01-04 18:52:21.030 +0200] INFO: ≡ƒôñ [UdpTransport] Sending Raw Message
    env: "development"
    ip: "192.168.0.43"
    port: 8888
    message: "DIGITAL_WRITE|6|1"
[2026-01-04 18:52:21.112 +0200] WARN: Block execution failed
    env: "development"
    blockId: "ACTUATOR_SET_1767342128576"
    attempt: 3
    err: "ERR_MISSING_PARAMETER"
[ActuatorSet] ⏳ Starting Pulse: 20s (20000ms)...
✅ DEBUG LISTENER: automation:block_end received! ACTUATOR_SET_1767342128576
[2026-01-04 18:52:22.126 +0200] INFO: ≡ƒôñ [UdpTransport] Sending Raw Message
    env: "development"
    ip: "192.168.0.43"
    port: 8888
    message: "DIGITAL_WRITE|6|1"
[2026-01-04 18:52:22.245 +0200] WARN: Block execution failed
    env: "development"
    blockId: "ACTUATOR_SET_1767342128576"
    attempt: 4
    err: "ERR_MISSING_PARAMETER"
[2026-01-04 18:52:22.245 +0200] INFO: ≡ƒöö NotificationService: Received Block Event with Config
    env: "development"
    blockId: "ACTUATOR_SET_1767342128576"
    config: {
      "channelId": "",
      "mode": "AUTO"
    }
[2026-01-04 18:52:22.246 +0200] ERROR: All retries exhausted.
    env: "development"
    blockId: "ACTUATOR_SET_1767342128576"
    policy: "STOP"
[2026-01-04 18:52:22.246 +0200] INFO: ≡ƒ¢í∩╕Å Safety Stop: Checking active resources for cleanup...
    env: "development"
    count: 2
[2026-01-04 18:52:22.246 +0200] INFO: ≡ƒöä Safety Stop: Reverting Device Status
    env: "development"
    deviceId: "69577839963d1a2f7f7b8b9e"
    restoreTo: 0
[2026-01-04 18:52:22.254 +0200] INFO: ≡ƒôñ [UdpTransport] Sending Raw Message
    env: "development"
    ip: "192.168.0.44"
    port: 8888
    message: "DIGITAL_WRITE|18|0"
[2026-01-04 18:52:22.301 +0200] INFO: ≡ƒöä Safety Stop: Reverting Device Status
    env: "development"
    deviceId: "69577cc4963d1a2f7f7b92c3"
    restoreTo: 0
[2026-01-04 18:52:22.308 +0200] INFO: ≡ƒôñ [UdpTransport] Sending Raw Message
    env: "development"
    ip: "192.168.0.43"
    port: 8888
    message: "DIGITAL_WRITE|6|0"
[2026-01-04 18:52:22.442 +0200] ERROR: Γ¥î Failed to revert device state during Safety Stop
    env: "development"
    deviceId: "69577cc4963d1a2f7f7b92c3"
    err: "ERR_MISSING_PARAMETER"
[2026-01-04 18:52:22.445 +0200] ERROR: Γ¥î Cycle Step Failed
    env: "development"
    cycleId: "fallback-tw_1767397161163_4sw62wba9"
    error: "ERR_MISSING_PARAMETER"
[2026-01-04 18:52:22.445 +0200] ERROR: Γ¥î Cycle Failed
    env: "development"
    sessionId: "695a9ab0d33d7a152a558b14"
    reason: "Flow execution failed: ERR_MISSING_PARAMETER"
[2026-01-04 18:52:22.451 +0200] INFO: ≡ƒô¿ Sending Notification: "≡ƒ¢æ Program Stopped"
    env: "development"
    provider: "Telegram"
    type: "telegram"
[18:52] INFO: ≡ƒòÆ Scheduler Tick
    env: "development"
[2026-01-04 18:52:30.012 +0200] INFO: ≡ƒöì Debug: Scheduler detecting flow finish
    env: "development"
    windowId: "tw_1767397161163_4sw62wba9"
    currentSessionId: "695a9ab0d33d7a152a558b14"
    snapshotStatus: "error"
    isSessionMismatch: false
    isStatusFinished: true
[2026-01-04 18:52:30.012 +0200] INFO: Γ£à Trigger/Fallback flow finished
    env: "development"
    windowId: "tw_1767397161163_4sw62wba9"
    sessionId: "695a9ab0d33d7a152a558b14"
[2026-01-04 18:52:30.012 +0200] INFO: ≡ƒ¢æ Flow finished (Break/Fallback) - closing window
    env: "development"
    windowId: "tw_1767397161163_4sw62wba9"
    result: "fallback"
[2026-01-04 18:52:30.015 +0200] INFO: ≡ƒÅü All windows completed - Advanced Program finished for today
    env: "development"
[18:52] INFO: ≡ƒòÆ Scheduler Tick
    env: "development"
[18:52] INFO: ≡ƒòÆ Scheduler Tick
    env: "development"
[18:53] INFO: ≡ƒòÆ Scheduler Tick
    env: "development"
[18:53] INFO: ≡ƒòÆ Scheduler Tick
    env: "development"
[2026-01-04 18:53:12.376 +0200] INFO: ≡ƒöî Client Disconnected
    env: "development"
    socketId: "uei7URk4XQT_aHOJAAAD"
[2026-01-04 18:53:12.501 +0200] INFO: ≡ƒöî Client Connected to WebSocket
    env: "development"
    socketId: "loHRBmmoII9LJVZCAAAG"
[18:53] INFO: ≡ƒòÆ Scheduler Tick
    env: "development"
[18:53] INFO: ≡ƒòÆ Scheduler Tick
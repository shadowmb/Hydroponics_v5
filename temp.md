[2026-01-05 00:13:51.181 +0200] INFO: Γû╢∩╕Å Active Program Started
    env: "development"
[2026-01-05 00:13:51.181 +0200] INFO: ≡ƒô¥ [ProgramLogService] logEvent called
    env: "development"
    programId: "prog_test_advansed"
    type: "INFO"
    message: "╨ƒ╤Ç╨╛╨│╤Ç╨░╨╝╨░╤é╨░ ╤ü╤é╨░╤Ç╤é╨╕╤Ç╨░"
[2026-01-05 00:13:51.191 +0200] INFO: Γ£à [ProgramLogService] Event saved to DB
    env: "development"
    programId: "prog_test_advansed"
    type: "INFO"
[00:13] INFO: ΓÜí Immediate Advanced Program Check
    env: "development"
[2026-01-05 00:13:51.194 +0200] INFO: ≡ƒô¥ [ProgramLogService] logEvent called
    env: "development"
    programId: "prog_test_advansed"
    type: "WINDOW_EVENT"
    message: "╨ƒ╤Ç╨╛╨╖╨╛╤Ç╨╡╤å \"╨ƒ╤Ç╨╛╨╖╨╛╤Ç╨╡╤å 1\" ╤ü╤é╨░╤Ç╤é╨╕╤Ç╨░"
[2026-01-05 00:13:51.199 +0200] INFO: ≡ƒöä Evaluating triggers for window
    env: "development"
    windowId: "tw_1767397161163_4sw62wba9"
    windowName: "╨ƒ╤Ç╨╛╨╖╨╛╤Ç╨╡╤å 1"
[2026-01-05 00:13:51.201 +0200] INFO: ≡ƒöì [TriggerEvaluator] Reading sensor...
    env: "development"
    sensorId: "6952bc2a3b5ab4f7e2676f7c"
    source: "live"
[2026-01-05 00:13:51.201 +0200] INFO: ≡ƒôí [TriggerEvaluator] Starting LIVE read...
    env: "development"
    sensorId: "6952bc2a3b5ab4f7e2676f7c"
[2026-01-05 00:13:51.202 +0200] INFO: Γ£à [ProgramLogService] Event saved to DB
    env: "development"
    programId: "prog_test_advansed"
    type: "WINDOW_EVENT"
[2026-01-05 00:13:51.327 +0200] INFO: ≡ƒöî [UdpTransport] Initializing...
    env: "development"
    ip: "192.168.0.43"
    port: 8888
[2026-01-05 00:13:51.328 +0200] INFO: Γ£à [UdpTransport] Listening
    env: "development"
    address: {
      "address": "0.0.0.0",
      "family": "IPv4",
      "port": 53914
    }
[2026-01-05 00:13:51.328 +0200] INFO: ≡ƒôñ [UdpTransport] Sending Raw Message
    env: "development"
    ip: "192.168.0.43"
    port: 8888
    message: "UART_READ_DISTANCE|11|10"
[2026-01-05 00:13:51.682 +0200] INFO: ≡ƒôè [SensorProcessor] Starting Burst Read
    env: "development"
    deviceId: "6952bc2a3b5ab4f7e2676f7c"
    count: 4
    delayMs: 90
[2026-01-05 00:13:51.685 +0200] INFO: ≡ƒôñ [UdpTransport] Sending Raw Message
    env: "development"
    ip: "192.168.0.43"
    port: 8888
    message: "UART_READ_DISTANCE|11|10"
[2026-01-05 00:13:51.972 +0200] INFO: ≡ƒôñ [UdpTransport] Sending Raw Message
    env: "development"
    ip: "192.168.0.43"
    port: 8888
    message: "UART_READ_DISTANCE|11|10"
[2026-01-05 00:13:52.266 +0200] INFO: ≡ƒôñ [UdpTransport] Sending Raw Message
    env: "development"
    ip: "192.168.0.43"
    port: 8888
    message: "UART_READ_DISTANCE|11|10"
[2026-01-05 00:13:52.547 +0200] INFO: ≡ƒôñ [UdpTransport] Sending Raw Message
    env: "development"
    ip: "192.168.0.43"
    port: 8888
    message: "UART_READ_DISTANCE|11|10"
[2026-01-05 00:13:52.646 +0200] INFO: ≡ƒôè [TriggerEvaluator] Live value received
    env: "development"
    sensorId: "6952bc2a3b5ab4f7e2676f7c"
    value: 205.3
[2026-01-05 00:13:52.646 +0200] INFO: ≡ƒÄ» [TriggerEvaluator] Condition check result
    env: "development"
    sensorValue: 205.3
    condition: "> 150"
    matches: true
[2026-01-05 00:13:52.646 +0200] INFO: ΓÜí Trigger condition matched - executing flow(s)
    env: "development"
    triggerId: "tr_1767397178624_2yt9vuv55"
    flowIds: [
      "test_temp",
      "ph"
    ]
    flowId: "test_temp"
    behavior: "break"
[2026-01-05 00:13:52.646 +0200] INFO: ≡ƒô¥ [ProgramLogService] logEvent called
    env: "development"
    programId: "prog_test_advansed"
    type: "TRIGGER_MATCH"
    message: "╨ó╤Ç╨╕╨│╨╡╤Ç:  Ultrasonic (205.3) > 150"
✅ DEBUG LISTENER: automation:block_end received! start
[2026-01-05 00:13:52.650 +0200] INFO: ≡ƒÜÇ Starting Cycle (Trace Overrides)
    env: "development"
    cycleId: "tr_1767397178624_2yt9vuv55"
    cycleName: "Trigger: tr_1767397178624_2yt9vuv55"
    sessionId: "695ae62063efeb660ce02a9a"
    stepsCount: 2
    overrides: {
      "╤Ç╨░╨╖╤ü╤é╨╛╨╡╨╜╨╕╨╡": 100,
      "╤Ç╨░╨╖╤ü╤é╨╛╨╡╨╜╨╕╨╡_tolerance": 10,
      "╨ö╨╛╨╖╨╕": 2,
      "╤Ç╨¥ ╨û╨╡╨╗╨░╨╜╨╛": 8,
      "╤Ç╨¥ ╨û╨╡╨╗╨░╨╜╨╛_tolerance": 1,
      "╤Ç╨¥ ╨ö╨╛╨╖╨░": 2,
      "activeProgramId": "prog_test_advansed"
    }
[2026-01-05 00:13:52.650 +0200] INFO: Γû╢∩╕Å Executing Cycle Step
    env: "development"
    step: 0
    flowId: "test_temp"
[2026-01-05 00:13:52.650 +0200] INFO: ≡ƒöº Cycle Step Overrides Resolution
    env: "development"
    step: 0
    sessionOverrides: {
      "╤Ç╨░╨╖╤ü╤é╨╛╨╡╨╜╨╕╨╡": 100,
      "╤Ç╨░╨╖╤ü╤é╨╛╨╡╨╜╨╕╨╡_tolerance": 10,
      "╨ö╨╛╨╖╨╕": 2,
      "╤Ç╨¥ ╨û╨╡╨╗╨░╨╜╨╛": 8,
      "╤Ç╨¥ ╨û╨╡╨╗╨░╨╜╨╛_tolerance": 1,
      "╤Ç╨¥ ╨ö╨╛╨╖╨░": 2,
      "activeProgramId": "prog_test_advansed",
      "cycleName": "Trigger: tr_1767397178624_2yt9vuv55"
    }
    finalOverrides: {
      "╤Ç╨░╨╖╤ü╤é╨╛╨╡╨╜╨╕╨╡": 100,
      "╤Ç╨░╨╖╤ü╤é╨╛╨╡╨╜╨╕╨╡_tolerance": 10,
      "╨ö╨╛╨╖╨╕": 2,
      "╤Ç╨¥ ╨û╨╡╨╗╨░╨╜╨╛": 8,
      "╤Ç╨¥ ╨û╨╡╨╗╨░╨╜╨╛_tolerance": 1,
      "╤Ç╨¥ ╨ö╨╛╨╖╨░": 2,
      "activeProgramId": "prog_test_advansed",
      "cycleName": "Trigger: tr_1767397178624_2yt9vuv55",
      "_parentCycleSessionId": "695ae62063efeb660ce02a9a"
    }
[2026-01-05 00:13:52.651 +0200] INFO: Γ£¿ AutomationEngine Actor Initialized/Reset (Session: none)
    env: "development"
[2026-01-05 00:13:52.656 +0200] INFO: Γ£à [ProgramLogService] Event saved to DB
    env: "development"
    programId: "prog_test_advansed"
    type: "TRIGGER_MATCH"
[2026-01-05 00:13:52.657 +0200] INFO: ≡ƒº⌐ AutomationEngine: Input Resolution
    env: "development"
    overrides: {
      "╤Ç╨░╨╖╤ü╤é╨╛╨╡╨╜╨╕╨╡": 100,
      "╤Ç╨░╨╖╤ü╤é╨╛╨╡╨╜╨╕╨╡_tolerance": 10,
      "╨ö╨╛╨╖╨╕": 2,
      "╤Ç╨¥ ╨û╨╡╨╗╨░╨╜╨╛": 8,
      "╤Ç╨¥ ╨û╨╡╨╗╨░╨╜╨╛_tolerance": 1,
      "╤Ç╨¥ ╨ö╨╛╨╖╨░": 2,
      "activeProgramId": "prog_test_advansed",
      "cycleName": "Trigger: tr_1767397178624_2yt9vuv55",
      "_parentCycleSessionId": "695ae62063efeb660ce02a9a"
    }
    variablesResolved: {}
[2026-01-05 00:13:52.659 +0200] INFO: ≡ƒôÑ Loading Program Session
    env: "development"
    sessionId: "695ae62063efeb660ce02aa4"
    programId: "test_temp"
    variables: {
      "global_2": 100,
      "╤Ç╨░╨╖╤ü╤é╨╛╨╡╨╜╨╕╨╡": 100,
      "╤Ç╨░╨╖╤ü╤é╨╛╨╡╨╜╨╕╨╡_tolerance": 10,
      "global_2_tolerance": 10,
      "global_3": 2,
      "╨ö╨╛╨╖╨╕": 2,
      "_parentCycleSessionId": "695ae62063efeb660ce02a9a"
    }
[2026-01-05 00:13:52.667 +0200] INFO: ≡ƒô¥ [ProgramLogService] logEvent called
    env: "development"
    programId: "prog_test_advansed"
    type: "FLOW_EXECUTED"
    message: "╨í╤é╨░╤Ç╤é╨╕╤Ç╨░╨╜ ╨┐╨╛╤é╨╛╨║: ╨ó╨╡╤ü╤é ╤é╨╡╨╝╨┐"
[2026-01-05 00:13:52.667 +0200] INFO: ≡ƒôï [ProgramLogService] Received block_end event
    env: "development"
    activeProgramId: "prog_test_advansed"
    blockType: "START"
    blockId: "start"
[2026-01-05 00:13:52.668 +0200] INFO: ≡ƒöö NotificationService: Received Block Event with Config
    env: "development"
    blockId: "start"
    config: {
      "config": {
        "label": "Start",
        "hasError": false
      }
    }
[2026-01-05 00:13:52.668 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "start"
    edgeFound: true
    nextBlockId: "SENSOR_READ_1767397080404"
[2026-01-05 00:13:52.670 +0200] INFO: ≡ƒÜÇ Trigger flow(s) started - waiting for completion
    env: "development"
    windowId: "tw_1767397161163_4sw62wba9"
    triggerId: "tr_1767397178624_2yt9vuv55"
    flowSessionId: "695ae62063efeb660ce02a9a"
    stepsCount: 2
[2026-01-05 00:13:52.679 +0200] INFO: Γ£à [ProgramLogService] Event saved to DB
    env: "development"
    programId: "prog_test_advansed"
    type: "FLOW_EXECUTED"
[2026-01-05 00:13:52.686 +0200] INFO: ≡ƒô¿ Sending Notification: "≡ƒÜÇ Program Started"
    env: "development"
    provider: "Telegram"
    type: "telegram"
[2026-01-05 00:13:52.688 +0200] INFO: ≡ƒôñ [UdpTransport] Sending Raw Message
    env: "development"
    ip: "192.168.0.43"
    port: 8888
    message: "UART_READ_DISTANCE|11|10"
[2026-01-05 00:13:52.689 +0200] INFO: ≡ƒô¿ Sending Notification: "Γä╣∩╕Å Event: CYCLE_START"
    env: "development"
    provider: "Telegram"
    type: "telegram"
[2026-01-05 00:13:52.922 +0200] INFO: ≡ƒôè [SensorProcessor] Starting Burst Read
    env: "development"
    deviceId: "6952bc2a3b5ab4f7e2676f7c"
    count: 4
    delayMs: 90
[2026-01-05 00:13:52.924 +0200] INFO: ≡ƒôñ [UdpTransport] Sending Raw Message
    env: "development"
    ip: "192.168.0.43"
    port: 8888
    message: "UART_READ_DISTANCE|11|10"
[2026-01-05 00:13:53.119 +0200] INFO: ≡ƒôñ [UdpTransport] Sending Raw Message
    env: "development"
    ip: "192.168.0.43"
    port: 8888
    message: "UART_READ_DISTANCE|11|10"
[2026-01-05 00:13:53.413 +0200] INFO: ≡ƒôñ [UdpTransport] Sending Raw Message
    env: "development"
    ip: "192.168.0.43"
    port: 8888
    message: "UART_READ_DISTANCE|11|10"
[2026-01-05 00:13:53.709 +0200] INFO: ≡ƒôñ [UdpTransport] Sending Raw Message
    env: "development"
    ip: "192.168.0.43"
    port: 8888
    message: "UART_READ_DISTANCE|11|10"
[SensorRead] ✔️ Saved to 'var_1': 205.3 cm
✅ DEBUG LISTENER: automation:block_end received! SENSOR_READ_1767397080404
[IfBlock DEBUG] Params: {
  "label": "Проверка",
  "operator": ">",
  "onFailure": "STOP",
  "errorNotification": false,
  "notificationChannelId": "",
  "notificationMode": "AUTO",
  "hasError": false,
  "variable": "var_1",
  "value": "{{global_2}}",
  "_blockId": "IF_1767540099917"
}
[IfBlock DEBUG] Checking Left Tolerance for: 'var_1'
[IfBlock DEBUG] Checking Right Tolerance for: {{global_2}}
[IfBlock Tolerance] Applied for 'global_2': 10 (Mode: symmetric)
✅ DEBUG LISTENER: automation:block_end received! IF_1767540099917
[ActuatorSet] 💧 Dose conversion: 2 doses × 1ml = 2ml
[ActuatorSet] ⏳ Starting Dose: 2doses (~2.3s)...
[2026-01-05 00:13:53.888 +0200] INFO: ≡ƒôï [ProgramLogService] Received block_end event
    env: "development"
    activeProgramId: "prog_test_advansed"
    blockType: "SENSOR_READ"
    blockId: "SENSOR_READ_1767397080404"
[2026-01-05 00:13:53.888 +0200] INFO: ≡ƒô¥ [ProgramLogService] logEvent called
    env: "development"
    programId: "prog_test_advansed"
    type: "INFO"
    message: "≡ƒôè ╨í╨╡╨╜╨╖╨╛╤Ç Distance: Read 205.30 cm"
[2026-01-05 00:13:53.888 +0200] INFO: ≡ƒöö NotificationService: Received Block Event with Config
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
        "label": "╨í╨╡╨╜╨╖╨╛╤Ç Distance",
        "hasError": false,
        "deviceId": "6952bc2a3b5ab4f7e2676f7c",
        "variable": "var_1"
      }
    }
[2026-01-05 00:13:53.888 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "SENSOR_READ_1767397080404"
    edgeFound: true
    nextBlockId: "IF_1767540099917"
[2026-01-05 00:13:53.890 +0200] INFO: ≡ƒôï [ProgramLogService] Received block_end event
    env: "development"
    activeProgramId: "prog_test_advansed"
    blockType: "IF"
    blockId: "IF_1767540099917"
[2026-01-05 00:13:53.890 +0200] INFO: ≡ƒô¥ [ProgramLogService] logEvent called
    env: "development"
    programId: "prog_test_advansed"
    type: "INFO"
    message: "Γ¥ô ╨ƒ╤Ç╨╛╨▓╨╡╤Ç╨║╨░: 205.30 > [90ΓÇô110] => TRUE"
[2026-01-05 00:13:53.890 +0200] INFO: ≡ƒöö NotificationService: Received Block Event with Config
    env: "development"
    blockId: "IF_1767540099917"
    config: {
      "channelId": "",
      "mode": "AUTO",
      "config": {
        "label": "╨ƒ╤Ç╨╛╨▓╨╡╤Ç╨║╨░",
        "operator": ">",
        "onFailure": "STOP",
        "errorNotification": false,
        "notificationChannelId": "",
        "notificationMode": "AUTO",
        "hasError": false,
        "variable": "var_1",
        "value": "{{global_2}}"
      }
    }
[2026-01-05 00:13:53.890 +0200] INFO: Γ¥ô IF Block Navigation Trace
    env: "development"
    blockId: "IF_1767540099917"
    result: true
    expectedHandle: "true"
    nextBlockId: "ACTUATOR_SET_1767540068441"
[2026-01-05 00:13:53.902 +0200] INFO: Γ£à [ProgramLogService] Event saved to DB
    env: "development"
    programId: "prog_test_advansed"
    type: "INFO"
[2026-01-05 00:13:53.903 +0200] INFO: Γ£à [ProgramLogService] Event saved to DB
    env: "development"
    programId: "prog_test_advansed"
    type: "INFO"
[2026-01-05 00:13:53.906 +0200] INFO: ≡ƒöî [UdpTransport] Initializing...
    env: "development"
    ip: "192.168.0.44"
    port: 8888
[2026-01-05 00:13:53.907 +0200] INFO: Γ£à [UdpTransport] Listening
    env: "development"
    address: {
      "address": "0.0.0.0",
      "family": "IPv4",
      "port": 60034
    }
[2026-01-05 00:13:53.907 +0200] INFO: ≡ƒôñ [UdpTransport] Sending Raw Message
    env: "development"
    ip: "192.168.0.44"
    port: 8888
    message: "DIGITAL_WRITE|R1_21|1"
[ActuatorSet] ✔️ Pulsed 'DOSE' for 2.31s
✅ DEBUG LISTENER: automation:block_end received! ACTUATOR_SET_1767540068441
✅ DEBUG LISTENER: automation:block_end received! end
✅ DEBUG LISTENER: automation:block_end received! start
[2026-01-05 00:13:56.343 +0200] INFO: ≡ƒôñ [UdpTransport] Sending Raw Message
    env: "development"
    ip: "192.168.0.44"
    port: 8888
    message: "DIGITAL_WRITE|R1_21|0"
[2026-01-05 00:13:56.475 +0200] INFO: ≡ƒôï [ProgramLogService] Received block_end event
    env: "development"
    activeProgramId: "prog_test_advansed"
    blockType: "ACTUATOR_SET"
    blockId: "ACTUATOR_SET_1767540068441"
[2026-01-05 00:13:56.475 +0200] INFO: ≡ƒô¥ [ProgramLogService] logEvent called
    env: "development"
    programId: "prog_test_advansed"
    type: "INFO"
    message: "ΓÜí Pump A: Dosed 2doses"
[2026-01-05 00:13:56.475 +0200] INFO: ≡ƒöö NotificationService: Received Block Event with Config
    env: "development"
    blockId: "ACTUATOR_SET_1767540068441"
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
        "label": "Pump A",
        "hasError": false,
        "deviceId": "6956db4e06968f74a3d46e18",
        "action": "DOSE",
        "amount": "{{global_3}}"
      }
    }
[2026-01-05 00:13:56.475 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "ACTUATOR_SET_1767540068441"
    edgeFound: true
    nextBlockId: "end"
[2026-01-05 00:13:56.476 +0200] INFO: ≡ƒôï [ProgramLogService] Received block_end event
    env: "development"
    activeProgramId: "prog_test_advansed"
    blockType: "END"
    blockId: "end"
[2026-01-05 00:13:56.476 +0200] INFO: ≡ƒöö NotificationService: Received Block Event with Config
    env: "development"
    blockId: "end"
    config: {
      "config": {
        "label": "End",
        "hasError": false
      }
    }
[2026-01-05 00:13:56.480 +0200] INFO: Γ£à [ProgramLogService] Event saved to DB
    env: "development"
    programId: "prog_test_advansed"
    type: "INFO"
[2026-01-05 00:13:56.480 +0200] INFO: Γ£à Cycle Step Completed
    env: "development"
    cycleId: "tr_1767397178624_2yt9vuv55"
    step: 0
[2026-01-05 00:13:56.481 +0200] INFO: Γû╢∩╕Å Executing Cycle Step
    env: "development"
    step: 1
    flowId: "ph"
[2026-01-05 00:13:56.481 +0200] INFO: ≡ƒöº Cycle Step Overrides Resolution
    env: "development"
    step: 1
    sessionOverrides: {
      "╤Ç╨░╨╖╤ü╤é╨╛╨╡╨╜╨╕╨╡": 100,
      "╤Ç╨░╨╖╤ü╤é╨╛╨╡╨╜╨╕╨╡_tolerance": 10,
      "╨ö╨╛╨╖╨╕": 2,
      "╤Ç╨¥ ╨û╨╡╨╗╨░╨╜╨╛": 8,
      "╤Ç╨¥ ╨û╨╡╨╗╨░╨╜╨╛_tolerance": 1,
      "╤Ç╨¥ ╨ö╨╛╨╖╨░": 2,
      "activeProgramId": "prog_test_advansed",
      "cycleName": "Trigger: tr_1767397178624_2yt9vuv55"
    }
    finalOverrides: {
      "╤Ç╨░╨╖╤ü╤é╨╛╨╡╨╜╨╕╨╡": 100,
      "╤Ç╨░╨╖╤ü╤é╨╛╨╡╨╜╨╕╨╡_tolerance": 10,
      "╨ö╨╛╨╖╨╕": 2,
      "╤Ç╨¥ ╨û╨╡╨╗╨░╨╜╨╛": 8,
      "╤Ç╨¥ ╨û╨╡╨╗╨░╨╜╨╛_tolerance": 1,
      "╤Ç╨¥ ╨ö╨╛╨╖╨░": 2,
      "activeProgramId": "prog_test_advansed",
      "cycleName": "Trigger: tr_1767397178624_2yt9vuv55",
      "_parentCycleSessionId": "695ae62063efeb660ce02a9a"
    }
[2026-01-05 00:13:56.481 +0200] INFO: Γ£¿ AutomationEngine Actor Initialized/Reset (Session: none)
    env: "development"
[2026-01-05 00:13:56.484 +0200] INFO: ≡ƒº⌐ AutomationEngine: Input Resolution
    env: "development"
    overrides: {
      "╤Ç╨░╨╖╤ü╤é╨╛╨╡╨╜╨╕╨╡": 100,
      "╤Ç╨░╨╖╤ü╤é╨╛╨╡╨╜╨╕╨╡_tolerance": 10,
      "╨ö╨╛╨╖╨╕": 2,
      "╤Ç╨¥ ╨û╨╡╨╗╨░╨╜╨╛": 8,
      "╤Ç╨¥ ╨û╨╡╨╗╨░╨╜╨╛_tolerance": 1,
      "╤Ç╨¥ ╨ö╨╛╨╖╨░": 2,
      "activeProgramId": "prog_test_advansed",
      "cycleName": "Trigger: tr_1767397178624_2yt9vuv55",
      "_parentCycleSessionId": "695ae62063efeb660ce02a9a"
    }
    variablesResolved: {}
[2026-01-05 00:13:56.487 +0200] INFO: ≡ƒôÑ Loading Program Session
    env: "development"
    sessionId: "695ae62463efeb660ce02ae9"
    programId: "ph"
    variables: {
      "global_2": 8,
      "╤Ç╨¥ ╨û╨╡╨╗╨░╨╜╨╛": 8,
      "╤Ç╨¥ ╨û╨╡╨╗╨░╨╜╨╛_tolerance": 1,
      "global_2_tolerance": 1,
      "global_3": 2,
      "╤Ç╨¥ ╨ö╨╛╨╖╨░": 2,
      "_parentCycleSessionId": "695ae62063efeb660ce02a9a"
    }
[2026-01-05 00:13:56.489 +0200] INFO: ≡ƒô¿ Sending Notification: "≡ƒ¢æ Program Stopped"
    env: "development"
    provider: "Telegram"
    type: "telegram"
[2026-01-05 00:13:56.491 +0200] INFO: ≡ƒô¥ [ProgramLogService] logEvent called
    env: "development"
    programId: "prog_test_advansed"
    type: "FLOW_EXECUTED"
    message: "╨í╤é╨░╤Ç╤é╨╕╤Ç╨░╨╜ ╨┐╨╛╤é╨╛╨║: pH"
[2026-01-05 00:13:56.491 +0200] INFO: ≡ƒôï [ProgramLogService] Received block_end event
    env: "development"
    activeProgramId: "prog_test_advansed"
    blockType: "START"
    blockId: "start"
[2026-01-05 00:13:56.491 +0200] INFO: ≡ƒöö NotificationService: Received Block Event with Config
    env: "development"
    blockId: "start"
    config: {
      "config": {
        "label": "Start",
        "hasError": false
      }
    }
[2026-01-05 00:13:56.491 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "start"
    edgeFound: true
    nextBlockId: "SENSOR_READ_1767341830216"
[2026-01-05 00:13:56.498 +0200] INFO: Γ£à [ProgramLogService] Event saved to DB
    env: "development"
    programId: "prog_test_advansed"
    type: "FLOW_EXECUTED"
[2026-01-05 00:13:56.501 +0200] INFO: ≡ƒô¿ Sending Notification: "≡ƒÜÇ Program Started"
    env: "development"
    provider: "Telegram"
    type: "telegram"
[2026-01-05 00:13:56.503 +0200] WARN: ΓÜá∩╕Å [ContextResolver] Stale Temp Data. Polling...
    env: "development"
    deviceId: "6956ca03859163d2d9dd76c5"
    extDev: "Temp18"
    age: 305845
[2026-01-05 00:13:56.509 +0200] INFO: ≡ƒôñ [UdpTransport] Sending Raw Message
    env: "development"
    ip: "192.168.0.43"
    port: 8888
    message: "ONEWIRE_READ_TEMP|D7_7"
[2026-01-05 00:13:57.382 +0200] INFO: ≡ƒîí∩╕Å [ContextResolver] Using Polled External Temperature
    env: "development"
    deviceId: "6956ca03859163d2d9dd76c5"
    temp: 22.5
    source: "external"
    extDevId: "695a9e8cd33d7a152a558f74"
    freshness: "polled"
[2026-01-05 00:13:57.384 +0200] INFO: ≡ƒôñ [UdpTransport] Sending Raw Message
    env: "development"
    ip: "192.168.0.43"
    port: 8888
    message: "ANALOG|A3_17"
🧪 [PhSmart] Raw:13 | Points:2 | NeutralMV:1920.8 | Polarity:INV | V_Meas:63.5mV | Temp:22.5°C | pH:1.01
[SensorRead] ✔️ Saved to 'var_1': 1.01 pH
✅ DEBUG LISTENER: automation:block_end received! SENSOR_READ_1767341830216
[IfBlock DEBUG] Params: {
  "operator": "==",
  "onFailure": "STOP",
  "errorNotification": false,
  "notificationChannelId": "69547be6c1bd3b33817c39c6",
  "notificationMode": "ALWAYS",
  "label": "Условие 1",
  "hasError": false,
  "variable": "var_1",
  "value": "{{global_2}}",
  "comment": "Проверява дали нивто на рН е = на желаното. Ако е =, то прекъсва потока, а ако не е продължава със следваща проверка",
  "_blockId": "condition_1767342192686"
}
[IfBlock DEBUG] Checking Left Tolerance for: 'var_1'
[IfBlock DEBUG] Checking Right Tolerance for: {{global_2}}
[IfBlock Tolerance] Applied for 'global_2': 1 (Mode: symmetric)
✅ DEBUG LISTENER: automation:block_end received! condition_1767342192686
[IfBlock DEBUG] Params: {
  "operator": "<",
  "onFailure": "STOP",
  "errorNotification": false,
  "notificationChannelId": "69547be6c1bd3b33817c39c6",
  "notificationMode": "ALWAYS",
  "label": "Условие 2",
  "hasError": false,
  "variable": "var_1",
  "value": "{{global_2}}",
  "comment": "Това условие проверява дали нивото на рН е под или над желаното ниво и в зависимост от резултата насочва потока в разлини страни.",
  "_blockId": "IF_1767341895819"
}
[IfBlock DEBUG] Checking Left Tolerance for: 'var_1'
[IfBlock DEBUG] Checking Right Tolerance for: {{global_2}}
[IfBlock Tolerance] Applied for 'global_2': 1 (Mode: symmetric)
✅ DEBUG LISTENER: automation:block_end received! IF_1767341895819
[LoopBlock Debug] Block: LOOP_1767341931585 | Interval: 1s (from 1 sec) | Iteration: 1 | Mode: COUNT
✅ DEBUG LISTENER: automation:block_end received! LOOP_1767341931585
[ActuatorSet] 💧 Dose conversion: 2 doses × 1ml = 2ml
[ActuatorSet] ⏳ Starting Dose: 2doses (~2.3s)...
[2026-01-05 00:13:57.444 +0200] INFO: ≡ƒöö AutomationEngine: Prepared Notification Payload
    env: "development"
    blockId: "SENSOR_READ_1767341830216"
    channel: "69547be6c1bd3b33817c39c6"
    mode: "ALWAYS"
[2026-01-05 00:13:57.444 +0200] INFO: ≡ƒôï [ProgramLogService] Received block_end event
    env: "development"
    activeProgramId: "prog_test_advansed"
    blockType: "SENSOR_READ"
    blockId: "SENSOR_READ_1767341830216"
[2026-01-05 00:13:57.444 +0200] INFO: ≡ƒô¥ [ProgramLogService] logEvent called
    env: "development"
    programId: "prog_test_advansed"
    type: "INFO"
    message: "≡ƒôè ╨í╨╡╨╜╨╖╨╛╤Ç ╤Ç╨¥: Read 1.01 pH"
[2026-01-05 00:13:57.444 +0200] INFO: ≡ƒöö NotificationService: Received Block Event with Config
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
[2026-01-05 00:13:57.445 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "SENSOR_READ_1767341830216"
    edgeFound: true
    nextBlockId: "condition_1767342192686"
[2026-01-05 00:13:57.447 +0200] INFO: ≡ƒöö AutomationEngine: Prepared Notification Payload
    env: "development"
    blockId: "condition_1767342192686"
    channel: "69547be6c1bd3b33817c39c6"
    mode: "ALWAYS"
[2026-01-05 00:13:57.447 +0200] INFO: ≡ƒôï [ProgramLogService] Received block_end event
    env: "development"
    activeProgramId: "prog_test_advansed"
    blockType: "IF"
    blockId: "condition_1767342192686"
[2026-01-05 00:13:57.447 +0200] INFO: ≡ƒô¥ [ProgramLogService] logEvent called
    env: "development"
    programId: "prog_test_advansed"
    type: "INFO"
    message: "Γ¥ô ╨ú╤ü╨╗╨╛╨▓╨╕╨╡ 1: 1.01 == [7ΓÇô9] => FALSE"
[2026-01-05 00:13:57.447 +0200] INFO: ≡ƒöö NotificationService: Received Block Event with Config
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
[2026-01-05 00:13:57.447 +0200] INFO: Γ¥ô IF Block Navigation Trace
    env: "development"
    blockId: "condition_1767342192686"
    result: false
    expectedHandle: "false"
    nextBlockId: "IF_1767341895819"
[2026-01-05 00:13:57.448 +0200] INFO: ≡ƒöö AutomationEngine: Prepared Notification Payload
    env: "development"
    blockId: "IF_1767341895819"
    channel: "69547be6c1bd3b33817c39c6"
    mode: "ALWAYS"
[2026-01-05 00:13:57.448 +0200] INFO: ≡ƒôï [ProgramLogService] Received block_end event
    env: "development"
    activeProgramId: "prog_test_advansed"
    blockType: "IF"
    blockId: "IF_1767341895819"
[2026-01-05 00:13:57.448 +0200] INFO: ≡ƒô¥ [ProgramLogService] logEvent called
    env: "development"
    programId: "prog_test_advansed"
    type: "INFO"
    message: "Γ¥ô ╨ú╤ü╨╗╨╛╨▓╨╕╨╡ 2: 1.01 < [7ΓÇô9] => TRUE"
[2026-01-05 00:13:57.448 +0200] INFO: ≡ƒöö NotificationService: Received Block Event with Config
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
[2026-01-05 00:13:57.449 +0200] INFO: Γ¥ô IF Block Navigation Trace
    env: "development"
    blockId: "IF_1767341895819"
    result: true
    expectedHandle: "true"
    nextBlockId: "LOOP_1767341931585"
[2026-01-05 00:13:57.450 +0200] INFO: ≡ƒöö AutomationEngine: Prepared Notification Payload
    env: "development"
    blockId: "LOOP_1767341931585"
    channel: "69547be6c1bd3b33817c39c6"
    mode: "ALWAYS"
[2026-01-05 00:13:57.450 +0200] INFO: ≡ƒôï [ProgramLogService] Received block_end event
    env: "development"
    activeProgramId: "prog_test_advansed"
    blockType: "LOOP"
    blockId: "LOOP_1767341931585"
[2026-01-05 00:13:57.450 +0200] INFO: ≡ƒô¥ [ProgramLogService] logEvent called
    env: "development"
    programId: "prog_test_advansed"
    type: "INFO"
    message: "≡ƒöä ╨ª╨╕╨║╤è╨╗ ╨¥╨╕╤ü╨║╨╛: Iteration 1: 1.01 < [7ΓÇô9] => TRUE (Continuing)"
[2026-01-05 00:13:57.450 +0200] INFO: ≡ƒöö NotificationService: Received Block Event with Config
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
[2026-01-05 00:13:57.459 +0200] INFO: Γ£à [ProgramLogService] Event saved to DB
    env: "development"
    programId: "prog_test_advansed"
    type: "INFO"
[2026-01-05 00:13:57.459 +0200] INFO: Γ£à [ProgramLogService] Event saved to DB
    env: "development"
    programId: "prog_test_advansed"
    type: "INFO"
[2026-01-05 00:13:57.459 +0200] INFO: Γ£à [ProgramLogService] Event saved to DB
    env: "development"
    programId: "prog_test_advansed"
    type: "INFO"
[2026-01-05 00:13:57.460 +0200] INFO: Γ£à [ProgramLogService] Event saved to DB
    env: "development"
    programId: "prog_test_advansed"
    type: "INFO"
[2026-01-05 00:13:57.461 +0200] INFO: ≡ƒô¿ Sending Notification: "Γ£à Block Executed (condition_1767342192686)
Summary: 1.01 == [7ΓÇô9] => FALSE"
    env: "development"
    provider: "Telegram"
    type: "telegram"
[2026-01-05 00:13:57.463 +0200] INFO: ≡ƒô¿ Sending Notification: "Γ£à Block Executed (IF_1767341895819)
Summary: 1.01 < [7ΓÇô9] => TRUE"
    env: "development"
    provider: "Telegram"
    type: "telegram"
[2026-01-05 00:13:57.463 +0200] INFO: ≡ƒô¿ Sending Notification: "Γ£à Block Executed (SENSOR_READ_1767341830216)
Summary: Read 1.01 pH"
    env: "development"
    provider: "Telegram"
    type: "telegram"
[2026-01-05 00:13:57.469 +0200] INFO: ≡ƒô¿ Sending Notification: "Γ£à Block Executed (LOOP_1767341931585)
Summary: Iteration 1: 1.01 < [7ΓÇô9] => TRUE (Continuing)"
    env: "development"
    provider: "Telegram"
    type: "telegram"
[2026-01-05 00:13:57.479 +0200] INFO: ≡ƒôñ [UdpTransport] Sending Raw Message
    env: "development"
    ip: "192.168.0.44"
    port: 8888
    message: "DIGITAL_WRITE|R3_18|1"
[ActuatorSet] ✔️ Pulsed 'DOSE' for 2.31s
✅ DEBUG LISTENER: automation:block_end received! ACTUATOR_SET_1767341926368
[ActuatorSet] ⏳ Starting Pulse: 20s (20000ms)...
[2026-01-05 00:13:59.958 +0200] INFO: ≡ƒôñ [UdpTransport] Sending Raw Message
    env: "development"
    ip: "192.168.0.44"
    port: 8888
    message: "DIGITAL_WRITE|R3_18|0"
[00:14] INFO: ≡ƒòÆ Scheduler Tick
    env: "development"
[2026-01-05 00:14:00.061 +0200] INFO: ≡ƒôï [ProgramLogService] Received block_end event
    env: "development"
    activeProgramId: "prog_test_advansed"
    blockType: "ACTUATOR_SET"
    blockId: "ACTUATOR_SET_1767341926368"
[2026-01-05 00:14:00.061 +0200] INFO: ≡ƒô¥ [ProgramLogService] logEvent called
    env: "development"
    programId: "prog_test_advansed"
    type: "INFO"
    message: "ΓÜí ╨ƒ╨╛╨╝╨┐╨░ pH+: Dosed 2doses"
[2026-01-05 00:14:00.061 +0200] INFO: ≡ƒöö NotificationService: Received Block Event with Config
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
[2026-01-05 00:14:00.062 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "ACTUATOR_SET_1767341926368"
    edgeFound: true
    nextBlockId: "ACTUATOR_SET_1767342128576"
[2026-01-05 00:14:00.067 +0200] INFO: Γ£à [ProgramLogService] Event saved to DB
    env: "development"
    programId: "prog_test_advansed"
    type: "INFO"
[2026-01-05 00:14:00.072 +0200] INFO: ≡ƒôñ [UdpTransport] Sending Raw Message
    env: "development"
    ip: "192.168.0.43"
    port: 8888
    message: "DIGITAL_WRITE|D6_6|0"

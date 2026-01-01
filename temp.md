[12:40] INFO: ЁЯХТ Scheduler Tick
    env: "development"
✅ DEBUG LISTENER: automation:block_end received! start
[2026-01-01 12:40:34.279 +0200] INFO: тЦ╢я╕П Active Program Started
    env: "development"
[12:40] INFO: тЪб Immediate Advanced Program Check
    env: "development"
[2026-01-01 12:40:34.300 +0200] INFO: тПня╕П Skipping window - program started after window ended
    env: "development"
    windowId: "tw_1767194603750_o135w1fzt"
    windowName: "╨Я╤А╨╛╨╖╨╛╤А╨╡╤Ж 1"
    programStart: "2026-01-01T10:40:34.279Z"
    windowEnd: "10:00"
[2026-01-01 12:40:34.306 +0200] INFO: ЁЯФД Evaluating triggers for window
    env: "development"
    windowId: "tw_1767194650547_0lf5tyf2u"
    windowName: "╨Я╤А╨╛╨╖╨╛╤А╨╡╤Ж 2"
[2026-01-01 12:40:34.310 +0200] INFO: тЪб Trigger condition matched - executing flow
    env: "development"
    triggerId: "tr_1767194660674_4to7h3jd0"
    flowId: "advanced_1"
    behavior: "break"
[2026-01-01 12:40:34.316 +0200] INFO: ЁЯЪА Starting Cycle (Trace Overrides)
    env: "development"
    cycleId: "tr_1767194660674_4to7h3jd0"
    cycleName: "Trigger: tr_1767194660674_4to7h3jd0"
    sessionId: "69564f22f26b127b17b27e23"
    stepsCount: 1
    overrides: {}
[2026-01-01 12:40:34.316 +0200] INFO: тЦ╢я╕П Executing Cycle Step
    env: "development"
    step: 0
    flowId: "advanced_1"
[2026-01-01 12:40:34.316 +0200] INFO: ЁЯФз Cycle Step Overrides Resolution
    env: "development"
    step: 0
    sessionOverrides: {
      "cycleName": "Trigger: tr_1767194660674_4to7h3jd0"
    }
    finalOverrides: {
      "cycleName": "Trigger: tr_1767194660674_4to7h3jd0"
    }
[2026-01-01 12:40:34.319 +0200] INFO: тЬи AutomationEngine Actor Initialized/Reset (Session: none)
    env: "development"
[2026-01-01 12:40:34.337 +0200] INFO: ЁЯзй AutomationEngine: Input Resolution
    env: "development"
    overrides: {
      "cycleName": "Trigger: tr_1767194660674_4to7h3jd0"
    }
    variablesResolved: {}
[2026-01-01 12:40:34.339 +0200] INFO: ЁЯУе Loading Program Session
    env: "development"
    sessionId: "69564f22f26b127b17b27e2a"
    programId: "advanced_1"
    variables: {}
[2026-01-01 12:40:34.351 +0200] INFO: ЁЯФФ NotificationService: Received Block Event with Config
    env: "development"
    blockId: "start"
    config: {
      "config": {
        "label": "Start",
        "hasError": false
      }
    }
[2026-01-01 12:40:34.351 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "start"
    edgeFound: true
    nextBlockId: "SENSOR_READ_1767198071666"
[2026-01-01 12:40:34.354 +0200] INFO: ЁЯЫС BREAK trigger executed - closing window
    env: "development"
    windowId: "tw_1767194650547_0lf5tyf2u"
[2026-01-01 12:40:34.354 +0200] INFO: тЬЕ Window completed
    env: "development"
    windowId: "tw_1767194650547_0lf5tyf2u"
    result: "triggered"
[2026-01-01 12:40:34.413 +0200] INFO: ЁЯУи Sending Notification: "ЁЯУв ╨Т╨╜╨╕╨╝╨░╨╜╨╕╨╡! ╨Ь╨░╤И╨╕╨╜╨░╤В╨░ ╤Б╤В╨░╤А╤В╨╕╤А╨░ ╨┐╤А╨╛╨│╤А╨░╨╝╨░: advanced 1 12:40:34 ╤З. "
    env: "development"
    provider: "TelegramGroup"
    type: "telegram"
[2026-01-01 12:40:34.415 +0200] INFO: ЁЯУи Sending Notification: " tr_1767194660674_4to7h3jd0"
    env: "development"
    provider: "TelegramGroup"
    type: "telegram"
[2026-01-01 12:40:34.519 +0200] INFO: ЁЯФМ [SerialTransport] Connecting...
    env: "development"
    path: "COM3"
    baudRate: 9600
[2026-01-01 12:40:34.575 +0200] INFO: тЬЕ [SerialTransport] Port Opened
    env: "development"
    path: "COM3"
[SensorRead] ✔️ Saved to 'var_1': 17.4 cm
✅ DEBUG LISTENER: automation:block_end received! SENSOR_READ_1767198071666
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
  "_blockId": "IF_1767198104528"
}
[IfBlock] Variable 'global_2' not found in context. Keys: var_1
[IfBlock] Comparison involves NaN/undefined: 17.4 >= undefined
[IfBlock DEBUG] Checking Left Tolerance for: 'var_1'
[IfBlock DEBUG] Checking Right Tolerance for: {{global_2}}
✅ DEBUG LISTENER: automation:block_end received! IF_1767198104528
[2026-01-01 12:40:36.787 +0200] INFO: ЁЯФФ NotificationService: Received Block Event with Config
    env: "development"
    blockId: "SENSOR_READ_1767198071666"
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
        "deviceId": "694549a90352590f8322f050",
        "variable": "var_1"
      }
    }
[2026-01-01 12:40:36.788 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "SENSOR_READ_1767198071666"
    edgeFound: true
    nextBlockId: "IF_1767198104528"
[2026-01-01 12:40:36.791 +0200] INFO: ЁЯФФ NotificationService: Received Block Event with Config
    env: "development"
    blockId: "IF_1767198104528"
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
[2026-01-01 12:40:36.791 +0200] INFO: тЭУ IF Block Navigation Trace
    env: "development"
    blockId: "IF_1767198104528"
    result: false
    expectedHandle: "false"
    nextBlockId: "ACTUATOR_SET_1767260793750"
[2026-01-01 12:40:36.870 +0200] WARN: Block execution failed
    env: "development"
    blockId: "ACTUATOR_SET_1767260793750"
    attempt: 1
    err: "ERR_INVALID_COMMAND"
[2026-01-01 12:40:37.962 +0200] WARN: Block execution failed
    env: "development"
    blockId: "ACTUATOR_SET_1767260793750"
    attempt: 2
    err: "ERR_INVALID_COMMAND"
[2026-01-01 12:40:39.062 +0200] WARN: Block execution failed
    env: "development"
    blockId: "ACTUATOR_SET_1767260793750"
    attempt: 3
    err: "ERR_INVALID_COMMAND"
✅ DEBUG LISTENER: automation:block_end received! ACTUATOR_SET_1767260793750
[2026-01-01 12:40:40.145 +0200] WARN: Block execution failed
    env: "development"
    blockId: "ACTUATOR_SET_1767260793750"
    attempt: 4
    err: "ERR_INVALID_COMMAND"
[2026-01-01 12:40:40.145 +0200] INFO: ЁЯФФ NotificationService: Received Block Event with Config
    env: "development"
    blockId: "ACTUATOR_SET_1767260793750"
    config: {
      "channelId": "",
      "mode": "AUTO"
    }
[2026-01-01 12:40:40.147 +0200] ERROR: All retries exhausted.
    env: "development"
    blockId: "ACTUATOR_SET_1767260793750"
    policy: "STOP"
[2026-01-01 12:40:40.150 +0200] INFO: ЁЯЫбя╕П Safety Stop: Checking active resources for cleanup...
    env: "development"
    count: 1
[2026-01-01 12:40:40.150 +0200] INFO: ЁЯФД Safety Stop: Reverting Device Status
    env: "development"
    deviceId: "6953be264061fa6a35a3f13b"
    restoreTo: 0
[2026-01-01 12:40:40.233 +0200] ERROR: тЭМ Failed to revert device state during Safety Stop
    env: "development"
    deviceId: "6953be264061fa6a35a3f13b"
    err: "ERR_INVALID_COMMAND"
[2026-01-01 12:40:40.238 +0200] ERROR: тЭМ Cycle Step Failed
    env: "development"
    cycleId: "tr_1767194660674_4to7h3jd0"
    error: "ERR_INVALID_COMMAND"
[2026-01-01 12:40:40.238 +0200] ERROR: тЭМ Cycle Failed
    env: "development"
    sessionId: "69564f22f26b127b17b27e23"
    reason: "Flow execution failed: ERR_INVALID_COMMAND"
[2026-01-01 12:40:40.260 +0200] INFO: ЁЯУи Sending Notification: "╨Я╤А╨╛╨│╤А╨░╨╝╤В╨░ ╤Б╨┐╨╕╤А╨░ ╨╖╨░╤А╨░╨┤╨╕  error 12:40:40 ╤З."
    env: "development"
    provider: "TelegramGroup"
    type: "telegram"
[12:41] INFO: ЁЯХТ Scheduler Tick
    env: "development"
[2026-01-01 12:41:00.022 +0200] INFO: тПня╕П Skipping window - program started after window ended
    env: "development"
    windowId: "tw_1767194603750_o135w1fzt"
    windowName: "╨Я╤А╨╛╨╖╨╛╤А╨╡╤Ж 1"
    programStart: "2026-01-01T10:40:34.279Z"
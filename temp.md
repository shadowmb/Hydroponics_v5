[2026-01-01 14:00:47.033 +0200] INFO: ЁЯУе Advanced Program Loaded
    env: "development"
    program: "NewProgramADvanced"
    windowCount: 2
[2026-01-01 14:00:52.981 +0200] INFO: ЁЯУЭ Active Program Updated
    env: "development"
[2026-01-01 14:00:54.593 +0200] INFO: тЦ╢я╕П Active Program Started
    env: "development"
[14:00] INFO: тЪб Immediate Advanced Program Check
    env: "development"
✅ DEBUG LISTENER: automation:block_end received! start
[SensorRead] Conversion failed: Unknown source unit: L
[SensorRead] ✔️ Saved to 'var_1': 182 l
✅ DEBUG LISTENER: automation:block_end received! SENSOR_READ_1767135796826
✅ DEBUG LISTENER: automation:block_end received! end
[14:01] INFO: ЁЯХТ Scheduler Tick
    env: "development"
[2026-01-01 14:01:00.017 +0200] INFO: ЁЯФД Evaluating triggers for window
    env: "development"
    windowId: "tw_1767194603750_o135w1fzt"
    windowName: "╨Я╤А╨╛╨╖╨╛╤А╨╡╤Ж 1"
[2026-01-01 14:01:00.103 +0200] INFO: тЪб Trigger condition matched - executing flow
    env: "development"
    triggerId: "tr_1767194626236_o2p3gd227"
    flowId: "test3"
    behavior: "continue"
[2026-01-01 14:01:00.106 +0200] INFO: ЁЯЪА Starting Cycle (Trace Overrides)
    env: "development"
    cycleId: "tr_1767194626236_o2p3gd227"
    cycleName: "Trigger: tr_1767194626236_o2p3gd227"
    sessionId: "695661fcb7029bce599ec74e"
    stepsCount: 1
    overrides: {
      "Distancia": 5,
      "Distancia_tolerance": 0,
      "TimePump": 5,
      "TimePump_tolerance": 0
    }
[2026-01-01 14:01:00.106 +0200] INFO: тЦ╢я╕П Executing Cycle Step
    env: "development"
    step: 0
    flowId: "test3"
[2026-01-01 14:01:00.106 +0200] INFO: ЁЯФз Cycle Step Overrides Resolution
    env: "development"
    step: 0
    sessionOverrides: {
      "Distancia": 5,
      "Distancia_tolerance": 0,
      "TimePump": 5,
      "TimePump_tolerance": 0,
      "cycleName": "Trigger: tr_1767194626236_o2p3gd227"
    }
    finalOverrides: {
      "Distancia": 5,
      "Distancia_tolerance": 0,
      "TimePump": 5,
      "TimePump_tolerance": 0,
      "cycleName": "Trigger: tr_1767194626236_o2p3gd227"
    }
[2026-01-01 14:01:00.106 +0200] INFO: тЬи AutomationEngine Actor Initialized/Reset (Session: none)
    env: "development"
[2026-01-01 14:01:00.108 +0200] INFO: ЁЯзй AutomationEngine: Input Resolution
    env: "development"
    overrides: {
      "Distancia": 5,
      "Distancia_tolerance": 0,
      "TimePump": 5,
      "TimePump_tolerance": 0,
      "cycleName": "Trigger: tr_1767194626236_o2p3gd227"
    }
    variablesResolved: {}
[2026-01-01 14:01:00.110 +0200] INFO: ЁЯУе Loading Program Session
    env: "development"
    sessionId: "695661fcb7029bce599ec753"
    programId: "test3"
    variables: {}
[2026-01-01 14:01:00.116 +0200] INFO: ЁЯФФ NotificationService: Received Block Event with Config
    env: "development"
    blockId: "start"
    config: {
      "config": {
        "label": "Start",
        "hasError": false
      }
    }
[2026-01-01 14:01:00.117 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "start"
    edgeFound: true
    nextBlockId: "SENSOR_READ_1767135796826"
[2026-01-01 14:01:00.118 +0200] INFO: ЁЯЪА Trigger flow started - waiting for completion
    env: "development"
    windowId: "tw_1767194603750_o135w1fzt"
    triggerId: "tr_1767194626236_o2p3gd227"
    flowSessionId: "695661fcb7029bce599ec74e"
[2026-01-01 14:01:00.136 +0200] INFO: ЁЯУи Sending Notification: "ЁЯУв ╨Т╨╜╨╕╨╝╨░╨╜╨╕╨╡! ╨Ь╨░╤И╨╕╨╜╨░╤В╨░ ╤Б╤В╨░╤А╤В╨╕╤А╨░ ╨┐╤А╨╛╨│╤А╨░╨╝╨░: ╤В╨╡╤Б╤В3 14:01:00 ╤З. "
    env: "development"
    provider: "TelegramGroup"
    type: "telegram"
[2026-01-01 14:01:00.137 +0200] INFO: ЁЯУи Sending Notification: " tr_1767194626236_o2p3gd227"
    env: "development"
    provider: "TelegramGroup"
    type: "telegram"
[2026-01-01 14:01:00.212 +0200] INFO: ЁЯФФ AutomationEngine: Prepared Notification Payload
    env: "development"
    blockId: "SENSOR_READ_1767135796826"
    channel: "6954567e758f275fb60815e2"
    mode: "ALWAYS"
[2026-01-01 14:01:00.212 +0200] INFO: ЁЯФФ NotificationService: Received Block Event with Config
    env: "development"
    blockId: "SENSOR_READ_1767135796826"
    config: {
      "channelId": "6954567e758f275fb60815e2",
      "mode": "ALWAYS",
      "config": {
        "readingType": "tank_volume",
        "retryCount": 3,
        "retryDelay": 1000,
        "onFailure": "STOP",
        "errorNotification": false,
        "notificationChannelId": "6954567e758f275fb60815e2",
        "notificationMode": "ALWAYS",
        "label": "Read Sensor",
        "hasError": false,
        "deviceId": "694549a90352590f8322f050",
        "variable": "var_1"
      }
    }
[2026-01-01 14:01:00.212 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "SENSOR_READ_1767135796826"
    edgeFound: true
    nextBlockId: "end"
[2026-01-01 14:01:00.213 +0200] INFO: ЁЯФФ NotificationService: Received Block Event with Config
    env: "development"
    blockId: "end"
    config: {
      "config": {
        "label": "End",
        "hasError": false
      }
    }
[2026-01-01 14:01:00.236 +0200] INFO: тЬЕ Cycle Step Completed
    env: "development"
    cycleId: "tr_1767194626236_o2p3gd227"
    step: 0
[2026-01-01 14:01:00.236 +0200] INFO: ЁЯПБ Cycle Completed Successfully
    env: "development"
    sessionId: "695661fcb7029bce599ec74e"
[2026-01-01 14:01:00.245 +0200] INFO: ЁЯУи Sending Notification: "тЬЕ Block Executed (SENSOR_READ_1767135796826)
Summary: Read 182 l"
    env: "development"
    provider: "TelegramBot"
    type: "telegram"
[2026-01-01 14:01:00.254 +0200] INFO: ЁЯУи Sending Notification: "╨Я╤А╨╛╨│╤А╨░╨╝╤В╨░ ╤Б╨┐╨╕╤А╨░ ╨╖╨░╤А╨░╨┤╨╕  completed 14:01:00 ╤З."
    env: "development"
    provider: "TelegramGroup"
    type: "telegram"
[2026-01-01 14:01:00.264 +0200] INFO: ЁЯУи Sending Notification: "тЬЕ Cycle Finished: tr_1767194626236_o2p3gd227 14:01:00 ╤З."
    env: "development"
    provider: "TelegramGroup"
    type: "telegram"
[14:02] INFO: ЁЯХТ Scheduler Tick
    env: "development"
[2026-01-01 14:02:00.020 +0200] INFO: тЬЕ Trigger flow finished
    env: "development"
    windowId: "tw_1767194603750_o135w1fzt"
    sessionId: "695661fcb7029bce599ec74e"
✅ DEBUG LISTENER: automation:block_end received! start
[SensorRead] Conversion failed: Unknown source unit: L
[SensorRead] ✔️ Saved to 'var_1': 749 l
✅ DEBUG LISTENER: automation:block_end received! SENSOR_READ_1767135796826
✅ DEBUG LISTENER: automation:block_end received! end
[14:03] INFO: ЁЯХТ Scheduler Tick
    env: "development"
[2026-01-01 14:03:00.017 +0200] INFO: тП░ Window time expired - checking fallback
    env: "development"
    windowId: "tw_1767194603750_o135w1fzt"
[2026-01-01 14:03:00.017 +0200] INFO: ЁЯЫбя╕П Executing fallback flow
    env: "development"
    windowId: "tw_1767194603750_o135w1fzt"
    fallbackFlowId: "test3"
[2026-01-01 14:03:00.020 +0200] INFO: ЁЯЪА Starting Cycle (Trace Overrides)
    env: "development"
    cycleId: "fallback-tw_1767194603750_o135w1fzt"
    cycleName: "Fallback: ╨Я╤А╨╛╨╖╨╛╤А╨╡╤Ж 1"
    sessionId: "69566274b7029bce599ec79a"
    stepsCount: 1
    overrides: {
      "Distancia": 5,
      "Distancia_tolerance": 0,
      "TimePump": 5,
      "TimePump_tolerance": 0
    }
[2026-01-01 14:03:00.020 +0200] INFO: тЦ╢я╕П Executing Cycle Step
    env: "development"
    step: 0
    flowId: "test3"
[2026-01-01 14:03:00.020 +0200] INFO: ЁЯФз Cycle Step Overrides Resolution
    env: "development"
    step: 0
    sessionOverrides: {
      "Distancia": 5,
      "Distancia_tolerance": 0,
      "TimePump": 5,
      "TimePump_tolerance": 0,
      "cycleName": "Fallback: ╨Я╤А╨╛╨╖╨╛╤А╨╡╤Ж 1"
    }
    finalOverrides: {
      "Distancia": 5,
      "Distancia_tolerance": 0,
      "TimePump": 5,
      "TimePump_tolerance": 0,
      "cycleName": "Fallback: ╨Я╤А╨╛╨╖╨╛╤А╨╡╤Ж 1"
    }
[2026-01-01 14:03:00.021 +0200] INFO: тЬи AutomationEngine Actor Initialized/Reset (Session: none)
    env: "development"
[2026-01-01 14:03:00.024 +0200] INFO: ЁЯзй AutomationEngine: Input Resolution
    env: "development"
    overrides: {
      "Distancia": 5,
      "Distancia_tolerance": 0,
      "TimePump": 5,
      "TimePump_tolerance": 0,
      "cycleName": "Fallback: ╨Я╤А╨╛╨╖╨╛╤А╨╡╤Ж 1"
    }
    variablesResolved: {}
[2026-01-01 14:03:00.026 +0200] INFO: ЁЯУе Loading Program Session
    env: "development"
    sessionId: "69566274b7029bce599ec79f"
    programId: "test3"
    variables: {}
[2026-01-01 14:03:00.032 +0200] INFO: ЁЯФФ NotificationService: Received Block Event with Config
    env: "development"
    blockId: "start"
    config: {
      "config": {
        "label": "Start",
        "hasError": false
      }
    }
[2026-01-01 14:03:00.032 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "start"
    edgeFound: true
    nextBlockId: "SENSOR_READ_1767135796826"
[2026-01-01 14:03:00.049 +0200] INFO: ЁЯУи Sending Notification: "ЁЯУв ╨Т╨╜╨╕╨╝╨░╨╜╨╕╨╡! ╨Ь╨░╤И╨╕╨╜╨░╤В╨░ ╤Б╤В╨░╤А╤В╨╕╤А╨░ ╨┐╤А╨╛╨│╤А╨░╨╝╨░: ╤В╨╡╤Б╤В3 14:03:00 ╤З. "
    env: "development"
    provider: "TelegramGroup"
    type: "telegram"
[2026-01-01 14:03:00.050 +0200] INFO: ЁЯУи Sending Notification: " fallback-tw_1767194603750_o135w1fzt"
    env: "development"
    provider: "TelegramGroup"
    type: "telegram"
[2026-01-01 14:03:00.128 +0200] INFO: ЁЯФФ AutomationEngine: Prepared Notification Payload
    env: "development"
    blockId: "SENSOR_READ_1767135796826"
    channel: "6954567e758f275fb60815e2"
    mode: "ALWAYS"
[2026-01-01 14:03:00.128 +0200] INFO: ЁЯФФ NotificationService: Received Block Event with Config
    env: "development"
    blockId: "SENSOR_READ_1767135796826"
    config: {
      "channelId": "6954567e758f275fb60815e2",
      "mode": "ALWAYS",
      "config": {
        "readingType": "tank_volume",
        "retryCount": 3,
        "retryDelay": 1000,
        "onFailure": "STOP",
        "errorNotification": false,
        "notificationChannelId": "6954567e758f275fb60815e2",
        "notificationMode": "ALWAYS",
        "label": "Read Sensor",
        "hasError": false,
        "deviceId": "694549a90352590f8322f050",
        "variable": "var_1"
      }
    }
[2026-01-01 14:03:00.128 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "SENSOR_READ_1767135796826"
    edgeFound: true
    nextBlockId: "end"
[2026-01-01 14:03:00.129 +0200] INFO: ЁЯФФ NotificationService: Received Block Event with Config
    env: "development"
    blockId: "end"
    config: {
      "config": {
        "label": "End",
        "hasError": false
      }
    }
[2026-01-01 14:03:00.136 +0200] INFO: тЬЕ Cycle Step Completed
    env: "development"
    cycleId: "fallback-tw_1767194603750_o135w1fzt"
    step: 0
[2026-01-01 14:03:00.136 +0200] INFO: ЁЯПБ Cycle Completed Successfully
    env: "development"
    sessionId: "69566274b7029bce599ec79a"
[2026-01-01 14:03:00.141 +0200] INFO: ЁЯУи Sending Notification: "тЬЕ Block Executed (SENSOR_READ_1767135796826)
Summary: Read 749 l"
    env: "development"
    provider: "TelegramBot"
    type: "telegram"
[2026-01-01 14:03:00.159 +0200] INFO: ЁЯУи Sending Notification: "╨Я╤А╨╛╨│╤А╨░╨╝╤В╨░ ╤Б╨┐╨╕╤А╨░ ╨╖╨░╤А╨░╨┤╨╕  completed 14:03:00 ╤З."
    env: "development"
    provider: "TelegramGroup"
    type: "telegram"
[2026-01-01 14:03:00.165 +0200] INFO: ЁЯУи Sending Notification: "тЬЕ Cycle Finished: fallback-tw_1767194603750_o135w1fzt 14:03:00 ╤З."
    env: "development"
    provider: "TelegramGroup"
    type: "telegram"
[14:04] INFO: ЁЯХТ Scheduler Tick
    env: "development"
✅ DEBUG LISTENER: automation:block_end received! start
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
[IfBlock DEBUG] Checking Left Tolerance for: 'var_1'
[IfBlock DEBUG] Checking Right Tolerance for: {{global_2}}
[IfBlock Tolerance] Applied for 'global_2': 0 (Mode: symmetric)
✅ DEBUG LISTENER: automation:block_end received! IF_1767198104528
✅ DEBUG LISTENER: automation:block_end received! end
[14:05] INFO: ЁЯХТ Scheduler Tick
    env: "development"
[2026-01-01 14:05:00.022 +0200] INFO: ЁЯФД Evaluating triggers for window
    env: "development"
    windowId: "tw_1767194650547_0lf5tyf2u"
    windowName: "╨Я╤А╨╛╨╖╨╛╤А╨╡╤Ж 2"
[2026-01-01 14:05:00.030 +0200] INFO: тЪб Trigger condition matched - executing flow
    env: "development"
    triggerId: "tr_1767194660674_4to7h3jd0"
    flowId: "advanced_1"
    behavior: "break"
[2026-01-01 14:05:00.034 +0200] INFO: ЁЯЪА Starting Cycle (Trace Overrides)
    env: "development"
    cycleId: "tr_1767194660674_4to7h3jd0"
    cycleName: "Trigger: tr_1767194660674_4to7h3jd0"
    sessionId: "695662ecb7029bce599ec7eb"
    stepsCount: 1
    overrides: {
      "Distancia": 5,
      "Distancia_tolerance": 0,
      "TimePump": 5,
      "TimePump_tolerance": 0
    }
[2026-01-01 14:05:00.034 +0200] INFO: тЦ╢я╕П Executing Cycle Step
    env: "development"
    step: 0
    flowId: "advanced_1"
[2026-01-01 14:05:00.034 +0200] INFO: ЁЯФз Cycle Step Overrides Resolution
    env: "development"
    step: 0
    sessionOverrides: {
      "Distancia": 5,
      "Distancia_tolerance": 0,
      "TimePump": 5,
      "TimePump_tolerance": 0,
      "cycleName": "Trigger: tr_1767194660674_4to7h3jd0"
    }
    finalOverrides: {
      "Distancia": 5,
      "Distancia_tolerance": 0,
      "TimePump": 5,
      "TimePump_tolerance": 0,
      "cycleName": "Trigger: tr_1767194660674_4to7h3jd0"
    }
[2026-01-01 14:05:00.035 +0200] INFO: тЬи AutomationEngine Actor Initialized/Reset (Session: none)
    env: "development"
[2026-01-01 14:05:00.038 +0200] INFO: ЁЯзй AutomationEngine: Input Resolution
    env: "development"
    overrides: {
      "Distancia": 5,
      "Distancia_tolerance": 0,
      "TimePump": 5,
      "TimePump_tolerance": 0,
      "cycleName": "Trigger: tr_1767194660674_4to7h3jd0"
    }
    variablesResolved: {}
[2026-01-01 14:05:00.040 +0200] INFO: ЁЯУе Loading Program Session
    env: "development"
    sessionId: "695662ecb7029bce599ec7f2"
    programId: "advanced_1"
    variables: {
      "global_2": 5,
      "Distancia": 5,
      "Distancia_tolerance": 0,
      "global_2_tolerance": 0,
      "global_3": 5,
      "TimePump": 5,
      "TimePump_tolerance": 0,
      "global_3_tolerance": 0
    }
[2026-01-01 14:05:00.045 +0200] INFO: ЁЯФФ NotificationService: Received Block Event with Config
    env: "development"
    blockId: "start"
    config: {
      "config": {
        "label": "Start",
        "hasError": false
      }
    }
[2026-01-01 14:05:00.045 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "start"
    edgeFound: true
    nextBlockId: "SENSOR_READ_1767198071666"
[2026-01-01 14:05:00.047 +0200] INFO: ЁЯЪА Trigger flow started - waiting for completion
    env: "development"
    windowId: "tw_1767194650547_0lf5tyf2u"
    triggerId: "tr_1767194660674_4to7h3jd0"
    flowSessionId: "695662ecb7029bce599ec7eb"
[2026-01-01 14:05:00.069 +0200] INFO: ЁЯУи Sending Notification: "ЁЯУв ╨Т╨╜╨╕╨╝╨░╨╜╨╕╨╡! ╨Ь╨░╤И╨╕╨╜╨░╤В╨░ ╤Б╤В╨░╤А╤В╨╕╤А╨░ ╨┐╤А╨╛╨│╤А╨░╨╝╨░: advanced 1 14:05:00 ╤З. "
    env: "development"
    provider: "TelegramGroup"
    type: "telegram"
[2026-01-01 14:05:00.070 +0200] INFO: ЁЯУи Sending Notification: " tr_1767194660674_4to7h3jd0"
    env: "development"
    provider: "TelegramGroup"
    type: "telegram"
[2026-01-01 14:05:00.146 +0200] INFO: ЁЯФФ NotificationService: Received Block Event with Config
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
[2026-01-01 14:05:00.147 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "SENSOR_READ_1767198071666"
    edgeFound: true
    nextBlockId: "IF_1767198104528"
[2026-01-01 14:05:00.149 +0200] INFO: ЁЯФФ NotificationService: Received Block Event with Config
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
[2026-01-01 14:05:00.149 +0200] INFO: тЭУ IF Block Navigation Trace
    env: "development"
    blockId: "IF_1767198104528"
    result: true
    expectedHandle: "true"
    nextBlockId: "end"
[2026-01-01 14:05:00.149 +0200] INFO: ЁЯФФ NotificationService: Received Block Event with Config
    env: "development"
    blockId: "end"
    config: {
      "config": {
        "label": "End",
        "hasError": false
      }
    }
[2026-01-01 14:05:00.154 +0200] INFO: тЬЕ Cycle Step Completed
    env: "development"
    cycleId: "tr_1767194660674_4to7h3jd0"
    step: 0
[2026-01-01 14:05:00.154 +0200] INFO: ЁЯПБ Cycle Completed Successfully
    env: "development"
    sessionId: "695662ecb7029bce599ec7eb"
[2026-01-01 14:05:00.166 +0200] INFO: ЁЯУи Sending Notification: "╨Я╤А╨╛╨│╤А╨░╨╝╤В╨░ ╤Б╨┐╨╕╤А╨░ ╨╖╨░╤А╨░╨┤╨╕  completed 14:05:00 ╤З."
    env: "development"
    provider: "TelegramGroup"
    type: "telegram"
[2026-01-01 14:05:00.173 +0200] INFO: ЁЯУи Sending Notification: "тЬЕ Cycle Finished: tr_1767194660674_4to7h3jd0 14:05:00 ╤З."
    env: "development"
    provider: "TelegramGroup"
    type: "telegram"

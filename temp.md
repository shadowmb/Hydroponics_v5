[SensorRead] ✔️ Saved to 'var_1': 69.2 cm
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
[IfBlock] Comparison involves NaN/undefined: 69.2 >= undefined
[IfBlock DEBUG] Checking Left Tolerance for: 'var_1'
[IfBlock DEBUG] Checking Right Tolerance for: {{global_2}}
✅ DEBUG LISTENER: automation:block_end received! IF_1767198104528
[2026-01-01 13:22:03.617 +0200] INFO: ЁЯФФ NotificationService: Received Block Event with Config
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
[2026-01-01 13:22:03.618 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "SENSOR_READ_1767198071666"
    edgeFound: true
    nextBlockId: "IF_1767198104528"
[2026-01-01 13:22:03.620 +0200] INFO: ЁЯФФ NotificationService: Received Block Event with Config
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
[2026-01-01 13:22:03.621 +0200] INFO: тЭУ IF Block Navigation Trace
    env: "development"
    blockId: "IF_1767198104528"
    result: false
    expectedHandle: "false"
    nextBlockId: "ACTUATOR_SET_1767260793750"
[2026-01-01 13:22:03.704 +0200] WARN: Block execution failed
    env: "development"
    blockId: "ACTUATOR_SET_1767260793750"
    attempt: 1
    err: "ERR_INVALID_COMMAND"
[2026-01-01 13:22:04.777 +0200] WARN: Block execution failed
    env: "development"
    blockId: "ACTUATOR_SET_1767260793750"
    attempt: 2
    err: "ERR_INVALID_COMMAND"
[2026-01-01 13:22:05.867 +0200] WARN: Block execution failed
    env: "development"
    blockId: "ACTUATOR_SET_1767260793750"
    attempt: 3
    err: "ERR_INVALID_COMMAND"
✅ DEBUG LISTENER: automation:block_end received! ACTUATOR_SET_1767260793750
[2026-01-01 13:22:06.983 +0200] WARN: Block execution failed
    env: "development"
    blockId: "ACTUATOR_SET_1767260793750"
    attempt: 4
    err: "ERR_INVALID_COMMAND"
[2026-01-01 13:22:06.983 +0200] INFO: ЁЯФФ NotificationService: Received Block Event with Config
    env: "development"
    blockId: "ACTUATOR_SET_1767260793750"
    config: {
      "channelId": "",
      "mode": "AUTO"
    }
[2026-01-01 13:22:06.984 +0200] ERROR: All retries exhausted.
    env: "development"
    blockId: "ACTUATOR_SET_1767260793750"
    policy: "STOP"
[2026-01-01 13:22:06.986 +0200] INFO: ЁЯЫбя╕П Safety Stop: Checking active resources for cleanup...
    env: "development"
    count: 1
[2026-01-01 13:22:06.986 +0200] INFO: ЁЯФД Safety Stop: Reverting Device Status
    env: "development"
    deviceId: "6953be264061fa6a35a3f13b"
    restoreTo: 0
[2026-01-01 13:22:07.066 +0200] ERROR: тЭМ Failed to revert device state during Safety Stop
    env: "development"
    deviceId: "6953be264061fa6a35a3f13b"
    err: "ERR_INVALID_COMMAND"
[2026-01-01 13:22:07.069 +0200] ERROR: тЭМ Cycle Step Failed
    env: "development"
    cycleId: "tr_1767194660674_4to7h3jd0"
    error: "ERR_INVALID_COMMAND"
[2026-01-01 13:22:07.070 +0200] ERROR: тЭМ Cycle Failed
    env: "development"
    sessionId: "695658d9a06990f80cec4271"
    reason: "Flow execution failed: ERR_INVALID_COMMAND"
[2026-01-01 13:22:07.084 +0200] INFO: ЁЯУи Sending Notification: "╨Я╤А╨╛╨│╤А╨░╨╝╤В╨░ ╤Б╨┐╨╕╤А╨░ ╨╖╨░╤А╨░╨┤╨╕  error 13:22:07 ╤З."
    env: "development"
    provider: "TelegramGroup"
    type: "telegram"
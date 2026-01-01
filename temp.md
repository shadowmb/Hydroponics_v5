[2026-01-01 15:07:12.614 +0200] INFO: ≡ƒôÑ Advanced Program Loaded
    env: "development"
    program: "ProgramAdvancet"
    windowCount: 2
[2026-01-01 15:07:20.845 +0200] INFO: ≡ƒô¥ Active Program Updated
    env: "development"
[2026-01-01 15:07:42.369 +0200] INFO: ≡ƒô¥ Active Program Updated
    env: "development"
[2026-01-01 15:07:53.499 +0200] INFO: ≡ƒô¥ Active Program Updated
    env: "development"
[15:08] INFO: ≡ƒòÆ Scheduler Tick
    env: "development"
[2026-01-01 15:08:04.950 +0200] INFO: ≡ƒô¥ Active Program Updated
    env: "development"
[2026-01-01 15:08:14.482 +0200] INFO: ≡ƒô¥ Active Program Updated
    env: "development"
[2026-01-01 15:08:25.535 +0200] INFO: Γû╢∩╕Å Active Program Started
    env: "development"
[15:08] INFO: ΓÜí Immediate Advanced Program Check
    env: "development"
[15:09] INFO: ≡ƒòÆ Scheduler Tick
    env: "development"
[15:10] INFO: ≡ƒòÆ Scheduler Tick
    env: "development"
[2026-01-01 15:10:00.007 +0200] INFO: ≡ƒöä Evaluating triggers for window
    env: "development"
    windowId: "tw_1767270037947_psub82ett"
    windowName: "╨ƒ╤Ç╨╛╨╖╨╛╤Ç╨╡╤å 1"
[2026-01-01 15:10:00.203 +0200] ERROR: Γ¥î Failed to read sensor
    env: "development"
    sensorId: "6952bc2a3b5ab4f7e2676f7c"
    error: "ERR_INVALID_HEADER"
[2026-01-01 15:10:00.203 +0200] WARN: ΓÜá∩╕Å Sensor read returned null, skipping trigger
    env: "development"
    triggerId: "tr_1767270073003_9oukjl9fz"
    sensorId: "6952bc2a3b5ab4f7e2676f7c"
[2026-01-01 15:10:00.506 +0200] INFO: ΓÜí Trigger condition matched - executing flow
    env: "development"
    triggerId: "tr_1767272213313_6ejuv3qsr"
    flowId: "pumpstart"
    behavior: "break"
[2026-01-01 15:10:00.508 +0200] INFO: ≡ƒÜÇ Starting Cycle (Trace Overrides)
    env: "development"
    cycleId: "tr_1767272213313_6ejuv3qsr"
    cycleName: "Trigger: tr_1767272213313_6ejuv3qsr"
    sessionId: "69567228c78821d72ad10796"
    stepsCount: 1
    overrides: {
      "Global 2": 60,
      "Global 2_tolerance": 5,
      "razsto globalno": 60,
      "PumpTimne": 10,
      "razsto globalno_tolerance": 5
    }
[2026-01-01 15:10:00.508 +0200] INFO: Γû╢∩╕Å Executing Cycle Step
    env: "development"
    step: 0
    flowId: "pumpstart"
[2026-01-01 15:10:00.508 +0200] INFO: ≡ƒöº Cycle Step Overrides Resolution
    env: "development"
    step: 0
    sessionOverrides: {
      "Global 2": 60,
      "Global 2_tolerance": 5,
      "razsto globalno": 60,
      "PumpTimne": 10,
      "razsto globalno_tolerance": 5,
      "cycleName": "Trigger: tr_1767272213313_6ejuv3qsr"
    }
    finalOverrides: {
      "Global 2": 60,
      "Global 2_tolerance": 5,
      "razsto globalno": 60,
      "PumpTimne": 10,
      "razsto globalno_tolerance": 5,
      "cycleName": "Trigger: tr_1767272213313_6ejuv3qsr"
    }
[2026-01-01 15:10:00.509 +0200] INFO: Γ£¿ AutomationEngine Actor Initialized/Reset (Session: none)
    env: "development"
[2026-01-01 15:10:00.510 +0200] INFO: ≡ƒº⌐ AutomationEngine: Input Resolution
    env: "development"
    overrides: {
      "Global 2": 60,
      "Global 2_tolerance": 5,
      "razsto globalno": 60,
      "PumpTimne": 10,
      "razsto globalno_tolerance": 5,
      "cycleName": "Trigger: tr_1767272213313_6ejuv3qsr"
    }
    variablesResolved: {}
[2026-01-01 15:10:00.512 +0200] INFO: ≡ƒôÑ Loading Program Session
    env: "development"
    sessionId: "69567228c78821d72ad1079d"
    programId: "pumpstart"
    variables: {
      "global_2": 60,
      "razsto globalno": 60,
      "razsto globalno_tolerance": 5,
      "global_2_tolerance": 5,
      "global_3": 10,
      "PumpTimne": 10
    }
✅ DEBUG LISTENER: automation:block_end received! start
[2026-01-01 15:10:00.516 +0200] INFO: ≡ƒöö NotificationService: Received Block Event with Config
    env: "development"
    blockId: "start"
    config: {
      "config": {
        "label": "Start",
        "hasError": false
      }
    }
[2026-01-01 15:10:00.516 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "start"
    edgeFound: true
    nextBlockId: "SENSOR_READ_1767272016514"
[2026-01-01 15:10:00.517 +0200] INFO: ≡ƒÜÇ Trigger flow started - waiting for completion
    env: "development"
    windowId: "tw_1767270037947_psub82ett"
    triggerId: "tr_1767272213313_6ejuv3qsr"
    flowSessionId: "69567228c78821d72ad10796"
[2026-01-01 15:10:00.527 +0200] INFO: ≡ƒô¿ Sending Notification: "Γä╣∩╕Å Event: CYCLE_START"
    env: "development"
    provider: "Telegram"
    type: "telegram"
[2026-01-01 15:10:00.530 +0200] INFO: ≡ƒô¿ Sending Notification: "≡ƒÜÇ Program Started"
    env: "development"
    provider: "Telegram"
    type: "telegram"
[SensorRead] ✔️ Saved to 'var_1': 188.5 cm
✅ DEBUG LISTENER: automation:block_end received! SENSOR_READ_1767272016514
[IfBlock DEBUG] Params: {
  "operator": "==",
  "onFailure": "STOP",
  "errorNotification": false,
  "notificationChannelId": "",
  "notificationMode": "AUTO",
  "label": "Condition (IF)",
  "hasError": false,
  "variable": "var_1",
  "value": "{{global_2}}",
  "_blockId": "IF_1767272021401"
}
[IfBlock DEBUG] Checking Left Tolerance for: 'var_1'
[IfBlock DEBUG] Checking Right Tolerance for: {{global_2}}
[IfBlock Tolerance] Applied for 'global_2': 5 (Mode: symmetric)
✅ DEBUG LISTENER: automation:block_end received! IF_1767272021401
[ActuatorSet] ⏳ Starting Pulse: 10s (10000ms)...
[2026-01-01 15:10:01.224 +0200] INFO: ≡ƒöö NotificationService: Received Block Event with Config
    env: "development"
    blockId: "SENSOR_READ_1767272016514"
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
        "deviceId": "6952bc2a3b5ab4f7e2676f7c",
        "variable": "var_1"
      }
    }
[2026-01-01 15:10:01.224 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "SENSOR_READ_1767272016514"
    edgeFound: true
    nextBlockId: "IF_1767272021401"
[2026-01-01 15:10:01.226 +0200] INFO: ≡ƒöö NotificationService: Received Block Event with Config
    env: "development"
    blockId: "IF_1767272021401"
    config: {
      "channelId": "",
      "mode": "AUTO",
      "config": {
        "operator": "==",
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
[2026-01-01 15:10:01.227 +0200] INFO: Γ¥ô IF Block Navigation Trace
    env: "development"
    blockId: "IF_1767272021401"
    result: false
    expectedHandle: "false"
    nextBlockId: "ACTUATOR_SET_1767272078708"
[ActuatorSet] ✔️ Pulsed 'PULSE_ON' for 10.00s
✅ DEBUG LISTENER: automation:block_end received! ACTUATOR_SET_1767272078708
✅ DEBUG LISTENER: automation:block_end received! end
[2026-01-01 15:10:11.736 +0200] INFO: ≡ƒöö NotificationService: Received Block Event with Config
    env: "development"
    blockId: "ACTUATOR_SET_1767272078708"
    config: {
      "channelId": "",
      "mode": "AUTO",
      "config": {
        "strategy": "actuator_manual",
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
        "deviceId": "69510af85bb60cca7130e750",
        "action": "PULSE_ON",
        "duration": "{{global_3}}"
      }
    }
[2026-01-01 15:10:11.738 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "ACTUATOR_SET_1767272078708"
    edgeFound: true
    nextBlockId: "end"
[2026-01-01 15:10:11.739 +0200] INFO: ≡ƒöö NotificationService: Received Block Event with Config
    env: "development"
    blockId: "end"
    config: {
      "config": {
        "label": "End",
        "hasError": false
      }
    }
[2026-01-01 15:10:11.742 +0200] INFO: Γ£à Cycle Step Completed
    env: "development"
    cycleId: "tr_1767272213313_6ejuv3qsr"
    step: 0
[2026-01-01 15:10:11.742 +0200] INFO: ≡ƒÅü Cycle Completed Successfully
    env: "development"
    sessionId: "69567228c78821d72ad10796"
[2026-01-01 15:10:11.750 +0200] INFO: ≡ƒô¿ Sending Notification: "≡ƒ¢æ Program Stopped"
    env: "development"
    provider: "Telegram"
    type: "telegram"
[2026-01-01 15:10:11.754 +0200] INFO: ≡ƒô¿ Sending Notification: "Γä╣∩╕Å Event: CYCLE_COMPLETE"
    env: "development"
    provider: "Telegram"
    type: "telegram"
[15:11] INFO: ≡ƒòÆ Scheduler Tick
    env: "development"
[2026-01-01 15:11:00.009 +0200] INFO: Γ£à Trigger flow finished
    env: "development"
    windowId: "tw_1767270037947_psub82ett"
    sessionId: "69567228c78821d72ad10796"
[2026-01-01 15:11:00.010 +0200] INFO: ≡ƒ¢æ BREAK trigger finished - closing window
    env: "development"
    windowId: "tw_1767270037947_psub82ett"
[15:12] INFO: ≡ƒòÆ Scheduler Tick
    env: "development"
[15:13] INFO: ≡ƒòÆ Scheduler Tick
    env: "development"
[15:14] INFO: ≡ƒòÆ Scheduler Tick
    env: "development"
[15:15] INFO: ≡ƒòÆ Scheduler Tick
    env: "development"
[2026-01-01 15:15:00.013 +0200] INFO: ≡ƒöä Evaluating triggers for window
    env: "development"
    windowId: "tw_1767270057179_wrierh2c5"
    windowName: "╨ƒ╤Ç╨╛╨╖╨╛╤Ç╨╡╤å 2"
✅ DEBUG LISTENER: automation:block_end received! start
[2026-01-01 15:15:00.228 +0200] INFO: ΓÜí Trigger condition matched - executing flow
    env: "development"
    triggerId: "tr_1767270090899_061us44v1"
    flowId: "meri_razstoyanie"
    behavior: "break"
[2026-01-01 15:15:00.230 +0200] INFO: ≡ƒÜÇ Starting Cycle (Trace Overrides)
    env: "development"
    cycleId: "tr_1767270090899_061us44v1"
    cycleName: "Trigger: tr_1767270090899_061us44v1"
    sessionId: "69567354c78821d72ad10824"
    stepsCount: 1
    overrides: {
      "Global 2": 60,
      "Global 2_tolerance": 5,
      "razsto globalno": 60,
      "PumpTimne": 10,
      "razsto globalno_tolerance": 5
    }
[2026-01-01 15:15:00.230 +0200] INFO: Γû╢∩╕Å Executing Cycle Step
    env: "development"
    step: 0
    flowId: "meri_razstoyanie"
[2026-01-01 15:15:00.230 +0200] INFO: ≡ƒöº Cycle Step Overrides Resolution
    env: "development"
    step: 0
    sessionOverrides: {
      "Global 2": 60,
      "Global 2_tolerance": 5,
      "razsto globalno": 60,
      "PumpTimne": 10,
      "razsto globalno_tolerance": 5,
      "cycleName": "Trigger: tr_1767270090899_061us44v1"
    }
    finalOverrides: {
      "Global 2": 60,
      "Global 2_tolerance": 5,
      "razsto globalno": 60,
      "PumpTimne": 10,
      "razsto globalno_tolerance": 5,
      "cycleName": "Trigger: tr_1767270090899_061us44v1"
    }
[2026-01-01 15:15:00.231 +0200] INFO: Γ£¿ AutomationEngine Actor Initialized/Reset (Session: none)
    env: "development"
[2026-01-01 15:15:00.232 +0200] INFO: ≡ƒº⌐ AutomationEngine: Input Resolution
    env: "development"
    overrides: {
      "Global 2": 60,
      "Global 2_tolerance": 5,
      "razsto globalno": 60,
      "PumpTimne": 10,
      "razsto globalno_tolerance": 5,
      "cycleName": "Trigger: tr_1767270090899_061us44v1"
    }
    variablesResolved: {}
[2026-01-01 15:15:00.234 +0200] INFO: ≡ƒôÑ Loading Program Session
    env: "development"
    sessionId: "69567354c78821d72ad1082a"
    programId: "meri_razstoyanie"
    variables: {
      "global_2": 60,
      "Global 2": 60,
      "Global 2_tolerance": 5,
      "global_2_tolerance": 5
    }
[2026-01-01 15:15:00.236 +0200] INFO: ≡ƒöö NotificationService: Received Block Event with Config
    env: "development"
    blockId: "start"
    config: {
      "config": {
        "label": "Start",
        "hasError": false
      }
    }
[2026-01-01 15:15:00.236 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "start"
    edgeFound: true
    nextBlockId: "SENSOR_READ_1767271841791"
[2026-01-01 15:15:00.237 +0200] INFO: ≡ƒÜÇ Trigger flow started - waiting for completion
    env: "development"
    windowId: "tw_1767270057179_wrierh2c5"
    triggerId: "tr_1767270090899_061us44v1"
    flowSessionId: "69567354c78821d72ad10824"
[2026-01-01 15:15:00.249 +0200] INFO: ≡ƒô¿ Sending Notification: "≡ƒÜÇ Program Started"
    env: "development"
    provider: "Telegram"
    type: "telegram"
[2026-01-01 15:15:00.251 +0200] INFO: ≡ƒô¿ Sending Notification: "Γä╣∩╕Å Event: CYCLE_START"
    env: "development"
    provider: "Telegram"
    type: "telegram"
[2026-01-01 15:15:00.427 +0200] WARN: Block execution failed
    env: "development"
    blockId: "SENSOR_READ_1767271841791"
    attempt: 1
    err: "ERR_INVALID_HEADER"
[SensorRead] ✔️ Saved to 'var_1': 188.6 cm
✅ DEBUG LISTENER: automation:block_end received! SENSOR_READ_1767271841791
✅ DEBUG LISTENER: automation:block_end received! end
[2026-01-01 15:15:01.659 +0200] INFO: ≡ƒöö NotificationService: Received Block Event with Config
    env: "development"
    blockId: "SENSOR_READ_1767271841791"
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
        "deviceId": "6952bc2a3b5ab4f7e2676f7c",
        "variable": "var_1"
      }
    }
[2026-01-01 15:15:01.659 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "SENSOR_READ_1767271841791"
    edgeFound: true
    nextBlockId: "end"
[2026-01-01 15:15:01.659 +0200] INFO: ≡ƒöö NotificationService: Received Block Event with Config
    env: "development"
    blockId: "end"
    config: {
      "config": {
        "label": "End",
        "hasError": false
      }
    }
[2026-01-01 15:15:01.662 +0200] INFO: Γ£à Cycle Step Completed
    env: "development"
    cycleId: "tr_1767270090899_061us44v1"
    step: 0
[2026-01-01 15:15:01.662 +0200] INFO: ≡ƒÅü Cycle Completed Successfully
    env: "development"
    sessionId: "69567354c78821d72ad10824"
[2026-01-01 15:15:01.667 +0200] INFO: ≡ƒô¿ Sending Notification: "≡ƒ¢æ Program Stopped"
    env: "development"
    provider: "Telegram"
    type: "telegram"
[2026-01-01 15:15:01.670 +0200] INFO: ≡ƒô¿ Sending Notification: "Γä╣∩╕Å Event: CYCLE_COMPLETE"
    env: "development"
    provider: "Telegram"
    type: "telegram"
[15:16] INFO: ≡ƒòÆ Scheduler Tick
    env: "development"
[2026-01-01 15:16:00.015 +0200] INFO: Γ£à Trigger flow finished
    env: "development"
    windowId: "tw_1767270057179_wrierh2c5"
    sessionId: "69567354c78821d72ad10824"
[2026-01-01 15:16:00.015 +0200] INFO: ≡ƒ¢æ BREAK trigger finished - closing window
    env: "development"
    windowId: "tw_1767270057179_wrierh2c5"
[2026-01-01 15:16:00.018 +0200] INFO: ≡ƒÅü All windows completed - Advanced Program finished for today
    env: "development"




    Live Monitor:

    Лог на изпълнението
15 записа
15:10:00
Прозорец "Прозорец 1" - Активен
15:10:00
📊 Ultra = 188.5 → ⚡ > 60 ✓
15:10:00
✓ start
15:10:01
✓ SENSOR: Read 188.50 cm
15:10:01
✓ IF: 188.50 == [55–65] => FALSE
15:10:11
✓ ACTUATOR: Pulsed ON for 10.0s
15:10:11
✓ end: Total Time: 0m 11.2s
15:11:00
Прозорец "Прозорец 1" - Завършен чрез тригер
15:15:00
Прозорец "Прозорец 2" - Активен
15:15:00
📊 Ultra = 188.6 → ⚡ > 150 ✓
15:15:00
✓ start
15:15:01
✓ SENSOR: Read 188.60 cm
15:15:01
✓ end: Total Time: 0m 1.4s
15:16:00
Прозорец "Прозорец 2" - Завършен чрез тригер
15:16:00
🏁 Програмата завърши за днес
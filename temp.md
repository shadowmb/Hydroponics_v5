✅ DEBUG LISTENER: automation:block_end received! start
[ActuatorSet] 💧 Dose conversion: 5 doses × 5ml = 25ml
[ActuatorSet] ⏳ Starting Dose: 5doses (~6.3s)...
[2026-01-02 22:22:19.625 +0200] INFO: ΓÜí Cycle Force Started (Time updated to Now)
    env: "development"
    itemId: "695828e43c7aaa67ea3a50a0"
    newTime: "22:22"
[2026-01-02 22:22:19.628 +0200] INFO: Attempting to start cycle with sanitized steps
    env: "development"
    cycleId: "69578ded33b7ceb9161834e8"
    steps: [
      {
        "flowId": "dose_test",
        "overrides": {}
      }
    ]
[2026-01-02 22:22:19.633 +0200] INFO: ≡ƒÜÇ Starting Cycle (Trace Overrides)
    env: "development"
    cycleId: "69578ded33b7ceb9161834e8"
    cycleName: "69578ded33b7ceb9161834e8"
    sessionId: "695828fb50673771a5afa738"
    stepsCount: 1
    overrides: {
      "╨ö╨╛╨╖╨╕": 5,
      "╨ö╨╛╨╖╨╕_tolerance": 0
    }
[2026-01-02 22:22:19.634 +0200] INFO: Γû╢∩╕Å Executing Cycle Step
    env: "development"
    step: 0
    flowId: "dose_test"
[2026-01-02 22:22:19.634 +0200] INFO: ≡ƒöº Cycle Step Overrides Resolution
    env: "development"
    step: 0
    sessionOverrides: {
      "╨ö╨╛╨╖╨╕": 5,
      "╨ö╨╛╨╖╨╕_tolerance": 0,
      "cycleName": "69578ded33b7ceb9161834e8"
    }
    finalOverrides: {
      "╨ö╨╛╨╖╨╕": 5,
      "╨ö╨╛╨╖╨╕_tolerance": 0,
      "cycleName": "69578ded33b7ceb9161834e8"
    }
[2026-01-02 22:22:19.636 +0200] INFO: Γ£¿ AutomationEngine Actor Initialized/Reset (Session: none)
    env: "development"
[2026-01-02 22:22:19.651 +0200] INFO: ≡ƒº⌐ AutomationEngine: Input Resolution
    env: "development"
    overrides: {
      "╨ö╨╛╨╖╨╕": 5,
      "╨ö╨╛╨╖╨╕_tolerance": 0,
      "cycleName": "69578ded33b7ceb9161834e8"
    }
    variablesResolved: {}
[2026-01-02 22:22:19.653 +0200] INFO: ≡ƒôÑ Loading Program Session
    env: "development"
    sessionId: "695828fb50673771a5afa73d"
    programId: "dose_test"
    variables: {
      "global_1": 5,
      "╨ö╨╛╨╖╨╕": 5,
      "╨ö╨╛╨╖╨╕_tolerance": 0,
      "global_1_tolerance": 0
    }
[2026-01-02 22:22:19.660 +0200] INFO: ≡ƒöö NotificationService: Received Block Event with Config
    env: "development"
    blockId: "start"
    config: {
      "config": {
        "label": "Start",
        "hasError": false
      }
    }
[2026-01-02 22:22:19.660 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "start"
    edgeFound: true
    nextBlockId: "ACTUATOR_SET_1767385185450"
[2026-01-02 22:22:19.705 +0200] INFO: ≡ƒô¿ Sending Notification: "≡ƒÜÇ Program Started"
    env: "development"
    provider: "Telegram"
    type: "telegram"
[2026-01-02 22:22:19.707 +0200] INFO: ≡ƒô¿ Sending Notification: "Γä╣∩╕Å Event: CYCLE_START"
    env: "development"
    provider: "Telegram"
    type: "telegram"
[2026-01-02 22:22:19.778 +0200] INFO: ≡ƒöî [UdpTransport] Initializing...
    env: "development"
    ip: "192.168.0.44"
    port: 8888
[2026-01-02 22:22:19.779 +0200] INFO: Γ£à [UdpTransport] Listening
    env: "development"
    address: {
      "address": "0.0.0.0",
      "family": "IPv4",
      "port": 49255
    }
[ActuatorSet] ✔️ Pulsed 'DOSE' for 6.25s
✅ DEBUG LISTENER: automation:block_end received! ACTUATOR_SET_1767385185450
✅ DEBUG LISTENER: automation:block_end received! end
[2026-01-02 22:22:26.272 +0200] INFO: ≡ƒöö NotificationService: Received Block Event with Config
    env: "development"
    blockId: "ACTUATOR_SET_1767385185450"
    config: {
      "channelId": "",
      "mode": "AUTO",
      "config": {
        "strategy": "volumetric_flow",
        "amountMode": "DOSES",
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
        "deviceId": "6956db4e06968f74a3d46e18",
        "action": "DOSE",
        "amount": "{{global_1}}"
      }
    }
[2026-01-02 22:22:26.272 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "ACTUATOR_SET_1767385185450"
    edgeFound: true
    nextBlockId: "end"
[2026-01-02 22:22:26.273 +0200] INFO: ≡ƒöö NotificationService: Received Block Event with Config
    env: "development"
    blockId: "end"
    config: {
      "config": {
        "label": "End",
        "hasError": false
      }
    }
[2026-01-02 22:22:26.277 +0200] INFO: Γ£à Cycle Step Completed
    env: "development"
    cycleId: "69578ded33b7ceb9161834e8"
    step: 0
[2026-01-02 22:22:26.277 +0200] INFO: ≡ƒÅü Cycle Completed Successfully
    env: "development"
    sessionId: "695828fb50673771a5afa738"
[2026-01-02 22:22:26.285 +0200] INFO: ≡ƒô¿ Sending Notification: "≡ƒ¢æ Program Stopped"
    env: "development"
    provider: "Telegram"
    type: "telegram"
[2026-01-02 22:22:26.287 +0200] INFO: Γ£à Active Program Cycle Marked Completed
    env: "development"
    cycleId: "69578ded33b7ceb9161834e8"
[2026-01-02 22:22:26.293 +0200] INFO: ≡ƒô¿ Sending Notification: "Γä╣∩╕Å Event: CYCLE_COMPLETE"
    env: "development"
    provider: "Telegram"
    type: "telegram"
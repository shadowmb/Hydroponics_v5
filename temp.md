✅ DEBUG LISTENER: automation:block_end received! start
[2026-01-17 21:48:27.494 +0200] INFO: ✨ AutomationEngine Actor Initialized/Reset (Session: none)
    env: "development"
[2026-01-17 21:48:27.496 +0200] INFO: 🧩 AutomationEngine: Input Resolution
    env: "development"
    overrides: {}
    variablesResolved: {}
[2026-01-17 21:48:27.499 +0200] INFO: 📥 Loading Program Session
    env: "development"
    sessionId: "696be78b09059a5b3585a3a8"
    programId: "test_temp"
    variables: {}
[2026-01-17 21:48:27.500 +0200] INFO: 💾 Syncing Session Status to DB
    env: "development"
    sessionId: "696be78b09059a5b3585a3a8"
    updates: {
      "status": "loaded"
    }
[2026-01-17 21:48:27.507 +0200] INFO: 💾 Syncing Session Status to DB
    env: "development"
    sessionId: "696be78b09059a5b3585a3a8"
    updates: {
      "status": "running"
    }
[2026-01-17 21:48:27.508 +0200] INFO: 🔔 NotificationService: Received Block Event with Config
    env: "development"
    blockId: "start"
    config: {
      "config": {
        "label": "Start",
        "hasError": false
      }
    }
[2026-01-17 21:48:27.508 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "start"
    edgeFound: true
    nextBlockId: "SENSOR_READ_1768678747452"
[2026-01-17 21:48:27.511 +0200] INFO: 💾 Syncing Session Status to DB
    env: "development"
    sessionId: "696be78b09059a5b3585a3a8"
    updates: {
      "status": "running"
    }
[2026-01-17 21:48:27.520 +0200] INFO: 📨 Sending Notification: "🚀 Program Started"
    env: "development"
    provider: "Telegram"
    type: "telegram"
[2026-01-17 21:48:27.526 +0200] INFO: 📤 [UdpTransport] Sending Raw Message
    env: "development"
    ip: "127.0.0.1"
    port: 8888
    message: "ONEWIRE_READ_TEMP|D2_2"
[2026-01-17 21:48:27.528 +0200] INFO: 📊 [SensorProcessor] Starting Burst Read
    env: "development"
    deviceId: "69673845571cb443c36d559d"
    count: 3
    delayMs: 100
[2026-01-17 21:48:27.530 +0200] INFO: 📤 [UdpTransport] Sending Raw Message
    env: "development"
    ip: "127.0.0.1"
    port: 8888
    message: "ONEWIRE_READ_TEMP|D2_2"
[2026-01-17 21:48:27.643 +0200] INFO: 📤 [UdpTransport] Sending Raw Message
    env: "development"
    ip: "127.0.0.1"
    port: 8888
    message: "ONEWIRE_READ_TEMP|D2_2"
[2026-01-17 21:48:27.748 +0200] INFO: 📤 [UdpTransport] Sending Raw Message
    env: "development"
    ip: "127.0.0.1"
    port: 8888
    message: "ONEWIRE_READ_TEMP|D2_2"
[2026-01-17 21:48:27.750 +0200] WARN: [SensorValidation] Device Temp 18 SIM invalid read (Attempt 1/2): Value 120 above user max 100
    env: "development"
[2026-01-17 21:48:27.856 +0200] INFO: 📊 [SensorProcessor] Starting Burst Read
    env: "development"
    deviceId: "69673845571cb443c36d559d"
    count: 3
    delayMs: 100
[2026-01-17 21:48:27.860 +0200] INFO: 📤 [UdpTransport] Sending Raw Message
    env: "development"
    ip: "127.0.0.1"
    port: 8888
    message: "ONEWIRE_READ_TEMP|D2_2"
[2026-01-17 21:48:27.966 +0200] INFO: 📤 [UdpTransport] Sending Raw Message
    env: "development"
    ip: "127.0.0.1"
    port: 8888
    message: "ONEWIRE_READ_TEMP|D2_2"
[2026-01-17 21:48:28.080 +0200] INFO: 📤 [UdpTransport] Sending Raw Message
    env: "development"
    ip: "127.0.0.1"
    port: 8888
    message: "ONEWIRE_READ_TEMP|D2_2"
[2026-01-17 21:48:28.082 +0200] WARN: [SensorValidation] Device Temp 18 SIM invalid read (Attempt 2/2): Value 120 above user max 100
    env: "development"
[2026-01-17 21:48:28.082 +0200] WARN: [SensorValidation-DEBUG] Config: Action=useLastValid, Timeout=5000, DefaultVal=undefined (Type: undefined)
    env: "development"
[2026-01-17 21:48:28.082 +0200] ERROR: [SensorValidation] Device Temp 18 SIM failed after 2 attempts. Action: useLastValid. Consec. Failures: 4
    env: "development"
[2026-01-17 21:48:28.082 +0200] WARN: [SensorValidation-DEBUG] Checking Age: 242447ms vs Timeout: 5000ms
    env: "development"
[2026-01-17 21:48:28.082 +0200] WARN: [SensorValidation] FAIL: Last valid expired (242447ms > 5000ms) AND No Default Value allowed/set.
    env: "development"
[2026-01-17 21:48:28.082 +0200] WARN: Block execution failed
    env: "development"
    blockId: "SENSOR_READ_1768678747452"
    attempt: 1
    err: "Last valid value too old (242447ms > 5000ms) and no valid Default Value configured."
[2026-01-17 21:48:29.088 +0200] INFO: 📤 [UdpTransport] Sending Raw Message
    env: "development"
    ip: "127.0.0.1"
    port: 8888
    message: "ONEWIRE_READ_TEMP|D2_2"
[2026-01-17 21:48:29.089 +0200] INFO: 📊 [SensorProcessor] Starting Burst Read
    env: "development"
    deviceId: "69673845571cb443c36d559d"
    count: 3
    delayMs: 100
[2026-01-17 21:48:29.091 +0200] INFO: 📤 [UdpTransport] Sending Raw Message
    env: "development"
    ip: "127.0.0.1"
    port: 8888
    message: "ONEWIRE_READ_TEMP|D2_2"
[2026-01-17 21:48:29.206 +0200] INFO: 📤 [UdpTransport] Sending Raw Message
    env: "development"
    ip: "127.0.0.1"
    port: 8888
    message: "ONEWIRE_READ_TEMP|D2_2"
[2026-01-17 21:48:29.325 +0200] INFO: 📤 [UdpTransport] Sending Raw Message
    env: "development"
    ip: "127.0.0.1"
    port: 8888
    message: "ONEWIRE_READ_TEMP|D2_2"
[2026-01-17 21:48:29.326 +0200] WARN: [SensorValidation] Device Temp 18 SIM invalid read (Attempt 1/2): Value 120 above user max 100
    env: "development"
[2026-01-17 21:48:29.431 +0200] INFO: 📊 [SensorProcessor] Starting Burst Read
    env: "development"
    deviceId: "69673845571cb443c36d559d"
    count: 3
    delayMs: 100
[2026-01-17 21:48:29.434 +0200] INFO: 📤 [UdpTransport] Sending Raw Message
    env: "development"
    ip: "127.0.0.1"
    port: 8888
    message: "ONEWIRE_READ_TEMP|D2_2"
[2026-01-17 21:48:29.552 +0200] INFO: 📤 [UdpTransport] Sending Raw Message
    env: "development"
    ip: "127.0.0.1"
    port: 8888
    message: "ONEWIRE_READ_TEMP|D2_2"
[2026-01-17 21:48:29.671 +0200] INFO: 📤 [UdpTransport] Sending Raw Message
    env: "development"
    ip: "127.0.0.1"
    port: 8888
    message: "ONEWIRE_READ_TEMP|D2_2"
[2026-01-17 21:48:29.672 +0200] WARN: [SensorValidation] Device Temp 18 SIM invalid read (Attempt 2/2): Value 120 above user max 100
    env: "development"
[2026-01-17 21:48:29.672 +0200] WARN: [SensorValidation-DEBUG] Config: Action=useLastValid, Timeout=5000, DefaultVal=undefined (Type: undefined)
    env: "development"
[2026-01-17 21:48:29.672 +0200] ERROR: [SensorValidation] Device Temp 18 SIM failed after 2 attempts. Action: useLastValid. Consec. Failures: 5
    env: "development"
[2026-01-17 21:48:29.672 +0200] WARN: [SensorValidation-DEBUG] Checking Age: 244037ms vs Timeout: 5000ms
    env: "development"
[2026-01-17 21:48:29.672 +0200] WARN: [SensorValidation] FAIL: Last valid expired (244037ms > 5000ms) AND No Default Value allowed/set.
    env: "development"
[2026-01-17 21:48:29.672 +0200] WARN: Block execution failed
    env: "development"
    blockId: "SENSOR_READ_1768678747452"
    attempt: 2
    err: "Last valid value too old (244037ms > 5000ms) and no valid Default Value configured."
[21:48] INFO: 🕒 Scheduler Tick
    env: "development"
    isSim: false
[2026-01-17 21:48:30.684 +0200] INFO: 📤 [UdpTransport] Sending Raw Message
    env: "development"
    ip: "127.0.0.1"
    port: 8888
    message: "ONEWIRE_READ_TEMP|D2_2"
[2026-01-17 21:48:30.685 +0200] INFO: 📊 [SensorProcessor] Starting Burst Read
    env: "development"
    deviceId: "69673845571cb443c36d559d"
    count: 3
    delayMs: 100
[2026-01-17 21:48:30.687 +0200] INFO: 📤 [UdpTransport] Sending Raw Message
    env: "development"
    ip: "127.0.0.1"
    port: 8888
    message: "ONEWIRE_READ_TEMP|D2_2"
[2026-01-17 21:48:30.803 +0200] INFO: 📤 [UdpTransport] Sending Raw Message
    env: "development"
    ip: "127.0.0.1"
    port: 8888
    message: "ONEWIRE_READ_TEMP|D2_2"
[2026-01-17 21:48:30.911 +0200] INFO: 📤 [UdpTransport] Sending Raw Message
    env: "development"
    ip: "127.0.0.1"
    port: 8888
    message: "ONEWIRE_READ_TEMP|D2_2"
[2026-01-17 21:48:30.913 +0200] WARN: [SensorValidation] Device Temp 18 SIM invalid read (Attempt 1/2): Value 120 above user max 100
    env: "development"
[2026-01-17 21:48:31.021 +0200] INFO: 📊 [SensorProcessor] Starting Burst Read
    env: "development"
    deviceId: "69673845571cb443c36d559d"
    count: 3
    delayMs: 100
[2026-01-17 21:48:31.025 +0200] INFO: 📤 [UdpTransport] Sending Raw Message
    env: "development"
    ip: "127.0.0.1"
    port: 8888
    message: "ONEWIRE_READ_TEMP|D2_2"
[2026-01-17 21:48:31.128 +0200] INFO: 📤 [UdpTransport] Sending Raw Message
    env: "development"
    ip: "127.0.0.1"
    port: 8888
    message: "ONEWIRE_READ_TEMP|D2_2"
✅ DEBUG LISTENER: automation:block_end received! SENSOR_READ_1768678747452
[IfBlock DEBUG] Params: {
  "operator": "==",
  "onFailure": "STOP",
  "errorNotification": false,
  "notificationChannelId": "",
  "notificationMode": "AUTO",
  "label": "Condition (IF)",
  "hasError": false,
  "variable": "var_1",
  "value": "500",
  "_blockId": "IF_1768679266459"
}
[IfBlock] Comparison involves NaN/undefined: undefined == 500
[IfBlock DEBUG] Checking Left Tolerance for: 'var_1'
✅ DEBUG LISTENER: automation:block_end received! IF_1768679266459
✅ DEBUG LISTENER: automation:block_end received! end
[2026-01-17 21:48:31.235 +0200] INFO: 📤 [UdpTransport] Sending Raw Message
    env: "development"
    ip: "127.0.0.1"
    port: 8888
    message: "ONEWIRE_READ_TEMP|D2_2"
[2026-01-17 21:48:31.236 +0200] WARN: [SensorValidation] Device Temp 18 SIM invalid read (Attempt 2/2): Value 120 above user max 100
    env: "development"
[2026-01-17 21:48:31.237 +0200] WARN: [SensorValidation-DEBUG] Config: Action=useLastValid, Timeout=5000, DefaultVal=undefined (Type: undefined)
    env: "development"
[2026-01-17 21:48:31.237 +0200] ERROR: [SensorValidation] Device Temp 18 SIM failed after 2 attempts. Action: useLastValid. Consec. Failures: 6
    env: "development"
[2026-01-17 21:48:31.237 +0200] WARN: [SensorValidation-DEBUG] Checking Age: 245602ms vs Timeout: 5000ms
    env: "development"
[2026-01-17 21:48:31.237 +0200] WARN: [SensorValidation] FAIL: Last valid expired (245602ms > 5000ms) AND No Default Value allowed/set.
    env: "development"
[2026-01-17 21:48:31.237 +0200] WARN: Block execution failed
    env: "development"
    blockId: "SENSOR_READ_1768678747452"
    attempt: 3
    err: "Last valid value too old (245602ms > 5000ms) and no valid Default Value configured."
[2026-01-17 21:48:31.237 +0200] INFO: 🔔 NotificationService: Received Block Event with Config
    env: "development"
    blockId: "SENSOR_READ_1768678747452"
    config: {
      "channelId": "",
      "mode": "AUTO"
    }
[2026-01-17 21:48:31.237 +0200] ERROR: All retries exhausted.
    env: "development"
    blockId: "SENSOR_READ_1768678747452"
    policy: "CONTINUE"
[2026-01-17 21:48:31.238 +0200] INFO: 💾 Syncing Session Status to DB
    env: "development"
    sessionId: "696be78b09059a5b3585a3a8"
    updates: {
      "status": "running"
    }
[2026-01-17 21:48:31.239 +0200] INFO: 🔔 NotificationService: Received Block Event with Config
    env: "development"
    blockId: "IF_1768679266459"
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
        "value": "500"
      }
    }
[2026-01-17 21:48:31.239 +0200] INFO: ❓ IF Block Navigation Trace
    env: "development"
    blockId: "IF_1768679266459"
    result: false
    expectedHandle: "false"
    nextBlockId: "end"
[2026-01-17 21:48:31.239 +0200] INFO: 💾 Syncing Session Status to DB
    env: "development"
    sessionId: "696be78b09059a5b3585a3a8"
    updates: {
      "status": "running"
    }
[2026-01-17 21:48:31.239 +0200] INFO: 🔔 NotificationService: Received Block Event with Config
    env: "development"
    blockId: "end"
    config: {
      "config": {
        "label": "End",
        "hasError": false
      }
    }
[2026-01-17 21:48:31.240 +0200] INFO: 💾 Syncing Session Status to DB
    env: "development"
    sessionId: "696be78b09059a5b3585a3a8"
    updates: {
      "status": "completed",
      "endTime": "2026-01-17T19:48:31.240Z"
    }
[2026-01-17 21:48:31.248 +0200] INFO: 📨 Sending Notification: "🛑 Program Stopped"
    env: "development"
    provider: "Telegram"
    type: "telegram"
Това е от конзолата:
[2025-12-11 23:59:18.343 +0200] INFO: ЁЯФМ Client Connected to WebSocket
    env: "development"
    socketId: "Qr6CrGwuqcZ-D2FhAAAB"
[2025-12-11 23:59:29.251 +0200] INFO: ЁЯФМ [HardwareService] Creating Serial Transport
    env: "development"
    controllerId: "693134db23b1320394ed43b5"
    port: "COM3"
[2025-12-11 23:59:29.252 +0200] INFO: ЁЯФМ [SerialTransport] Connecting...
    env: "development"
    path: "COM3"
    baudRate: 9600
[2025-12-11 23:59:29.302 +0200] INFO: тЬЕ [SerialTransport] Port Opened
    env: "development"
    path: "COM3"
[2025-12-11 23:59:31.377 +0200] INFO: ЁЯУК [HardwareService] Burst Read Mode
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    sampleCount: 3
    sampleDelay: 50
[2025-12-11 23:59:31.701 +0200] INFO: тЬЕ [HardwareService] Median Calculated
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    samples: [
      18.6,
      18.6,
      18.6
    ]
    median: 18.6
    min: 18.6
    max: 18.6
[2025-12-11 23:59:31.702 +0200] INFO: ЁЯФН [HardwareService] Checking Normalization
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    driverId: "hc_sr04"
    sourceUnit: "cm"
    raw: 18.6
    value: 18.6
[2025-12-11 23:59:31.702 +0200] INFO: ЁЯФН [HardwareService] Normalization Result
    env: "development"
    normalized: {
      "value": 186,
      "baseUnit": "mm"
    }
[2025-12-11 23:59:31.702 +0200] INFO: ЁЯУП [HardwareService] Normalized Value
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    from: "cm"
    to: "mm"
    original: 18.6
    normalized: 186
[2025-12-11 23:59:31.702 +0200] INFO: ЁЯСА [HardwareService] Converted Primary to Display Unit
    env: "development"
    deviceId: "693aa44c9ef0525c5181c7ed"
    from: "mm"
    to: "mm"
    original: 186
    converted: 186

Това е в ДБ след записа:

[11:59:31 PM] [SUCCESS] Read OK: 186 mm (Raw: 18.6) [Full Response: {"ok":1,"distance":58.6,"baseValue":186,"baseUnit":"mm"}]
[11:59:31 PM] [INFO] [SENT] ULTRASONIC_TRIG_ECHO|D10_10|D11_11
[11:59:31 PM] [INFO] [SENT] ULTRASONIC_TRIG_ECHO|D10_10|D11_11
[11:59:31 PM] [INFO] [SENT] ULTRASONIC_TRIG_ECHO|D10_10|D11_11
[11:59:31 PM] [INFO] [SENT] ULTRASONIC_TRIG_ECHO|D10_10|D11_11
[11:59:28 PM] [INFO] Reading value...
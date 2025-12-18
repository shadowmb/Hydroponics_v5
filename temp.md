
Това е лога от тест на линейна стратегия:

[2025-12-17 15:40:18.637 +0200] INFO: ЁЯФМ [HardwareService] Creating Serial Transport
    env: "development"
    controllerId: "693134db23b1320394ed43b5"
    port: "COM3"
[2025-12-17 15:40:18.637 +0200] INFO: ЁЯФМ [SerialTransport] Connecting...
    env: "development"
    path: "COM3"
    baudRate: 9600
[2025-12-17 15:40:18.782 +0200] INFO: тЬЕ [SerialTransport] Port Opened
    env: "development"
    path: "COM3"
[2025-12-17 15:40:20.862 +0200] INFO: ЁЯУК [HardwareService] Burst Read Mode
    env: "development"
    deviceId: "6941b7fc0567cb0853c420cd"
    sampleCount: 5
    sampleDelay: 100
[2025-12-17 15:40:21.680 +0200] INFO: тЬЕ [HardwareService] Median Calculated
    env: "development"
    deviceId: "6941b7fc0567cb0853c420cd"
    samples: [
      17.3,
      17.3,
      17.3,
      19.4,
      19.5
    ]
    median: 17.3
    min: 17.3
    max: 19.5
[2025-12-17 15:40:21.683 +0200] INFO: ЁЯзР [HardwareService] Debug Strategy Selection
    env: "development"
    deviceId: "6941b7fc0567cb0853c420cd"
    configStrategy: "linear"
    driverId: "hc_sr04"
[2025-12-17 15:40:21.683 +0200] INFO: ЁЯФН [HardwareService] Checking Normalization
    env: "development"
    deviceId: "6941b7fc0567cb0853c420cd"
    driverId: "hc_sr04"
    sourceUnit: "cm"
    raw: 17.3
    smartInput: 17.3
    value: 17.3
[2025-12-17 15:40:21.684 +0200] INFO: ЁЯФН [HardwareService] Normalization Result
    env: "development"
    normalized: {
      "value": 173,
      "baseUnit": "mm"
    }
[2025-12-17 15:40:21.684 +0200] INFO: ЁЯУП [HardwareService] Normalized Value
    env: "development"
    deviceId: "6941b7fc0567cb0853c420cd"
    from: "cm"
    to: "mm"
    original: 17.3
    normalized: 173
[2025-12-17 15:40:21.684 +0200] INFO: ЁЯСА [HardwareService] Converted Primary to Display Unit
    env: "development"
    deviceId: "6941b7fc0567cb0853c420cd"
    from: "mm"
    to: "m"
    original: 173
    converted: 0.173


Това е лога от тест на volume стратегия:

[2025-12-17 15:41:49.149 +0200] INFO: ЁЯУК [HardwareService] Burst Read Mode
    env: "development"
    deviceId: "6941b7fc0567cb0853c420cd"
    sampleCount: 5
    sampleDelay: 100
[2025-12-17 15:41:49.970 +0200] INFO: тЬЕ [HardwareService] Median Calculated
    env: "development"
    deviceId: "6941b7fc0567cb0853c420cd"
    samples: [
      17.7,
      17.7,
      17.7,
      17.7,
      58.8
    ]
    median: 17.7
    min: 17.7
    max: 58.8
[2025-12-17 15:41:49.973 +0200] INFO: ЁЯзР [HardwareService] Debug Strategy Selection
    env: "development"
    deviceId: "6941b7fc0567cb0853c420cd"
    configStrategy: "tank_volume"
    driverId: "hc_sr04"
[2025-12-17 15:41:49.974 +0200] INFO: ЁЯФД [HardwareService] Smart Strategy Switched Unit
    env: "development"
    deviceId: "6941b7fc0567cb0853c420cd"
    strategy: "tank_volume"
    oldUnit: "cm"
    newUnit: "L"
[2025-12-17 15:41:49.974 +0200] INFO: ЁЯФН [HardwareService] Checking Normalization
    env: "development"
    deviceId: "6941b7fc0567cb0853c420cd"
    driverId: "hc_sr04"
    sourceUnit: "L"
    raw: 17.7
    smartInput: 17.7
    value: 91.02857142857142
[2025-12-17 15:41:49.974 +0200] INFO: ЁЯФН [HardwareService] Normalization Result
    env: "development"
    normalized: {
      "value": 91028.57142857142,
      "baseUnit": "ml"
    }
[2025-12-17 15:41:49.974 +0200] INFO: ЁЯУП [HardwareService] Normalized Value
    env: "development"
    deviceId: "6941b7fc0567cb0853c420cd"
    from: "L"
    to: "ml"
    original: 91.02857142857142
    normalized: 91028.57142857142
[2025-12-17 15:41:49.974 +0200] INFO: ЁЯСА [HardwareService] Converted Primary to Display Unit
    env: "development"
    deviceId: "6941b7fc0567cb0853c420cd"
    from: "ml"
    to: "L"
    original: 91028.57142857142
    converted: 91.02857142857142
[15:42] INFO: ЁЯХТ Scheduler Tick
    env: "development"

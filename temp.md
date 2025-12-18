Едан точка калибрация ;Calibration Table (points)
1 points
Input (Raw)	Arrow	Output (Target)
420	→	7


Това е в разтвор 1:

🧪 [PhSmart] Raw:442 | V_Ref:5V | ADC:1023 | V_Meas:2160.3mV | Temp:20.75°C | pH:-4.32
[11:24] INFO: ЁЯХТ Scheduler Tick
    env: "development"
[2025-12-18 11:24:00.395 +0200] INFO: ЁЯФМ [HardwareService] Creating UDP Transport
    env: "development"
    controllerId: "6932a965cb81d56e0343a42c"
    ip: "10.1.10.253"
[2025-12-18 11:24:00.395 +0200] INFO: ЁЯФМ [UdpTransport] Initializing...
    env: "development"
    ip: "10.1.10.253"
    port: 8888
[2025-12-18 11:24:00.397 +0200] INFO: тЬЕ [UdpTransport] Listening
    env: "development"
    address: {
      "address": "0.0.0.0",
      "family": "IPv4",
      "port": 51350
    }
[2025-12-18 11:24:00.475 +0200] INFO: ЁЯФН [HardwareService] DEBUG: Measurements Resolution
    env: "development"
    deviceId: "694162a7810841a0fd88f032"
    measurementKey: "ph"
    hasTemplateMeasurements: true
    measurementConfig: {
      "rawUnit": "adc",
      "baseUnit": "pH"
    }
[2025-12-18 11:24:00.476 +0200] INFO: ЁЯЫбя╕П [HardwareService] Pre-Smart Physical Validation
    env: "development"
    deviceId: "694162a7810841a0fd88f032"
    raw: 442
    physicalUnit: "adc"
    baseValue: 442
    baseUnit: "adc"
[2025-12-18 11:24:00.487 +0200] INFO: ЁЯМбя╕П [HardwareService] Using External Temperature for Compensation
    env: "development"
    deviceId: "694162a7810841a0fd88f032"
    temp: 20.75
    source: "external"
    extDevId: "69369887b388ad2f8e1ccb4d"
    freshness: "fresh"
[2025-12-18 11:24:00.487 +0200] INFO: ЁЯМбя╕П [HardwareService] Compensation Context
    env: "development"
    deviceId: "694162a7810841a0fd88f032"
    temp: 20.75
    voltage: 5
    adc: 1023
[2025-12-18 11:24:00.487 +0200] INFO: ЁЯзР [HardwareService] Debug Strategy Selection
    env: "development"
    deviceId: "694162a7810841a0fd88f032"
    configStrategy: "ph_smart"
    driverId: "dfrobot_ph_pro"
[2025-12-18 11:24:00.488 +0200] INFO: ЁЯФН [HardwareService] Checking Normalization
    env: "development"
    deviceId: "694162a7810841a0fd88f032"
    driverId: "dfrobot_ph_pro"
    sourceUnit: "adc"
    raw: 442
    smartInput: 442
    value: -4.32
[2025-12-18 11:24:00.488 +0200] INFO: ЁЯФН [HardwareService] Normalization Result
    env: "development"
    normalized: {
      "value": -4.32,
      "baseUnit": "adc"
    }


  Това показва UI:

    Acidity
6.83 adc Raw: 448 pH


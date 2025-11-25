
# Sensor Families & MCU Compatibility Table

| # | Sensor / Model | Protocol Family | MCU Primitive | Needs External Lib? | RAW Output | Recommended Connection | Suitable Controllers | Notes |
|---|----------------|-----------------|----------------|----------------------|------------|-------------------------|------------------------|-------|
| 1 | A02YYUW Waterproof Ultrasonic (SEN0311) | UART | UART_READ_DISTANCE | Yes | Distance numeric | UART→USB or WiFi | ESP32, FireBeetle 2 ESP32-E, Arduino Mega | Prefer controllers with multiple hardware UARTs |
| 2 | Capacitive Soil Moisture (SEN0193) | ANALOG | READ_ANALOG | No | ADC value | USB or WiFi | Uno, Nano, Mega, Wemos, NodeMCU, ESP32 | Calibration in backend |
| 3 | Gravity Water Flow G1/2 (SEN0550) | PULSE/FLOW | MEASURE_PULSE_RATE | No | PulseCount | USB or WiFi | Mega, ESP32, FireBeetle 2 | Uno/Nano OK for 1–2 flow sensors |
| 4 | RS485 PAR Sensor (SEN0641) | RS485/Modbus | MODBUS_RTU_READ_REGS | Yes | Register bytes | UART→RS485 adapter | ESP32, FireBeetle 2, Arduino Mega | Avoid Uno/Nano for Modbus |
| 5 | Analog EC Sensor V2 (DFR0300) | ANALOG | READ_ANALOG | No | ADC value | USB or WiFi | Uno, Nano, Mega, ESP32, Wemos | Backend handles EC formula |
| 6 | Analog pH Sensor V2 (SEN0161-V2) | ANALOG | READ_ANALOG | No | ADC value | USB or WiFi | Uno, Nano, Mega, ESP32, Wemos | Backend handles pH calibration |
| 7 | DHT22 (SEN0137) | DHT Pulse | DHT_READ | Yes | Temp, Humidity | USB or WiFi | Uno, Nano, Mega, ESP32 | Timing sensitive |
| 8 | DS18B20 (DFR0198) | ONE_WIRE | ONEWIRE_READ_TEMP | Yes | Temperature | USB or WiFi | Uno, Nano, Mega, ESP32 | Multiple sensors per pin |
| 9 | URM09 Ultrasonic (Trig, SEN0388) | TRIG-ECHO | ULTRASONIC_TRIG_ECHO | No | PulseDuration | USB or WiFi | Uno, Nano, Mega, ESP32 | Standard HC-SR04-style |
| 9.1 | URM09 Ultrasonic (Analog, SEN0307) | ANALOG | READ_ANALOG | No | ADC value | USB or WiFi | Uno, Nano, Mega, ESP32 | Formula in backend |


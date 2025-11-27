# Firmware Command Reference

This document lists the supported firmware commands available for use in Device Templates (`backend/config/devices/*.json`).

These commands map high-level device actions (like `READ` or `TOGGLE`) to the low-level protocol understood by the microcontroller.

> **Want to add a new command?**
> See the [Add New Firmware Command Procedure](../Instructions/procedure-add-firmware-command.md).

## Core Commands

### `ANALOG`
Reads an analog value from an ADC pin.
*   **Usage:** Sensors (pH, EC, Moisture, Light)
*   **Returns:** Integer (0-1023 or 0-4095 depending on MCU)
*   **Protocol Example:** `ANALOG|A0`
*   **JSON Example:**
    ```json
    "commands": {
        "READ": { "hardwareCmd": "ANALOG" }
    }
    ```

### `DIGITAL_READ`
Reads the state of a digital pin.
*   **Usage:** Float Switches, Buttons, Motion Sensors
*   **Returns:** `0` (LOW) or `1` (HIGH)
*   **Protocol Example:** `DIGITAL_READ|D2`
*   **JSON Example:**
    ```json
    "commands": {
        "READ": { "hardwareCmd": "DIGITAL_READ" }
    }
    ```

### `DIGITAL_WRITE` (formerly SET_PIN)
Sets a digital pin to HIGH or LOW.
*   **Usage:** LEDs, Solenoids, General Output
*   **Parameters:** `state` (0 or 1)
*   **Protocol Example:** `DIGITAL_WRITE|D2|1`
*   **JSON Example:**
    ```json
    "commands": {
        "TOGGLE": { "hardwareCmd": "DIGITAL_WRITE" }
    }
    ```

### `PWM_WRITE`
Writes a PWM duty cycle to a pin.
*   **Usage:** Dimmable Lights, Fan Speed
*   **Parameters:** `value` (0-255)
*   **Protocol Example:** `PWM_WRITE|D3|128`
*   **JSON Example:**
    ```json
    "commands": {
        "SET_LEVEL": { "hardwareCmd": "PWM_WRITE" }
    }
    ```

### `RELAY_SET`
Specialized version of DIGITAL_WRITE for relays (often Active LOW).
*   **Usage:** Relay Modules
*   **Parameters:** `state` (0 or 1)
*   **Protocol Example:** `RELAY_SET|D4|1`
*   **JSON Example:**
    ```json
    "commands": {
        "TOGGLE": { "hardwareCmd": "RELAY_SET" }
    }
    ```

### `SERVO_WRITE`
Controls a servo motor angle.
*   **Usage:** Servo Motors
*   **Parameters:** `angle` (0-180)
*   **Protocol Example:** `SERVO_WRITE|D9|90`
*   **JSON Example:**
    ```json
    "commands": {
        "SET_ANGLE": { "hardwareCmd": "SERVO_WRITE" }
    }
    ```

---

## Protocol-Specific Commands

### `DHT_READ`
Reads Temperature and Humidity from DHT11/DHT22 sensors.
*   **Usage:** DHT11, DHT22, AM2302
*   **Returns:** Object `{ "temp": 24.5, "hum": 60.0 }`
*   **Protocol Example:** `DHT_READ|D4|11` (Pin D4, Type DHT11)
*   **JSON Example:**
    ```json
    "commands": {
        "READ": { "hardwareCmd": "DHT_READ" }
    }
    ```

### `ONEWIRE_READ_TEMP`
Reads temperature from a DS18B20 sensor via OneWire.
*   **Usage:** DS18B20 Waterproof Probe
*   **Returns:** Float (Temperature in Celsius)
*   **Protocol Example:** `ONEWIRE_READ_TEMP|D5`
*   **JSON Example:**
    ```json
    "commands": {
        "READ": { "hardwareCmd": "ONEWIRE_READ_TEMP" }
    }
    ```

### `UART_READ_DISTANCE`
Reads distance from a serial-based ultrasonic sensor.
*   **Usage:** A02YYUW (Waterproof)
*   **Returns:** Float (Distance in mm or cm)
*   **Protocol Example:** `UART_READ_DISTANCE|D2|D3` (RX=D2, TX=D3)
*   **JSON Example:**
    ```json
    "commands": {
        "READ": { "hardwareCmd": "UART_READ_DISTANCE" }
    }
    ```

### `MODBUS_RTU_READ`
Reads registers from an RS485 Modbus device.
*   **Usage:** Industrial Sensors (Soil NPK, PAR, CO2)
*   **Parameters:** RX Pin, TX Pin, JSON Params
*   **Protocol Example:** `MODBUS_RTU_READ|D2|D3|{"addr":1,"func":3,"reg":0,"count":1}`
*   **JSON Example:**
    ```json
    "commands": {
        "READ": { 
            "hardwareCmd": "MODBUS_RTU_READ",
            "params": { "addr": 1, "func": 3, "reg": 0, "count": 1 }
        }
    }
    ```

### `I2C_READ`
Reads data from an I2C device.
*   **Usage:** BH1750, BME280, OLED
*   **Protocol Example:** `I2C_READ|0x23|2` (Addr 0x23, Read 2 bytes)
*   **JSON Example:**
    ```json
    "commands": {
        "READ": { "hardwareCmd": "I2C_READ" }
    }
    ```

---

## Planned / Missing Commands

### `MEASURE_PULSE_RATE` (Planned)
*   **Status:** Not yet implemented in v5 templates.
*   **Usage:** Water Flow Meters

### `ULTRASONIC_TRIG_ECHO` (Planned)
*   **Status:** Not yet implemented in v5 templates.
*   **Usage:** HC-SR04 (Standard Ultrasonic)

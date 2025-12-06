# Firmware Command Reference

This document lists the supported firmware commands available for use in Device Templates (`backend/config/devices/*.json`).

These commands map high-level device actions (like `READ` or `TOGGLE`) to the low-level protocol understood by the microcontroller.

> **Want to add a new command?**
> See the [Add New Firmware Command Procedure](../Instructions/procedure-add-firmware-command.md).

## Pin Format (v5)
All commands now use the `Label_GPIO` format for pins to support dynamic mapping across different boards (Uno, ESP32, etc.).
*   **Format:** `Label_GPIO` (e.g., `D2_2`, `A0_14`, `D13_13`)
*   **Label:** The physical label on the board (e.g., `D2`, `A0`).
*   **GPIO:** The actual integer GPIO number used by the MCU.
*   **Parsing:** The firmware uses a global `parsePin()` function to extract the GPIO number.
*   **Legacy Support:** The parser also accepts simple integer strings (e.g., `2`) or legacy labels if they start with a digit, but `Label_GPIO` is the standard.

## Core Commands

### `ANALOG`
Reads an analog value from an ADC pin.
*   **Usage:** Sensors (pH, EC, Moisture, Light)
*   **Returns:** Integer (0-1023 or 0-4095 depending on MCU)
*   **Protocol Example:** `ANALOG|A0_14` (Pin A0, GPIO 14)
*   **JSON Response Keys:** `value` (Use `"valuePath": "value"`)
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
*   **Protocol Example:** `DIGITAL_READ|D2_2` (Pin D2, GPIO 2)
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
*   **Protocol Example:** `DIGITAL_WRITE|D2_2|1` (Pin D2, GPIO 2, HIGH)
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
*   **Protocol Example:** `PWM_WRITE|D3_3|128` (Pin D3, GPIO 3, 50%)
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
*   **Protocol Example:** `RELAY_SET|D4_4|1` (Pin D4, GPIO 4, ON)
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
*   **Protocol Example:** `SERVO_WRITE|D9_9|90` (Pin D9, GPIO 9, 90 degrees)
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
*   **Protocol Example:** `DHT_READ|D4_4|11` (Pin D4, GPIO 4, Type DHT11)
*   **JSON Response Keys:** `temp`, `humidity` (Use `"outputs": [{"key": "temp"}, {"key": "humidity"}]`)
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
*   **Protocol Example:** `ONEWIRE_READ_TEMP|D5_5` (Pin D5, GPIO 5)
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
*   **Protocol Example:** `UART_READ_DISTANCE|D2_2|D3_3` (RX=D2/GPIO2, TX=D3/GPIO3)
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
*   **Protocol Example:** `MODBUS_RTU_READ|{"slaveId":1,"funcCode":3,"startAddr":0,"len":1,"pins":[{"role":"RX","gpio":2},{"role":"TX","gpio":3}]}`
*   **JSON Response Keys:** `registers` (Array). Use `"valuePath": "registers.0"` for first value.
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

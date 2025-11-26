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
*   **JSON Example:**
    ```json
    "commands": {
        "READ": { "hardwareCmd": "DIGITAL_READ" }
    }
    ```

### `SET_PIN` (Digital Write)
Sets a digital pin to HIGH or LOW.
*   **Usage:** Relays, LEDs, Solenoids, Pumps
*   **Parameters:** `state` (0 or 1) - usually passed automatically by the backend `WRITE` action.
*   **JSON Example:**
    ```json
    "commands": {
        "TOGGLE": { "hardwareCmd": "SET_PIN" }
    }
    ```

### `PWM_WRITE`
Writes a PWM duty cycle to a pin.
*   **Usage:** Dimmable Lights, Fan Speed
*   **Parameters:** `value` (0-255)
*   **JSON Example:**
    ```json
    "commands": {
        "SET_LEVEL": { "hardwareCmd": "PWM_WRITE" }
    }
    ```

---

## Protocol-Specific Commands

### `DHT_READ`
Reads Temperature and Humidity from DHT11/DHT22 sensors.
*   **Usage:** DHT11, DHT22, AM2302
*   **Returns:** Object `{ "temp": 24.5, "hum": 60.0 }` (or similar)
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
*   **JSON Example:**
    ```json
    "commands": {
        "READ": { "hardwareCmd": "ONEWIRE_READ_TEMP" }
    }
    ```

### `MEASURE_PULSE_RATE`
Counts digital pulses over a fixed time window.
*   **Usage:** Water Flow Meters (Hall Effect)
*   **Returns:** Integer (Pulses per second or total count)
*   **JSON Example:**
    ```json
    "commands": {
        "READ": { "hardwareCmd": "MEASURE_PULSE_RATE" }
    }
    ```

### `ULTRASONIC_TRIG_ECHO`
Measures distance using an Ultrasonic sensor with Trigger and Echo pins.
*   **Usage:** HC-SR04, URM09
*   **Returns:** Float (Distance in cm)
*   **JSON Example:**
    ```json
    "commands": {
        "READ": { "hardwareCmd": "ULTRASONIC_TRIG_ECHO" }
    }
    ```

### `UART_READ_DISTANCE`
Reads distance from a serial-based ultrasonic sensor.
*   **Usage:** A02YYUW (Waterproof)
*   **Returns:** Float (Distance in mm or cm)
*   **JSON Example:**
    ```json
    "commands": {
        "READ": { "hardwareCmd": "UART_READ_DISTANCE" }
    }
    ```

### `MODBUS_RTU_READ`
Reads registers from an RS485 Modbus device.
*   **Usage:** Industrial Sensors (Soil NPK, PAR, CO2)
*   **Parameters:** Requires complex setup (Slave ID, Register Address) usually defined in `params`.
*   **JSON Example:**
    ```json
    "commands": {
        "READ": { 
            "hardwareCmd": "MODBUS_RTU_READ",
            "params": { "slaveId": 1, "reg": 0, "len": 2 }
        }
    }
    ```

# Hydroponics v5 Firmware Command Reference

This document provides a comprehensive reference for all commands supported by the Hydroponics v5 Firmware. These commands are sent as delimited text strings via Serial (USB) or UDP (WiFi).

## Protocol Basics

*   **Format:** `COMMAND_NAME|PARAM1|PARAM2|...`
*   **Delimiter:** Pipe character (`|`)
*   **Termination:** Newline (`\n`) for Serial; Packet end for UDP.
*   **Response:** JSON string `{"ok":1, ...}` or `{"ok":0, "error":"..."}`.

## System Commands

These commands are built into the base firmware and are available on all controllers.

| Command | Syntax | Example | Description | Expected Response |
| :--- | :--- | :--- | :--- | :--- |
| **PING** | `PING` | `PING` | Checks connectivity. | `{"ok":1,"pong":1}` |
| **INFO** | `INFO` | `INFO` | Returns device info and capabilities. | `{"ok":1,"up":12345,"ver":"1.0-v5","capabilities":["ANALOG",...]}` |
| **STATUS** | `STATUS` | `STATUS` | Returns simple status and uptime. | `{"ok":1,"status":"running","up":12345}` |
| **RESET** | `RESET` | `RESET` | Soft resets the controller. | `{"ok":1,"msg":"Resetting..."}` |

## I/O Commands

These commands control basic Input/Output pins.

| Command | Syntax | Example | Description | Expected Response |
| :--- | :--- | :--- | :--- | :--- |
| **ANALOG** | `ANALOG|Pin` | `ANALOG|A0` | Reads analog value (0-1023). | `{"ok":1,"pin":"A0","value":512}` |
| **DIGITAL_READ** | `DIGITAL_READ|Pin` | `DIGITAL_READ|D2` | Reads digital state (0 or 1). | `{"ok":1,"pin":"D2","value":1}` |
| **DIGITAL_WRITE** | `DIGITAL_WRITE|Pin|State` | `DIGITAL_WRITE|D13|1` | Sets digital pin HIGH(1) or LOW(0). | `{"ok":1,"pin":"D13","state":1}` |
| **PWM_WRITE** | `PWM_WRITE|Pin|Value` | `PWM_WRITE|D3|128` | Writes PWM value (0-255). | `{"ok":1,"pin":"D3","value":128}` |
| **RELAY_SET** | `RELAY_SET|Pin|State` | `RELAY_SET|D7|0` | Controls a relay (Active LOW/HIGH depends on wiring, usually 0=ON). | `{"ok":1,"pin":"D7","state":0}` |
| **SERVO_WRITE** | `SERVO_WRITE|Pin|Angle` | `SERVO_WRITE|D9|90` | Moves servo to angle (0-180). | `{"ok":1,"pin":"D9","angle":90}` |

## Sensor Commands

These commands interface with specific sensors or protocols.

| Command | Syntax | Example | Description | Expected Response |
| :--- | :--- | :--- | :--- | :--- |
| **DHT_READ** | `DHT_READ|Pin` | `DHT_READ|D4` | Reads DHT11/DHT22 sensor. | `{"ok":1,"temp":24.5,"humidity":60.0}` |
| **ONEWIRE_READ_TEMP** | `ONEWIRE_READ_TEMP|Pin` | `ONEWIRE_READ_TEMP|D2` | Reads DS18B20 temperature. | `{"ok":1,"temp":25.5}` |
| **I2C_READ** | `I2C_READ|Addr|Bytes` | `I2C_READ|0x76|2` | Reads bytes from I2C address. | `{"ok":1,"address":"0x76","data":[12,34]}` |
| **UART_READ_DISTANCE** | `UART_READ_DISTANCE|RX|TX` | `UART_READ_DISTANCE|D10|D11` | Reads A02YYUW/JSN-SR04T ultrasonic sensor. | `{"ok":1,"distance":1500}` (mm) |
| **MODBUS_RTU_READ** | `MODBUS_RTU_READ|RX|TX|JSON` | `MODBUS_RTU_READ|D2|D3|{"addr":1,"func":3,"reg":0,"count":2}` | Reads Modbus RTU registers. | `{"ok":1,"registers":[123,456]}` |

## Error Codes

Common error responses you might encounter:

*   `ERR_MISSING_PARAMETER`: Command sent without required arguments.
*   `ERR_INVALID_FORMAT`: Arguments not separated by `|` correctly.
*   `ERR_INVALID_PIN`: Pin format wrong (must be `D#` or `A#`) or pin not supported.
*   `ERR_INVALID_VALUE`: Value out of range (e.g., PWM > 255).
*   `ERR_SENSOR_TIMEOUT`: Sensor failed to respond.
*   `ERR_CHECKSUM_FAILED`: Data received but corrupted.

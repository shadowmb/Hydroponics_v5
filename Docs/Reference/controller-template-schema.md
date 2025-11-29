# Controller Template Schema Reference

This document describes the JSON schema used for defining Controller Templates in Hydroponics v5.
Controller templates are located in `backend/config/controllers/` and are automatically loaded into the database on system startup.

## File Naming
*   Files must be valid JSON.
*   Filename should match the `key` of the controller (e.g., `arduino_uno.json`).
*   Use snake_case for filenames.

## JSON Structure

### Root Object

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `key` | String | **Yes** | Unique identifier for the controller type (e.g., `Arduino_Uno`). Used internally. |
| `label` | String | **Yes** | Human-readable name displayed in the UI (e.g., "Arduino Uno R3"). |
| `description` | String | No | Brief description of the board's capabilities or chipset. |
| `architecture` | String | No | Firmware architecture identifier (e.g., `avr`, `esp8266`, `renesas_uno`). Used by the Firmware Builder. |
| `communication_by` | Array<String> | **Yes** | List of physical connection methods supported natively. |
| `communication_type` | Array<String> | **Yes** | List of software protocols supported natively. |
| `memory` | Object | No | Hardware memory specifications. |
| `pin_counts` | Object | No | Summary of available pins by type. |
| `ports` | Array<Object> | **Yes** | Detailed definition of every pin/port on the board. |
| `electrical_specs` | Object | No | Electrical specifications and limits. |
| `constraints` | Array<String> | No | List of specific limitations or warnings (e.g., "No Native WiFi"). |

### Electrical Specs Object (`electrical_specs`)

| Field | Type | Description |
| :--- | :--- | :--- |
| `logic_voltage` | String | Logic level voltage (e.g., "5V", "3.3V"). |
| `input_voltage` | String | Recommended input voltage range (e.g., "7-12V (Vin)"). |
| `max_current_per_pin` | String | Maximum current draw per I/O pin (e.g., "20mA"). |
| `analog_resolution` | String | Resolution of the ADC (e.g., "10-bit", "12-bit"). |
| `adc_range` | String | Voltage range for analog inputs (e.g., "0-5V", "0-1V"). |

### Memory Object (`memory`)

| Field | Type | Description |
| :--- | :--- | :--- |
| `flash` | Number | Flash memory size in bytes. |
| `sram` | Number | SRAM size in bytes. |
| `eeprom` | Number | EEPROM size in bytes (optional). |

### Pin Counts Object (`pin_counts`)

| Field | Type | Description |
| :--- | :--- | :--- |
| `digital` | Number | Total number of digital I/O pins. |
| `analog` | Number | Total number of analog input pins. |
| `pwm` | Number | Number of pins capable of PWM output. |
| `i2c` | Number | Number of I2C buses/ports. |
| `spi` | Number | Number of SPI buses/ports. |
| `uart` | Number | Number of hardware UART (Serial) ports. |

### Port Object (`ports`)

Defines a single physical pin or port on the controller.

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | **Yes** | Unique ID for the port on this controller (e.g., `D13`, `A0`). |
| `label` | String | **Yes** | Label printed on the board or common name (e.g., "Digital Pin 13"). |
| `type` | String | **Yes** | Primary type: `digital` or `analog`. |
| `pin` | Number | **Yes** | The internal GPIO number used by the firmware (Arduino pin number). |
| `reserved` | Boolean | No | If `true`, this port is used by the system (e.g., USB Serial) and cannot be assigned to devices. Default: `false`. |
| `pwm` | Boolean | No | If `true`, this port supports PWM output. Default: `false`. |
| `max_voltage` | Number | No | Maximum voltage for analog inputs (e.g., 3.3 or 5.0). |

## Example (`arduino_uno.json`)

```json
{
    "key": "Arduino_Uno",
    "label": "Arduino Uno R3",
    "description": "Classic ATmega328P based board",
    "architecture": "avr",
    "memory": {
        "flash": 32256,
        "sram": 2048,
        "eeprom": 1024
    },
    "communication_by": [
        "serial"
    ],
    "communication_type": [
        "raw_serial"
    ],
    "pin_counts": {
        "digital": 14,
        "analog": 6,
        "pwm": 6,
        "i2c": 1,
        "spi": 1,
        "uart": 1
    },
    "electrical_specs": {
        "logic_voltage": "5V",
        "input_voltage": "7-12V (Vin) / 5V (USB)",
        "max_current_per_pin": "20mA",
        "analog_resolution": "10-bit",
        "adc_range": "0-5V"
    },
    "constraints": [
        "No native WiFi or Bluetooth",
        "Single Hardware Serial (Shared with USB)"
    ],
    "ports": [
        {
            "id": "D13",
            "label": "Digital Pin 13 (SCK, LED)",
            "type": "digital",
            "pwm": true,
            "pin": 13
        },
        {
            "id": "A0",
            "label": "Analog Pin A0",
            "type": "analog",
            "pin": 14
        }
    ]
}
```

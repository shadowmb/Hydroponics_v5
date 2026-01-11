# Firmware Generator Walkthrough

> [!IMPORTANT] AI INSTRUCTION
> When using this document to help a user, **DO NOT READ THE WHOLE FILE AT ONCE**.
> Ask the user: "Shall we start Step 1?".
> Present **Step 1 ONLY**. Wait for confirmation.
> Present **Step 2 ONLY**. Wait for confirmation.
> Repeat until finished.

This document outlines the detailed process for creating custom firmware for Hydroponics controllers using the built-in Firmware Builder.

## Overview
Firmware is the low-level "brain" of the controller, translating physical signals into useful data for the system. It acts as the intermediary between sensors/actuators and the Hydroponics v5 system.

## Accessing the Builder
1.  Navigate to the **Hardware Management** page.
2.  Click the **Firmware Builder** button to open the generation wizard.

## The 5-Step Generation Process

### Step 1: Board Selection
Choose the microcontroller model. The system currently supports 4 pre-defined, tested controllers:
*   **Arduino Uno R3**
*   **Arduino Uno R4 WiFi**
*   **WeMos D1 R2 V2.1.0**
*   **LilyGO T-Relay (4-Port ESP32)**: A 4-port relay board with an integrated ESP32 module, supporting additional sensors.

*Information Displayed:* Voltage, Pin count/layout, Connectivity options (WiFi/Serial).

> [!TIP]
> Each board shows its operating voltage (3.3V or 5V). This is critical for Step 4 (Device selection), as incompatible voltage devices will be unavailable.

### Step 2: Transport Configuration
Select how the controller communicates with the system.

#### Option A: Serial (USB)
*   **Description:** Wired connection via USB. More reliable but requires physical proximity.
*   **Settings:**
    *   **Baud Rate:** The communication speed.
    *   **Recommendation:** Select **9600** for stability.

> [!NOTE]
> Serial connections are more stable than WiFi and recommended for critical sensors (pH, EC) or when the controller is near the server.

#### Option B: WiFi
*   **Description:** Wireless connection. Requires careful configuration.
*   **Settings:**
    *   **WiFi SSID:** Name of the router (MUST match the network the System server is on).
    *   **WiFi Password:** Router password.
    *   **UDP Port:** Default is **8888**.
    *   **Serial Baud Rate:** Default is **115200** (for debug output via USB).

> [!WARNING]
> **All WiFi fields are mandatory.** If you enter an incorrect SSID or Password, the controller will fail to connect to the network. You will need to regenerate and re-flash the firmware. Double-check your credentials before proceeding.

> [!TIP]
> Test your WiFi credentials on another device first to ensure they are correct. The controller must be on the same network as the Hydroponics server.

### Step 3: Plugins
Add optional features to enhance controller functionality.

> [!NOTE]
> Not all plugins are available for all boards. Unavailable options will be grayed out based on hardware limitations.

Available plugins:
*   **EEPROM State Save:** Restores relay states after a power loss. Useful for maintaining actuator states during outages.
*   **mDNS (Bonjour):** Allows accessing the device via `hostname.local` instead of IP address. Simplifies network configuration.
*   **Over-The-Air (OTA) Updates:** Enables wireless firmware updates in the future. Requires WiFi transport.
*   **Remote Debug (Telnet):** Sends debug logs via Telnet/UDP for troubleshooting. Useful for diagnosing communication issues.
*   **Watchdog Timer:** Automatically resets the device if it freezes. Recommended for production deployments.
*   **WiFi Failover (Dual SSID):** Connects to a backup WiFi network if the primary fails. Requires WiFi transport.

### Step 4: Devices (Sensors & Actuators)
Select the specific hardware components connected to the controller.

> [!IMPORTANT]
> You select **devices** (e.g., "pH Sensor", "DHT22 Temperature Sensor"), not individual commands. The generator automatically includes the correct low-level communication commands for each device. Multiple devices may share the same underlying command (e.g., multiple analog sensors all use "Analog Read").

*   **Compatibility Check:** The system validates voltage requirements.
    *   *Example:* If a sensor requires 5V but the controller operates on 3.3V, the sensor will be **grayed out** and unselectable, with a message explaining the incompatibility.

> [!TIP]
> If a device you need is grayed out, check the board's voltage in Step 1. You may need to select a different board or use a voltage level shifter (external hardware).

### Step 5: Build & Summary
Review all configured settings:
*   Controller Name
*   Transport Method (Serial or WiFi)
*   Selected Plugins
*   **Included Commands:** A list of the specific low-level instructions added to the firmware based on your device selections.

**Example Commands:**
- `Analog Read` (for pH, EC sensors)
- `DHT Read` (for DHT22 temperature/humidity)
- `Digital Read/Write` (for relays, switches)
- `Ultrasonic Trig/Echo` (for distance sensors)
- `Modbus RTU Read` (for industrial sensors)
- `OneWire Read Temp` (for DS18B20 temperature sensors)
- `PWM Write` (for dimmers, fans)

#### Final Actions
*   **Copy Code:** Copies the verified C++ code to your clipboard. Use this to paste directly into Arduino IDE.
*   **Download .ino:** Saves the firmware as an Arduino sketch file (`.ino`). Use this to save for later or share with others.

## Uploading
To flash the firmware onto the controller, you must use an external tool:
- **Arduino IDE** (recommended for beginners)
- **PlatformIO** (advanced users)

**Steps:**
1. Open Arduino IDE or PlatformIO.
2. Paste the copied code or open the downloaded `.ino` file.
3. Select the correct board type and COM port.
4. Click "Upload" to flash the firmware via USB.

> [!CAUTION]
> Ensure the correct board type is selected in Arduino IDE (e.g., "Arduino Uno" for Uno R3, "ESP32 Dev Module" for LilyGO). Selecting the wrong board may brick your controller.

## Troubleshooting

**Controller not connecting after upload:**
- Verify WiFi credentials (SSID/Password) if using WiFi transport.
- Check that the controller and server are on the same network.
- For Serial: Ensure the correct Baud Rate is set in both firmware and system settings.

**Device not responding:**
- Verify physical connections (correct pins, voltage).
- Check that the device was selected in Step 4.
- Review the "Included Commands" list to confirm the necessary command is present.

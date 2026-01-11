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

### Step 2: Transport Configuration
Select how the controller communicates with the system.

#### Option A: Serial (USB)
*   **Description:** Wired connection via USB. More reliable but requires physical proximity.
*   **Settings:**
    *   **Baud Rate:** The communication speed.
    *   **Recommendation:** Select **9600** for stability.

#### Option B: WiFi
*   **Description:** Wireless connection. Requires careful configuration.
*   **Critical:** All fields are mandatory. Incorrect SSID/Password will require re-flashing the firmware.
*   **Settings:**
    *   **WiFi SSID:** Name of the router (MUST match the network the System server is on).
    *   **WiFi Password:** Router password.
    *   **UDP Port:** Default is **8888**.
    *   **Serial Baud Rate:** Default is **115200** (for debug output).

### Step 3: Plugins
Add optional features to enhance controller functionality. Availability depends on the selected Board.
*   **EEPROM State Save:** Restores relay states after a power loss.
*   **mDNS (Bonjour):** Allows accessing the device via `hostname.local` instead of IP.
*   **Over-The-Air (OTA) Updates:** Enables wireless firmware updates in the future.
*   **Remote Debug (Telnet):** Sends debug logs via Telnet/UDP for troubleshooting.
*   **Watchdog Timer:** Automatically resets the device if it freezes.
*   **WiFi Failover (Dual SSID):** Connects to a backup WiFi network if the primary fails.

### Step 4: Devices (Sensors & Actuators)
Select the specific hardware components connected to the controller.
*   **Compatibility Check:** The system validates voltage requirements.
    *   *Example:* If a sensor requires 5V but the controller operates on 3.3V, the sensor will be **grayed out** and unselectable, with a message explaining the incompatibility.
*   **Command Logic:** You do **not** select individual commands (e.g., `AnalogRead`). Instead, you select the **Device** (e.g., "pH Sensor"). The generator automatically includes the correct low-level commands required for that device. Multiple devices may share the same underlying command.

### Step 5: Build & Summary
Review all configured settings:
*   Controller Name
*   Transport Method
*   Selected Plugins
*   **Included Commands:** A list of the specific low-level instructions added to the firmware (e.g., `Analog Read`, `DHT Read`, `Ultrasonic Trig/Echo`, `Modbus RTU Read`).

#### Final Actions
*   **Copy Code:** Copies the verified C++ code to your clipboard.
*   **Download .ino:** Saves the firmware as an Arduino sketch file (`.ino`).

## Uploading
To flash the firmware onto the controller, you must use an external tool like **Arduino IDE** or **PlatformIO**. Paste or open the generated code and upload it to your board via USB.

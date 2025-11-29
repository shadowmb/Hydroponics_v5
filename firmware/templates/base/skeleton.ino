/*
 * Hydroponics v5 Firmware
 * Board: {{BOARD_NAME}}
 * Transport: {{TRANSPORT_NAME}}
 * Generated: {{DATE}}
 */

// === INCLUDES ===
#include <Arduino.h>
{{INCLUDES}}

// === GLOBALS ===
{{GLOBALS}}

// === SETUP ===
void setup() {
  {{SETUP_CODE}}
}

// === LOOP ===
void loop() {
  {{LOOP_CODE}}
}

// === FUNCTIONS ===
int parsePin(String pinStr) {
  // Handle "D5" -> 5
  if (pinStr.startsWith("D")) {
    return pinStr.substring(1).toInt();
  }
  // Handle "A0" -> A0 (which is an int constant)
  if (pinStr.startsWith("A")) {
    int pin = pinStr.substring(1).toInt();
    #if defined(ESP8266)
      return A0; // ESP8266 only has A0
    #else
      static const uint8_t analog_pins[] = {A0, A1, A2, A3, A4, A5};
      if (pin >= 0 && pin < 6) return analog_pins[pin];
    #endif
  }
  // Handle raw number "5"
  return pinStr.toInt();
}

{{FUNCTIONS_CODE}}

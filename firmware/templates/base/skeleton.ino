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

// === PROTOTYPES ===
String processCommand(String input);

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
  // 1. Handle Label_GPIO format (e.g. "D1_25" -> 25)
  int underscoreIndex = pinStr.indexOf('_');
  if (underscoreIndex != -1) {
    return pinStr.substring(underscoreIndex + 1).toInt();
  }

  // 2. Handle "D5" -> 5
  if (pinStr.startsWith("D")) {
    return pinStr.substring(1).toInt();
  }

  // 3. Handle "A0" -> A0
  if (pinStr.startsWith("A")) {
    int pin = pinStr.substring(1).toInt();
    #if defined(ESP8266)
      return A0; // ESP8266 only has A0
    #else
      static const uint8_t analog_pins[] = {A0, A1, A2, A3, A4, A5};
      if (pin >= 0 && pin < 6) return analog_pins[pin];
    #endif
  }

  // 4. Handle raw number "5"
  return pinStr.toInt();
}

{{FUNCTIONS_CODE}}
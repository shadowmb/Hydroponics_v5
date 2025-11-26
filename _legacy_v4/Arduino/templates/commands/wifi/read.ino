/*
 * READ Command Module
 * Reads digital value from specified pin (HIGH/LOW = 1/0)
 * Used for: buttons, switches, limit sensors, digital outputs
 */

// === INCLUDES ===
// No additional includes needed

// === GLOBALS ===
// No global variables needed

// === DISPATCHER ===
else if (strcmp(cmd, "READ") == 0) {
  return handleRead();
}

// === FUNCTIONS ===
String handleRead() {
  // Get pin number from command
  int pin = jsonDoc["pin"];

  // Validate pin number (2-13 on Arduino Uno)
  if (pin < 2 || pin > 13) {
    return "{\"ok\":0,\"error\":\"Invalid digital pin (use 2-13)\"}";
  }

  // Read digital value (HIGH=1, LOW=0)
  int state = digitalRead(pin);

  // Build response
  StaticJsonDocument<256> doc;
  doc["ok"] = 1;
  doc["pin"] = pin;
  doc["state"] = state;

  String response;
  serializeJson(doc, response);
  return response;
}

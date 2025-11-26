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
  handleRead(doc);
}

// === FUNCTIONS ===
void handleRead(JsonDocument& doc) {
  // Get pin number from command
  int pin = doc["pin"];

  // Validate pin number (2-13 on Arduino Uno)
  if (pin < 2 || pin > 13) {
    doc.clear();
    doc["ok"] = 0;
    doc["error"] = "Invalid digital pin (use 2-13)";
    serializeJson(doc, Serial);
    Serial.println();
    return;
  }

  // Read digital value (HIGH=1, LOW=0)
  int state = digitalRead(pin);

  // Build response
  doc.clear();
  doc["ok"] = 1;
  doc["pin"] = pin;
  doc["state"] = state;

  // Send response
  serializeJson(doc, Serial);
  Serial.println();
}

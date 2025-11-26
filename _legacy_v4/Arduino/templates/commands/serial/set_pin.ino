// === INCLUDES ===
// None required

// === GLOBALS ===
// None required

// === DISPATCHER ===
else if (strcmp(cmd, "SET_PIN") == 0) {
  handleSetPin(doc);
}

// === FUNCTIONS ===
void handleSetPin(JsonDocument& doc) {
  int pin = doc["pin"];
  int state = doc["state"];

  if (pin < 2 || pin > 13) {
    doc.clear();
    doc["ok"] = 0;
    doc["error"] = "Invalid digital pin (use 2-13)";
    serializeJson(doc, Serial);
    Serial.println();
    return;
  }

  if (state != 0 && state != 1) {
    doc.clear();
    doc["ok"] = 0;
    doc["error"] = "Invalid state (use 0 or 1)";
    serializeJson(doc, Serial);
    Serial.println();
    return;
  }

  digitalWrite(pin, state ? HIGH : LOW);

  // Build response
  doc.clear();
  doc["ok"] = 1;
  doc["pin"] = pin;
  doc["state"] = state;
  serializeJson(doc, Serial);
  Serial.println();
}

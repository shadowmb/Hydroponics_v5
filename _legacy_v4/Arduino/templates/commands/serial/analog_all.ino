// ABOUTME: ANALOG_ALL command handler template
// ABOUTME: Reads all analog pins (A0-A5) and returns their values

// === INCLUDES ===
// (none required)

// === GLOBALS ===
// No global variables needed

// === DISPATCHER ===
else if (strcmp(cmd, "ANALOG_ALL") == 0) {
  handleAnalogAll(doc);
}

// === FUNCTIONS ===
void handleAnalogAll(JsonDocument& doc) {
  doc.clear();
  doc["ok"] = 1;
  JsonArray values = doc.createNestedArray("values");
  for (int i = 0; i < 6; i++) {
    // Read analog pins A0-A5, not digital pins 0-5
    values.add(analogRead(A0 + i));
  }
  serializeJson(doc, Serial);
  Serial.println();
}

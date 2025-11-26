// ABOUTME: ANALOG_ALL command handler template
// ABOUTME: Reads all analog pins (A0-A5) and returns their values

// === INCLUDES ===
// (none required)

// === GLOBALS ===
// No global variables needed

// === DISPATCHER ===
else if (strcmp(cmd, "ANALOG_ALL") == 0) {
  return handleAnalogAll();
}

// === FUNCTIONS ===
String handleAnalogAll() {
  StaticJsonDocument<512> jsonDoc;
  jsonDoc["ok"] = 1;
  JsonArray values = jsonDoc.createNestedArray("values");
  for (int i = 0; i < 6; i++) {
    // Read analog pins A0-A5, not digital pins 0-5
    values.add(analogRead(A0 + i));
  }
  String response;
  serializeJson(jsonDoc, response);
  return response;
}

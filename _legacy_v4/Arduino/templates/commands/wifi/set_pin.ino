// === INCLUDES ===
// None required

// === GLOBALS ===
// None required

// === DISPATCHER ===
else if (strcmp(cmd, "SET_PIN") == 0) {
  return handleSetPin();
}

// === FUNCTIONS ===
String handleSetPin() {
  int pin = jsonDoc["pin"];
  int state = jsonDoc["state"];

  if (pin < 2 || pin > 13) {
    return "{\"ok\":0,\"error\":\"Invalid digital pin (use 2-13)\"}";
  }

  if (state != 0 && state != 1) {
    return "{\"ok\":0,\"error\":\"Invalid state (use 0 or 1)\"}";
  }

  digitalWrite(pin, state ? HIGH : LOW);

  // Build response
  StaticJsonDocument<256> doc;
  doc["ok"] = 1;
  doc["pin"] = pin;
  doc["state"] = state;

  String response;
  serializeJson(doc, response);
  return response;
}

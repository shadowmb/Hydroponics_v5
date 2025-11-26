// ABOUTME: WiFi command template for ANALOG command - reads analog pin values
// ABOUTME: Follows Wemos D1 R2 Foundation pattern with jsonDoc and responseBuffer

// === INCLUDES ===
// No additional includes needed

// === GLOBALS ===
// No global variables needed

// === DISPATCHER ===
else if (strcmp(cmd, "ANALOG") == 0) {
  return handleAnalogCommand();
}

// === FUNCTIONS ===
bool isValidAnalogPin(const char* pin) {
  return (strlen(pin) == 2 && pin[0] == 'A' && pin[1] >= '0' && pin[1] <= '5');
}

int getAnalogPinNumber(const char* pin) {
  return A0 + (pin[1] - '0');
}

String handleAnalogCommand() {
  const char* pinStr = jsonDoc["pin"];
  if (!pinStr || !isValidAnalogPin(pinStr)) {
    return "{\"ok\":0,\"err\":\"invalid_port\"}";
  }

  int analogPin = getAnalogPinNumber(pinStr);
  int value = analogRead(analogPin);
  float voltage = (value * 3.3) / 1023.0;  // ESP8266 uses 3.3V reference

  // Build response
  strcpy(responseBuffer, "{\"ok\":1,\"pin\":\"");
  strcat(responseBuffer, pinStr);
  strcat(responseBuffer, "\",\"value\":");
  sprintf(responseBuffer + strlen(responseBuffer), "%d", value);
  strcat(responseBuffer, ",\"volt\":");
  dtostrf(voltage, 4, 2, responseBuffer + strlen(responseBuffer));
  strcat(responseBuffer, "}");

  return String(responseBuffer);
}

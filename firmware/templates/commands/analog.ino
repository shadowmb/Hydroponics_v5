/*
 * ANALOG Command Module (v5 Clean)
 * Reads analog value from specified pin (0-1023)
 * Format: ANALOG|A0
 * Used for: EC sensors, pH sensors, moisture sensors, etc.
 */

// === INCLUDES ===
// No additional includes needed

// === GLOBALS ===
// No global variables needed

// === DISPATCHER ===
else if (strcmp(cmd, "ANALOG") == 0) {
  handleAnalog(delimiter + 1);
}

// === FUNCTIONS ===
bool isValidAnalogPin(const char* pin) {
  return (strlen(pin) == 2 && pin[0] == 'A' && pin[1] >= '0' && pin[1] <= '5');
}

int getAnalogPinNumber(const char* pin) {
  return A0 + (pin[1] - '0');
}

void handleAnalog(const char* params) {
  // Parse pin from params (e.g., "A0")
  if (!params || strlen(params) < 2) {
    Serial.println("{\"ok\":0,\"error\":\"ERR_MISSING_PARAMETER\"}");
    return;
  }

  // Validate pin format
  if (!isValidAnalogPin(params)) {
    Serial.println("{\"ok\":0,\"error\":\"ERR_INVALID_PIN\"}");
    return;
  }

  // Convert pin string to pin number and read analog value (0-1023)
  int analogPin = getAnalogPinNumber(params);
  int value = analogRead(analogPin);

  // Build and send JSON response
  Serial.print("{\"ok\":1,\"pin\":\"");
  Serial.print(params);
  Serial.print("\",\"value\":");
  Serial.print(value);
  Serial.println("}");
}

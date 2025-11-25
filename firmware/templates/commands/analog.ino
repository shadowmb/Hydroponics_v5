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
  return handleAnalog(delimiter + 1);
}

// === FUNCTIONS ===
bool isValidAnalogPin(const char* pin) {
  return (strlen(pin) == 2 && pin[0] == 'A' && pin[1] >= '0' && pin[1] <= '5');
}

int getAnalogPinNumber(const char* pin) {
  return A0 + (pin[1] - '0');
}

String handleAnalog(const char* params) {
  // Parse pin from params (e.g., "A0")
  if (!params || strlen(params) < 2) {
    return "{\"ok\":0,\"error\":\"ERR_MISSING_PARAMETER\"}";
  }

  // Validate pin format
  if (!isValidAnalogPin(params)) {
    return "{\"ok\":0,\"error\":\"ERR_INVALID_PIN\"}";
  }

  // Convert pin string to pin number and read analog value (0-1023)
  int analogPin = getAnalogPinNumber(params);
  int value = analogRead(analogPin);

  // Build and return JSON response
  String response = "{\"ok\":1,\"pin\":\"";
  response += params;
  response += "\",\"value\":";
  response += value;
  response += "}";
  
  return response;
}

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
String handleAnalog(const char* params) {
  // Parse pin from params (e.g., "A0_14")
  if (!params || strlen(params) < 2) {
    return "{\"ok\":0,\"error\":\"ERR_MISSING_PARAMETER\"}";
  }

  // Use global parsePin helper (handles Label_GPIO format)
  int analogPin = parsePin(params);
  
  if (analogPin == -1) {
    return "{\"ok\":0,\"error\":\"ERR_INVALID_PIN\"}";
  }

  // Read analog value (0-1023)
  int value = analogRead(analogPin);

  // Build and return JSON response
  String response = "{\"ok\":1,\"pin\":\"";
  response += params;
  response += "\",\"value\":";
  response += value;
  response += "}";
  
  return response;
}

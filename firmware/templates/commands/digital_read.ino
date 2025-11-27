/*
 * DIGITAL_READ Command Module (v5 Clean)
 * Reads digital pin state (HIGH/LOW)
 * Format: DIGITAL_READ|D3
 * Used for: Buttons, switches, limit sensors
 */

// === INCLUDES ===
// No additional includes needed

// === GLOBALS ===
// No global variables needed

// === DISPATCHER ===
else if (strcmp(cmd, "DIGITAL_READ") == 0) {
  return handleDigitalRead(delimiter + 1);
}

// === FUNCTIONS ===
// === FUNCTIONS ===
// parseDigitalPin removed - using global parsePin


String handleDigitalRead(const char* params) {
  // Parse pin from params (e.g., "D3")
  if (!params || strlen(params) < 2) {
    return "{\"ok\":0,\"error\":\"ERR_MISSING_PARAMETER\"}";
  }

  int pin = parsePin(String(params));
  if (pin == -1) {
    return "{\"ok\":0,\"error\":\"ERR_INVALID_PIN\"}";
  }

  // Set pin mode and read state
  pinMode(pin, INPUT);
  int state = digitalRead(pin);

  // Build and return JSON response
  String response = "{\"ok\":1,\"pin\":\"";
  response += params;
  response += "\",\"state\":";
  response += state;
  response += "}";
  
  return response;
}

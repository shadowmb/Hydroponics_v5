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
  handleDigitalRead(delimiter + 1);
}

// === FUNCTIONS ===
int parseDigitalPin(const char* pinStr) {
  if (strlen(pinStr) < 2 || pinStr[0] != 'D') {
    return -1;
  }
  int pin = atoi(pinStr + 1);
  return (pin >= 2 && pin <= 13) ? pin : -1;
}

void handleDigitalRead(const char* params) {
  // Parse pin from params (e.g., "D3")
  if (!params || strlen(params) < 2) {
    Serial.println("{\"ok\":0,\"error\":\"ERR_MISSING_PARAMETER\"}");
    return;
  }

  int pin = parseDigitalPin(params);
  if (pin == -1) {
    Serial.println("{\"ok\":0,\"error\":\"ERR_INVALID_PIN\"}");
    return;
  }

  // Set pin mode and read state
  pinMode(pin, INPUT);
  int state = digitalRead(pin);

  // Build and send JSON response
  Serial.print("{\"ok\":1,\"pin\":\"");
  Serial.print(params);
  Serial.print("\",\"state\":");
  Serial.print(state);
  Serial.println("}");
}

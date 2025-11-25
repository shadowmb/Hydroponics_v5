/*
 * DIGITAL_WRITE Command Module (v5 Clean)
 * Sets digital pin state (HIGH/LOW)
 * Format: DIGITAL_WRITE|D8|1
 * Used for: LEDs, digital outputs
 */

// === INCLUDES ===
// No additional includes needed

// === GLOBALS ===
// No global variables needed

// === DISPATCHER ===
else if (strcmp(cmd, "DIGITAL_WRITE") == 0) {
  handleDigitalWrite(delimiter + 1);
}

// === FUNCTIONS ===
int parseDigitalWritePin(const char* pinStr) {
  if (strlen(pinStr) < 2 || pinStr[0] != 'D') {
    return -1;
  }
  int pin = atoi(pinStr + 1);
  return (pin >= 2 && pin <= 13) ? pin : -1;
}

void handleDigitalWrite(const char* params) {
  // Parse params: "D8|1" -> pin=D8, state=1
  if (!params || strlen(params) < 4) {
    Serial.println("{\"ok\":0,\"error\":\"ERR_MISSING_PARAMETER\"}");
    return;
  }

  // Find delimiter
  char paramsCopy[16];
  strncpy(paramsCopy, params, sizeof(paramsCopy) - 1);
  paramsCopy[sizeof(paramsCopy) - 1] = '\0';
  
  char* delimiter = strchr(paramsCopy, '|');
  if (!delimiter) {
    Serial.println("{\"ok\":0,\"error\":\"ERR_INVALID_FORMAT\"}");
    return;
  }

  *delimiter = '\0';
  const char* pinStr = paramsCopy;
  const char* stateStr = delimiter + 1;

  // Parse pin
  int pin = parseDigitalWritePin(pinStr);
  if (pin == -1) {
    Serial.println("{\"ok\":0,\"error\":\"ERR_INVALID_PIN\"}");
    return;
  }

  // Parse state (0 or 1)
  int state = atoi(stateStr);
  if (state != 0 && state != 1) {
    Serial.println("{\"ok\":0,\"error\":\"ERR_INVALID_VALUE\"}");
    return;
  }

  // Set pin mode and state
  pinMode(pin, OUTPUT);
  digitalWrite(pin, state);

  // Build and send JSON response
  Serial.print("{\"ok\":1,\"pin\":\"");
  Serial.print(pinStr);
  Serial.print("\",\"state\":");
  Serial.print(state);
  Serial.println("}");
}

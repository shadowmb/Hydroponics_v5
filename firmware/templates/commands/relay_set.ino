/*
 * RELAY_SET Command Module (v5 Clean)
 * Controls relay state (ON/OFF)
 * Format: RELAY_SET|D7|1  (pin|state)
 * Used for: Relays, pumps, lights, fans
 */

// === INCLUDES ===
// No additional includes needed

// === GLOBALS ===
// No global variables needed

// === DISPATCHER ===
else if (strcmp(cmd, "RELAY_SET") == 0) {
  return handleRelaySet(delimiter + 1);
}

// === FUNCTIONS ===
int parseRelayPin(const char* pinStr) {
  if (strlen(pinStr) < 2 || pinStr[0] != 'D') {
    return -1;
  }
  int pin = atoi(pinStr + 1);
  return (pin >= 2 && pin <= 13) ? pin : -1;
}

String handleRelaySet(const char* params) {
  // Parse params: "D7|1" -> pin=D7, state=1
  if (!params || strlen(params) < 4) {
    return "{\"ok\":0,\"error\":\"ERR_MISSING_PARAMETER\"}";
  }

  // Find delimiter
  char paramsCopy[16];
  strncpy(paramsCopy, params, sizeof(paramsCopy) - 1);
  paramsCopy[sizeof(paramsCopy) - 1] = '\0';
  
  char* delimiter = strchr(paramsCopy, '|');
  if (!delimiter) {
    return "{\"ok\":0,\"error\":\"ERR_INVALID_FORMAT\"}";
  }

  *delimiter = '\0';
  const char* pinStr = paramsCopy;
  const char* stateStr = delimiter + 1;

  // Parse pin
  int pin = parseRelayPin(pinStr);
  if (pin == -1) {
    return "{\"ok\":0,\"error\":\"ERR_INVALID_PIN\"}";
  }

  // Parse state (0 or 1)
  int state = atoi(stateStr);
  if (state != 0 && state != 1) {
    return "{\"ok\":0,\"error\":\"ERR_INVALID_VALUE\"}";
  }

  // Set pin mode and state
  pinMode(pin, OUTPUT);
  digitalWrite(pin, state);

  // Build and return JSON response
  String response = "{\"ok\":1,\"pin\":\"";
  response += pinStr;
  response += "\",\"state\":";
  response += state;
  response += "}";
  
  return response;
}

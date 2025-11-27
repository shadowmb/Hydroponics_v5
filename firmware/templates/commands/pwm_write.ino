/*
 * PWM_WRITE Command Module (v5 Clean)
 * Sets PWM duty cycle on pin (0-255)
 * Format: PWM_WRITE|D9|128
 * Used for: LED dimming, motor speed control, fan speed
 */

// === INCLUDES ===
// No additional includes needed

// === GLOBALS ===
// No global variables needed

// === DISPATCHER ===
else if (strcmp(cmd, "PWM_WRITE") == 0) {
  return handlePWMWrite(delimiter + 1);
}

// === FUNCTIONS ===
// === FUNCTIONS ===
bool isPWMPin(int pin) {
  // Arduino Uno PWM pins: 3, 5, 6, 9, 10, 11
  return (pin == 3 || pin == 5 || pin == 6 || pin == 9 || pin == 10 || pin == 11);
}

// parsePWMPin removed - using global parsePin


String handlePWMWrite(const char* params) {
  // Parse params: "D9|128" -> pin=D9, value=128
  if (!params || strlen(params) < 4) {
    return "{\"ok\":0,\"error\":\"ERR_MISSING_PARAMETER\"}";
  }

  // Find delimiter
  char paramsCopy[16];
  strncpy(paramsCopy, params, sizeof(paramsCopy) - 1);
  paramsCopy[sizeof(paramsCopy) - 1] = '\0';
  
  char* delimiter = strchr(paramsCopy, '|');
    return "{\"ok\":0,\"error\":\"ERR_INVALID_VALUE\"}";
  }

  // Set PWM value
  pinMode(pin, OUTPUT);
  analogWrite(pin, value);

  // Build and return JSON response
  String response = "{\"ok\":1,\"pin\":\"";
  response += pinStr;
  response += "\",\"value\":";
  response += value;
  response += "}";
  
  return response;
}

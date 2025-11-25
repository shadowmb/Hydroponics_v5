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
  handlePWMWrite(delimiter + 1);
}

// === FUNCTIONS ===
bool isPWMPin(int pin) {
  // Arduino Uno PWM pins: 3, 5, 6, 9, 10, 11
  return (pin == 3 || pin == 5 || pin == 6 || pin == 9 || pin == 10 || pin == 11);
}

int parsePWMPin(const char* pinStr) {
  if (strlen(pinStr) < 2 || pinStr[0] != 'D') {
    return -1;
  }
  int pin = atoi(pinStr + 1);
  return isPWMPin(pin) ? pin : -1;
}

void handlePWMWrite(const char* params) {
  // Parse params: "D9|128" -> pin=D9, value=128
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
  const char* valueStr = delimiter + 1;

  // Parse pin
  int pin = parsePWMPin(pinStr);
  if (pin == -1) {
    Serial.println("{\"ok\":0,\"error\":\"ERR_INVALID_PIN\"}");
    return;
  }

  // Parse value (0-255)
  int value = atoi(valueStr);
  if (value < 0 || value > 255) {
    Serial.println("{\"ok\":0,\"error\":\"ERR_INVALID_VALUE\"}");
    return;
  }

  // Set PWM value
  pinMode(pin, OUTPUT);
  analogWrite(pin, value);

  // Build and send JSON response
  Serial.print("{\"ok\":1,\"pin\":\"");
  Serial.print(pinStr);
  Serial.print("\",\"value\":");
  Serial.print(value);
  Serial.println("}");
}

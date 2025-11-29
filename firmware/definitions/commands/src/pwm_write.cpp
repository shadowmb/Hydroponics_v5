

bool isPWMPin(int pin) {
  // Basic check for common Arduino boards. 
  // Ideally this should be board-specific but for now we keep it simple or rely on analogWrite handling it (it usually ignores non-PWM pins or does digital write)
  // Arduino Uno PWM pins: 3, 5, 6, 9, 10, 11
  // ESP8266/ESP32 have software PWM on most pins so this check is less critical there.
  return true; 
}

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
  if (!delimiter) {
     return "{\"ok\":0,\"error\":\"ERR_INVALID_FORMAT\"}";
  }
  
  *delimiter = '\0';
  const char* pinStr = paramsCopy;
  const char* valStr = delimiter + 1;

  // Parse pin
  int pin = parsePin(String(pinStr));
  if (pin == -1) {
    return "{\"ok\":0,\"error\":\"ERR_INVALID_PIN\"}";
  }

  // Parse value (0-255)
  int value = atoi(valStr);
  if (value < 0 || value > 255) {
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

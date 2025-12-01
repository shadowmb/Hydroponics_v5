
String handleWrite(const char* params) {
  // Expected params: "PIN|VALUE" (e.g., "3|128" or "A0|255")
  
  if (!params) return "{\"ok\":0,\"error\":\"ERR_MISSING_PARAMS\"}";

  // Find delimiter
  const char* pipe = strchr(params, '|');
  if (!pipe) return "{\"ok\":0,\"error\":\"ERR_INVALID_FORMAT\"}";

  // Extract Pin String
  int pinLen = pipe - params;
  char pinStr[10];
  if (pinLen >= sizeof(pinStr)) return "{\"ok\":0,\"error\":\"ERR_PIN_TOO_LONG\"}";
  strncpy(pinStr, params, pinLen);
  pinStr[pinLen] = '\0';

  // Parse Pin
  int pin = parsePin(pinStr);
  if (pin == -1) return "{\"ok\":0,\"error\":\"ERR_INVALID_PIN\"}";

  // Parse Value
  int value = atoi(pipe + 1);

  // Execute
  analogWrite(pin, value);

  // Response
  String response = "{\"ok\":1,\"pin\":\"";
  response += pinStr;
  response += "\",\"val\":";
  response += value;
  response += "}";
  
  return response;
}

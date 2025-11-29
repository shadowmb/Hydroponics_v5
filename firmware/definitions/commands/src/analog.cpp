#include <Arduino.h>

String handleAnalog(const char* params) {
  // Parse pin from params (e.g., "A0_14")
  if (!params || strlen(params) < 2) {
    return "{\"ok\":0,\"error\":\"ERR_MISSING_PARAMETER\"}";
  }

  // Use global parsePin helper (handles Label_GPIO format)
  // Note: parsePin is expected to be available in the main sketch or shared utils
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

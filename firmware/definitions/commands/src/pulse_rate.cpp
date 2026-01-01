#include <Arduino.h>

/**
 * handlePulseRate
 * Measures the high pulse duration on a pin and returns the frequency in Hz.
 * Assumes a 50% duty cycle for flow sensors.
 * Params: "PinLabel_GPIO"
 */
String handlePulseRate(const char* params) {
  if (!params) {
    return "{\"ok\":0,\"error\":\"ERR_MISSING_PARAMETER\"}";
  }

  int pin = parsePin(String(params));
  if (pin == -1) {
    return "{\"ok\":0,\"error\":\"ERR_INVALID_PIN\"}";
  }

  pinMode(pin, INPUT);
  
  // Use a long timeout (500ms) to support low flow rates
  // 30 L/h = 0.5 L/min = 1.25 Hz -> ~400ms High pulse
  unsigned long duration = pulseIn(pin, HIGH, 500000);

  if (duration == 0) {
    // Timeout or no pulses
    return "{\"ok\":1,\"hz\":0.0}";
  }

  // Frequency = 1 / Period
  // Period = 2 * duration (assuming 50% duty cycle)
  // Hz = 1,000,000 / (2 * duration)
  float hz = 500000.0 / (float)duration;

  String response = "{\"ok\":1,\"hz\":";
  response += String(hz, 2);
  response += "}";

  return response;
}

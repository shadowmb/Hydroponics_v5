/*
 * ONEWIRE_READ_TEMP Command Module (v5 Clean)
 * Reads temperature from DS18B20 OneWire sensors
 * Format: ONEWIRE_READ_TEMP|D5
 * Used for: DS18B20 temperature sensors
 */

// === INCLUDES ===
#include <OneWire.h>
#include <DallasTemperature.h>

// === GLOBALS ===
// OneWire sensors are initialized on-demand to save memory

// === DISPATCHER ===
else if (strcmp(cmd, "ONEWIRE_READ_TEMP") == 0) {
  return handleOneWireReadTemp(delimiter + 1);
}

// === FUNCTIONS ===
int parseOneWirePin(const char* pinStr) {
  if (strlen(pinStr) < 2 || pinStr[0] != 'D') {
    return -1;
  }
  int pin = atoi(pinStr + 1);
  return (pin >= 2 && pin <= 13) ? pin : -1;
}

String handleOneWireReadTemp(const char* params) {
  // Parse pin from params (e.g., "D5")
  if (!params || strlen(params) < 2) {
    return "{\"ok\":0,\"error\":\"ERR_MISSING_PARAMETER\"}";
  }

  int pin = parseOneWirePin(params);
  if (pin == -1) {
    return "{\"ok\":0,\"error\":\"ERR_INVALID_PIN\"}";
  }

  // Initialize OneWire and DallasTemperature
  OneWire oneWire(pin);
  DallasTemperature sensors(&oneWire);
  sensors.begin();

  // Request temperature
  sensors.requestTemperatures();
  
  // Read temperature (index 0 = first sensor on bus)
  float tempC = sensors.getTempCByIndex(0);

  // Check if reading failed
  if (tempC == DEVICE_DISCONNECTED_C) {
    return "{\"ok\":0,\"error\":\"ERR_SENSOR_NOT_FOUND\"}";
  }

  // Build and return JSON response
  String response = "{\"ok\":1,\"temp\":";
  response += String(tempC, 2);
  response += "}";
  
  return response;
}

/*
 * I2C_READ Command Module (v5 Clean)
 * Reads data from I2C devices
 * Format: I2C_READ|0x76|2  (address|bytes_to_read)
 * Used for: I2C sensors (BMP280, BME280, etc.)
 */

// === INCLUDES ===
#include <Wire.h>

// === GLOBALS ===
bool i2cInitialized = false;

// === DISPATCHER ===
else if (strcmp(cmd, "I2C_READ") == 0) {
  return handleI2CRead(delimiter + 1);
}

// === FUNCTIONS ===
void handleI2CRead(const char* params) {
  // This function signature is kept for compatibility but implementation is changed to return String
  // Wait, I need to change the signature in the replacement content too!
}

String handleI2CRead(const char* params) {
  // Parse params: "0x76|2" -> address=0x76, bytes=2
  if (!params || strlen(params) < 5) {
    return "{\"ok\":0,\"error\":\"ERR_MISSING_PARAMETER\"}";
  }

  // Find delimiter
  char paramsCopy[32];
  strncpy(paramsCopy, params, sizeof(paramsCopy) - 1);
  paramsCopy[sizeof(paramsCopy) - 1] = '\0';
  
  char* delimiter = strchr(paramsCopy, '|');
  if (!delimiter) {
    return "{\"ok\":0,\"error\":\"ERR_INVALID_FORMAT\"}";
  }

  *delimiter = '\0';
  const char* addrStr = paramsCopy;
  const char* bytesStr = delimiter + 1;

  // Parse I2C address (hex format: 0x76)
  uint8_t address;
  if (strncmp(addrStr, "0x", 2) == 0 || strncmp(addrStr, "0X", 2) == 0) {
    address = (uint8_t)strtol(addrStr, NULL, 16);
  } else {
    address = (uint8_t)atoi(addrStr);
  }

  // Parse bytes to read
  int bytesToRead = atoi(bytesStr);
  if (bytesToRead < 1 || bytesToRead > 32) {
    return "{\"ok\":0,\"error\":\"ERR_INVALID_VALUE\"}";
  }

  // Initialize I2C if needed
  if (!i2cInitialized) {
    Wire.begin();
    i2cInitialized = true;
  }

  // Request data from I2C device
  Wire.requestFrom(address, (uint8_t)bytesToRead);
  
  // Wait for data
  unsigned long startTime = millis();
  while (Wire.available() < bytesToRead && (millis() - startTime) < 100) {
    delay(1);
  }

  if (Wire.available() < bytesToRead) {
    return "{\"ok\":0,\"error\":\"ERR_I2C_TIMEOUT\"}";
  }

  // Read data
  uint8_t data[32];
  for (int i = 0; i < bytesToRead; i++) {
    data[i] = Wire.read();
  }

  // Build and return JSON response
  String response = "{\"ok\":1,\"address\":\"";
  response += addrStr;
  response += "\",\"data\":[";
  for (int i = 0; i < bytesToRead; i++) {
    response += data[i];
    if (i < bytesToRead - 1) response += ",";
  }
  response += "]}";
  
  return response;
}

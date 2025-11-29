
#include <Wire.h>

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

  // Note: Wire.begin() should be called in setup or lazily here if we had a global flag.
  // Since we don't have easy access to a global flag from here without declaring it in globals,
  // we assume Wire.begin() is called in setup OR we use a static local variable.
  static bool i2cInitialized = false;
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

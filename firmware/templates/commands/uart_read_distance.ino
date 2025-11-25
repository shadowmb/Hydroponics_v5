/*
 * UART_READ_DISTANCE Command Module (v5 Clean)
 * Reads distance from UART ultrasonic sensors (A02YYUW, JSN-SR04T)
 * Format: UART_READ_DISTANCE|D10|D11  (RX_pin|TX_pin)
 * Protocol: 4-byte frame [0xFF, MSB, LSB, Checksum]
 * Used for: A02YYUW, JSN-SR04T UART ultrasonic sensors
 */

// === INCLUDES ===
#include <SoftwareSerial.h>

// === GLOBALS ===
SoftwareSerial* uartSensor = nullptr;
int uartRxPin = -1;
int uartTxPin = -1;

// === DISPATCHER ===
else if (strcmp(cmd, "UART_READ_DISTANCE") == 0) {
  return handleUARTReadDistance(delimiter + 1);
}

// === FUNCTIONS ===
int parseUARTPin(const char* pinStr) {
  if (strlen(pinStr) < 2 || pinStr[0] != 'D') {
    return -1;
  }
  int pin = atoi(pinStr + 1);
  return (pin >= 2 && pin <= 13) ? pin : -1;
}

String handleUARTReadDistance(const char* params) {
  // Parse params: "D10|D11" -> RX=D10, TX=D11
  if (!params || strlen(params) < 7) {
    return "{\"ok\":0,\"error\":\"ERR_MISSING_PARAMETER\"}";
  }

  // Find delimiter between RX and TX pins
  char paramsCopy[16];
  strncpy(paramsCopy, params, sizeof(paramsCopy) - 1);
  paramsCopy[sizeof(paramsCopy) - 1] = '\0';
  
  char* pipePos = strchr(paramsCopy, '|');
  if (!pipePos) {
    return "{\"ok\":0,\"error\":\"ERR_INVALID_FORMAT\"}";
  }

  *pipePos = '\0';
  const char* rxPinStr = paramsCopy;
  const char* txPinStr = pipePos + 1;

  // Parse pins
  int rxPin = parseUARTPin(rxPinStr);
  int txPin = parseUARTPin(txPinStr);
  
  if (rxPin == -1 || txPin == -1) {
    return "{\"ok\":0,\"error\":\"ERR_INVALID_PIN\"}";
  }

  // Initialize SoftwareSerial if needed or if pins changed
  if (uartSensor == nullptr || rxPin != uartRxPin || txPin != uartTxPin) {
    if (uartSensor != nullptr) {
      delete uartSensor;
    }
    uartSensor = new SoftwareSerial(rxPin, txPin);
    uartSensor->begin(9600);
    uartRxPin = rxPin;
    uartTxPin = txPin;
    delay(100);  // Let sensor stabilize
  }

  // A02YYUW protocol: Read 4-byte frame [0xFF, MSB, LSB, Checksum]
  // Checksum = (0xFF + MSB + LSB) & 0xFF
  
  // Clear any old data
  while (uartSensor->available()) {
    uartSensor->read();
  }

  // Wait for data (up to 1 second)
  unsigned long startTime = millis();
  while (uartSensor->available() < 4 && (millis() - startTime) < 1000) {
    delay(10);
  }

  if (uartSensor->available() < 4) {
    return "{\"ok\":0,\"error\":\"ERR_SENSOR_TIMEOUT\"}";
  }

  // Read 4-byte frame
  uint8_t frame[4];
  for (int i = 0; i < 4; i++) {
    frame[i] = uartSensor->read();
  }

  // Validate header (should be 0xFF)
  if (frame[0] != 0xFF) {
    return "{\"ok\":0,\"error\":\"ERR_INVALID_HEADER\"}";
  }

  // Verify checksum
  uint8_t checksum = (frame[0] + frame[1] + frame[2]) & 0xFF;
  if (checksum != frame[3]) {
    return "{\"ok\":0,\"error\":\"ERR_CHECKSUM_FAILED\"}";
  }

  // Calculate distance in mm
  uint16_t distance = (frame[1] << 8) | frame[2];

  // Build and return JSON response
  String response = "{\"ok\":1,\"distance\":";
  response += distance;
  response += "}";
  
  return response;
}

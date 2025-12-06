
// Note: Globals (uartStream, uartSoftwareSerial, uartRxPin, uartTxPin, uartIsHardware) 
// are provided by the command definition JSON file (uart_read_distance.json)

String handleUARTReadDistance(const char* params) {
  if (!params || strlen(params) < 3) {
    return "{\"ok\":0,\"error\":\"ERR_MISSING_PARAMETER\"}";
  }

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

  int rxPin = parsePin(String(rxPinStr));
  int txPin = parsePin(String(txPinStr));
  
  if (rxPin == -1 || txPin == -1) {
    return "{\"ok\":0,\"error\":\"ERR_INVALID_PIN\"}";
  }

  if (uartStream == nullptr || rxPin != uartRxPin || txPin != uartTxPin) {
    // Cleanup
    if (uartSoftwareSerial != nullptr) {
      delete uartSoftwareSerial;
      uartSoftwareSerial = nullptr;
    }
    uartStream = nullptr;

    // Initialize
    #if defined(ARDUINO_UNOR4_WIFI) || defined(ARDUINO_UNOR4_MINIMA)
       if (rxPin == 0 && txPin == 1) {
         Serial1.begin(9600);
         uartStream = &Serial1;
         uartIsHardware = true;
       } else {
         uartSoftwareSerial = new SoftwareSerial(rxPin, txPin);
         uartSoftwareSerial->begin(9600);
         uartStream = uartSoftwareSerial;
         uartIsHardware = false;
       }
     #else
       uartSoftwareSerial = new SoftwareSerial(rxPin, txPin);
       uartSoftwareSerial->begin(9600);
       uartStream = uartSoftwareSerial;
       uartIsHardware = false;
     #endif
     
    uartRxPin = rxPin;
    uartTxPin = txPin;
    delay(100);
  }

  // Clear any old data
  while (uartStream->available()) {
    uartStream->read();
  }

  unsigned long startTime = millis();
  while (uartStream->available() < 4 && (millis() - startTime) < 1000) {
    delay(10);
  }

  if (uartStream->available() < 4) {
    return "{\"ok\":0,\"error\":\"ERR_SENSOR_TIMEOUT\"}";
  }

  uint8_t frame[4];
  for (int i = 0; i < 4; i++) {
    frame[i] = uartStream->read();
  }

  if (frame[0] != 0xFF) {
    return "{\"ok\":0,\"error\":\"ERR_INVALID_HEADER\"}";
  }

  uint8_t checksum = (frame[0] + frame[1] + frame[2]) & 0xFF;
  if (checksum != frame[3]) {
    return "{\"ok\":0,\"error\":\"ERR_CHECKSUM_FAILED\"}";
  }

  uint16_t distance = (frame[1] << 8) | frame[2];

  String response = "{\"ok\":1,\"distance\":";
  response += distance;
  response += "}";
  
  return response;
}

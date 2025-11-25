/*
 * MODBUS_RTU_READ Command Module (v5 Clean)
 * Reads Modbus RTU registers via Hardware Serial
 * Format: MODBUS_RTU_READ|D2|D3|{"addr":1,"func":3,"reg":0,"count":2}
 * Used for: Industrial sensors with Modbus RTU protocol
 * Note: Uses SoftwareSerial with dynamic RX/TX pins
 */

// === INCLUDES ===
#include <SoftwareSerial.h>

// === GLOBALS ===
SoftwareSerial* modbusSerial = nullptr;
int modbusRxPin = -1;
int modbusTxPin = -1;

// === DISPATCHER ===
else if (strcmp(cmd, "MODBUS_RTU_READ") == 0) {
  handleModbusRtuRead(delimiter + 1);
}

// === FUNCTIONS ===
unsigned int calculateModbusCRC16(unsigned char *buf, int len) {
  unsigned int crc = 0xFFFF;
  for (int pos = 0; pos < len; pos++) {
    crc ^= (unsigned int)buf[pos];
    for (int i = 8; i != 0; i--) {
      if ((crc & 0x0001) != 0) {
        crc >>= 1;
        crc ^= 0xA001;
      } else {
        crc >>= 1;
      }
    }
  }
  return crc;
}

int parseModbusPin(const char* pinStr) {
  if (strlen(pinStr) < 2 || pinStr[0] != 'D') {
    return -1;
  }
  int pin = atoi(pinStr + 1);
  return (pin >= 2 && pin <= 13) ? pin : -1;
}

void handleModbusRtuRead(const char* params) {
  // Parse params: "D2|D3|{...}" -> RX=D2, TX=D3, JSON params
  if (!params || strlen(params) < 10) {
    Serial.println("{\"ok\":0,\"error\":\"ERR_MISSING_PARAMETER\"}");
    return;
  }

  // Find first delimiter (between RX and TX)
  char paramsCopy[128];
  strncpy(paramsCopy, params, sizeof(paramsCopy) - 1);
  paramsCopy[sizeof(paramsCopy) - 1] = '\0';
  
  char* firstPipe = strchr(paramsCopy, '|');
  if (!firstPipe) {
    Serial.println("{\"ok\":0,\"error\":\"ERR_INVALID_FORMAT\"}");
    return;
  }
  *firstPipe = '\0';
  const char* rxPinStr = paramsCopy;
  
  // Find second delimiter (between TX and JSON)
  char* secondPipe = strchr(firstPipe + 1, '|');
  if (!secondPipe) {
    Serial.println("{\"ok\":0,\"error\":\"ERR_INVALID_FORMAT\"}");
    return;
  }
  *secondPipe = '\0';
  const char* txPinStr = firstPipe + 1;
  const char* jsonParams = secondPipe + 1;

  // Parse pins
  int rxPin = parseModbusPin(rxPinStr);
  int txPin = parseModbusPin(txPinStr);
  
  if (rxPin == -1 || txPin == -1) {
    Serial.println("{\"ok\":0,\"error\":\"ERR_INVALID_PIN\"}");
    return;
  }

  // Parse JSON parameters (simple parser for known structure)
  // Expected format: {"addr":1,"func":3,"reg":0,"count":2}
  uint8_t deviceAddr = 1;
  uint8_t functionCode = 3;
  uint16_t registerAddr = 0;
  uint16_t registerCount = 1;
  
  const char* addrPos = strstr(jsonParams, "\"addr\":");
  const char* funcPos = strstr(jsonParams, "\"func\":");
  const char* regPos = strstr(jsonParams, "\"reg\":");
  const char* countPos = strstr(jsonParams, "\"count\":");
  
  if (addrPos) deviceAddr = atoi(addrPos + 7);
  if (funcPos) functionCode = atoi(funcPos + 7);
  if (regPos) registerAddr = atoi(regPos + 6);
  if (countPos) registerCount = atoi(countPos + 8);

  // Initialize Modbus serial if needed or if pins changed
  if (modbusSerial == nullptr || rxPin != modbusRxPin || txPin != modbusTxPin) {
    if (modbusSerial != nullptr) {
      delete modbusSerial;
    }
    modbusSerial = new SoftwareSerial(rxPin, txPin);
    modbusSerial->begin(4800);  // Modbus RTU typically uses 4800 or 9600
    modbusRxPin = rxPin;
    modbusTxPin = txPin;
    delay(100);
  }

  // Build Modbus RTU request
  uint8_t request[8];
  request[0] = deviceAddr;
  request[1] = functionCode;
  request[2] = (registerAddr >> 8) & 0xFF;
  request[3] = registerAddr & 0xFF;
  request[4] = (registerCount >> 8) & 0xFF;
  request[5] = registerCount & 0xFF;
  
  unsigned int crc = calculateModbusCRC16(request, 6);
  request[6] = crc & 0xFF;
  request[7] = (crc >> 8) & 0xFF;

  // Clear any old data
  while (modbusSerial->available()) {
    modbusSerial->read();
  }

  // Send request
  modbusSerial->write(request, 8);
  
  // Wait for response
  delay(100);
  
  // Read response
  uint8_t expectedLen = 5 + (registerCount * 2);
  uint8_t response[64];
  int bytesRead = 0;
  unsigned long startTime = millis();
  
  while (bytesRead < expectedLen && (millis() - startTime) < 1000) {
    if (modbusSerial->available()) {
      response[bytesRead++] = modbusSerial->read();
    }
  }

  // Validate response
  if (bytesRead < 5) {
    Serial.println("{\"ok\":0,\"error\":\"ERR_MODBUS_TIMEOUT\"}");
    return;
  }

  // Check for Modbus exception
  if (response[1] & 0x80) {
    Serial.print("{\"ok\":0,\"error\":\"ERR_MODBUS_EXCEPTION\",\"code\":");
    Serial.print(response[2]);
    Serial.println("}");
    return;
  }

  // Verify CRC
  unsigned int responseCRC = calculateModbusCRC16(response, bytesRead - 2);
  unsigned int receivedCRC = response[bytesRead - 2] | (response[bytesRead - 1] << 8);
  
  if (responseCRC != receivedCRC) {
    Serial.println("{\"ok\":0,\"error\":\"ERR_MODBUS_CRC\"}");
    return;
  }

  // Extract register values
  Serial.print("{\"ok\":1,\"registers\":[");
  for (int i = 0; i < registerCount; i++) {
    int offset = 3 + (i * 2);
    uint16_t value = (response[offset] << 8) | response[offset + 1];
    Serial.print(value);
    if (i < registerCount - 1) Serial.print(",");
  }
  Serial.println("]}");
}
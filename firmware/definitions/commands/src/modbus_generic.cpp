
// Note: Globals (modbusStream, modbusSoftwareSerial, modbusRxPin, modbusTxPin, modbusIsHardware) 
// are provided by the command definition JSON file (modbus_rtu_read.json)

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

uint8_t readN(uint8_t *buf, size_t len, unsigned long timeout) {
  size_t offset = 0, left = len;
  uint8_t *buffer = buf;
  unsigned long startTime = millis();

  while (left) {
    if (modbusStream && modbusStream->available()) {
      buffer[offset] = modbusStream->read();
      offset++;
      left--;
    }
    if (millis() - startTime > timeout) {
      break;
    }
  }
  return offset;
}

String handleModbusRtuRead(const char* params) {
  DynamicJsonDocument doc(1024);
  DeserializationError error = deserializeJson(doc, params);

  if (error) {
    return F("{\"ok\":0,\"error\":\"JSON_PARSE_ERROR\"}");
  }

  int rxPin = 2;
  int txPin = 3;

  if (doc.containsKey("pins")) {
    JsonArray pins = doc["pins"];
    for (JsonObject pin : pins) {
      const char* role = pin["role"];
      if (role && strcmp(role, "RX") == 0) rxPin = pin["gpio"] | 2;
      else if (role && strcmp(role, "TX") == 0) txPin = pin["gpio"] | 3;
    }
  } else {
     rxPin = doc["rxPin"] | 2;
     txPin = doc["txPin"] | 3;
  }

  unsigned long baudRate = doc["baudRate"] | 4800;
  uint8_t deviceAddress = doc["slaveId"] | doc["deviceAddress"] | 1;
  uint8_t functionCode = doc["funcCode"] | doc["functionCode"] | 3;
  uint16_t registerAddress = doc["startAddr"] | doc["registerAddress"] | 0;
  uint16_t registerCount = doc["len"] | doc["registerCount"] | 1;
  unsigned long timeout = doc["timeout"] | 500;

  if (deviceAddress < 1 || deviceAddress > 247) return F("{\"ok\":0,\"error\":\"ERR_INVALID_ADDR\"}");
  if (registerCount < 1 || registerCount > 125) return F("{\"ok\":0,\"error\":\"ERR_INVALID_COUNT\"}");

  // Check if configuration changed
  if (modbusStream == nullptr || modbusRxPin != rxPin || modbusTxPin != txPin) {
     // Cleanup old
     #if !defined(ARDUINO_UNOR4_WIFI) && !defined(ARDUINO_UNOR4_MINIMA)
     if (modbusSoftwareSerial != nullptr) {
       delete modbusSoftwareSerial;
       modbusSoftwareSerial = nullptr;
     }
     #endif
     modbusStream = nullptr;

     // Initialize New
     #if defined(ARDUINO_UNOR4_WIFI) || defined(ARDUINO_UNOR4_MINIMA)
       if (rxPin == 0 && txPin == 1) {
         Serial1.begin(baudRate);
         modbusStream = &Serial1;
         modbusIsHardware = true;
       } else {
         return F("{\"ok\":0,\"error\":\"ERR_R4_REQUIRES_HW_SERIAL_ON_0_1\"}");
       }
     #else
       // AVR / ESP fallback
       modbusSoftwareSerial = new SoftwareSerial(rxPin, txPin);
       modbusSoftwareSerial->begin(baudRate);
       modbusStream = modbusSoftwareSerial;
       modbusIsHardware = false;
     #endif
     
     modbusRxPin = rxPin;
     modbusTxPin = txPin;
     delay(100); 
  }

  // Clear buffer
  while (modbusStream->available()) modbusStream->read();

  // Build Request
  uint8_t request[8];
  request[0] = deviceAddress;
  request[1] = functionCode;
  request[2] = (registerAddress >> 8) & 0xFF;
  request[3] = registerAddress & 0xFF;
  request[4] = (registerCount >> 8) & 0xFF;
  request[5] = registerCount & 0xFF;

  uint16_t crc = calculateModbusCRC16(request, 6);
  request[6] = crc & 0xFF;
  request[7] = (crc >> 8) & 0xFF;

  uint8_t response[64]; 
  bool success = false;
  uint8_t retryCount = 0;
  const uint8_t maxRetries = 3;

  while (!success && retryCount < maxRetries) {
    retryCount++;
    while (modbusStream->available()) modbusStream->read();
    
    delay(100); 
    modbusStream->write(request, 8);
    modbusStream->flush(); 
    delay(100); 

    // size_t expectedLen = 5 + (registerCount * 2); -- variable unused warning
    uint8_t ch;
    
    if (readN(&ch, 1, timeout) == 1 && ch == deviceAddress) {
      response[0] = ch;
      if (readN(&ch, 1, timeout) == 1 && ch == functionCode) {
        response[1] = ch;
        if (readN(&ch, 1, timeout) == 1) {
          uint8_t byteCount = ch; // variable shadow warning if declared above
          response[2] = ch;
          if (readN(&response[3], byteCount + 2, timeout) == byteCount + 2) {
             uint16_t receivedCRC = response[byteCount + 4] << 8 | response[byteCount + 3]; 
             uint16_t calculatedCRC = calculateModbusCRC16(response, byteCount + 3);
             if (receivedCRC == calculatedCRC) {
               success = true;
             }
          }
        }
      }
    }
  }

  if (!success) {
    return F("{\"ok\":0,\"error\":\"TIMEOUT_OR_CRC\"}");
  }

  doc.clear();
  doc["ok"] = 1;
  JsonArray regs = doc.createNestedArray("registers");
  
  // uint8_t byteCount = response[2]; -- unused variable
  for (int i = 0; i < registerCount; i++) {
     uint16_t val = (response[3 + i*2] << 8) | response[4 + i*2];
     regs.add(val);
  }
  
  String output;
  serializeJson(doc, output);
  
  return output;
}

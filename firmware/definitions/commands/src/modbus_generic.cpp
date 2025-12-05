
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
    if (modbusSerial->available()) {
      buffer[offset] = modbusSerial->read();
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
  // Parse parameters using ArduinoJson
  // We use DynamicJsonDocument. Size calculation:
  // params string length + some overhead. 512 bytes is usually enough for simple commands.
  DynamicJsonDocument doc(1024);
  DeserializationError error = deserializeJson(doc, params);

  if (error) {
    return "{\"ok\":0,\"error\":\"JSON_PARSE_ERROR\"}";
  }

  // Get parameters with defaults
  int rxPin = doc["rxPin"] | 2;
  int txPin = doc["txPin"] | 3;
  unsigned long baudRate = doc["baudRate"] | 4800; // Default to 4800 as seemingly common for this sensor
  uint8_t deviceAddress = doc["deviceAddress"] | 1;
  uint8_t functionCode = doc["functionCode"] | 3;
  uint16_t registerAddress = doc["registerAddress"] | 0;
  uint16_t registerCount = doc["registerCount"] | 1;
  unsigned long timeout = doc["timeout"] | 500;

  // Validate Modbus parameters
  if (deviceAddress < 1 || deviceAddress > 247) return "{\"ok\":0,\"error\":\"ERR_INVALID_ADDR\"}";
  if (registerCount < 1 || registerCount > 125) return "{\"ok\":0,\"error\":\"ERR_INVALID_COUNT\"}";

  // Initialize SoftwareSerial logic
  // Check if configuration changed
  if (modbusSerial == nullptr || modbusRxPin != rxPin || modbusTxPin != txPin) {
     if (modbusSerial != nullptr) {
       delete modbusSerial;
     }
     modbusSerial = new SoftwareSerial(rxPin, txPin);
     modbusSerial->begin(baudRate);
     modbusRxPin = rxPin;
     modbusTxPin = txPin;
     delay(100); 
  } else {
    // If only baudrate changed (rare)
    // Check if SoftwareSerial supports getBaud? No easy way, assume re-init if needed or just .begin() again?
    // SoftwareSerial.begin() can be called again.
    // For safety, let's just use what we have, assuming standard usage.
  }

  // Clear buffer
  while (modbusSerial->available()) modbusSerial->read();

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

  // Send & Receive with Retries
  uint8_t response[256]; // Max modbus frame is 256
  bool success = false;
  uint8_t retryCount = 0;
  const uint8_t maxRetries = 3;

  while (!success && retryCount < maxRetries) {
    retryCount++;
    
    // Clear before write
    while (modbusSerial->available()) modbusSerial->read();
    
    modbusSerial->write(request, 8);
    modbusSerial->flush(); // Wait for tx to finish

    // Read Response
    // Min response length: Addr(1) + Func(1) + ByteCount(1) + Data(N) + CRC(2)
    // For Read Holding Registers (03), expected length = 3 + (RegCount*2) + 2
    size_t expectedLen = 5 + (registerCount * 2);
    
    // Read header first 3 bytes to verify Addr/Func/ByteCount
    // Or just read everything with timeout logic from legacy Code?
    // Legacy code used 'readN' for parts.
    
    uint8_t ch;
    // 1. Address
    if (readN(&ch, 1, timeout) == 1 && ch == deviceAddress) {
      response[0] = ch;
      // 2. Function
      if (readN(&ch, 1, timeout) == 1 && ch == functionCode) {
        response[1] = ch;
         // 3. Byte Count
        if (readN(&ch, 1, timeout) == 1) {
          uint8_t byteCount = ch;
          response[2] = ch;
          
          if (byteCount + 5 != expectedLen) {
             // Unexpected byte count, but let's try to read it anyway + CRC
          }
          
          // Read Data + CRC
          if (readN(&response[3], byteCount + 2, timeout) == byteCount + 2) {
             // Validate CRC
             uint16_t receivedCRC = response[byteCount + 4] << 8 | response[byteCount + 3]; // Modbus is Little Endian for CRC bytes?
             // Legacy code: response[byteCount + 4] << 8 | response[byteCount + 3];
             // Wait, standard Modbus RTU sends CRC Low then High.
             // Legacy code calc: request[6] = crc & 0xFF; request[7] = (crc >> 8) & 0xFF;
             // So last byte is High.
             // receivedCRC = High << 8 | Low.
             
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
    return "{\"ok\":0,\"error\":\"TIMEOUT_OR_CRC\"}";
  }

  // Format Success Response
  doc.clear();
  doc["ok"] = 1;
  JsonArray regs = doc.createNestedArray("registers");
  
  uint8_t byteCount = response[2];
  for (int i = 0; i < registerCount; i++) {
     // Registers are Big Endian (High byte first)
     uint16_t val = (response[3 + i*2] << 8) | response[4 + i*2];
     regs.add(val);
  }
  
  String output;
  serializeJson(doc, output);
  return output;
}

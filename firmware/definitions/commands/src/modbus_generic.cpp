
// Modbus RTU Read Handler with EEPROM Config + Auto-Reset
// Prevents Bus Fault on Arduino Uno R4 when pins change at runtime

// Note: Globals (modbusStream, modbusSoftwareSerial, modbusRxPin, modbusTxPin, modbusIsHardware) 
// are provided by the command definition JSON file

// EEPROM addresses for Modbus config (different from UART to avoid conflicts)
#define EEPROM_MODBUS_MAGIC_ADDR 110
#define EEPROM_MODBUS_RX_ADDR    111
#define EEPROM_MODBUS_TX_ADDR    112
#define EEPROM_MODBUS_MAGIC_VALUE 0xCD

#if defined(ARDUINO_UNOR4_WIFI) || defined(ARDUINO_UNOR4_MINIMA)
  #include <EEPROM.h>
#endif

// Save Modbus config to EEPROM (R4 only)
void saveModbusConfig(int rxPin, int txPin) {
  #if defined(ARDUINO_UNOR4_WIFI) || defined(ARDUINO_UNOR4_MINIMA)
    EEPROM.write(EEPROM_MODBUS_MAGIC_ADDR, EEPROM_MODBUS_MAGIC_VALUE);
    EEPROM.write(EEPROM_MODBUS_RX_ADDR, (uint8_t)rxPin);
    EEPROM.write(EEPROM_MODBUS_TX_ADDR, (uint8_t)txPin);
  #endif
}

// Load Modbus config from EEPROM (R4 only)
bool loadModbusConfig(int* rxPin, int* txPin) {
  #if defined(ARDUINO_UNOR4_WIFI) || defined(ARDUINO_UNOR4_MINIMA)
    if (EEPROM.read(EEPROM_MODBUS_MAGIC_ADDR) == EEPROM_MODBUS_MAGIC_VALUE) {
      *rxPin = EEPROM.read(EEPROM_MODBUS_RX_ADDR);
      *txPin = EEPROM.read(EEPROM_MODBUS_TX_ADDR);
      return true;
    }
  #endif
  return false;
}

// Initialize Modbus from saved config at boot (call from setup())
void initModbusFromEeprom(unsigned long baudRate) {
  #if defined(ARDUINO_UNOR4_WIFI) || defined(ARDUINO_UNOR4_MINIMA)
    int rxPin, txPin;
    if (loadModbusConfig(&rxPin, &txPin)) {
      if (rxPin == 0 && txPin == 1) {
        Serial1.begin(baudRate);
        modbusStream = &Serial1;
        modbusIsHardware = true;
      } else if (rxPin >= 0 && txPin >= 0 && rxPin != txPin) {
        modbusSoftwareSerial = new SoftwareSerial(rxPin, txPin);
        if (modbusSoftwareSerial) {
          modbusSoftwareSerial->begin(baudRate);
          modbusStream = modbusSoftwareSerial;
          modbusIsHardware = false;
        }
      }
      modbusRxPin = rxPin;
      modbusTxPin = txPin;
    }
  #endif
}

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

  int rxPin = 0;
  int txPin = 1;

  if (doc.containsKey("pins")) {
    JsonArray pins = doc["pins"];
    for (JsonObject pin : pins) {
      const char* role = pin["role"];
      if (role && strcmp(role, "RX") == 0) rxPin = pin["gpio"] | 0;
      else if (role && strcmp(role, "TX") == 0) txPin = pin["gpio"] | 1;
    }
  } else {
     rxPin = doc["rxPin"] | 0;
     txPin = doc["txPin"] | 1;
  }

  unsigned long baudRate = doc["baudRate"] | 4800;
  uint8_t deviceAddress = doc["slaveId"] | doc["deviceAddress"] | 1;
  uint8_t functionCode = doc["funcCode"] | doc["functionCode"] | 3;
  uint16_t registerAddress = doc["startAddr"] | doc["registerAddress"] | 0;
  uint16_t registerCount = doc["len"] | doc["registerCount"] | 1;
  unsigned long timeout = doc["timeout"] | 500;

  if (deviceAddress < 1 || deviceAddress > 247) return F("{\"ok\":0,\"error\":\"ERR_INVALID_ADDR\"}");
  if (registerCount < 1 || registerCount > 125) return F("{\"ok\":0,\"error\":\"ERR_INVALID_COUNT\"}");
  if (rxPin == txPin) return F("{\"ok\":0,\"error\":\"ERR_SAME_PIN\"}");

  // === R4 EEPROM + AUTO-RESET LOGIC ===
  #if defined(ARDUINO_UNOR4_WIFI) || defined(ARDUINO_UNOR4_MINIMA)
    // Check if Modbus is already initialized with different pins
    if (modbusStream != nullptr && (rxPin != modbusRxPin || txPin != modbusTxPin)) {
      // Pins changed! Save new config and trigger auto-reset
      saveModbusConfig(rxPin, txPin);
      delay(50);
      NVIC_SystemReset();
      return F("{\"ok\":0,\"error\":\"ERR_RESTARTING\"}");
    }
    
    // First-time initialization
    if (modbusStream == nullptr) {
      saveModbusConfig(rxPin, txPin);
      
      if (rxPin == 0 && txPin == 1) {
        Serial1.begin(baudRate);
        modbusStream = &Serial1;
        modbusIsHardware = true;
      } else {
        modbusSoftwareSerial = new SoftwareSerial(rxPin, txPin);
        if (modbusSoftwareSerial == nullptr) {
          return F("{\"ok\":0,\"error\":\"ERR_MEMORY\"}");
        }
        modbusSoftwareSerial->begin(baudRate);
        modbusStream = modbusSoftwareSerial;
        modbusIsHardware = false;
      }
      
      modbusRxPin = rxPin;
      modbusTxPin = txPin;
      delay(100);
    }
  #else
    // Non-R4 platforms: allow runtime pin changes
    if (modbusStream == nullptr || modbusRxPin != rxPin || modbusTxPin != txPin) {
      if (modbusSoftwareSerial != nullptr) {
        delete modbusSoftwareSerial;
        modbusSoftwareSerial = nullptr;
      }
      modbusStream = nullptr;

      modbusSoftwareSerial = new SoftwareSerial(rxPin, txPin);
      modbusSoftwareSerial->begin(baudRate);
      modbusStream = modbusSoftwareSerial;
      modbusIsHardware = false;
      
      modbusRxPin = rxPin;
      modbusTxPin = txPin;
      delay(100);
    }
  #endif

  if (modbusStream == nullptr) {
    return F("{\"ok\":0,\"error\":\"ERR_STREAM_NULL\"}");
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

    uint8_t ch;
    
    if (readN(&ch, 1, timeout) == 1 && ch == deviceAddress) {
      response[0] = ch;
      if (readN(&ch, 1, timeout) == 1 && ch == functionCode) {
        response[1] = ch;
        if (readN(&ch, 1, timeout) == 1) {
          uint8_t byteCount = ch;
          response[2] = ch;
          if (readN(&response[3], byteCount + 2, timeout) == byteCount + 2) {
             // Modbus CRC is Little Endian: low byte first, high byte second
             uint16_t receivedCRC = response[byteCount + 3] | (response[byteCount + 4] << 8); 
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
  
  for (int i = 0; i < registerCount; i++) {
     uint16_t val = (response[3 + i*2] << 8) | response[4 + i*2];
     regs.add(val);
  }
  
  String output;
  serializeJson(doc, output);
  
  return output;
}

/*
 * MODBUS_RTU_READ Command Module
 * Reads Modbus RTU registers via UART (SoftwareSerial)
 * Used for: RS485 sensors with Modbus protocol (via RS485-to-UART converter)
 * Returns raw register values with CRC16 validation
 */

// === INCLUDES ===
#include <SoftwareSerial.h>

// === GLOBALS ===
SoftwareSerial* modbusSerial = nullptr;
int modbusRxPin = -1;
int modbusTxPin = -1;
unsigned long modbusBaudRate = 0;

// === DISPATCHER ===
else if (strcmp(cmd, "MODBUS_RTU_READ") == 0) {
  handleModbusRtuRead(doc);
}

// === FUNCTIONS ===

// CRC16 calculation for Modbus RTU
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

// Read N bytes from Modbus serial with timeout
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

void handleModbusRtuRead(JsonDocument& doc) {
  // Get parameters
  int rxPin = doc["rxPin"] | 2;
  int txPin = doc["txPin"] | 3;
  unsigned long baudRate = doc["baudRate"] | 4800;
  uint8_t deviceAddress = doc["deviceAddress"] | 1;
  uint8_t functionCode = doc["functionCode"] | 3;
  uint16_t registerAddress = doc["registerAddress"] | 0;
  uint16_t registerCount = doc["registerCount"] | 1;
  unsigned long timeout = doc["timeout"] | 500;

  // Validate pins
  if (rxPin < 2 || rxPin > 13 || txPin < 2 || txPin > 13) {
    doc.clear();
    doc["ok"] = 0;
    doc["error"] = "Invalid pin (use 2-13)";
    serializeJson(doc, Serial);
    Serial.println();
    return;
  }

  // Validate Modbus parameters
  if (deviceAddress < 1 || deviceAddress > 247) {
    doc.clear();
    doc["ok"] = 0;
    doc["error"] = "Invalid device address (1-247)";
    serializeJson(doc, Serial);
    Serial.println();
    return;
  }

  if (registerCount < 1 || registerCount > 125) {
    doc.clear();
    doc["ok"] = 0;
    doc["error"] = "Invalid register count (1-125)";
    serializeJson(doc, Serial);
    Serial.println();
    return;
  }

  // Initialize SoftwareSerial if needed or if config changed
  if (modbusSerial == nullptr ||
      modbusRxPin != rxPin ||
      modbusTxPin != txPin ||
      modbusBaudRate != baudRate) {

    if (modbusSerial != nullptr) {
      modbusSerial->end();
      delay(50);
      delete modbusSerial;
      modbusSerial = nullptr;
    }

    modbusSerial = new SoftwareSerial(rxPin, txPin);
    modbusSerial->begin(baudRate);
    modbusRxPin = rxPin;
    modbusTxPin = txPin;
    modbusBaudRate = baudRate;

    delay(200);

    while (modbusSerial->available()) {
      modbusSerial->read();
    }
  }

  // Build Modbus RTU request
  uint8_t request[8];
  request[0] = deviceAddress;
  request[1] = functionCode;
  request[2] = (registerAddress >> 8) & 0xFF;  // Register address high byte
  request[3] = registerAddress & 0xFF;          // Register address low byte
  request[4] = (registerCount >> 8) & 0xFF;     // Register count high byte
  request[5] = registerCount & 0xFF;            // Register count low byte

  // Calculate and append CRC
  uint16_t crc = calculateModbusCRC16(request, 6);
  request[6] = crc & 0xFF;        // CRC low byte
  request[7] = (crc >> 8) & 0xFF; // CRC high byte

  // Clear receive buffer
  while (modbusSerial->available()) {
    modbusSerial->read();
  }

  uint8_t response[10] = {0};
  uint8_t ch = 0;
  bool success = false;
  uint8_t bytesRead = 0;
  uint8_t retryCount = 0;
  uint8_t maxRetries = 5;

  while (!success && retryCount < maxRetries) {
    retryCount++;
    bytesRead = 0;

    delay(100);
    modbusSerial->write(request, 8);
    delay(100);

    uint8_t read1 = readN(&ch, 1, timeout);
    bytesRead += read1;

    if (read1 == 1) {
      if (ch == deviceAddress) {
        response[0] = ch;
        uint8_t read2 = readN(&ch, 1, timeout);
        bytesRead += read2;

        if (read2 == 1) {
          if (ch == functionCode) {
            response[1] = ch;
            uint8_t read3 = readN(&ch, 1, timeout);
            bytesRead += read3;

            if (read3 == 1) {
              uint8_t byteCount = ch;
              response[2] = ch;

              uint8_t read4 = readN(&response[3], byteCount + 2, timeout);
              bytesRead += read4;

              if (read4 == byteCount + 2) {
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
    }

    modbusSerial->flush();
  }

  if (!success) {
    doc.clear();
    doc["ok"] = 0;
    doc["error"] = "Timeout or invalid response";
    doc["bytesRead"] = bytesRead;
    doc["retries"] = retryCount;
    serializeJson(doc, Serial);
    Serial.println();
    return;
  }

  doc.clear();
  doc["ok"] = 1;

  JsonArray registers = doc.createNestedArray("registers");
  for (int i = 0; i < registerCount; i++) {
    uint16_t regValue = (response[3 + i * 2] << 8) | response[4 + i * 2];
    registers.add(regValue);
  }

  serializeJson(doc, Serial);
  Serial.println();
}

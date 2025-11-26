/*
 * UART_STREAM_READ Command Module (WiFi version)
 * Reads continuous stream data via UART (SoftwareSerial)
 * Used for: Sensors that continuously output data (e.g., ultrasonic sensors)
 * Returns raw byte data with optional checksum validation
 */

// === INCLUDES ===
#include <SoftwareSerial.h>

// === GLOBALS ===
SoftwareSerial* streamSerial = nullptr;
int streamRxPin = -1;
int streamTxPin = -1;
unsigned long streamBaudRate = 0;

// === DISPATCHER ===
else if (strcmp(cmd, "UART_STREAM_READ") == 0) {
  return handleUartStreamRead();
}

// === FUNCTIONS ===

// Read frame from stream with timeout
uint8_t readStreamFrame(uint8_t *buf, size_t len, unsigned long timeout, uint8_t headerByte, bool hasHeader) {
  size_t offset = 0;
  unsigned long startTime = millis();
  bool headerFound = !hasHeader; // If no header required, skip header search

  while (offset < len) {
    if (streamSerial->available()) {
      uint8_t byte = streamSerial->read();

      // Wait for header byte if required
      if (!headerFound) {
        if (byte == headerByte) {
          headerFound = true;
          buf[offset++] = byte;
        }
      } else {
        buf[offset++] = byte;
      }
    }

    if (millis() - startTime > timeout) {
      break;
    }
  }
  return offset;
}

// Calculate checksum based on type
bool validateChecksum(uint8_t *buf, size_t len, const char* checksumType) {
  if (strcmp(checksumType, "none") == 0) {
    return true; // No validation needed
  }

  if (len < 2) {
    return false; // Need at least 1 data byte + 1 checksum byte
  }

  uint8_t receivedChecksum = buf[len - 1];
  uint8_t calculated = 0;

  if (strcmp(checksumType, "sum") == 0) {
    // Sum checksum (low 8 bits)
    for (size_t i = 0; i < len - 1; i++) {
      calculated += buf[i];
    }
    calculated &= 0xFF;
  } else if (strcmp(checksumType, "xor") == 0) {
    // XOR checksum
    for (size_t i = 0; i < len - 1; i++) {
      calculated ^= buf[i];
    }
  } else {
    return false; // Unknown checksum type
  }

  return (calculated == receivedChecksum);
}

String handleUartStreamRead() {
  // Get parameters with Arduino defaults
  int rxPin = jsonDoc["rxPin"];
  int txPin = jsonDoc["txPin"] | -1; // TX is optional for stream reading
  unsigned long baudRate = jsonDoc["baudRate"] | 9600;
  uint8_t frameLength = jsonDoc["frameLength"];
  uint8_t headerByte = jsonDoc["headerByte"] | 0xFF;
  const char* checksumType = jsonDoc["checksumType"] | "none";
  unsigned long timeout = jsonDoc["timeout"] | 1000;
  bool hasHeader = jsonDoc.containsKey("headerByte");

  // Validate pins
  if (rxPin < 2 || rxPin > 13) {
    return "{\"ok\":0,\"error\":\"Invalid RX pin (use 2-13)\"}";
  }

  if (txPin != -1 && (txPin < 2 || txPin > 13)) {
    return "{\"ok\":0,\"error\":\"Invalid TX pin (use 2-13 or omit)\"}";
  }

  // Validate frame length
  if (frameLength < 1 || frameLength > 64) {
    return "{\"ok\":0,\"error\":\"Invalid frame length (1-64)\"}";
  }

  // Initialize SoftwareSerial if needed or if config changed
  if (streamSerial == nullptr ||
      streamRxPin != rxPin ||
      streamTxPin != txPin ||
      streamBaudRate != baudRate) {

    if (streamSerial != nullptr) {
      streamSerial->end();
      delete streamSerial;
    }

    if (txPin == -1) {
      txPin = rxPin + 1; // Dummy TX pin (not used)
    }

    streamSerial = new SoftwareSerial(rxPin, txPin);
    streamSerial->begin(baudRate);
    streamRxPin = rxPin;
    streamTxPin = txPin;
    streamBaudRate = baudRate;
    delay(100); // Allow serial to stabilize
  }

  // Clear receive buffer
  while (streamSerial->available()) {
    streamSerial->read();
  }

  // Read frame
  uint8_t frame[64];
  uint8_t bytesRead = readStreamFrame(frame, frameLength, timeout, headerByte, hasHeader);

  // Validate read length
  if (bytesRead != frameLength) {
    StaticJsonDocument<128> doc;
    doc["ok"] = 0;
    doc["error"] = "Incomplete frame";
    doc["expected"] = frameLength;
    doc["received"] = bytesRead;
    String result;
    serializeJson(doc, result);
    streamSerial->flush();
    return result;
  }

  // Validate checksum if required
  if (!validateChecksum(frame, bytesRead, checksumType)) {
    streamSerial->flush();
    return "{\"ok\":0,\"error\":\"Checksum validation failed\"}";
  }

  // Build response with raw frame data
  StaticJsonDocument<512> doc;
  doc["ok"] = 1;
  doc["frameLength"] = bytesRead;
  doc["checksumValid"] = true;

  // Return raw bytes as array
  JsonArray data = doc.createNestedArray("data");
  for (uint8_t i = 0; i < bytesRead; i++) {
    data.add(frame[i]);
  }

  String result;
  serializeJson(doc, result);
  streamSerial->flush();
  return result;
}

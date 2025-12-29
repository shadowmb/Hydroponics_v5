
// UART Read Distance Handler with EEPROM Config + Auto-Reset
// Prevents Bus Fault on Arduino Uno R4 when pins change at runtime

// Note: Globals (uartStream, uartSoftwareSerial, uartRxPin, uartTxPin, uartIsHardware) 
// are provided by the command definition JSON file

// EEPROM addresses for UART config (avoid conflicts with other configs)
#define EEPROM_UART_MAGIC_ADDR 100
#define EEPROM_UART_RX_ADDR    101
#define EEPROM_UART_TX_ADDR    102
#define EEPROM_UART_MAGIC_VALUE 0xAB

#if defined(ARDUINO_UNOR4_WIFI) || defined(ARDUINO_UNOR4_MINIMA)
  #include <EEPROM.h>
#endif

// Save UART config to EEPROM (R4 only)
void saveUartConfig(int rxPin, int txPin) {
  #if defined(ARDUINO_UNOR4_WIFI) || defined(ARDUINO_UNOR4_MINIMA)
    EEPROM.write(EEPROM_UART_MAGIC_ADDR, EEPROM_UART_MAGIC_VALUE);
    EEPROM.write(EEPROM_UART_RX_ADDR, (uint8_t)rxPin);
    EEPROM.write(EEPROM_UART_TX_ADDR, (uint8_t)txPin);
  #endif
}

// Load UART config from EEPROM (R4 only)
// Returns true if valid config found, fills rxPin/txPin
bool loadUartConfig(int* rxPin, int* txPin) {
  #if defined(ARDUINO_UNOR4_WIFI) || defined(ARDUINO_UNOR4_MINIMA)
    if (EEPROM.read(EEPROM_UART_MAGIC_ADDR) == EEPROM_UART_MAGIC_VALUE) {
      *rxPin = EEPROM.read(EEPROM_UART_RX_ADDR);
      *txPin = EEPROM.read(EEPROM_UART_TX_ADDR);
      return true;
    }
  #endif
  return false;
}

// Initialize UART from saved config at boot (call from setup())
void initUartFromEeprom() {
  #if defined(ARDUINO_UNOR4_WIFI) || defined(ARDUINO_UNOR4_MINIMA)
    int rxPin, txPin;
    if (loadUartConfig(&rxPin, &txPin)) {
      if (rxPin == 0 && txPin == 1) {
        Serial1.begin(9600);
        uartStream = &Serial1;
        uartIsHardware = true;
      } else if (rxPin >= 0 && txPin >= 0 && rxPin != txPin) {
        uartSoftwareSerial = new SoftwareSerial(rxPin, txPin);
        if (uartSoftwareSerial) {
          uartSoftwareSerial->begin(9600);
          uartStream = uartSoftwareSerial;
          uartIsHardware = false;
        }
      }
      uartRxPin = rxPin;
      uartTxPin = txPin;
    }
  #endif
}

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

  if (rxPin == txPin) {
    return "{\"ok\":0,\"error\":\"ERR_SAME_PIN\"}";
  }

  // === R4 EEPROM + AUTO-RESET LOGIC ===
  #if defined(ARDUINO_UNOR4_WIFI) || defined(ARDUINO_UNOR4_MINIMA)
    // Check if UART is already initialized with different pins
    if (uartStream != nullptr && (rxPin != uartRxPin || txPin != uartTxPin)) {
      // Pins changed! Save new config and trigger auto-reset
      saveUartConfig(rxPin, txPin);
      delay(50); // Ensure EEPROM write completes
      
      // Return message before reset (backend should handle this)
      // Then reset - this line won't return
      NVIC_SystemReset();
      
      // Fallback (never reached)
      return "{\"ok\":0,\"error\":\"ERR_RESTARTING\"}";
    }
    
    // First-time initialization
    if (uartStream == nullptr) {
      // Save config to EEPROM for future boots
      saveUartConfig(rxPin, txPin);
      
      if (rxPin == 0 && txPin == 1) {
        Serial1.begin(9600);
        uartStream = &Serial1;
        uartIsHardware = true;
      } else {
        uartSoftwareSerial = new SoftwareSerial(rxPin, txPin);
        if (uartSoftwareSerial == nullptr) {
          return "{\"ok\":0,\"error\":\"ERR_MEMORY\"}";
        }
        uartSoftwareSerial->begin(9600);
        uartStream = uartSoftwareSerial;
        uartIsHardware = false;
      }
      
      uartRxPin = rxPin;
      uartTxPin = txPin;
      delay(150);
    }
  #else
    // Non-R4 platforms: allow runtime pin changes (they handle it fine)
    if (uartStream == nullptr || rxPin != uartRxPin || txPin != uartTxPin) {
      if (uartSoftwareSerial != nullptr) {
        delete uartSoftwareSerial;
        uartSoftwareSerial = nullptr;
      }
      uartStream = nullptr;
      
      uartSoftwareSerial = new SoftwareSerial(rxPin, txPin);
      if (uartSoftwareSerial == nullptr) {
        return "{\"ok\":0,\"error\":\"ERR_MEMORY\"}";
      }
      uartSoftwareSerial->begin(9600);
      uartStream = uartSoftwareSerial;
      uartIsHardware = false;
      
      uartRxPin = rxPin;
      uartTxPin = txPin;
      delay(100);
    }
  #endif

  // Safety check
  if (uartStream == nullptr) {
    return "{\"ok\":0,\"error\":\"ERR_STREAM_NULL\"}";
  }

  // Clear buffer
  while (uartStream->available()) {
    uartStream->read();
  }

  // Wait for sensor data
  unsigned long startTime = millis();
  while (uartStream->available() < 4 && (millis() - startTime) < 1000) {
    delay(10);
  }

  if (uartStream->available() < 4) {
    return "{\"ok\":0,\"error\":\"ERR_SENSOR_TIMEOUT\"}";
  }

  // Read frame
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

  if (distance < 30 || distance > 4500) {
    return "{\"ok\":0,\"error\":\"ERR_OUT_OF_RANGE\"}";
  }

  String response = "{\"ok\":1,\"distance\":";
  response += distance;
  response += "}";
  
  return response;
}

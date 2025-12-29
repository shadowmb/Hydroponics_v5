/*
 * Hydroponics v5 Firmware
 * Board: Arduino Uno R4 WiFi
 * Transport: wifi_native
 * Generated: 2025-12-29T10:42:20.966Z
 */

// === INCLUDES ===
#include <Arduino.h>
#include <WiFiS3.h>
#include <WiFiUdp.h>
#include <SoftwareSerial.h>
#include <ArduinoJson.h>
#include <SoftwareSerial.h>
#include <malloc.h>

// === GLOBALS ===
const char* CAPABILITIES[] = { "DHT_READ", "MODBUS_RTU_READ", "DIGITAL_WRITE", "DIGITAL_READ", "PWM_WRITE", "UART_READ_DISTANCE", "ANALOG", "ULTRASONIC_TRIG_ECHO", "ONEWIRE_READ_TEMP" };
const int CAPABILITIES_COUNT = 9;
WiFiUDP udp;
char packetBuffer[255];
Stream* modbusStream = nullptr;
SoftwareSerial* modbusSoftwareSerial = nullptr;
int modbusRxPin = -1;
int modbusTxPin = -1;
bool modbusIsHardware = false;
Stream* uartStream = nullptr;
SoftwareSerial* uartSoftwareSerial = nullptr;
int uartRxPin = -1;
int uartTxPin = -1;
bool uartIsHardware = false;

// === PROTOTYPES ===
String processCommand(String input);

// === SETUP ===
void setup() {
  Serial.begin(115200);
  delay(2000); // Wait for Serial
  Serial.println("Booting...");
  // Connect to WiFi
  Serial.print("Connecting to WiFi: TP-Link_Penka");
  WiFi.begin("TP-Link_Penka", "7806130560");
  int wifiRetries = 0;
  while (WiFi.status() != WL_CONNECTED && wifiRetries < 20) {
    delay(500);
    Serial.print(".");
    wifiRetries++;
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi Connected!");
    // Wait for IP Address
    Serial.print("Waiting for IP");
    int ipRetries = 0;
    while (WiFi.localIP() == IPAddress(0,0,0,0) && ipRetries < 20) {
      delay(500);
      Serial.print(".");
      ipRetries++;
    }
    Serial.println();
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    udp.begin(8888);
  } else {
    Serial.println("WiFi Connection Failed! Continuing...");
  }
}

// === LOOP ===
void loop() {
  // UDP Handling
  int packetSize = udp.parsePacket();
  if (packetSize) {
    Serial.print("Received UDP packet: ");
    Serial.println(packetSize);
    int len = udp.read(packetBuffer, 255);
    if (len > 0) packetBuffer[len] = 0;
    Serial.print("Payload: ");
    Serial.println(packetBuffer);
    String response = processCommand(String(packetBuffer));
    udp.beginPacket(udp.remoteIP(), udp.remotePort());
    udp.print(response);
    udp.endPacket();
  }
  // Serial Handling (for debugging)
  if (Serial.available()) {
    String input = Serial.readStringUntil('\n');
    input.trim();
    if (input.length() > 0) {
      Serial.print("Command received via Serial: ");
      Serial.println(input);
      String response = processCommand(input);
      Serial.println(response);
    }
  }
  // Modbus loop logic if needed
}

// === FUNCTIONS ===
int parsePin(String pinStr) {
  // 1. Handle Label_GPIO format (e.g. "D1_25" -> 25)
  int underscoreIndex = pinStr.indexOf('_');
  if (underscoreIndex != -1) {
    return pinStr.substring(underscoreIndex + 1).toInt();
  }

  // 2. Handle "D5" -> 5
  if (pinStr.startsWith("D")) {
    return pinStr.substring(1).toInt();
  }

  // 3. Handle "A0" -> A0
  if (pinStr.startsWith("A")) {
    int pin = pinStr.substring(1).toInt();
    #if defined(ESP8266)
      return A0; // ESP8266 only has A0
    #else
      static const uint8_t analog_pins[] = {A0, A1, A2, A3, A4, A5};
      if (pin >= 0 && pin < 6) return analog_pins[pin];
    #endif
  }

  // 4. Handle raw number "5"
  return pinStr.toInt();
}



String handleDHTRead(const char* params) {
  // Parse pin from params (e.g., "D4")
  if (!params || strlen(params) < 2) {
    return "{\"ok\":0,\"error\":\"ERR_MISSING_PARAMETER\"}";
  }

  int dataPin = parsePin(String(params));
  if (dataPin == -1) {
    return "{\"ok\":0,\"error\":\"ERR_INVALID_PIN\"}";
  }

  // DHT22 protocol parameters
  const unsigned long START_LOW_DURATION = 18000;  // 18ms
  const unsigned long START_HIGH_DURATION = 40;     // 40μs
  const unsigned long BIT_THRESHOLD = 40;           // 40μs threshold
  const int NUM_BITS = 40;                          // 40 bits (5 bytes)
  const unsigned long TIMEOUT = 5000;               // 5s timeout

  byte data[5] = {0};  // 5 bytes: humidity_int, humidity_dec, temp_int, temp_dec, checksum

  // Send start signal
  pinMode(dataPin, OUTPUT);
  digitalWrite(dataPin, LOW);
  delayMicroseconds(START_LOW_DURATION);
  digitalWrite(dataPin, HIGH);
  delayMicroseconds(START_HIGH_DURATION);
  pinMode(dataPin, INPUT);

  unsigned long timeoutStart = millis();

  // Wait for sensor response (pull low)
  while (digitalRead(dataPin) == HIGH) {
    if (millis() - timeoutStart > TIMEOUT) {
      return "{\"ok\":0,\"error\":\"ERR_SENSOR_TIMEOUT\"}";
    }
  }

  // Wait for sensor ready (pull high)
  while (digitalRead(dataPin) == LOW) {
    if (millis() - timeoutStart > TIMEOUT) {
      return "{\"ok\":0,\"error\":\"ERR_SENSOR_TIMEOUT\"}";
    }
  }

  // Wait for data start (pull low)
  while (digitalRead(dataPin) == HIGH) {
    if (millis() - timeoutStart > TIMEOUT) {
      return "{\"ok\":0,\"error\":\"ERR_SENSOR_TIMEOUT\"}";
    }
  }

  // Read 40 bits of data
  for (int i = 0; i < NUM_BITS; i++) {
    // Wait for bit start (high pulse)
    while (digitalRead(dataPin) == LOW) {
      if (millis() - timeoutStart > TIMEOUT) {
        return "{\"ok\":0,\"error\":\"ERR_READ_TIMEOUT\"}";
      }
    }

    // Measure high pulse duration
    unsigned long pulseStart = micros();
    while (digitalRead(dataPin) == HIGH) {
      if (millis() - timeoutStart > TIMEOUT) {
        return "{\"ok\":0,\"error\":\"ERR_READ_TIMEOUT\"}";
      }
    }
    unsigned long pulseDuration = micros() - pulseStart;

    // Decode bit: >40μs = 1, <40μs = 0
    int byteIndex = i / 8;
    int bitIndex = 7 - (i % 8);
    if (pulseDuration > BIT_THRESHOLD) {
      data[byteIndex] |= (1 << bitIndex);
    }
  }

  // Verify checksum
  byte checksum = data[0] + data[1] + data[2] + data[3];
  if (checksum != data[4]) {
    return "{\"ok\":0,\"error\":\"ERR_CHECKSUM_FAILED\"}";
  }

  // Parse DHT22 data (high precision: 0.1°C, 0.1% RH)
  // For DHT11, data[1] and data[3] will be 0
  float humidity = ((data[0] << 8) | data[1]) / 10.0;
  float temperature = (((data[2] & 0x7F) << 8) | data[3]) / 10.0;
  
  // Handle negative temperature (DHT22 only)
  if (data[2] & 0x80) {
    temperature = -temperature;
  }

  // Build and return JSON response
  String response = "{\"ok\":1,\"temp\":";
  response += String(temperature, 1);
  response += ",\"humidity\":";
  response += String(humidity, 1);
  response += "}";
  
  return response;
}


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
     if (modbusSoftwareSerial != nullptr) {
       delete modbusSoftwareSerial;
       modbusSoftwareSerial = nullptr;
     }
     modbusStream = nullptr;

     // Initialize New
     #if defined(ARDUINO_UNOR4_WIFI) || defined(ARDUINO_UNOR4_MINIMA)
       if (rxPin == 0 && txPin == 1) {
         Serial1.begin(baudRate);
         modbusStream = &Serial1;
         modbusIsHardware = true;
       } else {
         // Enable SoftwareSerial on R4 (same as UART_READ_DISTANCE)
         modbusSoftwareSerial = new SoftwareSerial(rxPin, txPin);
         modbusSoftwareSerial->begin(baudRate);
         modbusStream = modbusSoftwareSerial;
         modbusIsHardware = false;
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



String handleDigitalWrite(const char* params) {
  // Parse params: "D8|1" -> pin=D8, state=1
  if (!params || strlen(params) < 4) {
    return "{\"ok\":0,\"error\":\"ERR_MISSING_PARAMETER\"}";
  }

  // Find delimiter
  char paramsCopy[16];
  strncpy(paramsCopy, params, sizeof(paramsCopy) - 1);
  paramsCopy[sizeof(paramsCopy) - 1] = '\0';
  
  char* delimiter = strchr(paramsCopy, '|');
  if (!delimiter) {
    return "{\"ok\":0,\"error\":\"ERR_INVALID_FORMAT\"}";
  }

  *delimiter = '\0';
  const char* pinStr = paramsCopy;
  const char* stateStr = delimiter + 1;

  // Parse pin
  int pin = parsePin(String(pinStr));
  if (pin == -1) {
    return "{\"ok\":0,\"error\":\"ERR_INVALID_PIN\"}";
  }

  // Parse state (0 or 1)
  int state = atoi(stateStr);
  if (state != 0 && state != 1) {
    return "{\"ok\":0,\"error\":\"ERR_INVALID_VALUE\"}";
  }

  // Set pin mode and state
  pinMode(pin, OUTPUT);
  digitalWrite(pin, state);

  #ifdef ENABLE_EEPROM_STATE_SAVE
  saveState(pin, state);
  #endif

  // Build and return JSON response
  String response = "{\"ok\":1,\"pin\":\"";
  response += pinStr;
  response += "\",\"state\":";
  response += state;
  response += "}";
  
  return response;
}



String handleDigitalRead(const char* params) {
  // Parse pin from params (e.g., "D3")
  if (!params || strlen(params) < 2) {
    return "{\"ok\":0,\"error\":\"ERR_MISSING_PARAMETER\"}";
  }

  int pin = parsePin(String(params));
  if (pin == -1) {
    return "{\"ok\":0,\"error\":\"ERR_INVALID_PIN\"}";
  }

  // Read state
  int state = digitalRead(pin);

  // Build and return JSON response
  String response = "{\"ok\":1,\"pin\":\"";
  response += params;
  response += "\",\"state\":";
  response += state;
  response += "}";
  
  return response;
}



bool isPWMPin(int pin) {
  // Basic check for common Arduino boards. 
  // Ideally this should be board-specific but for now we keep it simple or rely on analogWrite handling it (it usually ignores non-PWM pins or does digital write)
  // Arduino Uno PWM pins: 3, 5, 6, 9, 10, 11
  // ESP8266/ESP32 have software PWM on most pins so this check is less critical there.
  return true; 
}

String handlePWMWrite(const char* params) {
  // Parse params: "D9|128" -> pin=D9, value=128
  if (!params || strlen(params) < 4) {
    return "{\"ok\":0,\"error\":\"ERR_MISSING_PARAMETER\"}";
  }

  // Find delimiter
  char paramsCopy[16];
  strncpy(paramsCopy, params, sizeof(paramsCopy) - 1);
  paramsCopy[sizeof(paramsCopy) - 1] = '\0';
  
  char* delimiter = strchr(paramsCopy, '|');
  if (!delimiter) {
     return "{\"ok\":0,\"error\":\"ERR_INVALID_FORMAT\"}";
  }
  
  *delimiter = '\0';
  const char* pinStr = paramsCopy;
  const char* valStr = delimiter + 1;

  // Parse pin
  int pin = parsePin(String(pinStr));
  if (pin == -1) {
    return "{\"ok\":0,\"error\":\"ERR_INVALID_PIN\"}";
  }

  // Parse value (0-255)
  int value = atoi(valStr);
  if (value < 0 || value > 255) {
    return "{\"ok\":0,\"error\":\"ERR_INVALID_VALUE\"}";
  }

  // Set PWM value
  pinMode(pin, OUTPUT);
  analogWrite(pin, value);

  // Build and return JSON response
  String response = "{\"ok\":1,\"pin\":\"";
  response += pinStr;
  response += "\",\"value\":";
  response += value;
  response += "}";
  
  return response;
}


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



String handleAnalog(const char* params) {
  // Parse pin from params (e.g., "A0_14")
  if (!params || strlen(params) < 2) {
    return "{\"ok\":0,\"error\":\"ERR_MISSING_PARAMETER\"}";
  }

  // Use global parsePin helper (handles Label_GPIO format)
  // Note: parsePin is expected to be available in the main sketch or shared utils
  int analogPin = parsePin(params);
  
  if (analogPin == -1) {
    return "{\"ok\":0,\"error\":\"ERR_INVALID_PIN\"}";
  }

  // Read analog value (0-1023)
  int value = analogRead(analogPin);

  // Build and return JSON response
  String response = "{\"ok\":1,\"pin\":\"";
  response += params;
  response += "\",\"value\":";
  response += value;
  response += "}";
  
  return response;
}



String handleUltrasonicTrigEcho(const char* params) {
  // Expected params: "D2_2|D3_3" (Trig|Echo)
  
  if (!params) {
    return "{\"ok\":0,\"error\":\"ERR_MISSING_PARAMETER\"}";
  }

  // Parse Trig Pin
  char paramsCopy[64];
  strncpy(paramsCopy, params, sizeof(paramsCopy) - 1);
  paramsCopy[sizeof(paramsCopy) - 1] = '\0';

  char* pipe = strchr(paramsCopy, '|');
  if (!pipe) {
    return "{\"ok\":0,\"error\":\"ERR_INVALID_FORMAT\"}";
  }
  *pipe = '\0';
  
  const char* trigPinStr = paramsCopy;
  const char* echoPinStr = pipe + 1;

  int trigPin = parsePin(String(trigPinStr));
  int echoPin = parsePin(String(echoPinStr));

  if (trigPin == -1 || echoPin == -1) {
    return "{\"ok\":0,\"error\":\"ERR_INVALID_PIN\"}";
  }

  // Perform Measurement
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);

  // Clear Trig
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);

  // Send 10us Pulse
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  // Read Echo
  long duration = pulseIn(echoPin, HIGH, 30000); // 30ms timeout (~5m)

  if (duration == 0) {
    return "{\"ok\":0,\"error\":\"ERR_TIMEOUT\"}";
  }

  // Calculate Distance (cm)
  // Speed of sound = 343 m/s = 0.0343 cm/us
  // Distance = (duration * 0.0343) / 2
  float distance = (duration * 0.0343) / 2.0;

  String response = "{\"ok\":1,\"distance\":";
  response += String(distance, 1);
  response += "}";

  return response;
}


void writeOnewireByte(int pin, byte data) {
  for (int i = 0; i < 8; i++) {
    pinMode(pin, OUTPUT);
    digitalWrite(pin, LOW);

    if (data & (1 << i)) {
      delayMicroseconds(6);
      pinMode(pin, INPUT);
      delayMicroseconds(64);
    } else {
      delayMicroseconds(60);
      pinMode(pin, INPUT);
      delayMicroseconds(10);
    }
  }
}

byte readOnewireByte(int pin) {
  byte data = 0;

  for (int i = 0; i < 8; i++) {
    pinMode(pin, OUTPUT);
    digitalWrite(pin, LOW);
    delayMicroseconds(3);
    pinMode(pin, INPUT);
    delayMicroseconds(10);

    if (digitalRead(pin)) {
      data |= (1 << i);
    }

    delayMicroseconds(53);
  }

  return data;
}

String handleOneWireReadTemp(const char* params) {
  // Parse pin from params (e.g., "D5")
  if (!params || strlen(params) < 2) {
    return "{\"ok\":0,\"error\":\"ERR_MISSING_PARAMETER\"}";
  }

  int pin = parsePin(String(params));
  if (pin == -1) {
    return "{\"ok\":0,\"error\":\"ERR_INVALID_PIN\"}";
  }

  byte data[9] = {0};  // DS18B20 scratchpad data
  bool readSuccess = false;

  // Step 1: Reset and check presence
  pinMode(pin, OUTPUT);
  digitalWrite(pin, LOW);
  delayMicroseconds(480);
  pinMode(pin, INPUT);
  delayMicroseconds(70);

  if (digitalRead(pin) == HIGH) {
    return "{\"ok\":0,\"error\":\"ERR_SENSOR_NOT_FOUND\"}";
  }

  delayMicroseconds(410);  // Complete presence sequence

  // Step 2: Skip ROM + Convert T
  writeOnewireByte(pin, 0xCC);  // Skip ROM
  writeOnewireByte(pin, 0x44);  // Convert T
  
  // Wait for conversion (750ms for 12-bit)
  delay(750);

  // Step 3: Reset, Skip ROM, Read Scratchpad
  pinMode(pin, OUTPUT);
  digitalWrite(pin, LOW);
  delayMicroseconds(480);
  pinMode(pin, INPUT);
  delayMicroseconds(70);

  if (digitalRead(pin) == LOW) {  // Presence OK
    delayMicroseconds(410);

    writeOnewireByte(pin, 0xCC);  // Skip ROM
    writeOnewireByte(pin, 0xBE);  // Read Scratchpad

    // Read 9 bytes
    for (int i = 0; i < 9; i++) {
      data[i] = readOnewireByte(pin);
    }
    readSuccess = true;
  } else {
     return "{\"ok\":0,\"error\":\"ERR_SENSOR_LOST\"}";
  }

  if (readSuccess) {
    // Convert data to temperature
    int16_t raw = (data[1] << 8) | data[0];
    float tempC = (float)raw / 16.0;

    // Build and return JSON response
    String response = "{\"ok\":1,\"temp\":";
    response += String(tempC, 2);
    response += "}";
    return response;
  }

  return "{\"ok\":0,\"error\":\"ERR_READ_FAILED\"}";
}

// === SYSTEM COMMANDS (RENESAS UNO R4 IMPLEMENTATION) ===
// For Arduino Uno R4 WiFi / Minima



// === MEMORY ===
int freeMemory() {
  // Renesas RA4M1 specific memory check
  // Using mallinfo if available, or a safe approximation
  struct mallinfo mi = mallinfo();
  return mi.fordblks; // Free space in heap
  // Note: This might need adjustment depending on the specific core version,
  // but it's standard for newlib-based ARM cores.
}

// === RESET ===
void resetDevice() {
  NVIC_SystemReset();
}

// === NETWORK ===
#include <WiFiS3.h>

String getMacAddress() {
  byte mac[6];
  WiFi.macAddress(mac);
  char buf[20];
  sprintf(buf, "%02X:%02X:%02X:%02X:%02X:%02X", mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
  return String(buf);
}

// === SYSTEM COMMANDS (COMMON) ===

#define FIRMWARE_VERSION "1.0-v5"

// Forward declarations of architecture-specific functions
// These must be implemented in the architecture-specific files (e.g., sys_avr.cpp)
int freeMemory();
void resetDevice();
String getMacAddress();

// === COMMAND PARSER ===
String processCommand(String input) {
  char cmdBuffer[120];
  strncpy(cmdBuffer, input.c_str(), sizeof(cmdBuffer) - 1);
  cmdBuffer[sizeof(cmdBuffer) - 1] = '\0';
  
  // Find delimiter position and isolate command name
  char* delimiter = strchr(cmdBuffer, '|');
  if (delimiter) {
    *delimiter = '\0';  // Terminate string at delimiter to isolate command
  }
  const char* cmd = cmdBuffer;
  
  // === SYSTEM COMMANDS ===
  
  if (strcmp(cmd, "PING") == 0) {
    return F("{\"ok\":1,\"pong\":1}");
  }

  else if (strcmp(cmd, "HYDROPONICS_DISCOVERY") == 0) {
    String response = F("{\"type\":\"ANNOUNCE\",\"mac\":\"");
    response += getMacAddress();
    response += F("\",\"model\":\"Hydroponics Controller\",\"firmware\":\"");
    response += FIRMWARE_VERSION;
    response += F("\",\"capabilities\":[");
    for (int i = 0; i < CAPABILITIES_COUNT; i++) {
      response += "\"";
      response += CAPABILITIES[i];
      response += "\"";
      if (i < CAPABILITIES_COUNT - 1) response += ",";
    }
    response += F("]}");
    return response;
  }
  
  else if (strcmp(cmd, "INFO") == 0) {
    String response = F("{\"ok\":1,\"up\":");
    response += millis();
    response += F(",\"mem\":");
    response += freeMemory();
    response += F(",\"ver\":\"");
    response += FIRMWARE_VERSION;
    response += F("\",\"capabilities\":[");
    for (int i = 0; i < CAPABILITIES_COUNT; i++) {
      response += "\"";
      response += CAPABILITIES[i];
      response += "\"";
      if (i < CAPABILITIES_COUNT - 1) response += ",";
    }
    response += F("]}");
    return response;
  }
  
  else if (strcmp(cmd, "STATUS") == 0) {
    String response = F("{\"ok\":1,\"status\":\"running\",\"up\":");
    response += millis();
    response += F("}");
    return response;
  }
  
  else if (strcmp(cmd, "RESET") == 0) {
    Serial.println("{\"ok\":1,\"msg\":\"Resetting...\"}");
    delay(100);
    resetDevice();
    return "{\"ok\":1,\"msg\":\"Resetting\"}";
  }

  else if (strcmp(cmd, "TEST_WATCHDOG") == 0) {
    Serial.println("{\"ok\":1,\"msg\":\"Blocking loop for 10s to test Watchdog...\"}");
    delay(10000); // Block for 10s, should trigger WDT (8s timeout)
    return "{\"ok\":0,\"error\":\"WDT_FAILED_TO_RESET\"}"; // Should not be reached if WDT is working
  }
  
  // === DYNAMIC DISPATCHERS ===
  else if (strcmp(cmd, "DHT_READ") == 0) { return handleDHTRead(delimiter ? delimiter + 1 : NULL); }
  else if (strcmp(cmd, "MODBUS_RTU_READ") == 0) { return handleModbusRtuRead(delimiter ? delimiter + 1 : "{}"); }
  else if (strcmp(cmd, "DIGITAL_WRITE") == 0) { return handleDigitalWrite(delimiter ? delimiter + 1 : NULL); }
  else if (strcmp(cmd, "DIGITAL_READ") == 0) { return handleDigitalRead(delimiter ? delimiter + 1 : NULL); }
  else if (strcmp(cmd, "PWM_WRITE") == 0) { return handlePWMWrite(delimiter ? delimiter + 1 : NULL); }
  else if (strcmp(cmd, "UART_READ_DISTANCE") == 0) { return handleUARTReadDistance(delimiter ? delimiter + 1 : NULL); }
  else if (strcmp(cmd, "ANALOG") == 0) { return handleAnalog(delimiter ? delimiter + 1 : NULL); }
  else if (strcmp(cmd, "ULTRASONIC_TRIG_ECHO") == 0) { return handleUltrasonicTrigEcho(delimiter ? delimiter + 1 : NULL); }
  else if (strcmp(cmd, "ONEWIRE_READ_TEMP") == 0) { return handleOneWireReadTemp(delimiter ? delimiter + 1 : NULL); }
  
  else {
    return F("{\"ok\":0,\"error\":\"ERR_INVALID_COMMAND\"}");
  }
}

/*
 * Hydroponics v5 Firmware
 * Board: LilyGO T-Relay (4-Port ESP32)
 * Transport: wifi_native
 * Generated: 2026-01-01T20:48:25.976Z
 */

// === INCLUDES ===
#include <Arduino.h>
#include <WiFi.h>
#include <WiFiUdp.h>

// === GLOBALS ===
const char* CAPABILITIES[] = { "DIGITAL_WRITE", "DIGITAL_READ", "PWM_WRITE" };
const int CAPABILITIES_COUNT = 3;
WiFiUDP udp;
char packetBuffer[255];

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
    #elif defined(A1)
      // Standard Arduino boards with multiple analog pins
      static const uint8_t analog_pins[] = {A0, A1, A2, A3, A4, A5};
      if (pin >= 0 && pin < 6) return analog_pins[pin];
    #elif defined(A0)
      if (pin == 0) return A0;
    #endif
    return pin; // Fallback to raw index if A-aliases are missing
  }

  // 4. Handle raw number "5"
  return pinStr.toInt();
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

// === SYSTEM COMMANDS (ESP8266/ESP32 IMPLEMENTATION) ===

// === MEMORY ===
int freeMemory() {
  return ESP.getFreeHeap();
}

// === RESET ===
void resetDevice() {
  ESP.restart();
}

// === NETWORK ===
#ifdef ESP8266
#include <ESP8266WiFi.h>
#elif defined(ESP32)
#include <WiFi.h>
#endif

String getMacAddress() {
  return WiFi.macAddress();
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
  else if (strcmp(cmd, "DIGITAL_WRITE") == 0) { return handleDigitalWrite(delimiter ? delimiter + 1 : NULL); }
  else if (strcmp(cmd, "DIGITAL_READ") == 0) { return handleDigitalRead(delimiter ? delimiter + 1 : NULL); }
  else if (strcmp(cmd, "PWM_WRITE") == 0) { return handlePWMWrite(delimiter ? delimiter + 1 : NULL); }
  
  else {
    return F("{\"ok\":0,\"error\":\"ERR_INVALID_COMMAND\"}");
  }
}

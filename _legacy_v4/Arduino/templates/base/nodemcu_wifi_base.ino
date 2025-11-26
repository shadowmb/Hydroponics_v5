// ABOUTME: Minimal base template for WeMos D1 R2 ESP8266 hydroponic controller
// ABOUTME: Handles WiFi, UDP discovery, Serial/UDP commands, and basic system operations

// ============================================================================
// INCLUDES
// ============================================================================
#include <ArduinoJson.h>
#include <ESP8266WiFi.h>
#include <WiFiUdp.h>
#include <EEPROM.h>

// GENERATOR_INCLUDES_PLACEHOLDER

// ============================================================================
// CONFIGURATION
// ============================================================================
#define FIRMWARE_VERSION "1.0-TEST"
#define DEVICE_TYPE "nodemcu"
#define DEVICE_NAME "Hydroponics NodeMCU Amica V2"
#define SERIAL_BAUD 115200
#define UDP_PORT 8888
#define EEPROM_SIZE 512
#define WIFI_TIMEOUT 20000

// ============================================================================
// CAPABILITIES
// ============================================================================
// GENERATOR_CAPABILITIES_ARRAY_PLACEHOLDER

// ============================================================================
// WIFI CONFIGURATION
// ============================================================================
struct WiFiConfig {
  char ssid[32];
  char password[64];
  bool configured;
};

WiFiConfig wifiConfig;

// Default WiFi credentials
const char* DEFAULT_SSID = "Penka";
const char* DEFAULT_PASSWORD = "7806130560";

// ============================================================================
// GLOBAL VARIABLES
// ============================================================================
WiFiUDP udp;
unsigned long startTime = 0;

// Command processing buffers
char commandBuffer[150];
char responseBuffer[300];
StaticJsonDocument<200> jsonDoc;

// GENERATOR_GLOBALS_PLACEHOLDER

// ============================================================================
// SETUP
// ============================================================================
void setup() {
  Serial.begin(SERIAL_BAUD);
  while (!Serial && millis() < 3000); // Wait up to 3s for serial

  startTime = millis();

  Serial.println(F("\n=== WeMos D1 R2 Starting ==="));
  Serial.print(F("Firmware: "));
  Serial.println(FIRMWARE_VERSION);

  // Load WiFi config from EEPROM
  loadWiFiConfig();

  // Connect to WiFi
  connectWiFi();

  // Start UDP server
  if (WiFi.status() == WL_CONNECTED) {
    udp.begin(UDP_PORT);
    Serial.print(F("UDP server started on port "));
    Serial.println(UDP_PORT);
  }

  Serial.println(F("=== Setup Complete ===\n"));
}

// ============================================================================
// MAIN LOOP
// ============================================================================
void loop() {
  // Handle UDP discovery
  handleUDPDiscovery();

  // Handle Serial commands
  handleSerialCommands();

  // Handle UDP commands
  handleUDPCommands();

  yield();
}

// ============================================================================
// WIFI FUNCTIONS
// ============================================================================
void loadWiFiConfig() {
  EEPROM.begin(EEPROM_SIZE);

  // Read configured flag
  byte configured = EEPROM.read(0);

  if (configured == 1) {
    // Load from EEPROM
    for (int i = 0; i < 32; i++) {
      wifiConfig.ssid[i] = EEPROM.read(1 + i);
    }
    for (int i = 0; i < 64; i++) {
      wifiConfig.password[i] = EEPROM.read(33 + i);
    }
    wifiConfig.configured = true;
    Serial.println(F("WiFi config loaded from EEPROM"));
  } else {
    // Use defaults
    strcpy(wifiConfig.ssid, DEFAULT_SSID);
    strcpy(wifiConfig.password, DEFAULT_PASSWORD);
    wifiConfig.configured = false;
    Serial.println(F("Using default WiFi config"));
  }

  EEPROM.end();
}

void saveWiFiConfig() {
  EEPROM.begin(EEPROM_SIZE);

  // Write configured flag
  EEPROM.write(0, 1);

  // Write SSID
  for (int i = 0; i < 32; i++) {
    EEPROM.write(1 + i, wifiConfig.ssid[i]);
  }

  // Write password
  for (int i = 0; i < 64; i++) {
    EEPROM.write(33 + i, wifiConfig.password[i]);
  }

  EEPROM.commit();
  EEPROM.end();

  Serial.println(F("WiFi config saved to EEPROM"));
}

void connectWiFi() {
  Serial.print(F("Connecting to WiFi: "));
  Serial.println(wifiConfig.ssid);

  WiFi.mode(WIFI_STA);
  WiFi.begin(wifiConfig.ssid, wifiConfig.password);

  unsigned long startAttempt = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startAttempt < WIFI_TIMEOUT) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print(F("WiFi connected! IP: "));
    Serial.println(WiFi.localIP());
    Serial.print(F("MAC: "));
    Serial.println(WiFi.macAddress());
  } else {
    Serial.println(F("WiFi connection failed"));
  }
}

// ============================================================================
// UDP FUNCTIONS
// ============================================================================
void handleUDPDiscovery() {
  int packetSize = udp.parsePacket();
  if (packetSize == 0) return;

  char incomingPacket[255];
  int len = udp.read(incomingPacket, 255);
  if (len > 0) {
    incomingPacket[len] = 0;
  }

  // Check for discovery message
  if (strcmp(incomingPacket, "HYDROPONICS_DISCOVERY") == 0) {
    sendDiscoveryResponse();
  }
}

void sendDiscoveryResponse() {
  StaticJsonDocument<512> doc;
  doc["type"] = "discovery_response";
  doc["deviceType"] = DEVICE_TYPE;
  doc["deviceName"] = DEVICE_NAME;
  doc["firmwareVersion"] = FIRMWARE_VERSION;
  doc["mac"] = WiFi.macAddress();
  doc["ip"] = WiFi.localIP().toString();

  JsonArray caps = doc.createNestedArray("capabilities");
  for (int i = 0; i < CAPABILITIES_COUNT; i++) {
    caps.add(CAPABILITIES[i]);
  }

  String response;
  serializeJson(doc, response);

  udp.beginPacket(udp.remoteIP(), udp.remotePort());
  udp.write(response.c_str());
  udp.endPacket();

  Serial.println(F("Discovery response sent"));
}

void handleUDPCommands() {
  int packetSize = udp.parsePacket();
  if (packetSize == 0) return;

  char incomingPacket[512];
  int len = udp.read(incomingPacket, 512);
  if (len > 0) {
    incomingPacket[len] = 0;
  }

  // Skip discovery messages (already handled)
  if (strcmp(incomingPacket, "HYDROPONICS_DISCOVERY") == 0) {
    return;
  }

  // Copy to command buffer for processing
  strncpy(commandBuffer, incomingPacket, 149);
  commandBuffer[149] = 0;

  String response = processCommandAndGetResponse();

  // Send response via UDP
  udp.beginPacket(udp.remoteIP(), udp.remotePort());
  udp.write(response.c_str());
  udp.endPacket();
}

// ============================================================================
// SERIAL FUNCTIONS
// ============================================================================
void handleSerialCommands() {
  if (!Serial.available()) return;

  String input = Serial.readStringUntil('\n');
  input.trim();

  if (input.length() == 0) return;

  // Copy to command buffer for processing
  strncpy(commandBuffer, input.c_str(), 149);
  commandBuffer[149] = 0;

  String response = processCommandAndGetResponse();
  Serial.println(response);
}

// ============================================================================
// COMMAND PROCESSING
// ============================================================================
String processCommandAndGetResponse() {
  // Clear JSON document
  jsonDoc.clear();

  // Parse JSON from command buffer
  DeserializationError error = deserializeJson(jsonDoc, commandBuffer);
  if (error) {
    return "{\"status\":\"error\",\"message\":\"Invalid JSON\"}";
  }

  // Get command
  const char* cmd = jsonDoc["cmd"];
  if (!cmd) {
    return "{\"status\":\"error\",\"message\":\"Missing cmd field\"}";
  }

  // System commands
  if (strcmp(cmd, "PING") == 0) {
    return handlePing();
  } else if (strcmp(cmd, "INFO") == 0) {
    return handleInfo();
  } else if (strcmp(cmd, "STATUS") == 0) {
    return handleStatus();
  } else if (strcmp(cmd, "RESET") == 0) {
    return handleReset();
  } else if (strcmp(cmd, "CONFIG_WIFI") == 0) {
    return handleConfigWiFi();
  }

  // GENERATOR_DISPATCHER_PLACEHOLDER

  return "{\"status\":\"error\",\"message\":\"Unknown command\"}";
}

// ============================================================================
// SYSTEM COMMAND HANDLERS
// ============================================================================
String handlePing() {
  StaticJsonDocument<256> doc;
  doc["status"] = "ok";
  doc["version"] = FIRMWARE_VERSION;
  doc["uptime"] = millis() - startTime;
  doc["freeMemory"] = ESP.getFreeHeap();
  doc["wifiConnected"] = (WiFi.status() == WL_CONNECTED);
  if (WiFi.status() == WL_CONNECTED) {
    doc["ip"] = WiFi.localIP().toString();
    doc["rssi"] = WiFi.RSSI();
  }

  String response;
  serializeJson(doc, response);
  return response;
}

String handleInfo() {
  StaticJsonDocument<512> doc;
  doc["status"] = "ok";
  doc["deviceType"] = DEVICE_TYPE;
  doc["deviceName"] = DEVICE_NAME;
  doc["firmwareVersion"] = FIRMWARE_VERSION;
  doc["mac"] = WiFi.macAddress();

  JsonArray caps = doc.createNestedArray("capabilities");
  for (int i = 0; i < CAPABILITIES_COUNT; i++) {
    caps.add(CAPABILITIES[i]);
  }

  String response;
  serializeJson(doc, response);
  return response;
}

String handleStatus() {
  return "{\"status\":\"ok\",\"state\":\"running\"}";
}

String handleReset() {
  Serial.println(F("Resetting device..."));
  ESP.restart();
  return "{\"status\":\"ok\",\"message\":\"Resetting\"}";
}

String handleConfigWiFi() {
  const char* ssid = jsonDoc["ssid"];
  const char* password = jsonDoc["password"];

  if (ssid == nullptr || password == nullptr) {
    return "{\"status\":\"error\",\"message\":\"Missing ssid or password\"}";
  }

  // Update config
  strncpy(wifiConfig.ssid, ssid, 31);
  wifiConfig.ssid[31] = 0;
  strncpy(wifiConfig.password, password, 63);
  wifiConfig.password[63] = 0;
  wifiConfig.configured = true;

  // Save to EEPROM
  saveWiFiConfig();

  // Reconnect
  WiFi.disconnect();
  delay(100);
  connectWiFi();

  if (WiFi.status() == WL_CONNECTED) {
    return "{\"status\":\"ok\",\"message\":\"WiFi configured and connected\"}";
  } else {
    return "{\"status\":\"error\",\"message\":\"WiFi configured but connection failed\"}";
  }
}

// ============================================================================
// GENERATOR FUNCTIONS
// ============================================================================
// GENERATOR_FUNCTIONS_PLACEHOLDER

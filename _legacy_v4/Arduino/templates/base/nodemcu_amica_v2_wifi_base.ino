// ABOUTME: Production-ready base template for NodeMCU Amica V2 ESP8266 controller
// ABOUTME: Built-in Multi-Network Fallback and Auto-Reconnect for maximum reliability

// ============================================================================
// INCLUDES
// ============================================================================
#include <ArduinoJson.h>
#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <WiFiUdp.h>
#include <EEPROM.h>

// GENERATOR_INCLUDES_PLACEHOLDER

// WIFI_FEATURES_INCLUDES_PLACEHOLDER

// ============================================================================
// CONFIGURATION
// ============================================================================
#define FIRMWARE_VERSION "1.0-TEST"
#define DEVICE_TYPE "nodemcu_amica_v2"
#define DEVICE_NAME "Hydroponics NodeMCU Amica V2"
#define SERIAL_BAUD 115200
#define UDP_PORT 8888
#define EEPROM_SIZE 512
#define WIFI_TIMEOUT 20000

// Auto-Reconnect configuration
#define WIFI_CHECK_INTERVAL 5000   // Check every 5 seconds
#define MAX_RECONNECT_ATTEMPTS 5   // Max attempts before long pause
#define RECONNECT_DELAY 2000       // 2 seconds between attempts

// ============================================================================
// CAPABILITIES
// ============================================================================
// GENERATOR_CAPABILITIES_ARRAY_PLACEHOLDER
const char* CAPABILITIES[] = {"SET_PIN", "READ", "HEARTBEAT"};
const int CAPABILITIES_COUNT = 3;

// ============================================================================
// WIFI CONFIGURATION (Multi-Network Support)
// ============================================================================
struct WiFiConfig {
  char ssid[32];
  char password[64];
  bool configured;
};

struct WiFiNetwork {
  char ssid[32];
  char password[64];
};

WiFiConfig wifiConfig;
WiFiNetwork network2;  // Secondary fallback network

// Default WiFi credentials
const char* DEFAULT_SSID = "Penka";
const char* DEFAULT_PASSWORD = "7806130560";

// EEPROM Layout:
// Bytes 0-96:   Primary WiFi config (wifiConfig)
// Bytes 100-195: Secondary WiFi network (network2)
#define MULTI_NET_EEPROM_START 100

// ============================================================================
// GLOBAL VARIABLES
// ============================================================================
WiFiUDP udp;
ESP8266WebServer server(80);
unsigned long startTime = 0;

// Auto-Reconnect state
unsigned long lastWiFiCheck = 0;
uint8_t reconnectAttempts = 0;

// Stop-on-Disconnect state
int pinsToStop[10];                    // Pins to stop on disconnect
uint8_t pinsToStopCount = 0;
unsigned long wifiDisconnectStartTime = 0;

// Flow mode heartbeat protection
int activeHighPins = 0;                // Count of active HIGH pins
bool inFlowMode = false;               // Flow execution mode flag
unsigned long lastCommandTime = 0;     // Last command timestamp
bool pinStates[20];                    // Track individual pin states (prevent double-increment)

// Command processing buffers
char commandBuffer[150];
char responseBuffer[300];
StaticJsonDocument<200> jsonDoc;

// GENERATOR_GLOBALS_PLACEHOLDER

// WIFI_FEATURES_GLOBALS_PLACEHOLDER

// ============================================================================
// SETUP
// ============================================================================
void setup() {
  Serial.begin(SERIAL_BAUD);
  while (!Serial && millis() < 3000); // Wait up to 3s for serial

  startTime = millis();

  Serial.println(F("\n=== NodeMCU Amica V2 Starting ==="));
  Serial.print(F("Firmware: "));
  Serial.println(FIRMWARE_VERSION);

  // Load WiFi configs from EEPROM
  loadWiFiConfig();
  loadSecondaryNetwork();

  // Connect to WiFi (with fallback support)
  connectWiFi();

  // Start UDP server
  if (WiFi.status() == WL_CONNECTED) {
    udp.begin(UDP_PORT);
    Serial.print(F("UDP server started on port "));
    Serial.println(UDP_PORT);

    // Start HTTP server
    server.on("/api/command", HTTP_POST, handleHttpCommand);
    server.on("/api/health", HTTP_GET, handleHttpHealth);
    server.begin();
    Serial.println(F("HTTP server started on port 80"));
  }

  // WIFI_FEATURES_SETUP_PLACEHOLDER

  Serial.println(F("=== Setup Complete ===\n"));
}

// ============================================================================
// MAIN LOOP
// ============================================================================
void loop() {
  // Handle UDP discovery FIRST (time critical)
  handleUDPDiscovery();

  // Handle UDP commands
  handleUDPCommands();

  // Handle Serial commands
  handleSerialCommands();

  // Handle HTTP requests
  server.handleClient();

  // Auto-Reconnect check
  checkWiFiConnectionAndReconnect();

  // WIFI_FEATURES_LOOP_PLACEHOLDER

  // Flow mode heartbeat timeout protection
  if (inFlowMode && (millis() - lastCommandTime > 15000)) {
    Serial.println(F("[Heartbeat-Timeout] 15s without command - stopping pins"));
    stopAllPinsOnDisconnect();
    inFlowMode = false;
    activeHighPins = 0;
    memset(pinStates, false, sizeof(pinStates));
  }

  yield();
}

// ============================================================================
// WIFI FUNCTIONS - Multi-Network with Fallback
// ============================================================================
void loadWiFiConfig() {
  EEPROM.begin(EEPROM_SIZE);

  byte configured = EEPROM.read(0);

  if (configured == 1) {
    for (int i = 0; i < 32; i++) {
      wifiConfig.ssid[i] = EEPROM.read(1 + i);
    }
    for (int i = 0; i < 64; i++) {
      wifiConfig.password[i] = EEPROM.read(33 + i);
    }
    wifiConfig.configured = true;
    Serial.println(F("Primary WiFi config loaded from EEPROM"));
  } else {
    strcpy(wifiConfig.ssid, DEFAULT_SSID);
    strcpy(wifiConfig.password, DEFAULT_PASSWORD);
    wifiConfig.configured = false;
    Serial.println(F("Using default WiFi config"));
  }

  EEPROM.end();
}

void saveWiFiConfig() {
  EEPROM.begin(EEPROM_SIZE);

  EEPROM.write(0, 1);

  for (int i = 0; i < 32; i++) {
    EEPROM.write(1 + i, wifiConfig.ssid[i]);
  }

  for (int i = 0; i < 64; i++) {
    EEPROM.write(33 + i, wifiConfig.password[i]);
  }

  EEPROM.commit();
  EEPROM.end();

  Serial.println(F("Primary WiFi config saved to EEPROM"));
}

void loadSecondaryNetwork() {
  EEPROM.begin(EEPROM_SIZE);

  for (int i = 0; i < 32; i++) {
    network2.ssid[i] = EEPROM.read(MULTI_NET_EEPROM_START + i);
  }
  for (int i = 0; i < 64; i++) {
    network2.password[i] = EEPROM.read(MULTI_NET_EEPROM_START + 32 + i);
  }

  EEPROM.end();

  if (network2.ssid[0] != 0) {
    Serial.print(F("Secondary network loaded: "));
    Serial.println(network2.ssid);
  }
}

void saveSecondaryNetwork() {
  EEPROM.begin(EEPROM_SIZE);

  for (int i = 0; i < 32; i++) {
    EEPROM.write(MULTI_NET_EEPROM_START + i, network2.ssid[i]);
  }
  for (int i = 0; i < 64; i++) {
    EEPROM.write(MULTI_NET_EEPROM_START + 32 + i, network2.password[i]);
  }

  EEPROM.commit();
  EEPROM.end();

  Serial.println(F("Secondary network saved to EEPROM"));
}

void connectWiFi() {
  // Try primary network
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
    return;
  }

  // Try secondary network (if configured)
  if (network2.ssid[0] != 0) {
    Serial.print(F("Primary failed, trying fallback: "));
    Serial.println(network2.ssid);

    WiFi.disconnect();
    delay(100);
    WiFi.begin(network2.ssid, network2.password);

    startAttempt = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - startAttempt < WIFI_TIMEOUT) {
      delay(500);
      Serial.print(".");
    }
    Serial.println();

    if (WiFi.status() == WL_CONNECTED) {
      Serial.print(F("Fallback connected! IP: "));
      Serial.println(WiFi.localIP());
      Serial.print(F("MAC: "));
      Serial.println(WiFi.macAddress());
    } else {
      Serial.println(F("All networks failed"));
    }
  } else {
    Serial.println(F("WiFi connection failed"));
  }
}

void checkWiFiConnectionAndReconnect() {
  if (millis() - lastWiFiCheck >= WIFI_CHECK_INTERVAL) {
    lastWiFiCheck = millis();

    if (WiFi.status() != WL_CONNECTED) {
      Serial.println(F("[Auto-Reconnect] Disconnected"));

      // Stop pins IMMEDIATELY on first disconnect detection
      if (wifiDisconnectStartTime == 0) {
        wifiDisconnectStartTime = millis();
        Serial.println(F("[Stop-on-Disconnect] Stopping all pins IMMEDIATELY"));
        stopAllPinsOnDisconnect();
      }

      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        WiFi.disconnect();
        delay(100);
        connectWiFi();

        if (WiFi.status() == WL_CONNECTED) {
          Serial.println(F("[Auto-Reconnect] Restored"));
          reconnectAttempts = 0;
          wifiDisconnectStartTime = 0;  // Reset timer on reconnect
        } else {
          delay(RECONNECT_DELAY);
        }
      } else {
        // Max attempts reached - long pause
        delay(60000); // Wait 60 seconds
        reconnectAttempts = 0;
      }
    } else {
      reconnectAttempts = 0; // Reset on successful connection
      wifiDisconnectStartTime = 0;  // Reset disconnect timer
    }
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

  if (strcmp(incomingPacket, "HYDROPONICS_DISCOVERY") == 0) {
    Serial.print(F("["));
    Serial.print(millis());
    Serial.println(F("] UDP Discovery request received"));
    sendDiscoveryResponse();
  }
}

void sendDiscoveryResponse() {
  StaticJsonDocument<512> doc;
  doc["mac"] = WiFi.macAddress();
  doc["ip"] = WiFi.localIP().toString();
  doc["deviceType"] = DEVICE_TYPE;
  doc["firmwareVersion"] = FIRMWARE_VERSION;
  doc["deviceName"] = DEVICE_NAME;
  doc["status"] = "online";

  JsonArray caps = doc.createNestedArray("capabilities");
  for (int i = 0; i < CAPABILITIES_COUNT; i++) {
    caps.add(CAPABILITIES[i]);
  }

  String response;
  serializeJson(doc, response);

  Serial.print(F("UDP Discovery JSON: "));
  Serial.println(response);

  Serial.print(F("Sending to: "));
  Serial.print(udp.remoteIP());
  Serial.print(F(":"));
  Serial.println(udp.remotePort());

  udp.beginPacket(udp.remoteIP(), udp.remotePort());
  udp.print(response);
  udp.endPacket();

  Serial.print(F("["));
  Serial.print(millis());
  Serial.println(F("] Discovery response sent"));
}

void handleUDPCommands() {
  int packetSize = udp.parsePacket();
  if (packetSize == 0) return;

  char incomingPacket[512];
  int len = udp.read(incomingPacket, 512);
  if (len > 0) {
    incomingPacket[len] = 0;
  }

  if (strcmp(incomingPacket, "HYDROPONICS_DISCOVERY") == 0) {
    return;
  }

  strncpy(commandBuffer, incomingPacket, 149);
  commandBuffer[149] = 0;

  String response = processCommandAndGetResponse();

  udp.beginPacket(udp.remoteIP(), udp.remotePort());
  udp.print(response);
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

  strncpy(commandBuffer, input.c_str(), 149);
  commandBuffer[149] = 0;

  String response = processCommandAndGetResponse();
  Serial.println(response);
}

// ============================================================================
// COMMAND PROCESSING
// ============================================================================
String processCommandAndGetResponse() {
  jsonDoc.clear();

  DeserializationError error = deserializeJson(jsonDoc, commandBuffer);
  if (error) {
    return "{\"ok\":0,\"error\":\"Invalid JSON\"}";
  }

  const char* cmd = jsonDoc["cmd"];
  if (!cmd) {
    return "{\"ok\":0,\"error\":\"Missing cmd field\"}";
  }

  // System commands
  if (strcmp(cmd, "PING") == 0) {
    return handlePing();
  } else if (strcmp(cmd, "INFO") == 0) {
    return handleInfo();
  } else if (strcmp(cmd, "STATUS") == 0) {
    return handleStatus();
  } else if (strcmp(cmd, "HEARTBEAT") == 0) {
    // Flow mode heartbeat - reset timeout
    lastCommandTime = millis();
    return F("{\"ok\":1,\"pong\":1}");
  } else if (strcmp(cmd, "RESET") == 0) {
    return handleReset();
  } else if (strcmp(cmd, "CONFIG_WIFI") == 0) {
    return handleConfigWiFi();
  } else if (strcmp(cmd, "SET_FALLBACK_WIFI") == 0) {
    return handleSetFallbackWiFi();
  }

  // Base commands
  else if (strcmp(cmd, "READ") == 0) {
    return handleRead();
  } else if (strcmp(cmd, "SET_PIN") == 0) {
    return handleSetPin();
  }

  // GENERATOR_DISPATCHER_PLACEHOLDER

  // WIFI_FEATURES_COMMAND_HANDLER_PLACEHOLDER

  return "{\"ok\":0,\"error\":\"Unknown command\"}";
}

// ============================================================================
// SYSTEM COMMAND HANDLERS
// ============================================================================
String handlePing() {
  StaticJsonDocument<256> doc;
  doc["ok"] = 1;
  doc["pong"] = 1;
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
  doc["ok"] = 1;
  doc["up"] = millis();
  doc["mem"] = ESP.getFreeHeap();
  doc["ver"] = FIRMWARE_VERSION;

  JsonArray caps = doc.createNestedArray("capabilities");
  for (int i = 0; i < CAPABILITIES_COUNT; i++) {
    caps.add(CAPABILITIES[i]);
  }

  String response;
  serializeJson(doc, response);
  return response;
}

String handleStatus() {
  return "{\"ok\":1,\"status\":\"running\"}";
}

String handleReset() {
  Serial.println(F("Resetting device..."));
  ESP.restart();
  return "{\"ok\":1,\"msg\":\"Resetting\"}";
}

String handleConfigWiFi() {
  const char* ssid = jsonDoc["ssid"];
  const char* password = jsonDoc["password"];

  if (ssid == nullptr || password == nullptr) {
    return "{\"ok\":0,\"error\":\"Missing ssid or password\"}";
  }

  strncpy(wifiConfig.ssid, ssid, 31);
  wifiConfig.ssid[31] = 0;
  strncpy(wifiConfig.password, password, 63);
  wifiConfig.password[63] = 0;
  wifiConfig.configured = true;

  saveWiFiConfig();

  WiFi.disconnect();
  delay(100);
  connectWiFi();

  if (WiFi.status() == WL_CONNECTED) {
    return "{\"ok\":1,\"msg\":\"WiFi configured and connected\"}";
  } else {
    return "{\"ok\":0,\"error\":\"WiFi configured but connection failed\"}";
  }
}

String handleSetFallbackWiFi() {
  const char* ssid = jsonDoc["ssid"];
  const char* password = jsonDoc["password"];

  if (ssid == nullptr || password == nullptr) {
    return "{\"ok\":0,\"error\":\"Missing ssid or password\"}";
  }

  strncpy(network2.ssid, ssid, 31);
  network2.ssid[31] = 0;
  strncpy(network2.password, password, 63);
  network2.password[63] = 0;

  saveSecondaryNetwork();

  return "{\"ok\":1,\"msg\":\"Fallback network saved\"}";
}

// ============================================================================
// STOP-ON-DISCONNECT HELPER FUNCTIONS
// ============================================================================
void addPinToStopList(int pin) {
  // Check if pin already in list
  for (uint8_t i = 0; i < pinsToStopCount; i++) {
    if (pinsToStop[i] == pin) return;  // Already exists
  }

  // Add to list
  if (pinsToStopCount < 10) {
    pinsToStop[pinsToStopCount++] = pin;
  }
}

void removePinFromStopList(int pin) {
  for (uint8_t i = 0; i < pinsToStopCount; i++) {
    if (pinsToStop[i] == pin) {
      // Remove by shifting
      for (uint8_t j = i; j < pinsToStopCount - 1; j++) {
        pinsToStop[j] = pinsToStop[j + 1];
      }
      pinsToStopCount--;
      return;
    }
  }
}

void stopAllPinsOnDisconnect() {
  for (uint8_t i = 0; i < pinsToStopCount; i++) {
    digitalWrite(pinsToStop[i], LOW);
  }
  // Clear the list after stopping
  pinsToStopCount = 0;
}

// ============================================================================
// BASE COMMAND HANDLERS
// ============================================================================
String handleRead() {
  int pin = jsonDoc["pin"];

  if (pin < 0) {
    return "{\"ok\":0,\"error\":\"Missing or invalid pin\"}";
  }

  pinMode(pin, INPUT);
  int value = digitalRead(pin);

  StaticJsonDocument<128> doc;
  doc["ok"] = 1;
  doc["pin"] = pin;
  doc["value"] = value;
  doc["state"] = (value == HIGH) ? "HIGH" : "LOW";

  String response;
  serializeJson(doc, response);
  return response;
}

String handleSetPin() {
  int pin = jsonDoc["pin"];
  int state = jsonDoc["state"];
  bool stopOnDisconnect = jsonDoc["stopOnDisconnect"] | true;  // Default true

  if (pin < 0 || (state != 0 && state != 1)) {
    return "{\"ok\":0,\"error\":\"Missing or invalid pin/state\"}";
  }

  pinMode(pin, OUTPUT);
  digitalWrite(pin, state);

  // Track flow mode (heartbeat protection)
  lastCommandTime = millis();  // Reset timeout for any SET_PIN command

  if (pin < 20) {  // Safety check for array bounds
    bool previousState = pinStates[pin];
    pinStates[pin] = (state == HIGH);

    if (state == HIGH && !previousState) {
      // Pin was LOW, now HIGH - increment counter
      activeHighPins++;
      if (activeHighPins == 1) {
        inFlowMode = true;  // First HIGH pin - enter flow mode
        Serial.println(F("[Flow-Mode] Entered flow mode"));
      }
    } else if (state == LOW && previousState) {
      // Pin was HIGH, now LOW - decrement counter
      activeHighPins--;
      if (activeHighPins == 0) {
        inFlowMode = false;  // No more HIGH pins - exit flow mode
        Serial.println(F("[Flow-Mode] Exited flow mode"));
      }
    }
  }

  // Manage stop list
  if (state == HIGH) {
    // Pin is active
    if (stopOnDisconnect) {
      addPinToStopList(pin);  // Add to stop list
    } else {
      removePinFromStopList(pin);  // Remove if it was there
    }
  } else {
    // Pin is LOW - remove from stop list
    removePinFromStopList(pin);
  }

  StaticJsonDocument<128> doc;
  doc["ok"] = 1;
  doc["pin"] = pin;
  doc["state"] = state;

  String response;
  serializeJson(doc, response);
  return response;
}

// ============================================================================
// HTTP SERVER HANDLERS
// ============================================================================
void handleHttpCommand() {
  String body = server.arg("plain");

  strncpy(commandBuffer, body.c_str(), 149);
  commandBuffer[149] = 0;

  String response = processCommandAndGetResponse();

  server.send(200, "application/json", response);
}

void handleHttpHealth() {
  StaticJsonDocument<128> doc;
  doc["ok"] = 1;
  doc["status"] = "online";

  String response;
  serializeJson(doc, response);

  server.send(200, "application/json", response);
}

// ============================================================================
// GENERATOR FUNCTIONS
// ============================================================================
// GENERATOR_FUNCTIONS_PLACEHOLDER

// WIFI_FEATURES_FUNCTIONS_PLACEHOLDER

// ABOUTME: Minimal base template for Arduino Uno R4 WiFi hydroponic controller
// ABOUTME: Handles WiFi, UDP discovery, Serial/UDP commands, and basic system operations

// ============================================================================
// INCLUDES
// ============================================================================
#include <ArduinoJson.h>
#include <WiFiS3.h>
#include <WiFiUdp.h>

// GENERATOR_INCLUDES_PLACEHOLDER

// ============================================================================
// CONFIGURATION
// ============================================================================
#define FIRMWARE_VERSION "1.0-TEST"
#define DEVICE_TYPE "arduino_uno_r4_wifi"
#define DEVICE_NAME "Hydroponics Arduino Uno R4 WiFi"
#define SERIAL_BAUD 115200
#define UDP_PORT 8888
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
WiFiServer server(80);
unsigned long startTime = 0;
int wifiStatus = WL_IDLE_STATUS;

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

  Serial.println(F("\n=== Arduino Uno R4 WiFi Starting ==="));
  Serial.print(F("Firmware: "));
  Serial.println(FIRMWARE_VERSION);

  // Check WiFi module
  if (WiFi.status() == WL_NO_MODULE) {
    Serial.println(F("WiFi module not detected!"));
    while (true); // Stop execution
  }

  // Connect to WiFi
  connectWiFi();

  // Start UDP server
  if (WiFi.status() == WL_CONNECTED) {
    udp.begin(UDP_PORT);
    Serial.print(F("UDP server started on port "));
    Serial.println(UDP_PORT);

    // Start HTTP server
    server.begin();
    Serial.println(F("HTTP server started on port 80"));
  }

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
  handleHttpRequests();

  delay(1); // Small delay for stability
}

// ============================================================================
// WIFI FUNCTIONS
// ============================================================================
void connectWiFi() {
  Serial.print(F("Connecting to WiFi: "));
  Serial.println(wifiConfig.configured ? wifiConfig.ssid : DEFAULT_SSID);

  const char* ssid = wifiConfig.configured ? wifiConfig.ssid : DEFAULT_SSID;
  const char* password = wifiConfig.configured ? wifiConfig.password : DEFAULT_PASSWORD;

  wifiStatus = WiFi.begin(ssid, password);

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
    printMacAddress();
  } else {
    Serial.println(F("WiFi connection failed"));
  }
}

void printMacAddress() {
  byte mac[6];
  WiFi.macAddress(mac);
  for (int i = 5; i >= 0; i--) {
    if (mac[i] < 16) {
      Serial.print("0");
    }
    Serial.print(mac[i], HEX);
    if (i > 0) {
      Serial.print(":");
    }
  }
  Serial.println();
}

String getMacAddress() {
  byte mac[6];
  WiFi.macAddress(mac);
  String macStr = "";
  for (int i = 5; i >= 0; i--) {
    if (mac[i] < 16) {
      macStr += "0";
    }
    macStr += String(mac[i], HEX);
    if (i > 0) {
      macStr += ":";
    }
  }
  macStr.toUpperCase();
  return macStr;
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
    Serial.print(F("["));
    Serial.print(millis());
    Serial.println(F("] UDP Discovery request received"));
    sendDiscoveryResponse();
  }
}

void sendDiscoveryResponse() {
  StaticJsonDocument<512> doc;
  doc["mac"] = getMacAddress();
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

  // Copy to command buffer for processing
  strncpy(commandBuffer, input.c_str(), 149);
  commandBuffer[149] = 0;

  String response = processCommandAndGetResponse();
  Serial.println(response);
}

// ============================================================================
// HTTP SERVER FUNCTIONS
// ============================================================================
void handleHttpRequests() {
  WiFiClient client = server.available();
  if (!client) return;

  Serial.println(F("New HTTP client"));

  // Read HTTP request
  String currentLine = "";
  String requestBody = "";
  bool isPost = false;
  int contentLength = 0;
  bool headersEnded = false;

  while (client.connected()) {
    if (client.available()) {
      char c = client.read();

      if (!headersEnded) {
        if (c == '\n') {
          if (currentLine.length() == 0) {
            // Headers ended
            headersEnded = true;

            if (isPost && contentLength > 0) {
              // Read POST body
              requestBody.reserve(contentLength);
              for (int i = 0; i < contentLength && client.available(); i++) {
                requestBody += (char)client.read();
              }
            }
            break;
          } else {
            // Process header line
            if (currentLine.startsWith("POST")) {
              isPost = true;
            }
            if (currentLine.startsWith("Content-Length: ")) {
              contentLength = currentLine.substring(16).toInt();
            }
            currentLine = "";
          }
        } else if (c != '\r') {
          currentLine += c;
        }
      }
    }
  }

  // Process command if POST
  String response;
  if (isPost && requestBody.length() > 0) {
    strncpy(commandBuffer, requestBody.c_str(), 149);
    commandBuffer[149] = 0;
    response = processCommandAndGetResponse();
  } else {
    // GET request - return health status
    response = "{\"ok\":1,\"status\":\"online\"}";
  }

  // Send HTTP response
  client.println("HTTP/1.1 200 OK");
  client.println("Content-Type: application/json");
  client.println("Connection: close");
  client.print("Content-Length: ");
  client.println(response.length());
  client.println();
  client.println(response);

  client.stop();
  Serial.println(F("HTTP client disconnected"));
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
    return "{\"ok\":0,\"error\":\"Invalid JSON\"}";
  }

  // Get command
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
  } else if (strcmp(cmd, "RESET") == 0) {
    return handleReset();
  } else if (strcmp(cmd, "CONFIG_WIFI") == 0) {
    return handleConfigWiFi();
  }

  // GENERATOR_DISPATCHER_PLACEHOLDER

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
  NVIC_SystemReset(); // Renesas system reset
  return "{\"ok\":1,\"msg\":\"Resetting\"}";
}

String handleConfigWiFi() {
  const char* ssid = jsonDoc["ssid"];
  const char* password = jsonDoc["password"];

  if (ssid == nullptr || password == nullptr) {
    return "{\"ok\":0,\"error\":\"Missing ssid or password\"}";
  }

  // Update config
  strncpy(wifiConfig.ssid, ssid, 31);
  wifiConfig.ssid[31] = 0;
  strncpy(wifiConfig.password, password, 63);
  wifiConfig.password[63] = 0;
  wifiConfig.configured = true;

  // Reconnect
  WiFi.disconnect();
  delay(100);
  connectWiFi();

  if (WiFi.status() == WL_CONNECTED) {
    return "{\"ok\":1,\"msg\":\"WiFi configured and connected\"}";
  } else {
    return "{\"ok\":0,\"error\":\"WiFi configured but connection failed\"}";
  }
}

// ============================================================================
// GENERATOR FUNCTIONS
// ============================================================================
// GENERATOR_FUNCTIONS_PLACEHOLDER

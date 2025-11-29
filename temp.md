/*
 * Hydroponics v5 Firmware
 * Board: Arduino Uno R4 WiFi
 * Transport: wifi_native
 * Generated: 2025-11-29T20:52:40.644Z
 */

// === INCLUDES ===
#include <Arduino.h>
#include <WiFiS3.h>
#include <WiFiUdp.h>
#include <EEPROM.h>
#include <WDT.h>
// Custom Failover Logic
#include <malloc.h>

// === GLOBALS ===
const char* CAPABILITIES[] = { "ULTRASONIC_TRIG_ECHO" };
const int CAPABILITIES_COUNT = 1;
WiFiUDP udp;
char packetBuffer[255];
void saveState(int pin, int state);
void restoreState();
WiFiServer telnetServer(23); WiFiClient telnetClient;
unsigned long lastWifiCheck = 0;
const char* backupSsid = "sunny_ad";
const char* backupPass = "1122334455";

// === PROTOTYPES ===
String processCommand(String input);

// === SETUP ===
void setup() {
  Serial.begin(115200);
  delay(2000); // Wait for Serial
  Serial.println("Booting...");
  // Connect to WiFi
  Serial.print("Connecting to WiFi: sunny_ad1");
  WiFi.begin("sunny_ad", "11223344555");
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
  restoreState();
  // mDNS not supported on Renesas yet
  // OTA not supported on Renesas yet
  telnetServer.begin();
  WDT.begin(2684); // ~8s
  // Primary connection handled by Transport
  // If Primary failed (timeout), try Backup
  if (WiFi.status() != WL_CONNECTED) {
    Serial.print("Primary failed. Connecting to Backup: sunny_ad");
    WiFi.disconnect();
    WiFi.begin("sunny_ad", "1122334455");
    int backupRetries = 0;
    while (WiFi.status() != WL_CONNECTED && backupRetries < 20) {
      delay(500);
      Serial.print(".");
      backupRetries++;
    }
    Serial.println();
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("Backup WiFi Connected!");
      Serial.print("IP Address: ");
      Serial.println(WiFi.localIP());
      udp.begin(8888); // Ensure UDP is started
    } else {
      Serial.println("Backup WiFi Failed! System running offline.");
    }
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
  WiFiClient newClient = telnetServer.available();
  if (newClient) {
    if (!telnetClient || !telnetClient.connected()) {
      if (telnetClient) telnetClient.stop();
      telnetClient = newClient;
    } else {
      newClient.stop();
    }
  }
  WDT.refresh();
  if (millis() - lastWifiCheck > 10000) {
    lastWifiCheck = millis();
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("Primary WiFi lost. Trying Backup...");
      WiFi.disconnect();
      WiFi.begin(backupSsid, backupPass);
      // Non-blocking attempt (check status next loop)
    }
  }
}

// === FUNCTIONS ===
int parsePin(String pinStr) {
  // Handle "D5" -> 5
  if (pinStr.startsWith("D")) {
    return pinStr.substring(1).toInt();
  }
  // Handle "A0" -> A0 (which is an int constant)
  if (pinStr.startsWith("A")) {
    int pin = pinStr.substring(1).toInt();
    #if defined(ESP8266)
      return A0; // ESP8266 only has A0
    #else
      static const uint8_t analog_pins[] = {A0, A1, A2, A3, A4, A5};
      if (pin >= 0 && pin < 6) return analog_pins[pin];
    #endif
  }
  // Handle raw number "5"
  return pinStr.toInt();
}

void saveState(int pin, int state) { EEPROM.write(pin, state); }
void restoreState() { /* Implementation to read EEPROM and set pins */ }
void debugPrint(String msg) { if (telnetClient && telnetClient.connected()) telnetClient.print(msg); Serial.print(msg); }


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

// === SYSTEM COMMANDS (COMMON) ===

#define FIRMWARE_VERSION "1.0-v5"

// Forward declarations of architecture-specific functions
// These must be implemented in the architecture-specific files (e.g., sys_avr.cpp)
int freeMemory();
void resetDevice();

// === COMMAND PARSER ===
String processCommand(String input) {
  char cmdBuffer[64];
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
    return "{\"ok\":1,\"pong\":1}";
  }
  
  else if (strcmp(cmd, "INFO") == 0) {
    String response = "{\"ok\":1,\"up\":";
    response += millis();
    response += ",\"mem\":";
    response += freeMemory();
    response += ",\"ver\":\"";
    response += FIRMWARE_VERSION;
    response += "\",\"capabilities\":[";
    for (int i = 0; i < CAPABILITIES_COUNT; i++) {
      response += "\"";
      response += CAPABILITIES[i];
      response += "\"";
      if (i < CAPABILITIES_COUNT - 1) response += ",";
    }
    response += "]}";
    return response;
  }
  
  else if (strcmp(cmd, "STATUS") == 0) {
    String response = "{\"ok\":1,\"status\":\"running\",\"up\":";
    response += millis();
    response += "}";
    return response;
  }
  
  else if (strcmp(cmd, "RESET") == 0) {
    Serial.println("{\"ok\":1,\"msg\":\"Resetting...\"}");
    delay(100);
    resetDevice();
    return "{\"ok\":1,\"msg\":\"Resetting\"}";
  }
  
  // === DYNAMIC DISPATCHERS ===
  else if (strcmp(cmd, "ULTRASONIC_TRIG_ECHO") == 0) { return handleUltrasonicTrigEcho(delimiter ? delimiter + 1 : NULL); }
  
  else {
    return "{\"ok\":0,\"error\":\"ERR_INVALID_COMMAND\"}";
  }
}


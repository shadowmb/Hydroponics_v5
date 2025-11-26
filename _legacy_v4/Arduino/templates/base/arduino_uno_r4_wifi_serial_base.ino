// ABOUTME: Minimal base template for Arduino Uno R4 WiFi in Serial mode
// ABOUTME: Handles Serial commands and basic system operations (no WiFi)

#include <ArduinoJson.h>

// GENERATOR_INCLUDES_PLACEHOLDER

// === CONFIGURATION ===
#define FIRMWARE_VERSION "1.0-TEST"
#define DEVICE_TYPE "arduino_uno_r4_wifi"
#define DEVICE_NAME "Hydroponics Arduino Uno R4 WiFi (Serial)"
#define SERIAL_BAUD 115200
#define JSON_BUFFER_SIZE 512

// === CAPABILITIES TRACKING ===
// System commands (PING, INFO, STATUS) are always available
// Only sensor/device commands are tracked in capabilities
// GENERATOR_CAPABILITIES_ARRAY_PLACEHOLDER

// GENERATOR_GLOBALS_PLACEHOLDER

unsigned long startTime = 0;

// === SETUP ===
void setup() {
  Serial.begin(SERIAL_BAUD);
  while (!Serial && millis() < 3000); // Wait up to 3s for serial

  startTime = millis();

  // Clear any garbage data in buffer after reset
  delay(100);
  while(Serial.available() > 0) {
    Serial.read();
  }

  // Send ready signal
  Serial.println("{\"ok\":1,\"msg\":\"Arduino Uno R4 WiFi Ready (Serial Mode)\"}");
}

// === MAIN LOOP ===
void loop() {
  if (Serial.available() > 0) {
    String input = Serial.readStringUntil('\n');
    input.trim();

    if (input.length() > 0) {
      processCommand(input);
    } else {
      // Clear any remaining garbage data if we got empty input
      while(Serial.available() > 0) {
        Serial.read();
      }
    }
  }
}

// === COMMAND PARSER ===
void processCommand(String input) {
  StaticJsonDocument<JSON_BUFFER_SIZE> doc;
  DeserializationError error = deserializeJson(doc, input);

  if (error) {
    doc.clear();
    doc["ok"] = 0;
    doc["error"] = "JSON parse error";
    serializeJson(doc, Serial);
    Serial.println();

    // Clear remaining garbage data from buffer
    while(Serial.available() > 0) {
      Serial.read();
    }
    return;
  }

  const char* cmd = doc["cmd"];

  if (!cmd) {
    doc.clear();
    doc["ok"] = 0;
    doc["error"] = "Missing 'cmd' field";
    serializeJson(doc, Serial);
    Serial.println();

    // Clear remaining garbage data from buffer
    while(Serial.available() > 0) {
      Serial.read();
    }
    return;
  }

  // === SYSTEM COMMANDS ===

  if (strcmp(cmd, "PING") == 0) {
    doc.clear();
    doc["ok"] = 1;
    doc["pong"] = 1;
    doc["version"] = FIRMWARE_VERSION;
    doc["uptime"] = millis() - startTime;
    serializeJson(doc, Serial);
    Serial.println();
  }

  else if (strcmp(cmd, "INFO") == 0) {
    doc.clear();
    doc["ok"] = 1;
    doc["up"] = millis();
    doc["ver"] = FIRMWARE_VERSION;

    // Add capabilities array
    JsonArray capabilities = doc.createNestedArray("capabilities");
    for (int i = 0; i < CAPABILITIES_COUNT; i++) {
      capabilities.add(CAPABILITIES[i]);
    }

    serializeJson(doc, Serial);
    Serial.println();
  }

  else if (strcmp(cmd, "STATUS") == 0) {
    doc.clear();
    doc["ok"] = 1;
    doc["status"] = "running";
    doc["up"] = millis();
    serializeJson(doc, Serial);
    Serial.println();
  }

  else if (strcmp(cmd, "RESET") == 0) {
    doc.clear();
    doc["ok"] = 1;
    doc["msg"] = "Resetting...";
    serializeJson(doc, Serial);
    Serial.println();
    delay(100);
    // Renesas system reset
    NVIC_SystemReset();
  }

  // GENERATOR_DISPATCHER_PLACEHOLDER

  else {
    doc.clear();
    doc["ok"] = 0;
    doc["error"] = "Unknown command";
    serializeJson(doc, Serial);
    Serial.println();
  }
}

// GENERATOR_FUNCTIONS_PLACEHOLDER

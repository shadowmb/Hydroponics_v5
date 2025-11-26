// ABOUTME: Minimal base template for NodeMCU Amica V2 in Serial mode
// ABOUTME: Handles Serial commands and basic system operations (no WiFi)

#include <ArduinoJson.h>

// GENERATOR_INCLUDES_PLACEHOLDER

// === CONFIGURATION ===
#define FIRMWARE_VERSION "1.0-TEST"
#define DEVICE_TYPE "nodemcu_amica_v2"
#define DEVICE_NAME "Hydroponics NodeMCU Amica V2 (Serial)"
#define SERIAL_BAUD 115200
#define JSON_BUFFER_SIZE 512

// === CAPABILITIES TRACKING ===
// System commands (PING, INFO, STATUS, RESET) are always available
// Base commands (READ, SET_PIN) are always available
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
  Serial.println("{\"ok\":1,\"msg\":\"NodeMCU Amica V2 Ready (Serial Mode)\"}");
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
    doc["freeMemory"] = ESP.getFreeHeap();
    serializeJson(doc, Serial);
    Serial.println();
  }

  else if (strcmp(cmd, "INFO") == 0) {
    doc.clear();
    doc["ok"] = 1;
    doc["up"] = millis();
    doc["mem"] = ESP.getFreeHeap();
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

  else if (strcmp(cmd, "HEARTBEAT") == 0) {
    // Flow mode heartbeat response
    doc.clear();
    doc["ok"] = 1;
    doc["pong"] = 1;
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
    ESP.restart();
  }

  // === BASE COMMANDS ===

  else if (strcmp(cmd, "READ") == 0) {
    int pin = doc["pin"];

    if (pin < 0) {
      doc.clear();
      doc["ok"] = 0;
      doc["error"] = "Missing or invalid pin";
      serializeJson(doc, Serial);
      Serial.println();
      return;
    }

    pinMode(pin, INPUT);
    int value = digitalRead(pin);

    doc.clear();
    doc["ok"] = 1;
    doc["pin"] = pin;
    doc["value"] = value;
    doc["state"] = (value == HIGH) ? "HIGH" : "LOW";
    serializeJson(doc, Serial);
    Serial.println();
  }

  else if (strcmp(cmd, "SET_PIN") == 0) {
    int pin = doc["pin"];
    int state = doc["state"];

    if (pin < 0 || (state != 0 && state != 1)) {
      doc.clear();
      doc["ok"] = 0;
      doc["error"] = "Missing or invalid pin/state";
      serializeJson(doc, Serial);
      Serial.println();
      return;
    }

    pinMode(pin, OUTPUT);
    digitalWrite(pin, state);

    doc.clear();
    doc["ok"] = 1;
    doc["pin"] = pin;
    doc["state"] = state;
    serializeJson(doc, Serial);
    Serial.println();
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

// === SYSTEM COMMANDS (COMMON) ===

#define FIRMWARE_VERSION "1.0-v5"

// Forward declarations of architecture-specific functions
// These must be implemented in the architecture-specific files (e.g., sys_avr.cpp)
int freeMemory();
void resetDevice();
String getMacAddress();

// === COMMAND PARSER ===
String processCommand(String input) {
  input.trim();
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
    #if defined(ESP8266) || defined(ESP32) || defined(ARDUINO_UNOR4_WIFI)
    response += F("\",\"ip\":\"");
    response += WiFi.localIP().toString();
    #endif
    response += F("\",\"model\":\"{{BOARD_NAME}}\",\"firmware\":\"");
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
  {{COMMAND_DISPATCHERS}}
  
  else {
    return F("{\"ok\":0,\"error\":\"ERR_INVALID_COMMAND\"}");
  }
}

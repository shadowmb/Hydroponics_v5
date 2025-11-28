// === SYSTEM COMMANDS IMPLEMENTATION ===

#define FIRMWARE_VERSION "1.0-v5"

// === RESET FUNCTION ===
void(* resetFunc) (void) = 0;

// === UTILITY FUNCTIONS ===
int freeMemory() {
  extern int __heap_start, *__brkval;
  int v;
  return (int) &v - (__brkval == 0 ? (int) &__heap_start : (int) __brkval);
}

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
    resetFunc();
    return "{\"ok\":1,\"msg\":\"Resetting\"}";
  }
  
  // === DYNAMIC DISPATCHERS ===
  {{COMMAND_DISPATCHERS}}
  
  else {
    return "{\"ok\":0,\"error\":\"ERR_INVALID_COMMAND\"}";
  }
}

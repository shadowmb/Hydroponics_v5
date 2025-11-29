// === SYSTEM COMMANDS (ESP8266/ESP32 IMPLEMENTATION) ===

// === MEMORY ===
int freeMemory() {
  return ESP.getFreeHeap();
}

// === RESET ===
void resetDevice() {
  ESP.restart();
}

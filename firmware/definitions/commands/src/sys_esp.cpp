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

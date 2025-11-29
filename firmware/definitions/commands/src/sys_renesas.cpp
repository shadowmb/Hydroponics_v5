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

// === NETWORK ===
#include <WiFiS3.h>

String getMacAddress() {
  byte mac[6];
  WiFi.macAddress(mac);
  char buf[20];
  sprintf(buf, "%02X:%02X:%02X:%02X:%02X:%02X", mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
  return String(buf);
}

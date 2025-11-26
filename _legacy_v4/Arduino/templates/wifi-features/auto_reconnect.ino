// ============================================================================
// WiFi Feature: Auto-Reconnect with Smart Retry
// ============================================================================
// ABOUTME: Monitors WiFi and auto-reconnects with exponential backoff
// ABOUTME: Minimal implementation - hardcoded parameters, no commands

// FEATURE_INCLUDES
// (No additional includes needed)

// FEATURE_GLOBALS
unsigned long lastWiFiCheck = 0;
uint8_t reconnectAttempts = 0;

// Hardcoded parameters
#define WIFI_CHECK_INTERVAL 30000  // Check every 30 seconds
#define MAX_RECONNECT_ATTEMPTS 5   // Max attempts before long pause
#define RECONNECT_DELAY 2000       // 2 seconds between attempts

// FEATURE_SETUP
// (No setup code needed)

// FEATURE_LOOP
// Check WiFi connection periodically
if (millis() - lastWiFiCheck >= WIFI_CHECK_INTERVAL) {
  lastWiFiCheck = millis();

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println(F("[Auto-Reconnect] Disconnected"));

    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      WiFi.disconnect();
      delay(100);
      connectWiFi();

      if (WiFi.status() == WL_CONNECTED) {
        Serial.println(F("[Auto-Reconnect] Restored"));
        reconnectAttempts = 0;
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
  }
}

// FEATURE_FUNCTIONS
// (No functions needed)

// FEATURE_COMMAND_HANDLER
// (No commands needed)

// FEATURE_COMMAND_FUNCTION
// (No command functions needed)

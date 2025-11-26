// ============================================================================
// WiFi Feature: Multi-Network Fallback (2 Networks)
// ============================================================================
// ABOUTME: Automatic fallback to secondary WiFi network if primary fails
// ABOUTME: Minimal implementation - tries both networks at boot only

// FEATURE_INCLUDES
// (No additional includes needed)

// FEATURE_GLOBALS
struct WiFiNetwork {
  char ssid[32];
  char password[64];
};

WiFiNetwork network1;
WiFiNetwork network2;

// EEPROM layout (starts at byte 100)
#define MULTI_NET_EEPROM_START 100

// FEATURE_SETUP
loadSecondaryNetwork();

// FEATURE_LOOP
// (No loop code needed)

// FEATURE_FUNCTIONS
void loadSecondaryNetwork() {
  EEPROM.begin(EEPROM_SIZE);

  // Load network 2 from EEPROM
  for (int i = 0; i < 32; i++) {
    network2.ssid[i] = EEPROM.read(MULTI_NET_EEPROM_START + i);
  }
  for (int i = 0; i < 64; i++) {
    network2.password[i] = EEPROM.read(MULTI_NET_EEPROM_START + 32 + i);
  }

  EEPROM.end();
}

void saveSecondaryNetwork() {
  EEPROM.begin(EEPROM_SIZE);

  // Save network 2 to EEPROM
  for (int i = 0; i < 32; i++) {
    EEPROM.write(MULTI_NET_EEPROM_START + i, network2.ssid[i]);
  }
  for (int i = 0; i < 64; i++) {
    EEPROM.write(MULTI_NET_EEPROM_START + 32 + i, network2.password[i]);
  }

  EEPROM.commit();
  EEPROM.end();
}

// FEATURE_OVERRIDE_connectWiFi
void connectWiFi() {
  // Try primary network (from base config)
  Serial.print(F("Connecting to WiFi: "));
  Serial.println(wifiConfig.ssid);

  WiFi.mode(WIFI_STA);
  WiFi.begin(wifiConfig.ssid, wifiConfig.password);

  unsigned long startAttempt = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startAttempt < WIFI_TIMEOUT) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print(F("WiFi connected! IP: "));
    Serial.println(WiFi.localIP());
    return;
  }

  // Try secondary network
  if (network2.ssid[0] != 0) {
    Serial.print(F("Primary failed, trying fallback: "));
    Serial.println(network2.ssid);

    WiFi.disconnect();
    delay(100);
    WiFi.begin(network2.ssid, network2.password);

    startAttempt = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - startAttempt < WIFI_TIMEOUT) {
      delay(500);
      Serial.print(".");
    }
    Serial.println();

    if (WiFi.status() == WL_CONNECTED) {
      Serial.print(F("Fallback connected! IP: "));
      Serial.println(WiFi.localIP());
    } else {
      Serial.println(F("All networks failed"));
    }
  } else {
    Serial.println(F("WiFi connection failed"));
  }
}

// FEATURE_COMMAND_HANDLER
else if (strcmp(cmd, "SET_FALLBACK_WIFI") == 0) {
  return handleSetFallbackWiFi();
}

// FEATURE_COMMAND_FUNCTION
String handleSetFallbackWiFi() {
  const char* ssid = jsonDoc["ssid"];
  const char* password = jsonDoc["password"];

  if (ssid == nullptr || password == nullptr) {
    return "{\"ok\":0,\"error\":\"Missing ssid or password\"}";
  }

  strncpy(network2.ssid, ssid, 31);
  network2.ssid[31] = 0;
  strncpy(network2.password, password, 63);
  network2.password[63] = 0;

  saveSecondaryNetwork();

  return "{\"ok\":1,\"msg\":\"Fallback network saved\"}";
}

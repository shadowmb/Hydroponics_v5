// ABOUTME: SINGLE_WIRE_PULSE command handler for pulse-width timing protocol sensors (DHT-style).
// ABOUTME: Reads digital data by measuring high pulse durations and comparing against threshold.

// === INCLUDES ===
// No additional includes required

// === GLOBALS ===
// No additional globals required

// === DISPATCHER ===
else if (strcmp(cmd, "SINGLE_WIRE_PULSE") == 0) {
  handleSingleWirePulse(doc);
}

// === FUNCTIONS ===

void handleSingleWirePulse(JsonDocument& doc) {
  int dataPin = doc["dataPin"];
  unsigned long startLowDuration = doc["startLowDuration"] | 18000;   // Default 18ms for DHT-style
  unsigned long startHighDuration = doc["startHighDuration"] | 40;    // Default 40μs for DHT-style
  unsigned long bitThreshold = doc["bitThreshold"] | 40;              // Default 40μs threshold
  int numBits = doc["numBits"] | 40;                                  // Default 40 bits
  unsigned long timeout = doc["timeout"] | 5000;                     // Default 5s timeout

  // Validate pin
  if (dataPin < 2 || dataPin > 13) {
    doc.clear();
    doc["ok"] = 0;
    doc["error"] = "Invalid digital pin (use 2-13)";
    serializeJson(doc, Serial);
    Serial.println();
    return;
  }

  // Validate numBits (max 320 bits = 40 bytes)
  if (numBits <= 0 || numBits > 320) {
    doc.clear();
    doc["ok"] = 0;
    doc["error"] = "Invalid numBits (must be 1-320)";
    serializeJson(doc, Serial);
    Serial.println();
    return;
  }

  // Calculate bytes needed for data storage
  int numBytes = (numBits + 7) / 8;
  byte data[40] = {0};  // Max 40 bytes

  // Send start signal
  pinMode(dataPin, OUTPUT);
  digitalWrite(dataPin, LOW);
  delayMicroseconds(startLowDuration);
  digitalWrite(dataPin, HIGH);
  delayMicroseconds(startHighDuration);
  pinMode(dataPin, INPUT);

  unsigned long timeoutStart = millis();

  // Wait for sensor response (pull low)
  while (digitalRead(dataPin) == HIGH) {
    if (millis() - timeoutStart > timeout) {
      doc.clear();
      doc["ok"] = 0;
      doc["error"] = "no_response";
      serializeJson(doc, Serial);
      Serial.println();
      return;
    }
  }

  // Wait for sensor ready (pull high then low for data start)
  while (digitalRead(dataPin) == LOW) {
    if (millis() - timeoutStart > timeout) {
      doc.clear();
      doc["ok"] = 0;
      doc["error"] = "sensor_timeout";
      serializeJson(doc, Serial);
      Serial.println();
      return;
    }
  }

  while (digitalRead(dataPin) == HIGH) {
    if (millis() - timeoutStart > timeout) {
      doc.clear();
      doc["ok"] = 0;
      doc["error"] = "sensor_timeout";
      serializeJson(doc, Serial);
      Serial.println();
      return;
    }
  }

  // Read bits using pulse timing
  for (int i = 0; i < numBits; i++) {
    // Wait for bit start (low to high transition)
    while (digitalRead(dataPin) == LOW) {
      if (millis() - timeoutStart > timeout) {
        doc.clear();
        doc["ok"] = 0;
        doc["error"] = "bit_timeout";
        serializeJson(doc, Serial);
        Serial.println();
        return;
      }
    }

    // Measure high pulse duration
    unsigned long bitStart = micros();
    while (digitalRead(dataPin) == HIGH) {
      if (millis() - timeoutStart > timeout) {
        doc.clear();
        doc["ok"] = 0;
        doc["error"] = "bit_timeout";
        serializeJson(doc, Serial);
        Serial.println();
        return;
      }
    }
    unsigned long bitDuration = micros() - bitStart;

    // Set bit based on duration threshold
    if (bitDuration > bitThreshold) {
      data[i / 8] |= (1 << (7 - (i % 8)));
    }
  }

  // Build response with raw bit data
  doc.clear();
  doc["ok"] = 1;
  doc["dataPin"] = dataPin;
  doc["numBits"] = numBits;
  JsonArray dataArray = doc.createNestedArray("data");
  for (int i = 0; i < numBytes; i++) {
    dataArray.add(data[i]);
  }
  doc["unit"] = "raw";
  serializeJson(doc, Serial);
  Serial.println();
}

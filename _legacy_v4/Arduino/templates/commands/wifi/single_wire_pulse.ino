// ABOUTME: SINGLE_WIRE_PULSE command handler for pulse-width timing protocol sensors (DHT-style).
// ABOUTME: Reads digital data by measuring high pulse durations and comparing against threshold.

// === INCLUDES ===
// No additional includes required

// === GLOBALS ===
// No additional globals required

// === DISPATCHER ===
else if (strcmp(cmd, "SINGLE_WIRE_PULSE") == 0) {
  return handleSingleWirePulse();
}

// === FUNCTIONS ===

String handleSingleWirePulse() {
  int dataPin = jsonDoc["dataPin"];
  unsigned long startLowDuration = jsonDoc["startLowDuration"] | 18000;   // Default 18ms for DHT-style
  unsigned long startHighDuration = jsonDoc["startHighDuration"] | 40;    // Default 40μs for DHT-style
  unsigned long bitThreshold = jsonDoc["bitThreshold"] | 40;              // Default 40μs threshold
  int numBits = jsonDoc["numBits"] | 40;                                  // Default 40 bits
  unsigned long timeout = jsonDoc["timeout"] | 5000;                     // Default 5s timeout

  StaticJsonDocument<512> doc;

  // Validate pin
  if (dataPin < 2 || dataPin > 13) {
    doc["ok"] = 0;
    doc["error"] = "Invalid digital pin (use 2-13)";
    String response;
    serializeJson(doc, response);
    return response;
  }

  // Validate numBits (max 320 bits = 40 bytes)
  if (numBits <= 0 || numBits > 320) {
    doc["ok"] = 0;
    doc["error"] = "Invalid numBits (must be 1-320)";
    String response;
    serializeJson(doc, response);
    return response;
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
      doc["ok"] = 0;
      doc["error"] = "no_response";
      String response;
      serializeJson(doc, response);
      return response;
    }
  }

  // Wait for sensor ready (pull high then low for data start)
  while (digitalRead(dataPin) == LOW) {
    if (millis() - timeoutStart > timeout) {
      doc["ok"] = 0;
      doc["error"] = "sensor_timeout";
      String response;
      serializeJson(doc, response);
      return response;
    }
  }

  while (digitalRead(dataPin) == HIGH) {
    if (millis() - timeoutStart > timeout) {
      doc["ok"] = 0;
      doc["error"] = "sensor_timeout";
      String response;
      serializeJson(doc, response);
      return response;
    }
  }

  // Read bits using pulse timing
  for (int i = 0; i < numBits; i++) {
    // Wait for bit start (low to high transition)
    while (digitalRead(dataPin) == LOW) {
      if (millis() - timeoutStart > timeout) {
        doc["ok"] = 0;
        doc["error"] = "bit_timeout";
        String response;
        serializeJson(doc, response);
        return response;
      }
    }

    // Measure high pulse duration
    unsigned long bitStart = micros();
    while (digitalRead(dataPin) == HIGH) {
      if (millis() - timeoutStart > timeout) {
        doc["ok"] = 0;
        doc["error"] = "bit_timeout";
        String response;
        serializeJson(doc, response);
        return response;
      }
    }
    unsigned long bitDuration = micros() - bitStart;

    // Set bit based on duration threshold
    if (bitDuration > bitThreshold) {
      data[i / 8] |= (1 << (7 - (i % 8)));
    }
  }

  // Build response with raw bit data
  doc["ok"] = 1;
  doc["dataPin"] = dataPin;
  doc["numBits"] = numBits;
  JsonArray dataArray = doc.createNestedArray("data");
  for (int i = 0; i < numBytes; i++) {
    dataArray.add(data[i]);
  }
  doc["unit"] = "raw";

  String response;
  serializeJson(doc, response);
  return response;
}

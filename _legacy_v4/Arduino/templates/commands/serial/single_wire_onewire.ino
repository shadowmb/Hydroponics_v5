// === INCLUDES ===
// (None required - uses standard Arduino functions)

// === GLOBALS ===
// (None required - uses existing responseBuffer and jsonDoc)

// === DISPATCHER ===
else if (strcmp(cmd, "SINGLE_WIRE_ONEWIRE") == 0) {
  handleSingleWireOnewire(doc);
}

// === FUNCTIONS ===

void handleSingleWireOnewire(JsonDocument& doc) {
  int dataPin = doc["dataPin"];
  unsigned long timeout = doc["timeout"] | 5000;  // Default 5s timeout

  // Validate pin
  if (dataPin < 2 || dataPin > 13) {
    doc.clear();
    doc["ok"] = 0;
    doc["error"] = "Invalid pin";
    serializeJson(doc, Serial);
    Serial.println();
    return;
  }

  // Simple DS18B20 temperature reading
  byte data[9] = {0};  // DS18B20 scratchpad data
  bool readSuccess = false;

  // Step 1: Reset and check presence
  pinMode(dataPin, OUTPUT);
  digitalWrite(dataPin, LOW);
  delayMicroseconds(480);
  pinMode(dataPin, INPUT);
  delayMicroseconds(70);

  if (digitalRead(dataPin) == HIGH) {
    // No presence pulse - sensor not found
    doc.clear();
    doc["ok"] = 0;
    doc["error"] = "no_response";
    serializeJson(doc, Serial);
    Serial.println();
    return;
  }

  delayMicroseconds(410);  // Complete presence sequence

  // Step 2: Skip ROM + Convert T
  writeOnewireByte(dataPin, 0xCC);  // Skip ROM
  writeOnewireByte(dataPin, 0x44);  // Convert T
  delay(750);  // Wait for conversion

  // Step 3: Reset, Skip ROM, Read Scratchpad
  pinMode(dataPin, OUTPUT);
  digitalWrite(dataPin, LOW);
  delayMicroseconds(480);
  pinMode(dataPin, INPUT);
  delayMicroseconds(70);

  if (digitalRead(dataPin) == LOW) {  // Presence OK
    delayMicroseconds(410);

    writeOnewireByte(dataPin, 0xCC);  // Skip ROM
    writeOnewireByte(dataPin, 0xBE);  // Read Scratchpad

    // Read 9 bytes
    for (int i = 0; i < 9; i++) {
      data[i] = readOnewireByte(dataPin);
    }
    readSuccess = true;
  }

  // Build JSON response
  doc.clear();
  doc["ok"] = 1;
  doc["dataPin"] = dataPin;
  doc["presence"] = 1;
  JsonArray dataArray = doc.createNestedArray("data");

  if (readSuccess) {
    for (int i = 0; i < 9; i++) {
      dataArray.add(data[i]);
    }
  }

  doc["unit"] = "raw";
  serializeJson(doc, Serial);
  Serial.println();
}

// Simple DS18B20 byte write
void writeOnewireByte(int pin, byte data) {
  for (int i = 0; i < 8; i++) {
    pinMode(pin, OUTPUT);
    digitalWrite(pin, LOW);

    if (data & (1 << i)) {
      delayMicroseconds(6);
      pinMode(pin, INPUT);
      delayMicroseconds(64);
    } else {
      delayMicroseconds(60);
      pinMode(pin, INPUT);
      delayMicroseconds(10);
    }
  }
}

// Simple DS18B20 byte read
byte readOnewireByte(int pin) {
  byte data = 0;

  for (int i = 0; i < 8; i++) {
    pinMode(pin, OUTPUT);
    digitalWrite(pin, LOW);
    delayMicroseconds(3);
    pinMode(pin, INPUT);
    delayMicroseconds(10);

    if (digitalRead(pin)) {
      data |= (1 << i);
    }

    delayMicroseconds(53);
  }

  return data;
}

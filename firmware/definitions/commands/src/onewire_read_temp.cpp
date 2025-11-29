#include <Arduino.h>

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

String handleOneWireReadTemp(const char* params) {
  // Parse pin from params (e.g., "D5")
  if (!params || strlen(params) < 2) {
    return "{\"ok\":0,\"error\":\"ERR_MISSING_PARAMETER\"}";
  }

  int pin = parsePin(String(params));
  if (pin == -1) {
    return "{\"ok\":0,\"error\":\"ERR_INVALID_PIN\"}";
  }

  byte data[9] = {0};  // DS18B20 scratchpad data
  bool readSuccess = false;

  // Step 1: Reset and check presence
  pinMode(pin, OUTPUT);
  digitalWrite(pin, LOW);
  delayMicroseconds(480);
  pinMode(pin, INPUT);
  delayMicroseconds(70);

  if (digitalRead(pin) == HIGH) {
    return "{\"ok\":0,\"error\":\"ERR_SENSOR_NOT_FOUND\"}";
  }

  delayMicroseconds(410);  // Complete presence sequence

  // Step 2: Skip ROM + Convert T
  writeOnewireByte(pin, 0xCC);  // Skip ROM
  writeOnewireByte(pin, 0x44);  // Convert T
  
  // Wait for conversion (750ms for 12-bit)
  delay(750);

  // Step 3: Reset, Skip ROM, Read Scratchpad
  pinMode(pin, OUTPUT);
  digitalWrite(pin, LOW);
  delayMicroseconds(480);
  pinMode(pin, INPUT);
  delayMicroseconds(70);

  if (digitalRead(pin) == LOW) {  // Presence OK
    delayMicroseconds(410);

    writeOnewireByte(pin, 0xCC);  // Skip ROM
    writeOnewireByte(pin, 0xBE);  // Read Scratchpad

    // Read 9 bytes
    for (int i = 0; i < 9; i++) {
      data[i] = readOnewireByte(pin);
    }
    readSuccess = true;
  } else {
     return "{\"ok\":0,\"error\":\"ERR_SENSOR_LOST\"}";
  }

  if (readSuccess) {
    // Convert data to temperature
    int16_t raw = (data[1] << 8) | data[0];
    float tempC = (float)raw / 16.0;

    // Build and return JSON response
    String response = "{\"ok\":1,\"temp\":";
    response += String(tempC, 2);
    response += "}";
    return response;
  }

  return "{\"ok\":0,\"error\":\"ERR_READ_FAILED\"}";
}

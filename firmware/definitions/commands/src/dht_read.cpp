#include <Arduino.h>

String handleDHTRead(const char* params) {
  // Parse pin from params (e.g., "D4")
  if (!params || strlen(params) < 2) {
    return "{\"ok\":0,\"error\":\"ERR_MISSING_PARAMETER\"}";
  }

  int dataPin = parsePin(String(params));
  if (dataPin == -1) {
    return "{\"ok\":0,\"error\":\"ERR_INVALID_PIN\"}";
  }

  // DHT22 protocol parameters
  const unsigned long START_LOW_DURATION = 18000;  // 18ms
  const unsigned long START_HIGH_DURATION = 40;     // 40μs
  const unsigned long BIT_THRESHOLD = 40;           // 40μs threshold
  const int NUM_BITS = 40;                          // 40 bits (5 bytes)
  const unsigned long TIMEOUT = 5000;               // 5s timeout

  byte data[5] = {0};  // 5 bytes: humidity_int, humidity_dec, temp_int, temp_dec, checksum

  // Send start signal
  pinMode(dataPin, OUTPUT);
  digitalWrite(dataPin, LOW);
  delayMicroseconds(START_LOW_DURATION);
  digitalWrite(dataPin, HIGH);
  delayMicroseconds(START_HIGH_DURATION);
  pinMode(dataPin, INPUT);

  unsigned long timeoutStart = millis();

  // Wait for sensor response (pull low)
  while (digitalRead(dataPin) == HIGH) {
    if (millis() - timeoutStart > TIMEOUT) {
      return "{\"ok\":0,\"error\":\"ERR_SENSOR_TIMEOUT\"}";
    }
  }

  // Wait for sensor ready (pull high)
  while (digitalRead(dataPin) == LOW) {
    if (millis() - timeoutStart > TIMEOUT) {
      return "{\"ok\":0,\"error\":\"ERR_SENSOR_TIMEOUT\"}";
    }
  }

  // Wait for data start (pull low)
  while (digitalRead(dataPin) == HIGH) {
    if (millis() - timeoutStart > TIMEOUT) {
      return "{\"ok\":0,\"error\":\"ERR_SENSOR_TIMEOUT\"}";
    }
  }

  // Read 40 bits of data
  for (int i = 0; i < NUM_BITS; i++) {
    // Wait for bit start (high pulse)
    while (digitalRead(dataPin) == LOW) {
      if (millis() - timeoutStart > TIMEOUT) {
        return "{\"ok\":0,\"error\":\"ERR_READ_TIMEOUT\"}";
      }
    }

    // Measure high pulse duration
    unsigned long pulseStart = micros();
    while (digitalRead(dataPin) == HIGH) {
      if (millis() - timeoutStart > TIMEOUT) {
        return "{\"ok\":0,\"error\":\"ERR_READ_TIMEOUT\"}";
      }
    }
    unsigned long pulseDuration = micros() - pulseStart;

    // Decode bit: >40μs = 1, <40μs = 0
    int byteIndex = i / 8;
    int bitIndex = 7 - (i % 8);
    if (pulseDuration > BIT_THRESHOLD) {
      data[byteIndex] |= (1 << bitIndex);
    }
  }

  // Verify checksum
  byte checksum = data[0] + data[1] + data[2] + data[3];
  if (checksum != data[4]) {
    return "{\"ok\":0,\"error\":\"ERR_CHECKSUM_FAILED\"}";
  }

  // Parse DHT22 data (high precision: 0.1°C, 0.1% RH)
  // For DHT11, data[1] and data[3] will be 0
  float humidity = ((data[0] << 8) | data[1]) / 10.0;
  float temperature = (((data[2] & 0x7F) << 8) | data[3]) / 10.0;
  
  // Handle negative temperature (DHT22 only)
  if (data[2] & 0x80) {
    temperature = -temperature;
  }

  // Build and return JSON response
  String response = "{\"ok\":1,\"temp\":";
  response += String(temperature, 1);
  response += ",\"humidity\":";
  response += String(humidity, 1);
  response += "}";
  
  return response;
}

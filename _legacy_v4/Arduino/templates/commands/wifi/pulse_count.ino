/*
 * PULSE_COUNT Command Module
 * Counts pulses over a measurement period
 * Used for: Flow sensors and similar pulse-generating devices
 * Returns pulse count and calculated frequency
 */

// === INCLUDES ===
// No additional includes needed

// === GLOBALS ===
volatile unsigned long pulseCounter = 0;
int pulsePinGlobal = -1;

// === DISPATCHER ===
else if (strcmp(cmd, "PULSE_COUNT") == 0) {
  return handlePulseCount();
}

// === FUNCTIONS ===

// Interrupt service routine for pulse counting
void IRAM_ATTR pulseCounterISR() {
  pulseCounter++;
}

String handlePulseCount() {
  // Get parameters from command
  int pin = jsonDoc["pin"];
  unsigned long measurementTime = jsonDoc["measurementTime"] | 5000; // Default 5 seconds
  bool pullupEnabled = jsonDoc["pullupEnabled"] | true; // Default enabled
  unsigned long timeout = jsonDoc["timeout"] | 10000; // Default 10 seconds

  // Validate pin (ESP8266 GPIO pins)
  if (pin < 0 || pin > 16) {
    StaticJsonDocument<512> doc;
    doc["ok"] = 0;
    doc["error"] = "Invalid pin (use GPIO 0-16)";
    String response;
    serializeJson(doc, response);
    return response;
  }

  // Validate measurement time
  if (measurementTime > timeout) {
    StaticJsonDocument<512> doc;
    doc["ok"] = 0;
    doc["error"] = "Measurement time exceeds timeout";
    String response;
    serializeJson(doc, response);
    return response;
  }

  // Setup pin with optional pullup
  pinMode(pin, INPUT);
  if (pullupEnabled) {
    pinMode(pin, INPUT_PULLUP);
  }

  // Reset counter
  pulseCounter = 0;
  pulsePinGlobal = pin;

  // Attach interrupt (ESP8266 supports interrupts on most GPIO pins)
  int interruptPin = digitalPinToInterrupt(pin);
  bool useInterrupt = (interruptPin != NOT_AN_INTERRUPT);

  if (useInterrupt) {
    // Use hardware interrupt for accurate counting
    attachInterrupt(interruptPin, pulseCounterISR, RISING);

    // Wait for measurement period
    delay(measurementTime);

    // Detach interrupt
    detachInterrupt(interruptPin);
  } else {
    // Use polling for pins without interrupt support
    unsigned long startTime = millis();
    int lastState = digitalRead(pin);

    while (millis() - startTime < measurementTime) {
      int currentState = digitalRead(pin);

      // Detect rising edge
      if (currentState == HIGH && lastState == LOW) {
        pulseCounter++;
      }

      lastState = currentState;
      delayMicroseconds(100); // Small delay to debounce
    }
  }

  // Calculate results
  unsigned long actualMeasurementTime = measurementTime;
  unsigned long pulseCount = pulseCounter;
  float pulsesPerSecond = (float)pulseCount / (actualMeasurementTime / 1000.0);

  // Build response
  StaticJsonDocument<512> doc;
  doc["ok"] = 1;
  doc["pin"] = pin;
  doc["pulseCount"] = pulseCount;
  doc["measurementTime"] = actualMeasurementTime;
  doc["pulsesPerSecond"] = pulsesPerSecond;
  doc["method"] = useInterrupt ? "interrupt" : "polling";

  // Send response
  String response;
  serializeJson(doc, response);
  return response;
}

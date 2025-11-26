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
  handlePulseCount(doc);
}

// === FUNCTIONS ===

// Interrupt service routine for pulse counting
void pulseCounterISR() {
  pulseCounter++;
}

void handlePulseCount(JsonDocument& doc) {
  // Get parameters from command
  int pin = doc["pin"];
  unsigned long measurementTime = doc["measurementTime"] | 5000; // Default 5 seconds
  bool pullupEnabled = doc["pullupEnabled"] | true; // Default enabled
  unsigned long timeout = doc["timeout"] | 10000; // Default 10 seconds

  // Validate pin (Arduino Uno digital pins 2-13, pin 2-3 support interrupts)
  if (pin < 2 || pin > 13) {
    doc.clear();
    doc["ok"] = 0;
    doc["error"] = "Invalid pin (use digital pins 2-13)";
    serializeJson(doc, Serial);
    Serial.println();
    return;
  }

  // Validate measurement time
  if (measurementTime > timeout) {
    doc.clear();
    doc["ok"] = 0;
    doc["error"] = "Measurement time exceeds timeout";
    serializeJson(doc, Serial);
    Serial.println();
    return;
  }

  // Setup pin with optional pullup
  pinMode(pin, INPUT);
  if (pullupEnabled) {
    digitalWrite(pin, HIGH); // Enable internal pullup resistor
  }

  // Reset counter
  pulseCounter = 0;
  pulsePinGlobal = pin;

  // Attach interrupt (only pins 2 and 3 on Arduino Uno support external interrupts)
  // For other pins, we'll use polling method
  int interruptPin = digitalPinToInterrupt(pin);
  bool useInterrupt = (interruptPin != NOT_AN_INTERRUPT);

  if (useInterrupt) {
    // Use hardware interrupt for accurate counting (pins 2-3 on Uno)
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
  doc.clear();
  doc["ok"] = 1;
  doc["pin"] = pin;
  doc["pulseCount"] = pulseCount;
  doc["measurementTime"] = actualMeasurementTime;
  doc["pulsesPerSecond"] = pulsesPerSecond;
  doc["method"] = useInterrupt ? "interrupt" : "polling";

  // Send response
  serializeJson(doc, Serial);
  Serial.println();
}

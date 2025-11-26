/*
 * PULSE_MEASURE Command Module
 * Sends ultrasonic pulse and measures echo time
 * Used for: HC-SR04 ultrasonic distance sensors
 * Returns distance in centimeters
 */

// === INCLUDES ===
// No additional includes needed

// === GLOBALS ===
// No global variables needed

// === DISPATCHER ===
else if (strcmp(cmd, "PULSE_MEASURE") == 0) {
  handlePulseMeasure(doc);
}

// === FUNCTIONS ===
void handlePulseMeasure(JsonDocument& doc) {
  // Get pin numbers from command
  int triggerPin = doc["triggerPin"];
  int echoPin = doc["echoPin"];

  // Validate pins
  if (triggerPin < 2 || triggerPin > 13 || echoPin < 2 || echoPin > 13) {
    doc.clear();
    doc["ok"] = 0;
    doc["error"] = "Invalid pins (use digital pins 2-13)";
    serializeJson(doc, Serial);
    Serial.println();
    return;
  }

  // Setup pins
  pinMode(triggerPin, OUTPUT);
  pinMode(echoPin, INPUT);

  // Send ultrasonic pulse
  digitalWrite(triggerPin, LOW);
  delayMicroseconds(2);
  digitalWrite(triggerPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(triggerPin, LOW);

  // Measure echo time (timeout 30ms = ~5m max distance)
  long duration = pulseIn(echoPin, HIGH, 30000);

  // Calculate distance in cm
  // Speed of sound: 343 m/s = 0.0343 cm/μs
  // Distance = (duration / 2) * 0.0343
  float distance = (duration / 2.0) * 0.0343;

  // Build response
  doc.clear();
  doc["ok"] = 1;
  doc["triggerPin"] = triggerPin;
  doc["echoPin"] = echoPin;
  doc["duration"] = duration;
  doc["distance"] = distance;

  // Send response
  serializeJson(doc, Serial);
  Serial.println();
}

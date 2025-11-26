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
  return handlePulseMeasure();
}

// === FUNCTIONS ===
String handlePulseMeasure() {
  // Get pin numbers from command
  int triggerPin = jsonDoc["triggerPin"];
  int echoPin = jsonDoc["echoPin"];

  // Validate pins
  if (triggerPin < 2 || triggerPin > 13 || echoPin < 2 || echoPin > 13) {
    StaticJsonDocument<512> doc;
    doc["ok"] = 0;
    doc["error"] = "Invalid pins (use digital pins 2-13)";
    String response;
    serializeJson(doc, response);
    return response;
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
  StaticJsonDocument<512> doc;
  doc["ok"] = 1;
  doc["triggerPin"] = triggerPin;
  doc["echoPin"] = echoPin;
  doc["duration"] = duration;
  doc["distance"] = distance;

  // Send response
  String response;
  serializeJson(doc, response);
  return response;
}

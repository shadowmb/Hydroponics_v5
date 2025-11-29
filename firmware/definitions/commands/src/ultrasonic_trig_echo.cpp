

String handleUltrasonicTrigEcho(const char* params) {
  // Expected params: "D2_2|D3_3" (Trig|Echo)
  
  if (!params) {
    return "{\"ok\":0,\"error\":\"ERR_MISSING_PARAMETER\"}";
  }

  // Parse Trig Pin
  char paramsCopy[64];
  strncpy(paramsCopy, params, sizeof(paramsCopy) - 1);
  paramsCopy[sizeof(paramsCopy) - 1] = '\0';

  char* pipe = strchr(paramsCopy, '|');
  if (!pipe) {
    return "{\"ok\":0,\"error\":\"ERR_INVALID_FORMAT\"}";
  }
  *pipe = '\0';
  
  const char* trigPinStr = paramsCopy;
  const char* echoPinStr = pipe + 1;

  int trigPin = parsePin(String(trigPinStr));
  int echoPin = parsePin(String(echoPinStr));

  if (trigPin == -1 || echoPin == -1) {
    return "{\"ok\":0,\"error\":\"ERR_INVALID_PIN\"}";
  }

  // Perform Measurement
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);

  // Clear Trig
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);

  // Send 10us Pulse
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  // Read Echo
  long duration = pulseIn(echoPin, HIGH, 30000); // 30ms timeout (~5m)

  if (duration == 0) {
    return "{\"ok\":0,\"error\":\"ERR_TIMEOUT\"}";
  }

  // Calculate Distance (cm)
  // Speed of sound = 343 m/s = 0.0343 cm/us
  // Distance = (duration * 0.0343) / 2
  float distance = (duration * 0.0343) / 2.0;

  String response = "{\"ok\":1,\"distance\":";
  response += String(distance, 1);
  response += "}";

  return response;
}

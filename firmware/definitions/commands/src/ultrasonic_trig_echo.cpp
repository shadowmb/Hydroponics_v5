

// Robust Ultrasonic Handler - Prevents Bus Fault on Uno R4
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

  // Validate pins are different
  if (trigPin == echoPin) {
    return "{\"ok\":0,\"error\":\"ERR_SAME_PIN\"}";
  }

  // Configure pins with explicit cleanup
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  digitalWrite(trigPin, LOW);
  
  // Small delay to ensure pin states are stable
  delay(2);

  // --- CRITICAL SECTION: Interrupt-safe trigger pulse ---
  // On Uno R4 (Renesas RA4M1), interrupts can corrupt pulseIn timing
  noInterrupts();
  
  // Clear any residual state
  digitalWrite(trigPin, LOW);
  delayMicroseconds(5);

  // Send 10us Trigger Pulse
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  
  interrupts();
  // --- END CRITICAL SECTION ---

  // Read Echo with timeout (30ms = ~5m range)
  // Using volatile to prevent optimizer issues on R4
  volatile long duration = pulseIn(echoPin, HIGH, 30000);

  // IMPORTANT: Reset pins to safe state regardless of result
  // This prevents interrupt handler corruption on next call
  digitalWrite(trigPin, LOW);
  pinMode(trigPin, INPUT);  // Release pin control
  
  // Small delay to let hardware settle
  delayMicroseconds(100);

  if (duration == 0) {
    return "{\"ok\":0,\"error\":\"ERR_TIMEOUT\"}";
  }

  // Calculate Distance (cm)
  // Speed of sound = 343 m/s = 0.0343 cm/us
  // Distance = (duration * 0.0343) / 2
  float distance = (duration * 0.0343) / 2.0;

  // Sanity check - HC-SR04 range is 2-400cm
  if (distance < 2.0 || distance > 400.0) {
    return "{\"ok\":0,\"error\":\"ERR_OUT_OF_RANGE\"}";
  }

  String response = "{\"ok\":1,\"distance\":";
  response += String(distance, 1);
  response += "}";

  return response;
}


/*
 * SERVO_WRITE Command Module (v5 Clean)
 * Sets servo position (0-180 degrees)
 * Format: SERVO_WRITE|D9|90
 * Used for: Servo motors, actuators
 */

// === INCLUDES ===
#include <Servo.h>

// === GLOBALS ===
Servo servos[6]; // Support up to 6 servos
bool servoAttached[6] = {false, false, false, false, false, false};
int servoPins[6] = {3, 5, 6, 9, 10, 11}; // PWM pins

// === DISPATCHER ===
else if (strcmp(cmd, "SERVO_WRITE") == 0) {
  handleServoWrite(delimiter + 1);
}

// === FUNCTIONS ===
int getServoIndex(int pin) {
  for (int i = 0; i < 6; i++) {
    if (servoPins[i] == pin) return i;
  }
  return -1;
}

int parseServoPin(const char* pinStr) {
  if (strlen(pinStr) < 2 || pinStr[0] != 'D') {
    return -1;
  }
  int pin = atoi(pinStr + 1);
  return (getServoIndex(pin) != -1) ? pin : -1;
}

void handleServoWrite(const char* params) {
  // Parse params: "D9|90" -> pin=D9, angle=90
  if (!params || strlen(params) < 4) {
    Serial.println("{\"ok\":0,\"error\":\"ERR_MISSING_PARAMETER\"}");
    return;
  }

  // Find delimiter
  char paramsCopy[16];
  strncpy(paramsCopy, params, sizeof(paramsCopy) - 1);
  paramsCopy[sizeof(paramsCopy) - 1] = '\0';
  
  char* delimiter = strchr(paramsCopy, '|');
  if (!delimiter) {
    Serial.println("{\"ok\":0,\"error\":\"ERR_INVALID_FORMAT\"}");
    return;
  }

  *delimiter = '\0';
  const char* pinStr = paramsCopy;
  const char* angleStr = delimiter + 1;

  // Parse pin
  int pin = parseServoPin(pinStr);
  if (pin == -1) {
    Serial.println("{\"ok\":0,\"error\":\"ERR_INVALID_PIN\"}");
    return;
  }

  // Parse angle (0-180)
  int angle = atoi(angleStr);
  if (angle < 0 || angle > 180) {
    Serial.println("{\"ok\":0,\"error\":\"ERR_INVALID_VALUE\"}");
    return;
  }

  // Attach servo if not already attached
  int servoIndex = getServoIndex(pin);
  if (!servoAttached[servoIndex]) {
    servos[servoIndex].attach(pin);
    servoAttached[servoIndex] = true;
  }

  // Set servo position
  servos[servoIndex].write(angle);

  // Build and send JSON response
  Serial.print("{\"ok\":1,\"pin\":\"");
  Serial.print(pinStr);
  Serial.print("\",\"angle\":");
  Serial.print(angle);
  Serial.println("}");
}

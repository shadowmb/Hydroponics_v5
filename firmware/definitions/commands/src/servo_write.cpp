
#include <Servo.h>

// Note: Globals must be declared in the JSON 'globals' section, but for C++ compilation of this file alone, 
// we might need them here or assume they are injected. 
// However, since this file is included into the main sketch, we should rely on the JSON globals.
// BUT, the functions below use these globals. So they must be visible.
// The FirmwareBuilder puts globals BEFORE functions, so it's fine.
// But for this file to be valid C++ (if compiled separately), it needs declarations.
// We will assume this file is included in a context where these are available, or we declare them as extern?
// Actually, for simplicity in the Builder model, we can put the globals in the JSON and use them here.
// But wait, 'servos' array needs to be defined.
// Let's put the globals in the JSON as intended.

// Forward declaration for syntax checking (optional, but good practice)
extern Servo servos[6];
extern bool servoAttached[6];
extern int servoPins[6];

int getServoIndex(int pin) {
  for (int i = 0; i < 6; i++) {
    if (servoPins[i] == pin) return i;
  }
  return -1;
}

String handleServoWrite(const char* params) {
  // Parse params: "D9|90" -> pin=D9, angle=90
  if (!params || strlen(params) < 4) {
    return "{\"ok\":0,\"error\":\"ERR_MISSING_PARAMETER\"}";
  }

  // Find delimiter
  char paramsCopy[16];
  strncpy(paramsCopy, params, sizeof(paramsCopy) - 1);
  paramsCopy[sizeof(paramsCopy) - 1] = '\0';
  
  char* delimiter = strchr(paramsCopy, '|');
  if (!delimiter) {
    return "{\"ok\":0,\"error\":\"ERR_INVALID_FORMAT\"}";
  }

  *delimiter = '\0';
  const char* pinStr = paramsCopy;
  const char* angleStr = delimiter + 1;

  // Parse pin
  int pin = parsePin(String(pinStr));
  if (pin == -1 || getServoIndex(pin) == -1) {
    return "{\"ok\":0,\"error\":\"ERR_INVALID_PIN\"}";
  }

  // Parse angle (0-180)
  int angle = atoi(angleStr);
  if (angle < 0 || angle > 180) {
    return "{\"ok\":0,\"error\":\"ERR_INVALID_VALUE\"}";
  }

  // Attach servo if not already attached
  int servoIndex = getServoIndex(pin);
  if (!servoAttached[servoIndex]) {
    servos[servoIndex].attach(pin);
    servoAttached[servoIndex] = true;
  }

  // Set servo position
  servos[servoIndex].write(angle);

  // Build and return JSON response
  String response = "{\"ok\":1,\"pin\":\"";
  response += pinStr;
  response += "\",\"angle\":";
  response += angle;
  response += "}";
  
  return response;
}

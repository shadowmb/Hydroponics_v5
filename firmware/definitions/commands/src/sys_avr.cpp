// === SYSTEM COMMANDS (AVR IMPLEMENTATION) ===
// For Arduino Uno R3, Mega, Nano, etc.

// === MEMORY ===
int freeMemory() {
  extern int __heap_start, *__brkval;
  int v;
  return (int) &v - (__brkval == 0 ? (int) &__heap_start : (int) __brkval);
}

// === RESET ===
void resetDevice() {
  void(* resetFunc) (void) = 0;
  resetFunc();
}

// ============================================================================
// WiFi Feature: OTA Update (Over-The-Air Firmware Upload)
// ============================================================================
// ABOUTME: Enables wireless firmware updates via Arduino IDE
// ABOUTME: Minimal implementation - just ArduinoOTA library basics

// FEATURE_INCLUDES
#include <ArduinoOTA.h>

// FEATURE_GLOBALS
// (No globals needed)

// FEATURE_SETUP
ArduinoOTA.setHostname(DEVICE_NAME);
ArduinoOTA.begin();
Serial.println(F("[OTA] Ready"));

// FEATURE_LOOP
ArduinoOTA.handle();

// FEATURE_FUNCTIONS
// (No functions needed)

// FEATURE_COMMAND_HANDLER
// (No commands needed)

// FEATURE_COMMAND_FUNCTION
// (No command functions needed)

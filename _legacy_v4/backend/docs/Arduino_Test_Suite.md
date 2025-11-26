# Arduino Semantic Relay Commands - Comprehensive Test Suite

*Version: 1.0*  
*Date: 2025-08-19*  
*For: Hydroponics v4 Foundation Controller*

---

## Overview

This test suite validates the Arduino sketch implementation with enhanced semantic relay commands. It covers all new semantic commands, backward compatibility, input validation, state logic verification, and performance considerations.

**Target Sketch:** `hydroponics_foundation.ino`  
**Test Method:** Serial Monitor commands with expected JSON responses  
**Required Hardware:** Arduino Uno with digital pins 2-13 available for testing

---

## Test Categories

### 🎯 1. SEMANTIC COMMAND TESTING

#### 1.1 ACTIVATE_RELAY Command Testing

**Test Case 1.1.1: Active High Logic - Activate**
```json
Command: {"cmd":"ACTIVATE_RELAY","port":7,"deviceId":"test-pump-01","relayLogic":"active_high"}

Expected Response:
{
  "status": "ok",
  "message": "Device activated",
  "port": 7,
  "logicalState": "active",
  "hardwareState": "HIGH",
  "deviceId": "test-pump-01",
  "timestamp": [millis_value]
}

Hardware Verification: Pin 7 should read HIGH
```

**Test Case 1.1.2: Active Low Logic - Activate**
```json
Command: {"cmd":"ACTIVATE_RELAY","port":8,"deviceId":"test-valve-02","relayLogic":"active_low"}

Expected Response:
{
  "status": "ok",
  "message": "Device activated",
  "port": 8,
  "logicalState": "active",
  "hardwareState": "LOW",
  "deviceId": "test-valve-02",
  "timestamp": [millis_value]
}

Hardware Verification: Pin 8 should read LOW
```

#### 1.2 DEACTIVATE_RELAY Command Testing

**Test Case 1.2.1: Active High Logic - Deactivate**
```json
Command: {"cmd":"DEACTIVATE_RELAY","port":7,"deviceId":"test-pump-01","relayLogic":"active_high"}

Expected Response:
{
  "status": "ok",
  "message": "Device deactivated",
  "port": 7,
  "logicalState": "inactive",
  "hardwareState": "LOW",
  "deviceId": "test-pump-01",
  "timestamp": [millis_value]
}

Hardware Verification: Pin 7 should read LOW
```

**Test Case 1.2.2: Active Low Logic - Deactivate**
```json
Command: {"cmd":"DEACTIVATE_RELAY","port":8,"deviceId":"test-valve-02","relayLogic":"active_low"}

Expected Response:
{
  "status": "ok",
  "message": "Device deactivated",
  "port": 8,
  "logicalState": "inactive",
  "hardwareState": "HIGH",
  "deviceId": "test-valve-02",
  "timestamp": [millis_value]
}

Hardware Verification: Pin 8 should read HIGH
```

#### 1.3 TOGGLE_RELAY Command Testing

**Test Case 1.3.1: Active High Toggle - From Inactive**
```json
Prerequisites: Ensure pin 9 is inactive (LOW for active_high)
Command: {"cmd":"TOGGLE_RELAY","port":9,"deviceId":"test-motor-03","relayLogic":"active_high"}

Expected Response:
{
  "status": "ok",
  "message": "Device toggled",
  "port": 9,
  "logicalState": "active",
  "hardwareState": "HIGH",
  "deviceId": "test-motor-03",
  "timestamp": [millis_value]
}

Hardware Verification: Pin 9 should read HIGH
```

**Test Case 1.3.2: Active Low Toggle - From Active**
```json
Prerequisites: Ensure pin 10 is active (LOW for active_low)
Command: {"cmd":"TOGGLE_RELAY","port":10,"deviceId":"test-heater-04","relayLogic":"active_low"}

Expected Response:
{
  "status": "ok",
  "message": "Device toggled",
  "port": 10,
  "logicalState": "inactive",
  "hardwareState": "HIGH",
  "deviceId": "test-heater-04",
  "timestamp": [millis_value]
}

Hardware Verification: Pin 10 should read HIGH
```

---

### ⚠️ 2. INPUT VALIDATION TESTING

#### 2.1 Invalid Relay Logic Parameters

**Test Case 2.1.1: Invalid relayLogic Value**
```json
Command: {"cmd":"ACTIVATE_RELAY","port":7,"deviceId":"test-device","relayLogic":"invalid_logic"}

Expected Response:
{
  "status": "error",
  "message": "Invalid relayLogic. Must be 'active_high' or 'active_low'",
  "deviceId": "test-device",
  "timestamp": [millis_value]
}
```

**Test Case 2.1.2: Missing relayLogic Parameter**
```json
Command: {"cmd":"ACTIVATE_RELAY","port":7,"deviceId":"test-device"}

Expected Response:
{
  "status": "error",
  "message": "Invalid relayLogic. Must be 'active_high' or 'active_low'",
  "deviceId": "test-device",
  "timestamp": [millis_value]
}

Note: Missing relayLogic defaults to empty string, should be caught by validation
```

#### 2.2 Missing DeviceId Parameters

**Test Case 2.2.1: Missing deviceId Parameter**
```json
Command: {"cmd":"ACTIVATE_RELAY","port":7,"relayLogic":"active_high"}

Expected Response:
{
  "status": "error",
  "message": "Invalid relayLogic. Must be 'active_high' or 'active_low'",
  "deviceId": "",
  "timestamp": [millis_value]
}

Note: deviceId defaults to empty string when missing
```

#### 2.3 Invalid Port Numbers

**Test Case 2.3.1: Invalid Digital Port - Too Low**
```json
Command: {"cmd":"ACTIVATE_RELAY","port":1,"deviceId":"test-device","relayLogic":"active_high"}

Expected Response:
{
  "status": "error",
  "message": "Invalid digital port: 1",
  "deviceId": "test-device",
  "timestamp": [millis_value]
}
```

**Test Case 2.3.2: Invalid Digital Port - Too High**
```json
Command: {"cmd":"ACTIVATE_RELAY","port":14,"deviceId":"test-device","relayLogic":"active_high"}

Expected Response:
{
  "status": "error",
  "message": "Invalid digital port: 14",
  "deviceId": "test-device",
  "timestamp": [millis_value]
}
```

**Test Case 2.3.3: Analog Port Used with Semantic Command**
```json
Command: {"cmd":"ACTIVATE_RELAY","port":A0,"deviceId":"test-device","relayLogic":"active_high"}

Expected Response:
{
  "status": "error",
  "message": "Invalid digital port: 14",
  "deviceId": "test-device",
  "timestamp": [millis_value]
}

Note: A0 likely gets parsed as invalid number or 14
```

#### 2.4 Malformed JSON with Semantic Commands

**Test Case 2.4.1: Invalid JSON Syntax**
```json
Command: {"cmd":"ACTIVATE_RELAY","port":7,"deviceId":"test-device","relayLogic":"active_high"

Expected Response:
{
  "status": "error",
  "message": "Invalid JSON format",
  "timestamp": [millis_value]
}
```

**Test Case 2.4.2: Missing Required Parameters**
```json
Command: {"cmd":"ACTIVATE_RELAY"}

Expected Response:
{
  "status": "error",
  "message": "Invalid digital port: 0",
  "deviceId": "",
  "timestamp": [millis_value]
}

Note: Missing port defaults to 0, which is invalid
```

---

### 🔧 3. STATE LOGIC VERIFICATION

#### 3.1 Active High Logic Verification

**Test Case 3.1.1: Complete State Cycle - Active High**
```json
Step 1 - Initial Deactivate:
Command: {"cmd":"DEACTIVATE_RELAY","port":5,"deviceId":"state-test","relayLogic":"active_high"}
Expected: logicalState="inactive", hardwareState="LOW"
Verify: digitalRead(5) == LOW

Step 2 - Activate:
Command: {"cmd":"ACTIVATE_RELAY","port":5,"deviceId":"state-test","relayLogic":"active_high"}
Expected: logicalState="active", hardwareState="HIGH"
Verify: digitalRead(5) == HIGH

Step 3 - Toggle (should deactivate):
Command: {"cmd":"TOGGLE_RELAY","port":5,"deviceId":"state-test","relayLogic":"active_high"}
Expected: logicalState="inactive", hardwareState="LOW"
Verify: digitalRead(5) == LOW

Step 4 - Toggle again (should activate):
Command: {"cmd":"TOGGLE_RELAY","port":5,"deviceId":"state-test","relayLogic":"active_high"}
Expected: logicalState="active", hardwareState="HIGH"
Verify: digitalRead(5) == HIGH
```

#### 3.2 Active Low Logic Verification

**Test Case 3.2.1: Complete State Cycle - Active Low**
```json
Step 1 - Initial Deactivate:
Command: {"cmd":"DEACTIVATE_RELAY","port":6,"deviceId":"state-test","relayLogic":"active_low"}
Expected: logicalState="inactive", hardwareState="HIGH"
Verify: digitalRead(6) == HIGH

Step 2 - Activate:
Command: {"cmd":"ACTIVATE_RELAY","port":6,"deviceId":"state-test","relayLogic":"active_low"}
Expected: logicalState="active", hardwareState="LOW"
Verify: digitalRead(6) == LOW

Step 3 - Toggle (should deactivate):
Command: {"cmd":"TOGGLE_RELAY","port":6,"deviceId":"state-test","relayLogic":"active_low"}
Expected: logicalState="inactive", hardwareState="HIGH"
Verify: digitalRead(6) == HIGH

Step 4 - Toggle again (should activate):
Command: {"cmd":"TOGGLE_RELAY","port":6,"deviceId":"state-test","relayLogic":"active_low"}
Expected: logicalState="active", hardwareState="LOW"
Verify: digitalRead(6) == LOW
```

#### 3.3 Current State Detection Accuracy

**Test Case 3.3.1: Toggle State Detection - Active High**
```json
Prerequisites: Manually set pin 11 to HIGH using legacy command
Command: {"cmd":"DIGITAL_ON","port":11}

Then test toggle detection:
Command: {"cmd":"TOGGLE_RELAY","port":11,"deviceId":"detection-test","relayLogic":"active_high"}

Expected Response:
- Current hardware state detected as HIGH
- Logical state interpreted as "active" (for active_high)
- New state should be "inactive" (LOW)
```

**Test Case 3.3.2: Toggle State Detection - Active Low**
```json
Prerequisites: Manually set pin 12 to HIGH using legacy command
Command: {"cmd":"DIGITAL_ON","port":12}

Then test toggle detection:
Command: {"cmd":"TOGGLE_RELAY","port":12,"deviceId":"detection-test","relayLogic":"active_low"}

Expected Response:
- Current hardware state detected as HIGH
- Logical state interpreted as "inactive" (for active_low)
- New state should be "active" (LOW)
```

---

### 🔄 4. BACKWARD COMPATIBILITY TESTING

#### 4.1 Legacy Digital Commands

**Test Case 4.1.1: DIGITAL_ON Command**
```json
Command: {"cmd":"DIGITAL_ON","port":4}

Expected Response:
{
  "status": "ok",
  "message": "Port activated",
  "port": 4,
  "state": "true",
  "timestamp": [millis_value]
}

Hardware Verification: Pin 4 should read LOW (inverted logic maintained)
```

**Test Case 4.1.2: DIGITAL_OFF Command**
```json
Command: {"cmd":"DIGITAL_OFF","port":4}

Expected Response:
{
  "status": "ok",
  "message": "Port deactivated",
  "port": 4,
  "state": "false",
  "timestamp": [millis_value]
}

Hardware Verification: Pin 4 should read HIGH
```

**Test Case 4.1.3: DIGITAL_TOGGLE Command**
```json
Command: {"cmd":"DIGITAL_TOGGLE","port":4}

Expected Response:
{
  "status": "ok",
  "message": "Port toggled",
  "port": 4,
  "previous_state": "[HIGH|LOW]",
  "current_state": "[HIGH|LOW]",
  "test_result": "responding",
  "timestamp": [millis_value]
}
```

#### 4.2 System Commands Unchanged

**Test Case 4.2.1: PING Command**
```json
Command: {"cmd":"PING"}

Expected Response:
{
  "status": "ok",
  "message": "PONG",
  "uptime": [millis_value],
  "freeMemory": [memory_bytes],
  "version": "1.0",
  "timestamp": [millis_value]
}
```

**Test Case 4.2.2: STATUS Command**
```json
Command: {"cmd":"STATUS"}

Expected Response:
{
  "status": "ok",
  "message": "Port status report",
  "uptime": [millis_value],
  "freeMemory": [memory_bytes],
  "timestamp": [millis_value]
}
```

#### 4.3 Analog Commands Unchanged

**Test Case 4.3.1: ANALOG_READ Command**
```json
Command: {"cmd":"ANALOG_READ","port":"A0"}

Expected Response:
{
  "status": "ok",
  "message": "Analog value read",
  "port": "A0",
  "value": [0-1023],
  "test_result": "responding",
  "timestamp": [millis_value]
}
```

#### 4.4 Response Format Consistency

**Test Case 4.4.1: Error Response Format**
```json
Legacy Error Command: {"cmd":"DIGITAL_ON","port":1}
Expected Legacy Error:
{
  "status": "error",
  "message": "Invalid digital port: 1",
  "timestamp": [millis_value]
}

Semantic Error Command: {"cmd":"ACTIVATE_RELAY","port":1,"deviceId":"test","relayLogic":"active_high"}
Expected Semantic Error:
{
  "status": "error",
  "message": "Invalid digital port: 1",
  "deviceId": "test",
  "timestamp": [millis_value]
}

Verification: Both maintain consistent status/message/timestamp structure
```

---

### 🧠 5. MEMORY AND PERFORMANCE TESTING

#### 5.1 JSON Parsing with Enhanced Parameters

**Test Case 5.1.1: Large DeviceId Parameter**
```json
Command: {"cmd":"ACTIVATE_RELAY","port":7,"deviceId":"very-long-device-identifier-with-many-characters-12345","relayLogic":"active_high"}

Expected Response:
- Should process successfully without memory overflow
- deviceId should be returned correctly in response
- Check freeMemory before and after with PING command
```

**Test Case 5.1.2: Multiple Rapid Commands**
```json
Send 5 rapid commands in sequence:
{"cmd":"ACTIVATE_RELAY","port":7,"deviceId":"rapid-test-1","relayLogic":"active_high"}
{"cmd":"DEACTIVATE_RELAY","port":7,"deviceId":"rapid-test-2","relayLogic":"active_high"}
{"cmd":"TOGGLE_RELAY","port":8,"deviceId":"rapid-test-3","relayLogic":"active_low"}
{"cmd":"ACTIVATE_RELAY","port":9,"deviceId":"rapid-test-4","relayLogic":"active_low"}
{"cmd":"STATUS"}

Expected Response:
- All commands should be processed successfully
- No memory corruption or crashes
- STATUS command should return valid memory reading
```

#### 5.2 Response Building Efficiency

**Test Case 5.2.1: Response Time Consistency**
```json
Measure response times for:
1. PING (simple response)
2. DIGITAL_ON (legacy response)
3. ACTIVATE_RELAY (enhanced response)

Method:
- Send PING, note timestamp in response
- Send command immediately after
- Note timestamp in command response
- Calculate difference

Expected: Response time difference should be minimal (<50ms typical)
```

#### 5.3 Buffer Overflow Protection

**Test Case 5.3.1: Maximum Length Parameters**
```json
Command: {"cmd":"ACTIVATE_RELAY","port":7,"deviceId":"[250-character-string]","relayLogic":"active_high"}

Where [250-character-string] is: "aaaaaaaa..." (250 'a' characters)

Expected Response:
- Either successful processing if within buffer limits
- Or graceful error handling if exceeds buffer
- No system crash or undefined behavior
```

**Test Case 5.3.2: Invalid JSON Beyond Buffer**
```json
Command: {"cmd":"ACTIVATE_RELAY","port":7,"deviceId":"test","relayLogic":"active_high","extra_param":"[very-long-string-500-chars]"}

Expected Response:
{
  "status": "error",
  "message": "Invalid JSON format",
  "timestamp": [millis_value]
}

Verification: System should handle gracefully without crash
```

---

## 🧪 Integration Test Scenarios

### Scenario 1: Mixed Legacy and Semantic Commands

```json
Step 1: {"cmd":"DIGITAL_ON","port":5}
Step 2: {"cmd":"ACTIVATE_RELAY","port":6,"deviceId":"pump-01","relayLogic":"active_low"}
Step 3: {"cmd":"STATUS"}
Step 4: {"cmd":"TOGGLE_RELAY","port":5,"deviceId":"valve-01","relayLogic":"active_high"}
Step 5: {"cmd":"DIGITAL_TOGGLE","port":6}
Step 6: {"cmd":"PING"}

Expected: All commands work correctly, no interference between legacy and semantic modes
```

### Scenario 2: Complete Device Lifecycle Test

```json
Device Setup: {"cmd":"ACTIVATE_RELAY","port":7,"deviceId":"test-pump","relayLogic":"active_low"}
Device Check: {"cmd":"STATUS"}
Device Toggle: {"cmd":"TOGGLE_RELAY","port":7,"deviceId":"test-pump","relayLogic":"active_low"}
Device Reset: {"cmd":"DEACTIVATE_RELAY","port":7,"deviceId":"test-pump","relayLogic":"active_low"}
Final Check: {"cmd":"STATUS"}

Expected: Complete lifecycle with consistent logical state management
```

---

## 📋 Test Execution Checklist

### Pre-Test Setup
- [ ] Arduino Uno connected via USB
- [ ] Serial Monitor open at 9600 baud
- [ ] All digital pins 2-13 available (no external connections)
- [ ] Fresh Arduino restart (check for restart message)
- [ ] Note initial free memory from PING response

### Test Execution Order
1. [ ] **System Commands** (PING, STATUS)
2. [ ] **Basic Semantic Commands** (ACTIVATE/DEACTIVATE)
3. [ ] **Toggle Commands** (both logic types)
4. [ ] **Input Validation Tests** (invalid parameters)
5. [ ] **State Logic Verification** (complete cycles)
6. [ ] **Backward Compatibility** (all legacy commands)
7. [ ] **Performance Tests** (memory, timing)
8. [ ] **Integration Scenarios** (mixed command flows)

### Post-Test Validation
- [ ] All expected responses received
- [ ] No system crashes or hangs
- [ ] Hardware states match expected values
- [ ] Memory usage stable (compare initial vs final)
- [ ] Error handling graceful for invalid inputs

### Documentation Requirements
- [ ] Record any unexpected responses
- [ ] Note any performance issues
- [ ] Document hardware state verification results
- [ ] Report any memory concerns
- [ ] Validate all backward compatibility items

---

## ⚠️ Known Limitations & Notes

### Arduino Memory Constraints
- StaticJsonDocument<300> buffer may limit very long parameters
- Monitor free memory during extensive testing
- System designed for typical device identifier lengths

### Hardware Verification Method
- Use multimeter to verify actual pin states
- LED indicators on pins can provide visual confirmation
- Relay clicking sounds indicate successful switching

### Error Response Variations
- Some error messages may vary based on parsing order
- deviceId field only present in semantic command errors
- Legacy errors maintain original format for compatibility

---

*This test suite provides comprehensive validation for the Arduino semantic relay command implementation. Execute tests in order and document any deviations from expected responses.*
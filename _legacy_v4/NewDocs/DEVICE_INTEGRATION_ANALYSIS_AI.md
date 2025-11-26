# Device Integration System - Complete Integration Guide

*Generated: 2025-01-27 | Complete Integration Reference | Universal Device Integration*

## Quick Integration Checklist
**EXISTING physicalType (e.g., new pH sensor, new EC sensor):**
1. Create `/backend/src/data/deviceTemplates/[device_id].ts`
2. Add device mapping to converter (if needed)
3. Add to `CalibrationDialog.vue` componentMap (3 locations)
4. **Verify raw value extraction** in test endpoint (if new Arduino command - see Step 7)

**NEW physicalType (e.g., distance, light, pressure):**
1. Create `/backend/src/services/conversion/[Type]Converter.ts`
2. Update `ConverterFactory.ts` + `index.ts`
3. Create `/backend/src/data/deviceTemplates/[device_id].ts`
4. Add to `CalibrationDialog.vue` componentMap (3 locations)
5. Add to `BaseSensorCalibration.vue` (5 locations - see Step 6)
6. **Verify/update raw value extraction** in test endpoint (if new Arduino command - see Step 7)
7. Verify Arduino command exists

## Step-by-Step Integration Process

### Step 1: Arduino Command Layer
**Templates**: `/Arduino/templates/commands/serial/` + `/Arduino/templates/commands/wifi/`
**Available**: ANALOG, ANALOG_ALL, PULSE_MEASURE, SET_PIN, READ, BATCH, SET_ALL, SINGLE_WIRE_PULSE, SINGLE_WIRE_ONEWIRE, PULSE_COUNT, MODBUS_RTU_READ, UART_STREAM_READ

**Action**: Check if command exists
- **Flow**: PULSE_COUNT
- **Analog**: ANALOG
- **Digital**: READ
- **Temperature/Humidity**: SINGLE_WIRE_PULSE, SINGLE_WIRE_ONEWIRE
- **Distance**: PULSE_MEASURE
- **Modbus/RS485**: MODBUS_RTU_READ
- **UART Stream**: UART_STREAM_READ
- **If missing**: See `HOW_TO_ADD_NEW_ARDUINO_COMMAND.md`

### Step 2: Backend Command Processing
**File**: `/backend/src/services/DeviceCommandService.ts`
**Command Handlers**: executePulseCountCommand(), executeAnalogReadCommand(), executeDigitalReadCommand(), etc.

**Action**: Verify command handler exists for your Arduino command
- Check if handler function exists for your command type
- If not, create new handler following existing pattern
- All handlers return standardized {reading, unit, success} format

### Step 3: Conversion System
**Directory**: `/backend/src/services/conversion/`
**Existing Converters**: FlowConverter.ts, TemperatureConverter.ts, PHConverter.ts, ECConverter.ts, etc.

**For existing physicalType**: Add device mapping to existing converter
```typescript
// In appropriate converter (e.g., FlowConverter.ts)
const DEVICE_MAPPINGS = {
  'EXISTING_DEVICE': value,
  'NEW_DEVICE': new_value,  // Add this line
}
```

**For new physicalType**: Create new converter file following pattern:
```typescript
export class NewTypeConverter extends BaseConverter {
  private static readonly DEVICE_MAPPINGS = {
    'DEVICE_MODEL': calibration_value
  }
  // Implement conversion logic
}
```

### Step 4: Device Template System
**Create**: `/backend/src/data/deviceTemplates/[device_id].ts`

**Action**: Create new template file

**Important Notes**:
- **defaultUnits**: Array of measurement units for this device. First unit is auto-selected when device is chosen. Example: `['°C', '%RH']` for DHT22
- **category**: Used for UI grouping. Use Bulgarian names matching existing categories
- **icon/color/formFields**: Currently UNUSED - comment them out with `// UNUSED` prefix
- **calibrationConfig**: Not yet implemented - comment out entire block with `// UNUSED` prefix

**Template Structure**:
```typescript
{
  type: 'DEVICE_MODEL',                    // Unique identifier (e.g., 'SEN0550')
  physicalType: 'MEASUREMENT_TYPE',        // Converter routing (e.g., 'flow', 'temperature')
  displayName: 'Human Readable Name',
  description: 'Device description',
  manufacturer: 'Manufacturer Name',
  model: 'Model Number',
  requiredCommand: 'ARDUINO_COMMAND',      // Arduino command identifier
  defaultUnits: ['unit1', 'unit2'],        // Array of measurement units (first is auto-selected)

  portRequirements: [
    {
      role: 'signal',                      // Pin role ('signal', 'trigger', 'echo', etc.)
      type: 'digital',                     // Pin type ('digital', 'analog', 'pwm')
      required: true,
      defaultPin: 'D2',                    // Default pin assignment
      description: 'Pin description'
    }
  ],

  executionConfig: {
    strategy: 'arduino_native',            // Execution strategy
    commandType: 'ARDUINO_COMMAND',        // Arduino command to use
    parameters: {                          // Command parameters
      measurementTime: 5000,
      pullupEnabled: true,
      timeout: 10000
    },
    responseMapping: {
      valueKey: 'outputKey',
      unit: 'measurement_unit',
      conversion: 'converter_method'
    },
    timeout: 12000
  },

  uiConfig: {
    // icon: 'icon_name',                  // UNUSED: Optional, not used in frontend
    // color: '#HEX_COLOR',                // UNUSED: Optional, not used in frontend
    category: 'UI Category Name',          // REQUIRED: Display category (e.g., 'РН Сензори')
    // formFields: {...}                   // UNUSED: Optional, not used in frontend
  },

  // UNUSED: Calibration feature not yet implemented in frontend
  // calibrationConfig: {                  // Optional - usually commented out
  //   type: 'sensor',
  //   calibrationMethod: 'multi_point',
  //   isRequired: false,
  //   testActions: ['quick_read', 'continuous_monitor'],
  //   parametersToCalibrate: [...],
  //   validation: {...},
  //   ui: {...}
  // },

  isActive: true,
  version: '1.0.0'
}
```

### Step 5: Frontend Calibration Integration
**File**: `/frontend/src/components/CalibrationDialog.vue`

**Required Changes (3 locations)**:

**1. Add to componentMap (~line 124)**:
```typescript
const componentMap = {
  // Existing mappings...
  'NEW_DEVICE_TYPE': () => import('./calibration/BaseSensorCalibration.vue'),
  // For actuators use: () => import('./calibration/RelayControls.vue')
}
```

**2. Add to getDeviceTypeLabel (~line 165)**:
```typescript
const typeLabels: Record<string, string> = {
  // Existing labels...
  'NEW_DEVICE_TYPE': 'Human Readable Device Name',
}
```

**3. Add physicalType to getPhysicalTypeLabel (~line 189)** (if new physicalType):
```typescript
const typeLabels: Record<string, string> = {
  // Existing labels...
  'new_physical_type': 'Български Лейбъл',  // e.g., 'distance': 'Сензор за Разстояние'
}
```

**Component Types**:
- **Sensors**: Use `BaseSensorCalibration.vue`
- **Actuators**: Use `RelayControls.vue`

### Step 6: BaseSensorCalibration Configuration (if new physicalType)
**File**: `/frontend/src/components/calibration/BaseSensorCalibration.vue`

**IMPORTANT**: If adding a NEW physicalType (not just a new device of existing type), you MUST update BaseSensorCalibration.vue:

**Required Changes (3 locations)**:

**1. Add to sensorType mapping (~line 315-343)**:
```typescript
const sensorType = computed(() => {
  // ...
  switch (type) {
    // Existing mappings...
    case 'NEW_DEVICE_TYPE':
    case 'new_physical_type':
      return 'new_physical_type'
    // ...
  }
})
```

**2. Add sensor configuration (~line 367-441)**:
```typescript
const sensorConfigs = {
  // Existing configs...
  new_physical_type: {
    physicsFormula: null,              // Physics formula display (or null)
    unit: 'unit_symbol',               // Display unit (from template defaultUnits[0])
    rawUnit: 'raw_unit',               // Raw sensor unit (e.g., 'ADC', 'mm', 'µs')
    readingClass: 'text-color',        // CSS class for reading display
    supportsManualInput: false,        // Allow manual ADC entry
    step: '0.1',                       // Input step for calibration values
    rules: [                           // Validation rules for target values
      (val: any) => (val !== null && val >= min && val <= max) || 'Validation message'
    ]
  }
}
```

**3. Update isDigitalSensor (if digital sensor) (~line 446-449)**:
```typescript
const isDigitalSensor = computed(() => {
  const digitalSensorTypes = ['ultrasonic', 'distance', 'temperature_humidity', 'NEW_TYPE']
  return digitalSensorTypes.includes(sensorType.value)
})
```
Digital sensors measure time/pulses/digital signals (not analog voltage), so they don't need voltage selection.

**4. Update formatRawValue (if special raw value handling) (~line 558-586)**:
```typescript
const formatRawValue = () => {
  // ...
  else if (sensorType.value === 'new_physical_type') {
    raw = testReading.value.specificProperty || raw
  }
  // ...
}
```

**5. Update formatPointLabel (if special unit display) (~line 598-621)**:
```typescript
else if (sensorType.value === 'new_physical_type') {
  targetUnit = 'display_unit'
  rawUnit = 'raw_unit'
}
```

**Example: Distance Sensor (SEN0311)**
```typescript
// Step 1: sensorType mapping
case 'SEN0311':
case 'distance':
  return 'distance'

// Step 2: sensor configuration
distance: {
  physicsFormula: null,
  unit: 'cm',                // From template defaultUnits: ['cm']
  rawUnit: 'mm',             // UART returns millimeters
  readingClass: 'text-purple',
  supportsManualInput: false,
  step: '0.1',
  rules: [(val: any) => (val !== null && val >= 0 && val <= 500) || 'Разстоянието трябва да е между 0-500 cm']
}

// Step 3: Digital sensor (measures time, not voltage)
const digitalSensorTypes = ['ultrasonic', 'distance', 'temperature_humidity']

// Step 4: Raw value handling
else if (sensorType.value === 'distance') {
  raw = testReading.value.rawValue || raw  // Use rawValue (mm)
}

// Step 5: Calibration point labels
else if (sensorType.value === 'distance') {
  targetUnit = 'cm'
  rawUnit = 'mm'
}
```

**When to Skip This Step**:
- If adding a new device that uses an EXISTING physicalType (e.g., new pH sensor, new EC sensor)
- BaseSensorCalibration.vue already has configuration for the existing physicalType
- Only CalibrationDialog.vue needs updates (Step 5)

### Step 7: Backend Test Endpoint Raw Value Extraction (if new Arduino command)
**File**: `/backend/src/routes/deviceRoutes.ts`

**IMPORTANT**: If adding a NEW Arduino command type that returns data in a different format, you MUST update the test endpoint raw value extraction logic.

**Location**: `POST /:id/test` endpoint (~line 972-1001)

**Current Support**:
The test endpoint already supports these raw value types:
- `duration` (µs) - Ultrasonic (PULSE_MEASURE), pH, EC sensors
- `pulseCount` - Flow sensors (PULSE_COUNT)
- `rawValue` from converter - Distance (UART_STREAM_READ), Light (MODBUS_RTU_READ)
- `adc` - Soil moisture (ANALOG_READ), other ADC sensors
- `volt` - Voltage-based sensors
- `data` (number) - DHT22 (SINGLE_WIRE_PULSE), DS18B20 (SINGLE_WIRE_ONEWIRE)

**When to Update**:
Only if adding a new Arduino command that returns data in a field NOT listed above.

**Example Update**:
```typescript
// Extract raw value based on sensor type (from Arduino response)
let rawValue = convertedValue // fallback
if (readResponse.data?.rawResponse) {
  const arduinoResponse = readResponse.data.rawResponse

  // Add new condition for your command
  if (arduinoResponse.YOUR_NEW_FIELD !== undefined) {
    rawValue = arduinoResponse.YOUR_NEW_FIELD
  }
  // ... existing conditions ...
}
```

**Critical Rules**:
1. Raw value MUST be the actual sensor reading (µs, ADC, pulses, mm, etc.), NOT the converted value
2. Raw value is used for calibration - calibration points store raw → target mapping
3. Test the raw value extraction before implementing calibration for new sensor type
4. Fallback to `convertedValue` is only for safety - should not happen in production

**Verification**:
1. Test the device → Check browser console for raw value
2. Raw value should match Arduino response field (e.g., 8306 µs, not 142.07 cm)
3. Add calibration point → Verify it stores raw value in `measuredValue` field

## Validation and Testing

### Integration Testing
**Create Test Script**: Create temporary test file to validate integration
```javascript
// Test template structure, converter mappings, and calculations
// Run with: node test_device_integration.js
// Remove file after testing
```

### Frontend Testing
**Actions**:
1. Start frontend server: `npm run dev` in `/frontend`
2. Navigate to device creation page
3. Verify new device appears in type dropdown
4. Test device creation with port assignment
5. Test calibration dialog opens correctly

### Backend Validation
**Actions**:
1. Run TypeScript check: `npm run types:check` in `/backend`
2. Run lint check: `npm run lint` in `/backend`
3. Verify no compilation errors

## Troubleshooting Common Issues

### "Неподдържан тип устройство" in Calibration
**Problem**: Device type missing from CalibrationDialog componentMap
**Solution**: Add device type to componentMap in CalibrationDialog.vue

### Converter Not Found
**Problem**: PhysicalType not recognized by conversion system
**Solution**: Check physicalType spelling, ensure converter exists

### Arduino Command Not Working
**Problem**: Command not implemented in Arduino firmware
**Solution**: Verify command exists in Arduino command list, implement if needed

### Template Not Loading in Frontend
**Problem**: Device template not seeded to database
**Solution**: Restart backend to trigger template seeding

## System Architecture Notes
- **Modular Design**: Each layer independent, can be modified separately
- **Template-Driven**: Frontend automatically adapts to new device templates
- **Type-Safe**: TypeScript ensures proper integration
- **Extensible**: Adding devices requires minimal code changes
- **Calibration Support**: Full multi-point calibration system available
- **Real-time Ready**: WebSocket support for live data streaming

## Integration Success Criteria
✅ **Arduino Command**: Appropriate command available and tested
✅ **Backend Handler**: Command handler exists and returns correct format
✅ **Converter**: Device mapping added to appropriate converter
✅ **Template**: Complete device template with all required fields
✅ **Frontend**: Device appears in UI and calibration works
✅ **Testing**: TypeScript compilation successful, no runtime errors

**Result**: New device fully integrated and ready for hardware testing
# FlowEditor Centralized Port Positioning System

## Overview

The FlowEditor centralized port positioning system provides a single source of truth for all port positioning logic across the flow editor. This system ensures consistency between visual rendering, coordinate calculations, and connection logic by centralizing configuration in `PortPositionMap.ts` and providing unified access through `PortPositionManager.ts`.

## Core System Architecture

### 1. Single Source of Truth: PortPositionMap

The `PortPositionMap.ts` file serves as the centralized configuration for all port positioning:

```typescript
// Key format: `${portType}.${direction}` or `${portType}.${direction}.${portId}`
export const PORT_POSITION_MAP: Record<string, PortPositionConfig> = {
  'flow.input': {
    positionType: 'left-center',
    cssClass: 'corner-left-center',
    labelClass: 'label-left-center',
    coordinates: Coordinates.leftCenter,
    description: 'Flow input trigger ports - left center of block',
    priority: 10
  },
  // ... more configurations
};
```

### 2. Configuration Structure

Each port configuration contains:

- **`positionType`**: Human-readable position identifier (e.g., 'left-center', 'bottom-right')
- **`cssClass`**: CSS class for visual styling
- **`labelClass`**: CSS class for port labels
- **`coordinates`**: Coordinate calculation configuration
- **`description`**: Human-readable description
- **`priority`**: For conflict resolution (higher = more priority)

### 3. Coordinate System

Coordinates use flexible offset calculations:

```typescript
const Coordinates = {
  topLeft: { offsetX: -OFFSET, offsetY: -OFFSET },
  topRight: { offsetX: 'width+offset', offsetY: -OFFSET },
  centerTop: { offsetX: 'center', offsetY: -OFFSET },
  leftCenter: { offsetX: -OFFSET, offsetY: 'center' },
  // ... more positions
};
```

**Offset Types:**
- **Numbers**: Direct pixel offset from block origin
- **`'center'`**: Block dimension divided by 2
- **`'width'`/`'height'`**: Full block dimension
- **`'width+offset'`/`'height+offset'`**: Dimension plus port offset

### 4. Available Port Keys

The system supports these port type combinations:

| Port Type | Direction | Map Key | CSS Class | Description |
|-----------|-----------|---------|-----------|-------------|
| flow | input | `flow.input` | `corner-left-center` | Flow trigger inputs |
| flow | output | `flow.output` | `corner-right-center` | Flow execution outputs |
| data | input | `data.input` | `corner-bottom-left` | Data input values |
| data | output | `data.output` | `corner-bottom-right` | Data output values |
| sensor | input | `sensor.input` | `corner-bottom-left` | Sensor configuration inputs |
| sensor | output | `sensor.output` | `corner-bottom-right` | Sensor measurement outputs |
| logic | input | `logic.input` | `corner-top-left` | Logic condition inputs |
| logic | output | `logic.output` | `corner-top-right` | Logic result outputs |
| actuator | input | `actuator.input` | `corner-left-center` | Actuator control inputs |
| actuator | output | `actuator.output` | `corner-right-center` | Actuator status outputs |
| error | output | `error.output` | `corner-bottom-right` | Error condition outputs |
| setVar | input | `setVar.input` | `corner-bottom-left` | Variable assignment inputs |
| notification | output | `notification.output` | `corner-top-right` | Notification outputs |

### 5. Priority System

The system resolves port positions using priority:

1. **Port ID Override** (priority 12-15): Specific port IDs like 'trigger', 'result'
2. **Port Type Configuration** (priority 4-10): Type-direction combinations
3. **Fallback Configuration** (priority 1): Default input/output positions

## PortPositionManager API

### Core Methods

#### `getPositionConfig(portType, direction, portId?)`
```typescript
const config = PortPositionManager.getPositionConfig('flow', 'input', 'trigger');
// Returns: PortPositionConfig with all positioning data
```

#### `calculateCanvasCoordinates(blockPosition, portType, direction, portId?)`
```typescript
const position = PortPositionManager.calculateCanvasCoordinates(
  { x: 100, y: 200 }, // block position
  'flow',            // port type
  'input',           // direction
  'trigger'          // optional port ID
);
// Returns: { x: 90, y: 230 } - absolute canvas coordinates
```

#### `getCSSClass(portType, direction, portId?)`
```typescript
const cssClass = PortPositionManager.getCSSClass('data', 'output');
// Returns: 'corner-bottom-right'
```

#### `getPositionType(portType, direction, portId?)`
```typescript
const positionType = PortPositionManager.getPositionType('logic', 'input');
// Returns: 'top-left'
```

### Validation Methods

#### `validatePositionAlignment(blockPosition, portType, direction, portId?, expectedPosition?, tolerance?)`
```typescript
const validation = PortPositionManager.validatePositionAlignment(
  { x: 100, y: 200 },  // block position
  'flow',              // port type
  'input',             // direction
  'trigger',           // port ID
  { x: 90, y: 230 },   // expected position
  2                    // tolerance in pixels
);
// Returns: PositionValidationResult with alignment details
```

#### `validateMultiplePositions(blockPosition, portConfigs, tolerance?)`
```typescript
const results = PortPositionManager.validateMultiplePositions(
  { x: 100, y: 200 },
  [
    { portType: 'flow', direction: 'input', portId: 'trigger' },
    { portType: 'data', direction: 'output', portId: 'result' }
  ],
  1 // tolerance
);
// Returns: Array of PositionValidationResult
```

### Debug Methods

#### `debugPosition(blockPosition, portType, direction, portId?)`
```typescript
PortPositionManager.debugPosition({ x: 100, y: 200 }, 'flow', 'input', 'trigger');
// Logs detailed position calculation to console
```

## Configuration Change Examples

### Example 1: Changing flow.input from left-center to top-left

**Current Configuration:**
```typescript
'flow.input': {
  positionType: 'left-center',
  cssClass: 'corner-left-center',
  labelClass: 'label-left-center',
  coordinates: Coordinates.leftCenter, // { offsetX: -OFFSET, offsetY: 'center' }
  description: 'Flow input trigger ports - left center of block',
  priority: 10
}
```

**Step-by-step Change:**

1. **Update positionType:**
   ```typescript
   positionType: 'top-left',  // was 'left-center'
   ```

2. **Update CSS classes:**
   ```typescript
   cssClass: 'corner-top-left',      // was 'corner-left-center'
   labelClass: 'label-top-left',     // was 'label-left-center'
   ```

3. **Update coordinates:**
   ```typescript
   coordinates: Coordinates.topLeft,  // was Coordinates.leftCenter
   // This resolves to: { offsetX: -OFFSET, offsetY: -OFFSET }
   // instead of: { offsetX: -OFFSET, offsetY: 'center' }
   ```

4. **Update description:**
   ```typescript
   description: 'Flow input trigger ports - top left corner',  // was 'left center of block'
   ```

**Result:**
```typescript
'flow.input': {
  positionType: 'top-left',
  cssClass: 'corner-top-left',
  labelClass: 'label-top-left',
  coordinates: Coordinates.topLeft,
  description: 'Flow input trigger ports - top left corner',
  priority: 10
}
```

### Example 2: Adding a new port type configuration

```typescript
// Add to PORT_POSITION_MAP
'custom.input': {
  positionType: 'center-top',
  cssClass: 'corner-center-top',
  labelClass: 'label-center-top',
  coordinates: Coordinates.centerTop,
  description: 'Custom input ports - center top of block',
  priority: 6
}
```

### CSS Class Naming Conventions

The system follows consistent naming patterns:

- **Port CSS Classes**: `corner-{position}` (e.g., `corner-left-center`, `corner-bottom-right`)
- **Label CSS Classes**: `label-{position}` (e.g., `label-left-center`, `label-bottom-right`)
- **Position Names**: `{vertical}-{horizontal}` or `{horizontal}-{vertical}`
  - Examples: `top-left`, `bottom-right`, `left-center`, `center-top`

## Components Using the System

### 1. BlockRenderer.vue

Uses `PortPositionManager` for:
- Getting CSS classes for port styling
- Calculating canvas coordinates for drag operations
- Determining position types for connection logic

```typescript
// In BlockRenderer.vue
function getPortPosition(index: number, portId: string, direction: 'input' | 'output', portType?: string): string {
  const resolvedPortType = portType || 'logic';
  const positionType = PortPositionManager.getPositionType(
    resolvedPortType as PortType, 
    direction as PortDirection, 
    portId
  );
  return positionType;
}
```

### 2. MagneticZoneDebugOverlay.vue

Uses `PortPositionManager` for:
- Visual debugging of port positions
- Validating coordinate calculations
- Testing zoom and pan transformations

```typescript
// In MagneticZoneDebugOverlay.vue
function getMagneticZoneStyle(block: BlockInstance, portId: string, type: 'input' | 'output') {
  const position = PortPositionManager.calculateCanvasCoordinates(
    block.position,
    portType,
    type as PortDirection,
    portId
  );
  
  return {
    position: 'absolute',
    left: `${position.x - zoneSize/2}px`,
    top: `${position.y - zoneSize/2}px`,
    // ... more styling
  };
}
```

## Validation & Debugging

### 1. Using MagneticZoneDebugOverlay for Visual Validation

The debug overlay provides visual feedback for port positioning:

```vue
<MagneticZoneDebugOverlay 
  :blocks="blocks" 
  :enabled="debugMode"
  :zoom="currentZoom"
  :pan-offset="panOffset"
/>
```

**Features:**
- Visual magnetic zones around each port
- Real-time position validation
- Zoom and pan transformation testing
- Console logging of position calculations

### 2. Browser Console Validation Commands

**Test all positions:**
```javascript
// Get all configured positions
const positions = PortPositionManager.getAllConfiguredPositions();
console.table(positions);
```

**Validate position map consistency:**
```javascript
const validation = PortPositionManager.validatePositionMap();
if (!validation.valid) {
  console.error('Position map errors:', validation.errors);
}
```

**Test specific port positioning:**
```javascript
PortPositionManager.debugPosition(
  { x: 100, y: 200 },  // block position
  'flow',              // port type
  'input',             // direction
  'trigger'            // port ID
);
```

**Validate coordinate alignment:**
```javascript
const result = PortPositionManager.validatePositionAlignment(
  { x: 100, y: 200 },  // block position
  'data',              // port type
  'output',            // direction
  'result',            // port ID
  { x: 290, y: 270 },  // expected position
  2                    // tolerance
);
console.log('Alignment valid:', result.aligned);
```

### 3. Debug Tools and Test Functions

**PositionValidationTests** provides comprehensive testing:

```typescript
// Test coordinate alignment at multiple zoom levels
const report = await PositionValidationTests.testZoomLevels(
  blocks,                                    // array of block instances
  [0.5, 1.0, 1.5, 2.0],                    // zoom levels to test
  { x: 0, y: 0 }                           // pan offset
);

console.log(`Tests passed: ${report.summary.passedTests}/${report.summary.totalTests}`);
```

**Real-time validation during development:**
```typescript
// In component setup
watch([blocks, zoom, panOffset], () => {
  if (debugMode.value) {
    PositionValidationTests.validateCurrentState(blocks.value, zoom.value, panOffset.value);
  }
});
```

## Troubleshooting

### Common Positioning Errors and Symptoms

#### 1. Port appears in wrong location
**Symptoms:**
- Port visual doesn't match expected position
- Connection lines don't align with port centers
- Magnetic zones don't match visual ports

**Diagnosis:**
```javascript
// Check if configuration exists
const config = PortPositionManager.getPositionConfig('flow', 'input', 'trigger');
console.log('Config found:', config);

// Debug coordinate calculation
PortPositionManager.debugPosition({ x: 100, y: 200 }, 'flow', 'input', 'trigger');
```

**Common Causes:**
- Missing configuration in `PORT_POSITION_MAP`
- Incorrect `coordinates` offset calculation
- Wrong CSS class mapping
- Port ID override conflict

#### 2. CSS/Offset Misalignments
**Symptoms:**
- Visual port position differs from calculated coordinates
- Zoom/pan transformations create alignment drift
- Port labels appear in wrong positions

**Diagnosis:**
```javascript
// Compare visual vs calculated positions
const validation = PortPositionManager.validatePositionAlignment(
  blockPosition, portType, direction, portId, actualVisualPosition, 1
);
console.log('Offset:', validation.offset);
```

**Common Causes:**
- CSS `transform` conflicts with calculated coordinates
- Incorrect block dimensions in calculations
- Browser zoom affecting pixel calculations
- CSS positioning mode conflicts (absolute vs relative)

#### 3. Key Mapping Mistakes
**Symptoms:**
- Fallback positions used instead of specific configurations
- Port ID overrides not applied
- Wrong port type resolution

**Diagnosis:**
```javascript
// Check key generation
const key = generatePortKey('flow', 'input', 'trigger');
console.log('Generated key:', key);

// Verify override application
const hasOverride = PORT_ID_OVERRIDES['trigger'];
console.log('Override exists:', !!hasOverride);
```

**Common Causes:**
- Typos in port type or direction strings
- Case sensitivity issues
- Port ID not matching override keys
- Incorrect priority resolution

### Debug Workflow

1. **Identify the Issue:**
   ```javascript
   // Log current configuration
   PortPositionManager.debugPosition(blockPos, portType, direction, portId);
   ```

2. **Validate Configuration:**
   ```javascript
   // Check for configuration errors
   const validation = PortPositionManager.validatePositionMap();
   if (!validation.valid) console.error(validation.errors);
   ```

3. **Test Coordinate Calculation:**
   ```javascript
   // Compare expected vs actual
   const result = PortPositionManager.validatePositionAlignment(
     blockPos, portType, direction, portId, expectedPos, tolerance
   );
   ```

4. **Use Visual Debugging:**
   ```vue
   <!-- Enable debug overlay -->
   <MagneticZoneDebugOverlay :blocks="blocks" :enabled="true" />
   ```

5. **Test at Multiple Zoom Levels:**
   ```javascript
   await PositionValidationTests.testZoomLevels(blocks, [0.5, 1.0, 2.0]);
   ```

## Best Practices

### 1. Configuration Management
- Always update all four fields when changing position: `positionType`, `cssClass`, `labelClass`, `coordinates`
- Use consistent naming conventions for CSS classes
- Set appropriate priority values to avoid conflicts
- Add descriptive descriptions for documentation

### 2. Testing Changes
- Use `MagneticZoneDebugOverlay` to visually verify changes
- Test at multiple zoom levels (0.25x to 2x)
- Validate with different block sizes and positions
- Check both input and output ports

### 3. Performance Considerations
- `PortPositionManager` methods are lightweight and can be called frequently
- Coordinate calculations are cached internally when possible
- Avoid creating new position configurations at runtime
- Use the validation methods during development, not production

### 4. Extending the System
- Add new port types to `PortType` union type first
- Create corresponding entries in `PORT_POSITION_MAP`
- Update CSS with matching classes
- Add validation tests for new configurations

## Migration Guide

### Migrating from Legacy Position Logic

**Old approach:**
```typescript
// Legacy scattered positioning logic
function getPortPosition(index: number, portId: string, direction: string) {
  if (portId === 'trigger') return 'left-center';
  if (direction === 'input') return 'bottom-left';
  return 'bottom-right';
}
```

**New centralized approach:**
```typescript
// Use PortPositionManager
function getPortPosition(index: number, portId: string, direction: PortDirection, portType: PortType) {
  return PortPositionManager.getPositionType(portType, direction, portId);
}
```

**Migration steps:**
1. Identify all places using legacy positioning logic
2. Replace with `PortPositionManager` calls
3. Add missing configurations to `PORT_POSITION_MAP`
4. Test with debug overlay and validation tools
5. Remove legacy code

This centralized system ensures consistency, maintainability, and provides powerful debugging tools for the FlowEditor port positioning requirements.

 📋 FlowEditor Port Position - Преместване от лаво-горе на 
  среда-горе

  🎯 Обзор на промените

  Преместване на flow.input портовете (входния порт "вход") от
  позиция 'left-center' на 'center-top' във FlowEditor v3.

  ---
  📂 Променени файлове и действия

  1. PortPositionMap.ts - Основна конфигурация

  Файл:
  /frontend/src/modules/flowEditorV2/constants/PortPositionMap.ts       
  Линии: ~37-44

  Промени:
  // ПРЕДИ:
  'flow.input': {
    positionType: 'left-center',
    cssClass: 'corner-left-center',
    labelClass: 'label-left-center',
    coordinates: Coordinates.leftCenter,
    description: 'Flow input trigger ports - left center of block',     
    priority: 10
  }

  // СЛЕД:
  'flow.input': {
    positionType: 'center-top',
    cssClass: 'corner-center-top',
    labelClass: 'label-center-top',
    coordinates: Coordinates.centerTop,
    description: 'Flow input trigger ports - center top of block',      
    priority: 10
  }

  Координати (линия ~25):
  centerTop: { offsetX: 'center', offsetY: -60 }  // -60px за 
  поставяне над блока

  ---
  2. PortPositionMap.ts - PORT_ID_OVERRIDES

  Файл: Същия файл
  Линии: ~191-198

  Промени:
  // Специфичен override за 'trigger' портове
  'trigger': {
    positionType: 'center-top',
    cssClass: 'corner-center-top-trigger',
    labelClass: 'label-center-top-trigger',
    coordinates: Coordinates.centerTop,
    description: 'Trigger port override - always center top',
    priority: 15
  }

  ---
  3. BlockRenderer.vue - CSS стилове

  Файл:
  /frontend/src/modules/flowEditorV2/ui/blocks/BlockRenderer.vue        
  Линии: ~882-886

  Добавени CSS класове:
  .corner-center-top {
    left: 50% !important;
    top: -60px !important;
    transform: translateX(-50%) !important;
  }

  .label-center-top {
    left: 50% !important;
    top: -60px !important;
    transform: translateX(-50%) !important;
    z-index: 200 !important;
    color: white !important;
    font-weight: bold !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8) !important;
  }

  ---
  4. PortPositionCentralization.test.ts - Тест очаквания

  Файл: /frontend/src/modules/flowEditorV2/tests/PortPositionCentra     
  lization.test.ts
  Линии: ~30, ~190

  Промени:
  // Обновени тест очаквания
  { portType: 'flow', direction: 'input', portId: 'trigger',
  expectedPosition: 'center-top' }

  // Обновени координати
  expected: { x: 190, y: 40 }  // 100+180/2 за център, 100-60 за        
  -60px offset

  ---
  5. ConnectionLayer.vue - Обновена координатна система

  Файл: /frontend/src/modules/flowEditorV2/ui/connections/Connectio     
  nLayer.vueЛинии: ~82-96

  Използва centralized calculation:
  const position = PortPositionManager.calculateCanvasCoordinates(      
    block.position,
    portType,
    type as PortDirection,
    portId
  );

  ---
  🔧 Технически детайли

  Координатна система:

  - Преди: offsetX: -10, offsetY: 'center' (лаво-център)
  - След: offsetX: 'center', offsetY: -60 (горе-център)

  Изчисления:

  - X координата: blockPosition.x + width/2 (център на блока)
  - Y координата: blockPosition.y - 60 (60px над блока)

  CSS позициониране:

  - Хоризонтално: left: 50% + translateX(-50%) за центриране
  - Вертикално: top: -60px за поставяне над блока
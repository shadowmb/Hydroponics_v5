/**
 * 📦 FlowEditor v3 - Port Position Map
 * ✅ Част от основната редакторна система
 * Конфигурация за port positioning
 * Последна проверка: 2025-01-26
 */

/**
 * This configuration defines where each port type should be positioned
 * on blocks, ensuring consistency between visual rendering and coordinate calculations.
 */

import type { 
  PortPositionConfig, 
  PortType, 
  PortDirection,
  CoordinateOffset 
} from '../types/PortPosition';

/**
 * Coordinate calculation helpers
 */
const OFFSET = 90; // CSS_PORT_OFFSET value

const Coordinates = {
  topLeft: { offsetX: -OFFSET, offsetY: 'height' },
  topRight: { offsetX: 'width', offsetY: -OFFSET },
  bottomLeft: { offsetX: -OFFSET, offsetY: 0 },
  bottomRight: { offsetX: 'width', offsetY: 'height' },
  centerTop: { offsetX: OFFSET, offsetY: 'center' }, // Move port completely outside block
  centerBottom: { offsetX: 'center', offsetY: 'height' },
  leftCenter: { offsetX: -OFFSET, offsetY: 'center' },
  rightCenter: { offsetX: 'width', offsetY: 65 }
  //rightCenter: { offsetX: 180, offsetY: 'center' }
} as const;

/**
 * V4.3 Enhanced: Port Position Configuration Map - Variant A Implementation
 * Key format: `${portType}.${direction}` or specific `${portType}.${direction}.${portId}`
 * 
 * Variant A Anchor Positions:
 * - flowIn -> center-top, flowOut -> center-bottom
 * - setVarNameIn -> top-left, setVarNameOut -> top-right
 * - setVarDataIn -> bottom-left, setVarDataOut -> bottom-right  
 * - onErrorIn -> left-center, onErrorOut -> right-center
 */
export const PORT_POSITION_MAP: Record<string, PortPositionConfig> = {
  // ========== V4.3 VARIANT A - NEW 4-TYPE SYSTEM ==========
  
  // Flow Navigation Ports (circle shape) - Variant A
  'flowIn.input': {
    positionType: 'center-top',
    cssClass: 'corner-center-top-flow',
    labelClass: 'label-center-top-flow',
    coordinates: Coordinates.centerTop,
    description: 'V4.3 Flow input navigation - center top (circle)',
    priority: 20
  },
  
  'flowOut.output': {
    positionType: 'center-bottom',
    cssClass: 'corner-center-bottom-flow',
    labelClass: 'label-center-bottom-flow',
    coordinates: Coordinates.centerBottom,
    description: 'V4.3 Flow output navigation - center bottom (circle)',
    priority: 20
  },
  
  // Variable Name Ports (square shape) - Variant A
  'setVarNameIn.input': {
    positionType: 'top-left',
    cssClass: 'corner-top-left-varname',
    labelClass: 'label-top-left-varname',
    coordinates: Coordinates.topLeft,
    description: 'V4.3 Variable name input - top left (square)',
    priority: 18
  },
  
  'setVarNameOut.output': {
    positionType: 'top-right',
    cssClass: 'corner-top-right-varname',
    labelClass: 'label-top-right-varname',
    coordinates: Coordinates.topRight,
    description: 'V4.3 Variable name output - top right (square)',
    priority: 18
  },
  
  // Variable Data Ports (star/diamond shape) - Variant A
  'setVarDataIn.input': {
    positionType: 'bottom-left',
    cssClass: 'corner-bottom-left-vardata',
    labelClass: 'label-bottom-left-vardata',
    coordinates: Coordinates.bottomLeft,
    description: 'V4.3 Variable data input - bottom left (star)',
    priority: 16
  },
  
  'setVarDataOut.output': {
    positionType: 'bottom-right',
    cssClass: 'corner-bottom-right-vardata',
    labelClass: 'label-bottom-right-vardata',
    coordinates: Coordinates.bottomRight,
    description: 'V4.3 Variable data output - bottom right (star)',
    priority: 16
  },
  
  // Error Handling Ports (triangle shape) - Variant A
  'onErrorIn.input': {
    positionType: 'left-center',
    cssClass: 'corner-left-center-error',
    labelClass: 'label-left-center-error',
    coordinates: Coordinates.leftCenter,
    description: 'V4.3 Error input handler - left center (triangle)',
    priority: 14
  },
  
  'onErrorOut.output': {
    positionType: 'right-center',
    cssClass: 'corner-right-center-error',
    labelClass: 'label-right-center-error',
    coordinates: Coordinates.rightCenter,
    description: 'V4.3 Error output signal - right center (triangle)',
    priority: 14
  },
  
  // Loop Control Ports (hexagon shape) - V4.4 New Loop System
  'loopOut.output': {
    positionType: 'right-center',
    cssClass: 'corner-right-center-loop',
    labelClass: 'label-right-center-loop',
    coordinates: { offsetX: 'width', offsetY: 40 }, // Slightly above right-center
    description: 'V4.4 Loop output - right center offset (hexagon)',
    priority: 15
  },
  
  // ========== LEGACY COMPATIBILITY (for backward compatibility) ==========
  
  'flow.input': {
    positionType: 'left-center',
    cssClass: 'corner-left-center',
    labelClass: 'label-left-center',
    coordinates: Coordinates.leftCenter,
    description: 'Legacy flow input - redirects to flowIn',
    priority: 5
  },

  'flow.output': {
    positionType: 'right-center',
    cssClass: 'corner-right-center', 
    labelClass: 'label-right-center',
    coordinates: Coordinates.rightCenter,
    description: 'Legacy flow output - redirects to flowOut',
    priority: 5
  },

  'data.input': {
    positionType: 'bottom-left',
    cssClass: 'corner-bottom-left',
    labelClass: 'label-bottom-left',
    coordinates: Coordinates.bottomLeft,
    description: 'Legacy data input - redirects to setVarDataIn',
    priority: 3
  },

  'data.output': {
    positionType: 'bottom-right',
    cssClass: 'corner-bottom-right',
    labelClass: 'label-bottom-right',
    coordinates: Coordinates.bottomRight,
    description: 'Legacy data output - redirects to setVarDataOut',
    priority: 3
  },

  'error.output': {
    positionType: 'center-bottom',
    cssClass: 'corner-center-bottom',
    labelClass: 'label-center-bottom',
    coordinates: Coordinates.centerBottom,
    description: 'Legacy error output - redirects to onErrorOut',
    priority: 3
  },

  'setVar.input': {
    positionType: 'top-left',
    cssClass: 'corner-top-left',
    labelClass: 'label-top-left',
    coordinates: Coordinates.topLeft,
    description: 'Legacy setVar input - redirects to setVarNameIn',
    priority: 3
  }
};

/**
 * Fallback configurations for unspecified port types
 */
export const FALLBACK_POSITIONS: Record<PortDirection, PortPositionConfig> = {
  input: {
    positionType: 'center-top',
    cssClass: 'corner-center-top-fallback',
    labelClass: 'label-center-top-fallback',
    coordinates: Coordinates.centerTop,
    description: 'Default input port position - center top',
    priority: 1
  },

  output: {
    positionType: 'center-bottom', 
    cssClass: 'corner-center-bottom',
    labelClass: 'label-center-bottom',
    coordinates: Coordinates.centerBottom,
    description: 'Default output port position - center bottom',
    priority: 1
  }
};

/**
 * V4.3 Enhanced: Port ID specific overrides - Variant A Implementation
 * These take precedence over type-based positioning
 */
export const PORT_ID_OVERRIDES: Record<string, Partial<PortPositionConfig>> = {
  // ========== V4.3 VARIANT A - NEW 4-TYPE SYSTEM OVERRIDES ==========
  
  'flowIn': {
    positionType: 'center-top',
    cssClass: 'corner-center-top-flowIn',
    labelClass: 'label-center-top-flowIn',
    coordinates: Coordinates.centerTop,
    description: 'V4.3 FlowIn port override - center top (Variant A)',
    priority: 25
  },
  
  'flowOut': {
    positionType: 'center-bottom',
    cssClass: 'corner-center-bottom-flowOut',
    labelClass: 'label-center-bottom-flowOut',
    coordinates: Coordinates.centerBottom,
    description: 'V4.3 FlowOut port override - center bottom (Variant A)',
    priority: 25
  },
  
  'flowOutTrue': {
    positionType: 'bottom-right',
    cssClass: 'corner-bottom-right-true',
    labelClass: 'label-bottom-right-true',
    coordinates: Coordinates.bottomRight,
    description: 'IF block True output - bottom right',
    priority: 18
  },
  
  'flowOutFalse': {
    positionType: 'center-bottom',
    cssClass: 'corner-center-bottom-false',
    labelClass: 'label-center-bottom-false',
    coordinates: Coordinates.centerBottom,
    description: 'IF block False output - center bottom',
    priority: 18
  },
  
  'flowIn1': {
    positionType: 'top-left',
    cssClass: 'corner-top-left-in1',
    labelClass: 'label-top-left-in1',
    coordinates: Coordinates.topLeft,
    description: 'MERGE block input 1 - top left',
    priority: 18
  },
  
  'flowIn2': {
    positionType: 'left-center',
    cssClass: 'corner-left-center-in2',
    labelClass: 'label-left-center-in2',
    coordinates: Coordinates.leftCenter,
    description: 'MERGE block input 2 - left center',
    priority: 18
  },
  
  'flowIn3': {
    positionType: 'bottom-left',
    cssClass: 'corner-bottom-left-in3',
    labelClass: 'label-bottom-left-in3',
    coordinates: Coordinates.bottomLeft,
    description: 'MERGE block input 3 - bottom left',
    priority: 18
  },
  
  'setVarNameIn': {
    positionType: 'top-left',
    cssClass: 'corner-top-left-varName',
    labelClass: 'label-top-left-varName',
    coordinates: Coordinates.topLeft,
    description: 'V4.3 Variable name input override - top left (Variant A)',
    priority: 23
  },
  
  'setVarNameOut': {
    positionType: 'top-right',
    cssClass: 'corner-top-right-varName',
    labelClass: 'label-top-right-varName',
    coordinates: Coordinates.topRight,
    description: 'V4.3 Variable name output override - top right (Variant A)',
    priority: 23
  },
  
  'setVarDataIn': {
    positionType: 'bottom-left',
    cssClass: 'corner-bottom-left-varData',
    labelClass: 'label-bottom-left-varData',
    coordinates: Coordinates.bottomLeft,
    description: 'V4.3 Variable data input override - bottom left (Variant A)',
    priority: 22
  },
  
  'setVarDataOut': {
    positionType: 'bottom-right',
    cssClass: 'corner-bottom-right-varData',
    labelClass: 'label-bottom-right-varData',
    coordinates: Coordinates.bottomRight,
    description: 'V4.3 Variable data output override - bottom right (Variant A)',
    priority: 22
  },
  
  'onErrorIn': {
    positionType: 'left-center',
    cssClass: 'corner-left-center-errorIn',
    labelClass: 'label-left-center-errorIn',
    coordinates: Coordinates.leftCenter,
    description: 'V4.3 Error input override - left center (Variant A)',
    priority: 21
  },
  
  'onErrorOut': {
    positionType: 'right-center',
    cssClass: 'corner-right-center-errorOut',
    labelClass: 'label-right-center-errorOut',
    coordinates: Coordinates.rightCenter,
    description: 'V4.3 Error output override - right center (Variant A)',
    priority: 21
  },
  
  'loopOut': {
    positionType: 'right-center',
    cssClass: 'corner-right-center-loopOut',
    labelClass: 'label-right-center-loopOut',
    coordinates: { offsetX: 'width', offsetY: 40 },
    description: 'V4.4 Loop output override - right center offset',
    priority: 24
  },
  
  // ========== LEGACY COMPATIBILITY OVERRIDES ==========
  // Specific port ID overrides
  'trigger': {
    positionType: 'center-top',
    cssClass: 'corner-center-top-trigger',
    labelClass: 'label-center-top-trigger',
    coordinates: Coordinates.centerTop,
    description: 'Trigger port override - always center top',
    priority: 15
  },

  'input': {
    positionType: 'center-top', 
    cssClass: 'corner-center-top-input',
    labelClass: 'label-center-top-input',
    coordinates: Coordinates.centerTop,
    description: 'Generic input port override - center top',
    priority: 12
  },

  'result': {
    positionType: 'center-bottom',
    cssClass: 'corner-right-center-result',
    labelClass: 'label-right-center-result', 
    coordinates: Coordinates.centerBottom,
    description: 'Result port override - always right center',
    priority: 15
  },

  'status': {
    positionType: 'right-center',
    cssClass: 'corner-right-center-status',
    labelClass: 'label-right-center-status',
    coordinates: Coordinates.rightCenter,
    description: 'Status port override - right center',
    priority: 12
  },

  'measurement': {
    positionType: 'right-center',
    cssClass: 'corner-right-center-measurement', 
    labelClass: 'label-right-center-measurement',
    coordinates: Coordinates.rightCenter,
    description: 'Measurement port override - right center',
    priority: 12
  },

  'error': {
    positionType: 'bottom-right',
    cssClass: 'corner-bottom-right-error-id',
    labelClass: 'label-bottom-right-error-id',
    coordinates: Coordinates.bottomRight,
    description: 'Error port override - bottom right corner',
    priority: 14
  },

  'onError': {
    positionType: 'bottom-right',
    cssClass: 'corner-bottom-right-onerror',
    labelClass: 'label-bottom-right-onerror',
    coordinates: Coordinates.bottomRight,
    description: 'OnError port override - bottom right corner',
    priority: 14
  },

  'data': {
    positionType: 'bottom-left',
    cssClass: 'corner-bottom-left',
    labelClass: 'label-bottom-left',
    coordinates: Coordinates.bottomLeft,
    description: 'Data port override - bottom left corner',
    priority: 11
  }
};

/**
 * V3.1 Enhanced: Helper function to generate position map keys for new 4-type system
 */
export function generatePortKey(portType: PortType, direction: PortDirection, portId?: string): string {
  if (portId && PORT_ID_OVERRIDES[portId]) {
    return `override.${portId}`;
  }
  
  // V3.1: Handle new 4-type system mapping + V4.4 Loop System
  // For new types, we use the portType directly since it already includes direction
  if (['flowIn', 'flowOut', 'setVarNameIn', 'setVarNameOut', 'setVarDataIn', 'setVarDataOut', 'onErrorIn', 'onErrorOut', 'loopOut'].includes(portType)) {
    return `${portType}.${direction}`;
  }
  
  // Legacy compatibility
  return `${portType}.${direction}`;
}

/**
 * Get all available position types
 */
export function getAllPositionTypes(): string[] {
  const types = new Set<string>();
  
  Object.values(PORT_POSITION_MAP).forEach(config => {
    types.add(config.positionType);
  });
  
  Object.values(FALLBACK_POSITIONS).forEach(config => {
    types.add(config.positionType);
  });
  
  return Array.from(types).sort();
}

/**
 * Validate position map consistency
 */
export function validatePositionMap(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check for duplicate CSS classes
  const cssClasses = new Set<string>();
  const allConfigs = [
    ...Object.values(PORT_POSITION_MAP),
    ...Object.values(FALLBACK_POSITIONS),
    ...Object.values(PORT_ID_OVERRIDES).filter(config => config.cssClass)
  ];
  
  allConfigs.forEach((config, index) => {
    if (config.cssClass && cssClasses.has(config.cssClass)) {
      errors.push(`Duplicate CSS class: ${config.cssClass}`);
    } else if (config.cssClass) {
      cssClasses.add(config.cssClass);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * V4.3 Enhanced: Clear position manager cache when position map is updated
 * This ensures new Variant A positions take effect immediately
 */
export function invalidatePositionCache(): void {
  // Invalidate PortPositionManager cache if available
  if (typeof window !== 'undefined' && (window as any).PortPositionManager) {
    const PortPositionManager = (window as any).PortPositionManager;
    if (typeof PortPositionManager.clearCache === 'function') {
      PortPositionManager.clearCache();
      console.log('✅ V4.3: Position cache invalidated for Variant A update');
    }
  }
}
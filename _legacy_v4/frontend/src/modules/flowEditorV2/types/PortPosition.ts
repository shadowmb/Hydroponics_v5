/**
 * 📦 FlowEditor v3 - Port Position Types
 * ✅ Част от основната редакторна система
 * Типове за port position система
 * Последна проверка: 2025-01-26
 */

import type { Position } from './BlockConcept';

/**
 * Available position types for port placement
 */
export type PositionType = 
  | 'top-left' 
  | 'top-right' 
  | 'bottom-left' 
  | 'bottom-right'
  | 'center-top' 
  | 'center-bottom'
  | 'left-center' 
  | 'right-center';

/**
 * Port type identifiers used in block definitions
 * V3.1 Enhanced: Added new 4-type system support
 */
export type PortType = 
  // New 4+1-type system (primary) - V4.4 with Loop Support
  | 'flowIn'
  | 'flowOut'
  | 'setVarNameIn'
  | 'setVarNameOut'
  | 'setVarDataIn'
  | 'setVarDataOut'
  | 'onErrorIn'
  | 'onErrorOut'
  | 'loopOut'
  // Legacy compatibility types
  | 'flow' 
  | 'data' 
  | 'sensor' 
  | 'error' 
  | 'setVar' 
  | 'logic' 
  | 'actuator' 
  | 'notification';

/**
 * Port direction (input/output)
 */
export type PortDirection = 'input' | 'output';

/**
 * Coordinate calculation modes
 */
export interface CoordinateOffset {
  offsetX: number | 'center' | 'width' | 'width+offset';
  offsetY: number | 'center' | 'height' | 'height+offset';
}

/**
 * Complete port position configuration
 */
export interface PortPositionConfig {
  positionType: PositionType;
  cssClass: string;
  labelClass: string;
  coordinates: CoordinateOffset;
  description: string;
  priority: number; // For conflict resolution
}

/**
 * Port identification key
 */
export interface PortKey {
  portType: PortType;
  direction: PortDirection;
  portId?: string; // Optional specific port ID override
}

/**
 * Position calculation result
 */
export interface CalculatedPosition {
  position: Position;
  positionType: PositionType;
  cssClass: string;
  labelClass: string;
  source: 'configured' | 'fallback' | 'override';
}

/**
 * Validation result for position alignment
 */
export interface PositionValidationResult {
  portKey: string;
  calculated: Position;
  expected: Position;
  aligned: boolean;
  offset: Position;
  positionType: PositionType;
  cssClass: string;
}

/**
 * Block dimensions constants
 */
export interface BlockDimensions {
  width: number;
  height: number;
  portOffset: number;
}

/**
 * Default block dimensions
 */
export const DEFAULT_BLOCK_DIMENSIONS: BlockDimensions = {
  width: 180,
  height: 60,
  portOffset: 10
} as const;
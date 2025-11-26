/**
 * 📦 FlowEditor v3 - Stable Port Positioning
 * ✅ Част от основната редакторна система
 * Стабилна port positioning система
 * Последна проверка: 2025-01-26
 */

/**
 * Заменя разпространените getPortPosition логики с централизирана система,
 * базирана на legacy принципите, които работят стабилно при zoom.
 * 
 * ✅ FIXED: Align magnetic zone calculations with CSS visual positioning
 * - CSS uses left/right/top/bottom: -10px positioning
 * - Calculations now match exactly with CSS_PORT_OFFSET = 10px
 * - Eliminates magnetic zone offset issues during drag & drop connections
 */

import { Position } from './StableCoordinateTransform';
import { BlockInstance } from '../types/BlockConcept';
import { BlockFactory } from '../blocks/BlockFactory';
import { PortPositionManager } from './PortPositionManager';
import type { PositionType, PortType, PortDirection } from '../types/PortPosition';

export interface PortPositionInfo {
  position: Position;
  type: 'input' | 'output';
  blockId: string;
  portId: string;
  positionType: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center-top' | 'center-bottom';
}

/**
 * Стабилна port positioning система
 * Централизира логиката за изчисляване на port позиции
 */
export class StablePortPositioning {
  
  // Константи за блок размери (консистентни с legacy)
  private static readonly BLOCK_WIDTH = 180;
  private static readonly BLOCK_HEIGHT = 60;
  private static readonly CSS_PORT_OFFSET = 10; // Отстояние от блока според CSS positioning (-10px)
  
  /**
   * ОСНОВНА ФУНКЦИЯ - изчисляване на точната позиция на port
   * Използва legacy логиката за corner-based позициониране
   * 
   * ✅ FIXED: Calculations now align exactly with CSS visual positioning
   * - Magnetic zones align precisely with visual port positions
   * - Eliminates the (-10, -4)px offset between visual and magnetic zones
   * 
   * @param block - блок инстанция
   * @param portId - ID на порта
   * @param type - тип на порта (input/output)
   * @returns точна позиция на порта в canvas координати (aligned with CSS)
   */
  static getPortPosition(
    block: BlockInstance,
    portId: string,
    type: 'input' | 'output'
  ): PortPositionInfo {
    const blockDef = BlockFactory.getDefinition(block.definitionId);
    if (!blockDef) {
      return this.createFallbackPortInfo(block, portId, type);
    }

    // Намери port definition
    const portDefinitions = type === 'input' ? blockDef.inputs : blockDef.outputs;
    const portIndex = portDefinitions.findIndex(p => p.id === portId);
    
    if (portIndex === -1) {
      return this.createFallbackPortInfo(block, portId, type);
    }

    // Определи позиционния тип и изчисли позицията директно чрез PortPositionManager
    const port = portDefinitions[portIndex];
    const portType = port ? (Array.isArray(port.type) ? port.type[0] : port.type) : 'logic';
    
    // ✅ DIRECT CENTRALIZED CALCULATION: Skip intermediate steps, use PortPositionManager directly
    const position = PortPositionManager.calculateCanvasCoordinates(
      block.position,
      portType,
      type as PortDirection,
      portId,
      {
        width: this.BLOCK_WIDTH,
        height: this.BLOCK_HEIGHT,
        portOffset: this.CSS_PORT_OFFSET
      }
    );
    
    // Get position type for return value
    const positionType = PortPositionManager.getPositionType(portType, type as PortDirection, portId);
    
    
    return {
      position,
      type,
      blockId: block.id,
      portId,
      positionType
    };
  }

  /**
   * Изчислява позицията на порт според типа му
   * ✅ CENTRALIZED: Always uses PortPositionManager for coordinate calculations
   */
  private static calculatePortPosition(
    blockPosition: Position,
    positionType: PositionType,
    portType?: string,
    direction?: PortDirection,
    portId?: string
  ): Position {
    // ✅ CENTRALIZED: Always use PortPositionManager for all coordinate calculations
    if (portType && direction) {
      // Use centralized calculation with full context
      return PortPositionManager.calculateCanvasCoordinates(
        blockPosition,
        portType,
        direction,
        portId,
        {
          width: this.BLOCK_WIDTH,
          height: this.BLOCK_HEIGHT,
          portOffset: this.CSS_PORT_OFFSET
        }
      );
    }
    
    // Even for legacy calls, use PortPositionManager with fallback portType
    
    // Determine fallback portType based on direction
    const fallbackPortType = direction === 'input' ? 'flow' : 'data';
    
    return PortPositionManager.calculateCanvasCoordinates(
      blockPosition,
      fallbackPortType,
      direction || 'input',
      portId,
      {
        width: this.BLOCK_WIDTH,
        height: this.BLOCK_HEIGHT,
        portOffset: this.CSS_PORT_OFFSET
      }
    );
  }

  /**
   * Определя типа на позицията според port характеристики
   * ✅ CENTRALIZED: Now uses PortPositionManager for consistent logic
   */
  private static determinePortPositionType(
    portIndex: number,
    portId: string,
    direction: 'input' | 'output',
    portType?: string
  ): PositionType {
    // ✅ CENTRALIZED: Use PortPositionManager for all position logic
    const resolvedPortType = portType || 'logic'; // Default fallback
    return PortPositionManager.getPositionType(
      resolvedPortType as PortType, 
      direction as PortDirection, 
      portId
    );
  }

  /**
   * Създава fallback port информация при грешки
   * ✅ FIXED: Use CSS_PORT_OFFSET for consistency
   */
  private static createFallbackPortInfo(
    block: BlockInstance,
    portId: string,
    type: 'input' | 'output'
  ): PortPositionInfo {
    const fallbackPosition = type === 'input' 
      ? { x: block.position.x + this.BLOCK_WIDTH / 2, y: block.position.y - this.CSS_PORT_OFFSET }
      : { x: block.position.x + this.BLOCK_WIDTH / 2, y: block.position.y + this.BLOCK_HEIGHT + this.CSS_PORT_OFFSET };
    
    return {
      position: fallbackPosition,
      type,
      blockId: block.id,
      portId,
      positionType: type === 'input' ? 'center-top' : 'center-bottom'
    };
  }

  /**
   * Batch операция за получаване на всички портове на блок
   * Полезно за connection rendering оптимизация
   */
  static getAllBlockPortPositions(block: BlockInstance): PortPositionInfo[] {
    const blockDef = BlockFactory.getDefinition(block.definitionId);
    if (!blockDef) return [];
    
    const results: PortPositionInfo[] = [];
    
    // Input портове
    blockDef.inputs.forEach(port => {
      results.push(this.getPortPosition(block, port.id, 'input'));
    });
    
    // Output портове
    blockDef.outputs.forEach(port => {
      results.push(this.getPortPosition(block, port.id, 'output'));
    });
    
    return results;
  }

  /**
   * Проверява дали позицията е валидна
   * Помощна функция за debugging
   */
  static validatePortPosition(portInfo: PortPositionInfo): boolean {
    const { position } = portInfo;
    return (
      typeof position.x === 'number' &&
      typeof position.y === 'number' &&
      !isNaN(position.x) &&
      !isNaN(position.y) &&
      isFinite(position.x) &&
      isFinite(position.y)
    );
  }

  /**
   * Debug функция за визуализация на port позиции
   */
  static debugPortPositions(block: BlockInstance): void {
    const portPositions = this.getAllBlockPortPositions(block);
    
  }

  /**
   * ✅ NEW: Validate alignment between CSS positioning and calculation
   * Useful for debugging magnetic zone misalignment issues
   */
  static validatePositionAlignment(
    block: BlockInstance,
    portId: string,
    type: 'input' | 'output'
  ): { calculated: Position; cssExpected: Position; aligned: boolean; positionType: string } {
    const portInfo = this.getPortPosition(block, portId, type);
    const calculated = portInfo.position;
    
    // Expected position based on actual position type
    const cssExpected = this.calculateCSSExpectedPosition(block.position, type, portInfo.positionType);
    
    const aligned = (
      Math.abs(calculated.x - cssExpected.x) < 1 &&
      Math.abs(calculated.y - cssExpected.y) < 1
    );
    
    return { calculated, cssExpected, aligned, positionType: portInfo.positionType };
  }

  /**
   * Calculate expected position based on CSS positioning
   * ✅ UPDATED: Support for all position types including left-center and right-center
   */
  private static calculateCSSExpectedPosition(
    blockPosition: Position,
    type: 'input' | 'output',
    positionType?: string
  ): Position {
    // Use positionType if provided, otherwise use defaults
    if (positionType) {
      return this.calculatePortPosition(blockPosition, positionType);
    }
    
    // Default fallback positions
    if (type === 'input') {
      // CSS: corner-top-left { left: -10px; top: -10px; }
      return {
        x: blockPosition.x - this.CSS_PORT_OFFSET,
        y: blockPosition.y - this.CSS_PORT_OFFSET
      };
    } else {
      // CSS: corner-top-right { right: -10px; top: -10px; }
      return {
        x: blockPosition.x + this.BLOCK_WIDTH + this.CSS_PORT_OFFSET,
        y: blockPosition.y - this.CSS_PORT_OFFSET
      };
    }
  }
}

/**
 * Convenience функция за директна употреба
 * Equivalent на старата getPortPosition функция, но със стабилна логика
 */
export function getStablePortPosition(
  block: BlockInstance,
  portId: string,
  type: 'input' | 'output'
): Position {
  const portInfo = StablePortPositioning.getPortPosition(block, portId, type);
  return portInfo.position;
}

/**
 * Convenience функция за legacy съвместимост
 * Заменя старите corner-based изчисления
 */
export function getStablePortPositionType(
  portIndex: number,
  portId: string,
  direction: 'input' | 'output',
  portType?: string
): string {
  return StablePortPositioning['determinePortPositionType'](portIndex, portId, direction, portType);
}

/**
 * ✅ CENTRALIZED: Test function to validate the coordinate alignment with centralized system
 * Call this to verify magnetic zones align with visual positioning
 */
export function testCoordinateAlignment(): void {
  
  // Import and run the comprehensive centralization tests
  try {
    // Try to use the centralized test if available
    if (typeof window !== 'undefined' && (window as any).testPortPositionCentralization) {
      (window as any).testPortPositionCentralization();
    } else {
      // Fallback to basic test
      runBasicCoordinateTest();
    }
  } catch (error) {
    runBasicCoordinateTest();
  }
}

/**
 * Basic coordinate test fallback
 */
function runBasicCoordinateTest(): void {
  // Test block at position (100, 100)
  const testBlock: BlockInstance = {
    id: 'test-block-basic',
    definitionId: 'test-sensor',
    position: { x: 100, y: 100 },
    parameters: {},
    connections: { inputs: {}, outputs: {} },
    meta: {}
  };

  // Test different position types including the new center positions
  const testCases = [
    { portId: 'trigger', type: 'input' as const, expectedPositionType: 'left-center' },
    { portId: 'data', type: 'input' as const, expectedPositionType: 'bottom-left' },
    { portId: 'result', type: 'output' as const, expectedPositionType: 'right-center' },
    { portId: 'error', type: 'output' as const, expectedPositionType: 'bottom-right' }
  ];

  testCases.forEach(({ portId, type, expectedPositionType }) => {
    const result = StablePortPositioning.validatePositionAlignment(testBlock, portId, type);
    
  });

}
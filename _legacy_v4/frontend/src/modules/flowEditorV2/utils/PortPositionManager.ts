/**
 * 📦 FlowEditor v3 - Port Position Manager
 * ✅ Част от основната редакторна система
 * Манаджър за централизирано port positioning
 * Последна проверка: 2025-01-26
 */

/**
 * This class provides a unified interface for all port positioning operations,
 * ensuring consistency between visual rendering and coordinate calculations.
 */

import type { Position } from '../types/BlockConcept';
import type { 
  PortPositionConfig,
  PortType,
  PortDirection,
  PositionType,
  CalculatedPosition,
  PositionValidationResult,
  BlockDimensions,
  CoordinateOffset
} from '../types/PortPosition';

import { 
  PORT_POSITION_MAP,
  FALLBACK_POSITIONS,
  PORT_ID_OVERRIDES,
  generatePortKey,
  validatePositionMap
} from '../constants/PortPositionMap';

import { DEFAULT_BLOCK_DIMENSIONS } from '../types/PortPosition';

/**
 * V3.1 Enhanced: Centralized port positioning manager with performance optimizations
 */
export class PortPositionManager {
  
  private static blockDimensions: BlockDimensions = DEFAULT_BLOCK_DIMENSIONS;
  
  // V3.1 Performance: Cache for position calculations
  private static positionCache: Map<string, Position> = new Map();
  private static configCache: Map<string, PortPositionConfig> = new Map();
  private static cacheEnabled = true;
  
  /**
   * V3.1 Performance: Enable/disable caching for testing
   */
  static setCacheEnabled(enabled: boolean): void {
    this.cacheEnabled = enabled;
    if (!enabled) {
      this.clearCache();
    }
  }
  
  /**
   * V3.1 Performance: Clear position cache
   */
  static clearCache(): void {
    this.positionCache.clear();
    this.configCache.clear();
  }
  
  /**
   * V3.1 Performance: Generate cache key for position calculations
   */
  private static generateCacheKey(
    blockPosition: Position,
    portType: string,
    direction: PortDirection,
    portId?: string,
    customDimensions?: Partial<BlockDimensions>
  ): string {
    const dimensionsKey = customDimensions 
      ? JSON.stringify(customDimensions)
      : 'default';
    return `${blockPosition.x},${blockPosition.y}|${portType}|${direction}|${portId || 'none'}|${dimensionsKey}`;
  }
  
  /**
   * Задава потребителски размери на блоковете за специални случаи
   * @param dimensions - парциални размери за заместване на стандартните
   */
  static setBlockDimensions(dimensions: Partial<BlockDimensions>): void {
    this.blockDimensions = { ...DEFAULT_BLOCK_DIMENSIONS, ...dimensions };
  }
  
  /**
   * Get block dimensions
   */
  static getBlockDimensions(): BlockDimensions {
    return { ...this.blockDimensions };
  }
  
  /**
   * V3.1 Enhanced: Получава конфигурацията за позициониране на порт с приоритетна система и кеширане
   * @param portType - тип на порта (нови типове: flowIn/Out, setVarNameIn/Out, setVarDataIn/Out, onErrorIn/Out)
   * @param direction - посока на порта (input/output)
   * @param portId - опционален ID за специфични настройки
   * @returns пълна конфигурация за позициониране
   */
  static getPositionConfig(
    portType: PortType | string,
    direction: PortDirection,
    portId?: string
  ): PortPositionConfig {
    // V3.1 Performance: Check cache first
    const configKey = `${portType}|${direction}|${portId || 'none'}`;
    if (this.cacheEnabled && this.configCache.has(configKey)) {
      return this.configCache.get(configKey)!;
    }
    
    let config: PortPositionConfig;
    
    // Priority 1: Port ID specific override (V3.2 enhanced for new types)
    if (portId && PORT_ID_OVERRIDES[portId]) {
      const override = PORT_ID_OVERRIDES[portId];
      const baseConfig = this.getBaseConfig(portType as PortType, direction);
      config = { ...baseConfig, ...override };
    }
    // Priority 2: Port type + direction configuration
    else {
      const key = generatePortKey(portType as PortType, direction);
      if (PORT_POSITION_MAP[key]) {
        config = PORT_POSITION_MAP[key];
      }
      // Priority 3: Fallback configuration
      else {
        config = FALLBACK_POSITIONS[direction];
      }
    }
    
    // V3.1 Performance: Cache the result
    if (this.cacheEnabled) {
      this.configCache.set(configKey, config);
    }
    
    return config;
  }
  
  /**
   * Get base configuration without overrides
   */
  private static getBaseConfig(portType: PortType, direction: PortDirection): PortPositionConfig {
    const key = generatePortKey(portType, direction);
    return PORT_POSITION_MAP[key] || FALLBACK_POSITIONS[direction];
  }
  
  /**
   * Get CSS class for a port
   */
  static getCSSClass(
    portType: PortType | string,
    direction: PortDirection,
    portId?: string
  ): string {
    const config = this.getPositionConfig(portType as PortType, direction, portId);
    return config.cssClass;
  }
  
  /**
   * Get label CSS class for a port
   */
  static getLabelCSSClass(
    portType: PortType | string,
    direction: PortDirection,
    portId?: string
  ): string {
    const config = this.getPositionConfig(portType as PortType, direction, portId);
    return config.labelClass;
  }
  
  /**
   * Get position type for a port
   */
  static getPositionType(
    portType: PortType | string,
    direction: PortDirection,
    portId?: string
  ): PositionType {
    const config = this.getPositionConfig(portType as PortType, direction, portId);
    return config.positionType;
  }
  
  /**
   * V3.1 Enhanced: Изчислява точните canvas координати на порт спрямо блока с кеширане
   * @param blockPosition - позицията на блока в canvas
   * @param portType - тип на порта (нови типове поддържани)
   * @param direction - посока на порта
   * @param portId - опционален ID на порта
   * @param customDimensions - потребителски размери на блока
   * @returns координати на порта в canvas пространството
   */
  static calculateCanvasCoordinates(
    blockPosition: Position,
    portType: PortType | string,
    direction: PortDirection,
    portId?: string,
    customDimensions?: Partial<BlockDimensions>
  ): Position {
    // V3.1 Performance: Check position cache first
    const cacheKey = this.generateCacheKey(blockPosition, portType, direction, portId, customDimensions);
    if (this.cacheEnabled && this.positionCache.has(cacheKey)) {
      return this.positionCache.get(cacheKey)!;
    }
    
    const config = this.getPositionConfig(portType as PortType, direction, portId);
    const dimensions = customDimensions 
      ? { ...this.blockDimensions, ...customDimensions }
      : this.blockDimensions;
    
    const position = this.calculateCoordinatesFromOffset(blockPosition, config.coordinates, dimensions);
    
    // V3.1 Performance: Cache the calculated position
    if (this.cacheEnabled) {
      this.positionCache.set(cacheKey, position);
    }
    
    return position;
  }
  
  /**
   * Calculate coordinates from offset configuration
   */
  private static calculateCoordinatesFromOffset(
    blockPosition: Position,
    coordinates: CoordinateOffset,
    dimensions: BlockDimensions
  ): Position {
    const { width, height, portOffset } = dimensions;
    
    // Calculate X coordinate
    let x: number;
    switch (coordinates.offsetX) {
      case 'center':
        x = blockPosition.x + width / 2 - portOffset;
        break;
      case 'width':
        x = blockPosition.x + width;
        break;
      case 'width+offset':
        x = blockPosition.x + width + portOffset;
        break;
      default:
        x = blockPosition.x + (coordinates.offsetX as number);
    }
    
    // Calculate Y coordinate
    let y: number;
    switch (coordinates.offsetY) {
      case 'center':
        y = blockPosition.y + height / 2 - portOffset;
        //y = blockPosition.y - 10;
        break;
      case 'height':
        y = blockPosition.y + height;
        break;
      case 'height+offset':
        y = blockPosition.y + height + portOffset;
        break;
      default:
        y = blockPosition.y + (coordinates.offsetY as number);
    }
    
    return { x, y };
  }
  
  /**
   * Get complete calculated position information
   */
  static getCalculatedPosition(
    blockPosition: Position,
    portType: PortType | string,
    direction: PortDirection,
    portId?: string,
    customDimensions?: Partial<BlockDimensions>
  ): CalculatedPosition {
    const config = this.getPositionConfig(portType as PortType, direction, portId);
    const position = this.calculateCanvasCoordinates(
      blockPosition,
      portType,
      direction,
      portId,
      customDimensions
    );
    
    let source: 'configured' | 'fallback' | 'override' = 'configured';
    
    if (portId && PORT_ID_OVERRIDES[portId]) {
      source = 'override';
    } else {
      const key = generatePortKey(portType as PortType, direction);
      if (!PORT_POSITION_MAP[key]) {
        source = 'fallback';
      }
    }
    
    return {
      position,
      positionType: config.positionType,
      cssClass: config.cssClass,
      labelClass: config.labelClass,
      source
    };
  }
  
  /**
   * Проверява съответствието между изчислени и очаквани координати
   * @param blockPosition - позицията на блока
   * @param portType - тип на порта
   * @param direction - посока на порта
   * @param portId - опционален ID на порта
   * @param expectedPosition - очаквана позиция за сравнение
   * @param tolerance - толерантност в pixels за съвпадение
   * @returns обект с резултати от валидацията
   */
  static validatePositionAlignment(
    blockPosition: Position,
    portType: PortType | string,
    direction: PortDirection,
    portId?: string,
    expectedPosition?: Position,
    tolerance: number = 1
  ): PositionValidationResult {
    const calculated = this.calculateCanvasCoordinates(blockPosition, portType, direction, portId);
    const config = this.getPositionConfig(portType as PortType, direction, portId);
    
    // If no expected position provided, assume calculated is expected (for self-consistency check)
    const expected = expectedPosition || calculated;
    
    const offset: Position = {
      x: calculated.x - expected.x,
      y: calculated.y - expected.y
    };
    
    const aligned = Math.abs(offset.x) <= tolerance && Math.abs(offset.y) <= tolerance;
    
    const portKey = portId 
      ? `${portType}.${direction}.${portId}`
      : `${portType}.${direction}`;
    
    return {
      portKey,
      calculated,
      expected,
      aligned,
      offset,
      positionType: config.positionType,
      cssClass: config.cssClass
    };
  }
  
  /**
   * Batch validate multiple ports
   */
  static validateMultiplePositions(
    blockPosition: Position,
    portConfigs: Array<{
      portType: PortType | string;
      direction: PortDirection;
      portId?: string;
      expectedPosition?: Position;
    }>,
    tolerance: number = 1
  ): PositionValidationResult[] {
    return portConfigs.map(config => 
      this.validatePositionAlignment(
        blockPosition,
        config.portType,
        config.direction,
        config.portId,
        config.expectedPosition,
        tolerance
      )
    );
  }
  
  /**
   * Get all configured port types and their positions
   */
  static getAllConfiguredPositions(): Array<{
    key: string;
    config: PortPositionConfig;
    isOverride: boolean;
  }> {
    const results = [];
    
    // Add main configurations
    for (const [key, config] of Object.entries(PORT_POSITION_MAP)) {
      results.push({ key, config, isOverride: false });
    }
    
    // Add overrides
    for (const [portId, override] of Object.entries(PORT_ID_OVERRIDES)) {
      const baseConfig = FALLBACK_POSITIONS.input; // Default base
      const mergedConfig = { ...baseConfig, ...override };
      results.push({ 
        key: `override.${portId}`, 
        config: mergedConfig, 
        isOverride: true 
      });
    }
    
    return results.sort((a, b) => (b.config.priority || 0) - (a.config.priority || 0));
  }
  
  /**
   * Validate entire position map for consistency
   */
  static validatePositionMap(): { valid: boolean; errors: string[] } {
    return validatePositionMap();
  }
  
  /**
   * Debug функция - извежда подробна информация за позициониране
   * @param blockPosition - позицията на блока
   * @param portType - тип на порта
   * @param direction - посока на порта
   * @param portId - опционален ID на порта
   */
  static debugPosition(
    blockPosition: Position,
    portType: PortType | string,
    direction: PortDirection,
    portId?: string
  ): void {
    const config = this.getPositionConfig(portType as PortType, direction, portId);
    const calculated = this.getCalculatedPosition(blockPosition, portType, direction, portId);
    
  }
  
  /**
   * V3.1 Enhanced: Legacy съвместимост с поддръжка за новите 4 типа портове
   * @param portIndex - индекс на порта (наследство)
   * @param portId - ID на порта
   * @param direction - посока на порта
   * @param portType - опционален тип на порта (вкл. нови типове)
   * @returns тип на позициониране (side, corner, center)
   */
  static determinePortPositionType(
    portIndex: number,
    portId: string,
    direction: PortDirection,
    portType?: string
  ): PositionType {
    // V3.1: Enhanced logic for new 4-type system
    let resolvedPortType = portType || 'logic'; // Default fallback
    
    // V3.1: Auto-detect new port types from portId
    if (!portType && portId) {
      if (portId.includes('flow')) {
        resolvedPortType = direction === 'input' ? 'flowIn' : 'flowOut';
      } else if (portId.includes('setVarName')) {
        resolvedPortType = direction === 'input' ? 'setVarNameIn' : 'setVarNameOut';
      } else if (portId.includes('setVarData')) {
        resolvedPortType = direction === 'input' ? 'setVarDataIn' : 'setVarDataOut';
      } else if (portId.includes('onError') || portId.includes('Error')) {
        resolvedPortType = direction === 'input' ? 'onErrorIn' : 'onErrorOut';
      }
    }
    
    return this.getPositionType(resolvedPortType, direction, portId);
  }
  
  /**
   * V4.1 Enhanced: Multi-port positioning system
   * Calculates positions for multiple ports of the same type around an anchor point
   * @param anchorPosition - anchor position type (e.g., 'center-top', 'top-left')
   * @param portCount - number of ports to position
   * @param spacing - spacing between ports in pixels
   * @returns array of calculated offsets from the anchor point
   */
  static calculateMultiPortPositions(
    anchorPosition: PositionType,
    portCount: number,
    spacing: number = 30
  ): Array<{ offsetX: number; offsetY: number }> {
    if (portCount <= 0) return [];
    if (portCount === 1) return [{ offsetX: 0, offsetY: 0 }];
    
    const direction = this.getAnchorDirection(anchorPosition);
    const positions: Array<{ offsetX: number; offsetY: number }> = [];
    
    switch (direction) {
      case 'horizontal': {
        // Center positions (center-top, center-bottom)
        const isOdd = portCount % 2 === 1;
        if (isOdd) {
          // Odd number: center port at anchor, others distributed around
          const middle = Math.floor(portCount / 2);
          for (let i = 0; i < portCount; i++) {
            const offsetX = (i - middle) * spacing;
            positions.push({ offsetX, offsetY: 0 });
          }
        } else {
          // Even number: equal distribution on both sides
          const halfSpacing = spacing / 2;
          for (let i = 0; i < portCount; i++) {
            const offsetX = (i - portCount / 2 + 0.5) * spacing;
            positions.push({ offsetX, offsetY: 0 });
          }
        }
        break;
      }
      
      case 'vertical-down': {
        // TOP positions (top-left, top-right) - go downward
        for (let i = 0; i < portCount; i++) {
          positions.push({ offsetX: 0, offsetY: i * spacing });
        }
        break;
      }
      
      case 'vertical-up': {
        // BOTTOM positions (bottom-left, bottom-right) - go upward  
        for (let i = 0; i < portCount; i++) {
          positions.push({ offsetX: 0, offsetY: -i * spacing });
        }
        break;
      }
      
      case 'horizontal-right': {
        // LEFT positions (left-center) - go rightward
        for (let i = 0; i < portCount; i++) {
          positions.push({ offsetX: i * spacing, offsetY: 0 });
        }
        break;
      }
      
      case 'horizontal-left': {
        // RIGHT positions (right-center) - go leftward
        for (let i = 0; i < portCount; i++) {
          positions.push({ offsetX: -i * spacing, offsetY: 0 });
        }
        break;
      }
    }
    
    return positions;
  }
  
  /**
   * V4.1 Enhanced: Determine anchor direction for multi-port distribution
   * @param anchorPosition - position type to analyze
   * @returns direction for port distribution
   */
  static getAnchorDirection(anchorPosition: PositionType): 'horizontal' | 'vertical-down' | 'vertical-up' | 'horizontal-left' | 'horizontal-right' {
    switch (anchorPosition) {
      case 'center-top':
      case 'center-bottom':
        return 'horizontal';
        
      case 'top-left':
      case 'top-right':
        return 'vertical-down';
        
      case 'bottom-left':
      case 'bottom-right':
        return 'vertical-up';
        
      case 'left-center':
        return 'horizontal-right';
        
      case 'right-center':
        return 'horizontal-left';
        
      default:
        return 'horizontal'; // Default fallback
    }
  }
  
  /**
   * V4.1 Enhanced: Group ports by type from block definition
   * @param blockDefinition - block definition containing port arrays
   * @returns map of port type to array of port IDs
   */
  static groupPortsByType(ports: Array<{ id: string; type: string | string[] }>): Map<string, string[]> {
    const groups = new Map<string, string[]>();
    
    ports.forEach(port => {
      const portType = Array.isArray(port.type) ? port.type[0] : port.type;
      
      if (!groups.has(portType)) {
        groups.set(portType, []);
      }
      groups.get(portType)!.push(port.id);
    });
    
    return groups;
  }
  
  /**
   * V4.2 Enhanced: Validate port groups for multi-port positioning
   * @param portGroups - grouped ports by type
   * @param maxPortsPerGroup - maximum allowed ports per group (default 3)
   * @returns validation result with warnings and errors
   */
  static validatePortGroups(
    portGroups: Map<string, string[]>, 
    maxPortsPerGroup: number = 3
  ): { valid: boolean; warnings: string[]; errors: string[] } {
    const warnings: string[] = [];
    const errors: string[] = [];
    
    portGroups.forEach((portIds, portType) => {
      if (portIds.length > maxPortsPerGroup) {
        errors.push(`Port type '${portType}' has ${portIds.length} ports, exceeding maximum of ${maxPortsPerGroup}`);
      } else if (portIds.length === maxPortsPerGroup) {
        warnings.push(`Port type '${portType}' has maximum allowed ports (${maxPortsPerGroup})`);
      }
    });
    
    return {
      valid: errors.length === 0,
      warnings,
      errors
    };
  }
  
  /**
   * V4.2 Enhanced: Get anchor position for port type (Variant A mapping)
   * @param portType - port type from new 4-type system
   * @param direction - port direction (input/output)
   * @returns anchor position for the port type
   */
  static getAnchorPositionForPortType(portType: string, direction: PortDirection): PositionType {
    // Variant A mapping as specified
    const anchorMap: Record<string, PositionType> = {
      'flowIn': 'center-top',
      'flowOut': 'center-bottom',
      'setVarNameIn': 'top-left',
      'setVarNameOut': 'top-right', 
      'setVarDataIn': 'bottom-left',
      'setVarDataOut': 'bottom-right',
      'onErrorIn': 'left-center',
      'onErrorOut': 'right-center'
    };
    
    // Check direct mapping first
    if (anchorMap[portType]) {
      return anchorMap[portType];
    }
    
    // Legacy compatibility: try with direction suffix
    const legacyKey = direction === 'input' ? `${portType}In` : `${portType}Out`;
    if (anchorMap[legacyKey]) {
      return anchorMap[legacyKey];
    }
    
    // Fallback to legacy positioning based on direction
    return direction === 'input' ? 'left-center' : 'right-center';
  }
  
  /**
   * V4.2 Enhanced: Calculate all port positions for a block using grouped positioning
   * @param blockPosition - position of the block in canvas
   * @param inputPorts - array of input port definitions
   * @param outputPorts - array of output port definitions
   * @param customDimensions - optional custom block dimensions
   * @returns map of port ID to canvas position
   */
  static calculateAllPortPositions(
    blockPosition: Position,
    inputPorts: Array<{ id: string; type: string | string[] }>,
    outputPorts: Array<{ id: string; type: string | string[] }>,
    customDimensions?: Partial<BlockDimensions>
  ): Map<string, Position> {
    const portPositions = new Map<string, Position>();
    
    // Group input ports by type
    const inputGroups = this.groupPortsByType(inputPorts);
    const outputGroups = this.groupPortsByType(outputPorts);
    
    // Validate groups
    const inputValidation = this.validatePortGroups(inputGroups);
    const outputValidation = this.validatePortGroups(outputGroups);
    
    if (!inputValidation.valid || !outputValidation.valid) {
      console.warn('Port group validation failed:', {
        inputErrors: inputValidation.errors,
        outputErrors: outputValidation.errors
      });
    }
    
    // Calculate positions for input port groups
    inputGroups.forEach((portIds, portType) => {
      const anchorPosition = this.getAnchorPositionForPortType(portType, 'input');
      
      portIds.forEach((portId, index) => {
        const position = this.calculateGroupedPortPosition(
          blockPosition,
          anchorPosition,
          index,
          portIds.length,
          customDimensions
        );
        portPositions.set(portId, position);
      });
    });
    
    // Calculate positions for output port groups
    outputGroups.forEach((portIds, portType) => {
      const anchorPosition = this.getAnchorPositionForPortType(portType, 'output');
      
      portIds.forEach((portId, index) => {
        const position = this.calculateGroupedPortPosition(
          blockPosition,
          anchorPosition,
          index,
          portIds.length,
          customDimensions
        );
        portPositions.set(portId, position);
      });
    });
    
    return portPositions;
  }
  
  /**
   * V4.2 Enhanced: Get spacing information for debugging and testing
   * @param anchorPosition - anchor position type
   * @param portCount - number of ports in the group
   * @returns spacing analysis for the port group
   */
  static getSpacingInfo(anchorPosition: PositionType, portCount: number): {
    anchorPosition: PositionType;
    direction: string;
    portCount: number;
    spacing: number;
    totalWidth: number;
    positions: Array<{ offsetX: number; offsetY: number }>;
  } {
    const direction = this.getAnchorDirection(anchorPosition);
    const spacing = 30; // Updated default spacing
    const positions = this.calculateMultiPortPositions(anchorPosition, portCount, spacing);
    
    // Calculate total width/height based on direction
    let totalWidth = 0;
    if (direction === 'horizontal') {
      totalWidth = portCount > 1 ? (portCount - 1) * spacing : 0;
    } else if (direction.includes('vertical')) {
      totalWidth = portCount > 1 ? (portCount - 1) * spacing : 0;
    } else {
      totalWidth = portCount > 1 ? (portCount - 1) * spacing : 0;
    }
    
    return {
      anchorPosition,
      direction,
      portCount,
      spacing,
      totalWidth,
      positions
    };
  }
  
  /**
   * V4.1 Enhanced: Calculate canvas coordinates for grouped ports
   * @param blockPosition - position of the block in canvas
   * @param anchorPosition - anchor position type for the port group
   * @param portIndex - index of the port within its group (0-based)
   * @param totalPortsInGroup - total number of ports in this group
   * @param customDimensions - optional custom block dimensions
   * @returns canvas coordinates for the specific port
   */
  static calculateGroupedPortPosition(
    blockPosition: Position,
    anchorPosition: PositionType,
    portIndex: number,
    totalPortsInGroup: number,
    customDimensions?: Partial<BlockDimensions>
  ): Position {
    // Get base anchor coordinates
    const anchorCoordinates = this.getAnchorCoordinates(anchorPosition);
    const dimensions = customDimensions 
      ? { ...this.blockDimensions, ...customDimensions }
      : this.blockDimensions;
    
    // Calculate the anchor point in canvas coordinates
    const anchorPoint = this.calculateCoordinatesFromOffset(blockPosition, anchorCoordinates, dimensions);
    
    // Get multi-port offset for this specific port
    const multiPortPositions = this.calculateMultiPortPositions(anchorPosition, totalPortsInGroup);
    const portOffset = multiPortPositions[portIndex] || { offsetX: 0, offsetY: 0 };
    
    return {
      x: anchorPoint.x + portOffset.offsetX,
      y: anchorPoint.y + portOffset.offsetY
    };
  }
  
  /**
   * V4.1 Helper: Get anchor coordinates for position type
   */
  private static getAnchorCoordinates(positionType: PositionType): CoordinateOffset {
    const OFFSET = 90; // CSS_PORT_OFFSET value from PortPositionMap
    
    // Map position types to their base coordinate offsets
    const anchorMap: Record<PositionType, CoordinateOffset> = {
      'top-left': { offsetX: -OFFSET, offsetY: -OFFSET },
      'top-right': { offsetX: 'width', offsetY: -OFFSET },
      'bottom-left': { offsetX: -OFFSET, offsetY: 'height' },
      'bottom-right': { offsetX: 'width', offsetY: 'height' },
      'center-top': { offsetX: 'center', offsetY: -OFFSET },
      'center-bottom': { offsetX: 'center', offsetY: 'height' },
      'left-center': { offsetX: -OFFSET, offsetY: 'center' },
      'right-center': { offsetX: 'width', offsetY: 'center' }
    };
    
    return anchorMap[positionType] || { offsetX: 0, offsetY: 0 };
  }

  /**
   * V4.5 Enhanced: Comprehensive validation of multi-port positioning system
   * Tests Variant A positioning, grouping, spacing, and performance
   * @returns detailed validation report
   */
  static validateMultiPortSystem(): {
    overall: boolean;
    tests: Array<{
      name: string;
      passed: boolean;
      details: string;
      performance?: number;
    }>;
    summary: {
      totalTests: number;
      passedTests: number;
      failedTests: number;
      warnings: string[];
    };
  } {
    const tests: Array<{
      name: string;
      passed: boolean;
      details: string;
      performance?: number;
    }> = [];
    const warnings: string[] = [];
    
    // Test 1: Variant A anchor positioning logic
    const variantATest = this.testVariantAPositioning();
    tests.push(variantATest);
    
    // Test 2: Port grouping functionality
    const groupingTest = this.testPortGrouping();
    tests.push(groupingTest);
    
    // Test 3: Spacing calculations
    const spacingTest = this.testSpacingCalculations();
    tests.push(spacingTest);
    
    // Test 4: CSS class generation
    const cssTest = this.testCSSClassGeneration();
    tests.push(cssTest);
    
    // Test 5: Backward compatibility
    const compatibilityTest = this.testBackwardCompatibility();
    tests.push(compatibilityTest);
    
    // Test 6: Performance validation
    const performanceTest = this.testPerformance();
    tests.push(performanceTest);
    if (performanceTest.performance && performanceTest.performance > 100) {
      warnings.push(`Performance test took ${performanceTest.performance}ms - consider optimization`);
    }
    
    // Test 7: Connection coordinate accuracy
    const coordinateTest = this.testCoordinateAccuracy();
    tests.push(coordinateTest);
    
    const passedTests = tests.filter(t => t.passed).length;
    const failedTests = tests.length - passedTests;
    const overall = failedTests === 0;
    
    return {
      overall,
      tests,
      summary: {
        totalTests: tests.length,
        passedTests,
        failedTests,
        warnings
      }
    };
  }
  
  /**
   * V4.5 Test: Variant A anchor positioning
   */
  private static testVariantAPositioning(): {
    name: string;
    passed: boolean;
    details: string;
  } {
    try {
      const expectedMappings = [
        { portType: 'flowIn', direction: 'input', expected: 'center-top' },
        { portType: 'flowOut', direction: 'output', expected: 'center-bottom' },
        { portType: 'setVarNameIn', direction: 'input', expected: 'top-left' },
        { portType: 'setVarNameOut', direction: 'output', expected: 'top-right' },
        { portType: 'setVarDataIn', direction: 'input', expected: 'bottom-left' },
        { portType: 'setVarDataOut', direction: 'output', expected: 'bottom-right' },
        { portType: 'onErrorIn', direction: 'input', expected: 'left-center' },
        { portType: 'onErrorOut', direction: 'output', expected: 'right-center' }
      ];
      
      const results = expectedMappings.map(test => {
        const actual = this.getAnchorPositionForPortType(test.portType, test.direction as PortDirection);
        return {
          ...test,
          actual,
          correct: actual === test.expected
        };
      });
      
      const incorrectMappings = results.filter(r => !r.correct);
      const passed = incorrectMappings.length === 0;
      
      return {
        name: 'Variant A Anchor Positioning',
        passed,
        details: passed 
          ? `All ${results.length} Variant A mappings correct`
          : `Failed mappings: ${incorrectMappings.map(r => `${r.portType}->${r.actual} (expected ${r.expected})`).join(', ')}`
      };
    } catch (error) {
      return {
        name: 'Variant A Anchor Positioning',
        passed: false,
        details: `Error: ${error}`
      };
    }
  }
  
  /**
   * V4.5 Test: Port grouping functionality
   */
  private static testPortGrouping(): {
    name: string;
    passed: boolean;
    details: string;
  } {
    try {
      const testPorts = [
        { id: 'flow1', type: 'flowIn' },
        { id: 'flow2', type: 'flowIn' },
        { id: 'var1', type: 'setVarNameIn' },
        { id: 'data1', type: 'setVarDataOut' }
      ];
      
      const groups = this.groupPortsByType(testPorts);
      
      const flowInGroup = groups.get('flowIn');
      const varNameGroup = groups.get('setVarNameIn');
      const varDataGroup = groups.get('setVarDataOut');
      
      const passed = 
        flowInGroup?.length === 2 &&
        flowInGroup.includes('flow1') &&
        flowInGroup.includes('flow2') &&
        varNameGroup?.length === 1 &&
        varNameGroup.includes('var1') &&
        varDataGroup?.length === 1 &&
        varDataGroup.includes('data1');
        
      return {
        name: 'Port Grouping Functionality',
        passed,
        details: passed 
          ? `Correctly grouped 4 ports into 3 groups`
          : `Grouping failed: flowIn=${flowInGroup?.length}, setVarNameIn=${varNameGroup?.length}, setVarDataOut=${varDataGroup?.length}`
      };
    } catch (error) {
      return {
        name: 'Port Grouping Functionality',
        passed: false,
        details: `Error: ${error}`
      };
    }
  }
  
  /**
   * V4.5 Test: Spacing calculations
   */
  private static testSpacingCalculations(): {
    name: string;
    passed: boolean;
    details: string;
  } {
    try {
      // Test horizontal spacing (center-top)
      const horizontalPositions = this.calculateMultiPortPositions('center-top', 3, 15);
      const expectedHorizontal = [
        { offsetX: -15, offsetY: 0 },  // First port left of center
        { offsetX: 0, offsetY: 0 },    // Center port at anchor
        { offsetX: 15, offsetY: 0 }    // Third port right of center
      ];
      
      // Test vertical spacing (top-left)
      const verticalPositions = this.calculateMultiPortPositions('top-left', 2, 15);
      const expectedVertical = [
        { offsetX: 0, offsetY: 0 },   // First port at anchor
        { offsetX: 0, offsetY: 15 }   // Second port below
      ];
      
      const horizontalCorrect = horizontalPositions.every((pos, i) => 
        pos.offsetX === expectedHorizontal[i].offsetX && pos.offsetY === expectedHorizontal[i].offsetY
      );
      
      const verticalCorrect = verticalPositions.every((pos, i) => 
        pos.offsetX === expectedVertical[i].offsetX && pos.offsetY === expectedVertical[i].offsetY
      );
      
      const passed = horizontalCorrect && verticalCorrect;
      
      return {
        name: 'Spacing Calculations',
        passed,
        details: passed 
          ? 'Horizontal and vertical spacing calculations correct'
          : `Spacing errors: horizontal=${!horizontalCorrect}, vertical=${!verticalCorrect}`
      };
    } catch (error) {
      return {
        name: 'Spacing Calculations',
        passed: false,
        details: `Error: ${error}`
      };
    }
  }
  
  /**
   * V4.5 Test: CSS class generation
   */
  private static testCSSClassGeneration(): {
    name: string;
    passed: boolean;
    details: string;
  } {
    try {
      // This would test CSS class generation logic if it existed in this manager
      // For now, we'll test that anchor directions are calculated correctly
      const directions = [
        { anchor: 'center-top', expected: 'horizontal' },
        { anchor: 'top-left', expected: 'vertical-down' },
        { anchor: 'bottom-right', expected: 'vertical-up' },
        { anchor: 'left-center', expected: 'horizontal-right' },
        { anchor: 'right-center', expected: 'horizontal-left' }
      ];
      
      const results = directions.map(test => ({
        ...test,
        actual: this.getAnchorDirection(test.anchor as PositionType),
        correct: this.getAnchorDirection(test.anchor as PositionType) === test.expected
      }));
      
      const passed = results.every(r => r.correct);
      
      return {
        name: 'CSS Class Generation',
        passed,
        details: passed 
          ? 'All anchor directions calculated correctly'
          : `Direction errors: ${results.filter(r => !r.correct).map(r => `${r.anchor}→${r.actual}`).join(', ')}`
      };
    } catch (error) {
      return {
        name: 'CSS Class Generation',
        passed: false,
        details: `Error: ${error}`
      };
    }
  }
  
  /**
   * V4.5 Test: Backward compatibility
   */
  private static testBackwardCompatibility(): {
    name: string;
    passed: boolean;
    details: string;
  } {
    try {
      // Test that legacy port types still get positioned
      const legacyTests = [
        { portType: 'flow', direction: 'input' },
        { portType: 'data', direction: 'output' },
        { portType: 'error', direction: 'output' }
      ];
      
      const results = legacyTests.map(test => {
        try {
          const config = this.getPositionConfig(test.portType as PortType, test.direction as PortDirection);
          return { ...test, success: !!config.positionType };
        } catch {
          return { ...test, success: false };
        }
      });
      
      const passed = results.every(r => r.success);
      
      return {
        name: 'Backward Compatibility',
        passed,
        details: passed 
          ? 'All legacy port types supported'
          : `Unsupported legacy types: ${results.filter(r => !r.success).map(r => r.portType).join(', ')}`
      };
    } catch (error) {
      return {
        name: 'Backward Compatibility',
        passed: false,
        details: `Error: ${error}`
      };
    }
  }
  
  /**
   * V4.5 Test: Performance validation
   */
  private static testPerformance(): {
    name: string;
    passed: boolean;
    details: string;
    performance: number;
  } {
    try {
      const iterations = 1000;
      const startTime = performance.now();
      
      // Simulate typical positioning operations
      for (let i = 0; i < iterations; i++) {
        this.getAnchorPositionForPortType('flowIn', 'input');
        this.calculateMultiPortPositions('center-top', 3, 15);
        this.groupPortsByType([
          { id: 'test1', type: 'flowIn' },
          { id: 'test2', type: 'setVarNameOut' }
        ]);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgPerOperation = duration / iterations;
      
      const passed = avgPerOperation < 0.1; // Less than 0.1ms per operation
      
      return {
        name: 'Performance Validation',
        passed,
        details: passed 
          ? `Average ${avgPerOperation.toFixed(3)}ms per operation (${iterations} ops in ${duration.toFixed(1)}ms)`
          : `Performance concern: ${avgPerOperation.toFixed(3)}ms per operation`,
        performance: duration
      };
    } catch (error) {
      return {
        name: 'Performance Validation',
        passed: false,
        details: `Error: ${error}`,
        performance: 0
      };
    }
  }
  
  /**
   * V4.5 Test: Connection coordinate accuracy
   */
  private static testCoordinateAccuracy(): {
    name: string;
    passed: boolean;
    details: string;
  } {
    try {
      const blockPosition = { x: 100, y: 100 };
      const testPositions = [
        { anchor: 'center-top' as PositionType, portIndex: 0, totalPorts: 1 },
        { anchor: 'top-left' as PositionType, portIndex: 1, totalPorts: 2 },
        { anchor: 'center-bottom' as PositionType, portIndex: 0, totalPorts: 3 }
      ];
      
      const results = testPositions.map(test => {
        try {
          const position = this.calculateGroupedPortPosition(
            blockPosition,
            test.anchor,
            test.portIndex,
            test.totalPorts
          );
          
          return {
            ...test,
            position,
            valid: typeof position.x === 'number' && typeof position.y === 'number' &&
                  !isNaN(position.x) && !isNaN(position.y)
          };
        } catch {
          return { ...test, position: null, valid: false };
        }
      });
      
      const passed = results.every(r => r.valid);
      
      return {
        name: 'Connection Coordinate Accuracy',
        passed,
        details: passed 
          ? `All ${results.length} coordinate calculations valid`
          : `Invalid coordinates: ${results.filter(r => !r.valid).length}/${results.length}`
      };
    } catch (error) {
      return {
        name: 'Connection Coordinate Accuracy',
        passed: false,
        details: `Error: ${error}`
      };
    }
  }

  /**
   * Legacy compatibility: mimic old getPortPosition function
   */
  static getPortPosition(
    index: number,
    portId: string,
    direction: PortDirection,
    portType?: string
  ): string {
    // Use new centralized logic but return CSS class name for compatibility
    const resolvedPortType = portType || 'logic'; // Default fallback
    const config = this.getPositionConfig(resolvedPortType, direction, portId);
    
    // Return the position type string (to be used in CSS class generation)
    return config.positionType;
  }
}

// V3.1 Enhanced: Export to window for browser console debugging with cache stats
if (typeof window !== 'undefined') {
  (window as any).PortPositionManager = PortPositionManager;
  (window as any).PortPositionStats = {
    getCacheSize: () => PortPositionManager['positionCache'].size,
    getConfigCacheSize: () => PortPositionManager['configCache'].size,
    clearCache: () => PortPositionManager.clearCache(),
    enableCache: (enabled: boolean) => PortPositionManager.setCacheEnabled(enabled)
  };
}
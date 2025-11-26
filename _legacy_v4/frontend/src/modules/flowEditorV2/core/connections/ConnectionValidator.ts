/**
 * 📦 FlowEditor v3 - Connection Validator
 * ✅ Част от основната редакторна система
 * Валидатор за връзки между блок портове
 * Последна проверка: 2025-01-26
 */

import type { 
  BlockInstance, 
  BlockConnection, 
  PortDefinition, 
  PortType,
  CompositePortType 
} from '../../types/BlockConcept';
// ❌ Legacy import removed - using adapter now
// import { BlockFactory } from '../blocks/legacy-BlockFactory';
import { getBlockDefinition } from '../../ui/adapters/BlockFactoryAdapter';
import { PortManager } from '../ports/PortManager';

export interface ConnectionValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
  compatibility: 'compatible' | 'convertible' | 'incompatible';
}

export interface PortConnectionInfo {
  blockId: string;
  portId: string;
  portType: CompositePortType;
  isInput: boolean;
  isOutput: boolean;
  maxConnections?: number;
  currentConnections: number;
}

export class ConnectionValidator {
  
  /**
   * Validates a potential connection between two ports
   */
  static validateConnection(
    sourceBlock: BlockInstance,
    sourcePortId: string,
    targetBlock: BlockInstance,
    targetPortId: string
  ): ConnectionValidationResult {
    
    // Get port definitions from adapter (tries new system first, then legacy)
    const sourceBlockDef = getBlockDefinition(sourceBlock.definitionId);
    const targetBlockDef = getBlockDefinition(targetBlock.definitionId);
    
    if (!sourceBlockDef || !targetBlockDef) {
      return {
        isValid: false,
        error: 'Block definition not found',
        compatibility: 'incompatible'
      };
    }
    
    const sourcePort = sourceBlockDef.outputs.find(p => p.id === sourcePortId);
    const targetPort = targetBlockDef.inputs.find(p => p.id === targetPortId);
    
    if (!sourcePort || !targetPort) {
      return {
        isValid: false,
        error: 'Port not found',
        compatibility: 'incompatible'
      };
    }
    
    // Basic validation checks
    const basicValidation = this.performBasicValidation(
      sourceBlock, sourcePort, targetBlock, targetPort
    );
    
    if (!basicValidation.isValid) {
      return basicValidation;
    }
    
    // Type compatibility check
    const sourceType = Array.isArray(sourcePort.type) ? sourcePort.type[0] : sourcePort.type;
    const targetType = Array.isArray(targetPort.type) ? targetPort.type[0] : targetPort.type;
    
    const isCompatible = PortManager.arePortsCompatible(sourceType, targetType);
    
    if (!isCompatible) {
      return {
        isValid: false,
        error: `Incompatible port types: ${this.formatPortType(sourcePort.type)} → ${this.formatPortType(targetPort.type)}`,
        compatibility: 'incompatible'
      };
    }
    
    // Connection limit validation
    const connectionLimitResult = this.validateConnectionLimits(
      sourceBlock, sourcePortId, targetBlock, targetPortId
    );
    
    if (!connectionLimitResult.isValid) {
      return connectionLimitResult;
    }
    
    // Circular dependency check
    const circularResult = this.checkCircularDependency(sourceBlock, targetBlock);
    if (!circularResult.isValid) {
      return circularResult;
    }
    
    // Success with potential warnings
    const result: ConnectionValidationResult = {
      isValid: true,
      compatibility: sourceType === targetType ? 'compatible' : 'convertible'
    };
    
    // Add warnings if needed
    if (sourceType !== targetType) {
      result.warning = `Type conversion: ${this.formatPortType(sourcePort.type)} → ${this.formatPortType(targetPort.type)}`;
    }
    
    return result;
  }
  
  /**
   * Validates an existing connection
   */
  static validateExistingConnection(
    connection: BlockConnection,
    blocks: BlockInstance[]
  ): ConnectionValidationResult {
    
    const sourceBlock = blocks.find(b => b.id === connection.sourceBlockId);
    const targetBlock = blocks.find(b => b.id === connection.targetBlockId);
    
    if (!sourceBlock || !targetBlock) {
      return {
        isValid: false,
        error: 'Connected block not found',
        compatibility: 'incompatible'
      };
    }
    
    return this.validateConnection(
      sourceBlock,
      connection.sourcePortId,
      targetBlock,
      connection.targetPortId
    );
  }
  
  /**
   * Gets detailed information about a port's connections
   */
  static getPortConnectionInfo(
    block: BlockInstance,
    portId: string,
    connections: BlockConnection[]
  ): PortConnectionInfo {
    
    const blockDef = getBlockDefinition(block.definitionId);
    if (!blockDef) {
      throw new Error(`Block definition not found: ${block.definitionId}`);
    }
    
    // Find port in inputs or outputs
    let port = blockDef.inputs.find(p => p.id === portId);
    let isInput = true;
    let isOutput = false;
    
    if (!port) {
      port = blockDef.outputs.find(p => p.id === portId);
      isInput = false;
      isOutput = true;
    }
    
    if (!port) {
      throw new Error(`Port not found: ${portId} in block ${block.id}`);
    }
    
    // Count current connections
    const currentConnections = isInput 
      ? connections.filter(c => c.targetBlockId === block.id && c.targetPortId === portId).length
      : connections.filter(c => c.sourceBlockId === block.id && c.sourcePortId === portId).length;
    
    return {
      blockId: block.id,
      portId,
      portType: port.type,
      isInput,
      isOutput,
      maxConnections: this.getMaxConnections(port, isInput),
      currentConnections
    };
  }
  
  /**
   * Checks if a port can accept more connections
   */
  static canPortAcceptConnection(
    block: BlockInstance,
    portId: string,
    connections: BlockConnection[]
  ): boolean {
    
    try {
      const portInfo = this.getPortConnectionInfo(block, portId, connections);
      
      if (portInfo.maxConnections === undefined) {
        return true; // No limit
      }
      
      return portInfo.currentConnections < portInfo.maxConnections;
    } catch {
      return false;
    }
  }
  
  /**
   * Validates all connections in a flow
   */
  static validateAllConnections(
    blocks: BlockInstance[],
    connections: BlockConnection[]
  ): {
    validConnections: BlockConnection[];
    invalidConnections: Array<{ connection: BlockConnection; error: string }>;
  } {
    
    const validConnections: BlockConnection[] = [];
    const invalidConnections: Array<{ connection: BlockConnection; error: string }> = [];
    
    for (const connection of connections) {
      const result = this.validateExistingConnection(connection, blocks);
      
      if (result.isValid) {
        validConnections.push(connection);
      } else {
        invalidConnections.push({
          connection,
          error: result.error || 'Unknown validation error'
        });
      }
    }
    
    return { validConnections, invalidConnections };
  }
  
  /**
   * Validates export data consistency - ensures all connections reference existing blocks
   */
  static validateExportConsistency(
    blocks: BlockInstance[],
    connections: BlockConnection[]
  ): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    orphanedConnections: BlockConnection[];
    missingBlocks: string[];
    validConnections: BlockConnection[];
  } {
    
    const errors: string[] = [];
    const warnings: string[] = [];
    const orphanedConnections: BlockConnection[] = [];
    const missingBlocks = new Set<string>();
    const validConnections: BlockConnection[] = [];
    
    // Create block ID lookup for fast checking
    const blockIds = new Set(blocks.map(block => block.id));
    
    // Check each connection
    for (const connection of connections) {
      const sourceExists = blockIds.has(connection.sourceBlockId);
      const targetExists = blockIds.has(connection.targetBlockId);
      
      if (!sourceExists) {
        missingBlocks.add(connection.sourceBlockId);
      }
      
      if (!targetExists) {
        missingBlocks.add(connection.targetBlockId);
      }
      
      if (!sourceExists || !targetExists) {
        orphanedConnections.push(connection);
        const missingBlockIds = [];
        if (!sourceExists) missingBlockIds.push(connection.sourceBlockId);
        if (!targetExists) missingBlockIds.push(connection.targetBlockId);
        
        errors.push(
          `Connection ${connection.id} references missing block(s): ${missingBlockIds.join(', ')}`
        );
      } else {
        validConnections.push(connection);
      }
    }
    
    // Generate summary
    if (orphanedConnections.length > 0) {
      errors.push(
        `Found ${orphanedConnections.length} orphaned connections referencing ${missingBlocks.size} missing blocks`
      );
    }
    
    if (missingBlocks.size > 0) {
      warnings.push(
        `Missing blocks: ${Array.from(missingBlocks).join(', ')}`
      );
    }
    
    const isValid = errors.length === 0;
    
    return {
      isValid,
      errors,
      warnings,
      orphanedConnections,
      missingBlocks: Array.from(missingBlocks),
      validConnections
    };
  }
  
  /**
   * Collects all blocks referenced by connections (for complete export)
   */
  static collectReferencedBlocks(
    blocks: BlockInstance[],
    connections: BlockConnection[]
  ): {
    directBlocks: BlockInstance[];
    referencedBlocks: BlockInstance[];
    missingBlockIds: string[];
  } {
    
    const blockMap = new Map(blocks.map(block => [block.id, block]));
    const referencedBlockIds = new Set<string>();
    const missingBlockIds: string[] = [];
    
    // Collect all block IDs referenced by connections
    for (const connection of connections) {
      referencedBlockIds.add(connection.sourceBlockId);
      referencedBlockIds.add(connection.targetBlockId);
    }
    
    // Find blocks that exist vs missing
    const referencedBlocks: BlockInstance[] = [];
    for (const blockId of referencedBlockIds) {
      const block = blockMap.get(blockId);
      if (block) {
        referencedBlocks.push(block);
      } else {
        missingBlockIds.push(blockId);
      }
    }
    
    return {
      directBlocks: blocks,
      referencedBlocks,
      missingBlockIds
    };
  }
  
  // Private helper methods
  
  private static performBasicValidation(
    sourceBlock: BlockInstance,
    sourcePort: PortDefinition,
    targetBlock: BlockInstance,
    targetPort: PortDefinition
  ): ConnectionValidationResult {
    
    // Cannot connect block to itself
    if (sourceBlock.id === targetBlock.id) {
      return {
        isValid: false,
        error: 'Cannot connect block to itself',
        compatibility: 'incompatible'
      };
    }
    
    // Source must be output, target must be input
    if (!sourcePort || !targetPort) {
      return {
        isValid: false,
        error: 'Invalid port configuration',
        compatibility: 'incompatible'
      };
    }
    
    return { isValid: true, compatibility: 'compatible' };
  }
  
  private static validateConnectionLimits(
    sourceBlock: BlockInstance,
    sourcePortId: string,
    targetBlock: BlockInstance,
    targetPortId: string
  ): ConnectionValidationResult {
    
    // For now, assume input ports accept only one connection
    // Output ports can have multiple connections
    const targetConnections = targetBlock.connections.inputs[targetPortId] || [];
    
    if (targetConnections.length > 0) {
      return {
        isValid: false,
        error: 'Target port already has a connection (single connection limit)',
        compatibility: 'incompatible'
      };
    }
    
    return { isValid: true, compatibility: 'compatible' };
  }
  
  private static checkCircularDependency(
    sourceBlock: BlockInstance,
    targetBlock: BlockInstance
  ): ConnectionValidationResult {
    
    // TODO: IMPLEMENT_LATER - Full circular dependency detection
    // For now, basic check that prevents immediate loops
    
    if (sourceBlock.id === targetBlock.id) {
      return {
        isValid: false,
        error: 'Circular dependency detected',
        compatibility: 'incompatible'
      };
    }
    
    return { isValid: true, compatibility: 'compatible' };
  }
  
  private static getMaxConnections(port: PortDefinition, isInput: boolean): number | undefined {
    // Input ports typically accept only one connection
    // Output ports can have multiple connections
    return isInput ? 1 : undefined;
  }
  
  private static formatPortType(portType: CompositePortType): string {
    if (Array.isArray(portType)) {
      return portType.join(' | ');
    }
    return portType;
  }
}

// Debug function for connection troubleshooting
export function debugValidateConnection(
  sourcePort: PortDefinition, 
  targetPort: PortDefinition
): string {
  const sourceType = Array.isArray(sourcePort.type) ? sourcePort.type[0] : sourcePort.type;
  const targetType = Array.isArray(targetPort.type) ? targetPort.type[0] : targetPort.type;
  
  const isCompatible = PortManager.arePortsCompatible(sourceType, targetType);
  
  // TODO: IMPLEMENT_LATER - Add debug logging for port compatibility analysis
  
  return `${sourceType} → ${targetType}: ${isCompatible ? 'COMPATIBLE' : 'INCOMPATIBLE'}`;
}

// Helper function for external use
export function validateConnection(
  source: { block: BlockInstance; portId: string },
  target: { block: BlockInstance; portId: string }
): ConnectionValidationResult {
  return ConnectionValidator.validateConnection(
    source.block,
    source.portId,
    target.block,
    target.portId
  );
}

// Export validation result types
export type { ConnectionValidationResult, PortConnectionInfo };
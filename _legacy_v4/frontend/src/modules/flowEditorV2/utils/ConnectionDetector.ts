/**
 * 📦 Universal Connection Detector
 * ✅ Detects connected blocks to specific ports across the entire flow
 * Universal utility for any block type and port combination
 * 
 * Created: 2025-08-03
 * Version: 1.0.0
 */

import type { BlockInstance, BlockConnection } from '../types/BlockConcept';

// Connection result interface
export interface ConnectedBlockInfo {
  blockId: string;
  block: BlockInstance;
  sourcePortId: string;
  targetPortId: string;
  connectionId: string;
  variableName?: string; // For setVarData blocks
  blockType?: string;    // Block definition type
}

// Connection detection result
export interface ConnectionDetectionResult {
  hasConnection: boolean;
  connectedBlocks: ConnectedBlockInfo[];
  connectionCount: number;
}

/**
 * Universal Connection Detector Class
 * Provides comprehensive connection detection and analysis
 */
export class ConnectionDetector {
  
  /**
   * Main function: Detects connected blocks to a specific port
   * @param targetBlockId - ID of the block to check
   * @param targetPortId - ID of the port to check (e.g., 'setVarDataIn', 'flowIn')
   * @param portDirection - 'input' or 'output'
   * @param workspaceBlocks - All blocks in the workspace
   * @param connections - All connections in the flow
   * @returns Connection detection result
   */
  static getConnectedBlocks(
    targetBlockId: string,
    targetPortId: string,
    portDirection: 'input' | 'output',
    workspaceBlocks: BlockInstance[],
    connections: BlockConnection[]
  ): ConnectionDetectionResult {
    
    const connectedBlocks: ConnectedBlockInfo[] = [];
    
    // Filter connections based on direction
    const relevantConnections = connections.filter(conn => {
      if (portDirection === 'input') {
        return conn.targetBlockId === targetBlockId && conn.targetPortId === targetPortId;
      } else {
        return conn.sourceBlockId === targetBlockId && conn.sourcePortId === targetPortId;
      }
    });
    
    // Process each relevant connection
    for (const connection of relevantConnections) {
      const connectedBlockId = portDirection === 'input' 
        ? connection.sourceBlockId 
        : connection.targetBlockId;
        
      const connectedBlock = workspaceBlocks.find(block => block.id === connectedBlockId);
      
      if (connectedBlock) {
        const blockInfo: ConnectedBlockInfo = {
          blockId: connectedBlock.id,
          block: connectedBlock,
          sourcePortId: connection.sourcePortId,
          targetPortId: connection.targetPortId,
          connectionId: connection.id,
          blockType: connectedBlock.definitionId
        };
        
        // Special handling for setVarData blocks - extract variable name
        if (connectedBlock.definitionId === 'setVarData') {
          blockInfo.variableName = connectedBlock.parameters?.sourceVariable || 'unknown';
        }
        
        // Special handling for setVarName blocks - extract variable name
        if (connectedBlock.definitionId === 'setVarName') {
          blockInfo.variableName = connectedBlock.parameters?.internalVar || 'unknown';
        }
        
        connectedBlocks.push(blockInfo);
      }
    }
    
    return {
      hasConnection: connectedBlocks.length > 0,
      connectedBlocks,
      connectionCount: connectedBlocks.length
    };
  }
  
  /**
   * Quick check: Does a port have any connections?
   * @param blockId - Block ID to check
   * @param portId - Port ID to check
   * @param portDirection - 'input' or 'output'
   * @param workspaceBlocks - All workspace blocks
   * @param connections - All connections
   * @returns True if port has connections
   */
  static hasConnection(
    blockId: string,
    portId: string,
    portDirection: 'input' | 'output',
    workspaceBlocks: BlockInstance[],
    connections: BlockConnection[]
  ): boolean {
    const result = this.getConnectedBlocks(blockId, portId, portDirection, workspaceBlocks, connections);
    return result.hasConnection;
  }
  
  /**
   * Get first connected block (most common use case)
   * @param blockId - Block ID to check
   * @param portId - Port ID to check
   * @param portDirection - 'input' or 'output'
   * @param workspaceBlocks - All workspace blocks
   * @param connections - All connections
   * @returns First connected block or null
   */
  static getFirstConnectedBlock(
    blockId: string,
    portId: string,
    portDirection: 'input' | 'output',
    workspaceBlocks: BlockInstance[],
    connections: BlockConnection[]
  ): ConnectedBlockInfo | null {
    const result = this.getConnectedBlocks(blockId, portId, portDirection, workspaceBlocks, connections);
    return result.connectedBlocks[0] || null;
  }
  
  /**
   * Get connected blocks of specific type
   * @param blockId - Block ID to check
   * @param portId - Port ID to check
   * @param portDirection - 'input' or 'output'
   * @param targetBlockType - Filter by block type (e.g., 'setVarData')
   * @param workspaceBlocks - All workspace blocks
   * @param connections - All connections
   * @returns Connected blocks of specified type
   */
  static getConnectedBlocksByType(
    blockId: string,
    portId: string,
    portDirection: 'input' | 'output',
    targetBlockType: string,
    workspaceBlocks: BlockInstance[],
    connections: BlockConnection[]
  ): ConnectedBlockInfo[] {
    const result = this.getConnectedBlocks(blockId, portId, portDirection, workspaceBlocks, connections);
    return result.connectedBlocks.filter(block => block.blockType === targetBlockType);
  }
  
  /**
   * Helper: Get variable name from connected setVarData block
   * Specific use case for Loop blocks
   * @param loopBlockId - Loop block ID
   * @param workspaceBlocks - All workspace blocks
   * @param connections - All connections
   * @returns Variable name or null
   */
  static getLoopConnectedVariableName(
    loopBlockId: string,
    workspaceBlocks: BlockInstance[],
    connections: BlockConnection[]
  ): string | null {
    const connectedSetVarData = this.getConnectedBlocksByType(
      loopBlockId, 
      'setVarDataIn', 
      'input', 
      'setVarData',
      workspaceBlocks,
      connections
    );
    
    if (connectedSetVarData.length > 0) {
      return connectedSetVarData[0].variableName || null;
    }
    
    return null;
  }

  /**
   * Helper: Get variable name from second setVarData connection (comparison value)
   * Specific use case for Loop blocks - setVarDataIn2 port
   * @param loopBlockId - Loop block ID
   * @param workspaceBlocks - All workspace blocks
   * @param connections - All connections
   * @returns Variable name or null
   */
  static getLoopConnectedComparisonVariableName(
    loopBlockId: string,
    workspaceBlocks: BlockInstance[],
    connections: BlockConnection[]
  ): string | null {
    const connectedSetVarData = this.getConnectedBlocksByType(
      loopBlockId, 
      'setVarDataIn2', 
      'input', 
      'setVarData',
      workspaceBlocks,
      connections
    );
    
    if (connectedSetVarData.length > 0) {
      return connectedSetVarData[0].variableName || null;
    }
    
    return null;
  }

  /**
   * Helper: Get variable name from third setVarData connection (If comparison value)
   * Specific use case for If blocks - setVarDataIn3 port
   * @param ifBlockId - If block ID
   * @param workspaceBlocks - All workspace blocks
   * @param connections - All connections
   * @returns Variable name or null
   */
  static getIfConnectedComparisonVariableName(
    ifBlockId: string,
    workspaceBlocks: BlockInstance[],
    connections: BlockConnection[]
  ): string | null {
    const connectedSetVarData = this.getConnectedBlocksByType(
      ifBlockId, 
      'setVarDataIn3', 
      'input', 
      'setVarData',
      workspaceBlocks,
      connections
    );
    
    if (connectedSetVarData.length > 0) {
      return connectedSetVarData[0].variableName || null;
    }
    
    return null;
  }
  
  /**
   * Debug helper: Get connection summary for a block
   * @param blockId - Block to analyze
   * @param workspaceBlocks - All workspace blocks
   * @param connections - All connections
   * @returns Connection summary object
   */
  static getBlockConnectionSummary(
    blockId: string,
    workspaceBlocks: BlockInstance[],
    connections: BlockConnection[]
  ): Record<string, ConnectionDetectionResult> {
    const block = workspaceBlocks.find(b => b.id === blockId);
    if (!block) return {};
    
    const summary: Record<string, ConnectionDetectionResult> = {};
    
    // Check all input ports
    if (block.connections?.inputs) {
      for (const portId of Object.keys(block.connections.inputs)) {
        summary[`input:${portId}`] = this.getConnectedBlocks(
          blockId, portId, 'input', workspaceBlocks, connections
        );
      }
    }
    
    // Check all output ports  
    if (block.connections?.outputs) {
      for (const portId of Object.keys(block.connections.outputs)) {
        summary[`output:${portId}`] = this.getConnectedBlocks(
          blockId, portId, 'output', workspaceBlocks, connections
        );
      }
    }
    
    return summary;
  }
}

// Export helper functions for convenient usage
export const {
  getConnectedBlocks,
  hasConnection,
  getFirstConnectedBlock,
  getConnectedBlocksByType,
  getLoopConnectedVariableName,
  getLoopConnectedComparisonVariableName,
  getIfConnectedComparisonVariableName,
  getBlockConnectionSummary
} = ConnectionDetector;

// Default export
export default ConnectionDetector;
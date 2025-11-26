// followConnections.ts - Navigation helper for finding connected blocks

import { ExecutionGraph, Connection } from '../types'

/**
 * Finds all blocks connected to a specific output port of a given block
 * 
 * @param blockId - The source block ID
 * @param outputPortId - The output port ID (e.g., 'flowOut', 'flowOutTrue', 'loopOut')
 * @param graph - The execution graph containing all connections
 * @returns Array of connections from the specified output port
 */
export function followConnections(
  blockId: string,
  outputPortId: string,
  graph: ExecutionGraph
): Connection[] {
  const connections = graph.connections.get(blockId) || []
  return connections.filter(connection => connection.sourcePortId === outputPortId)
}

/**
 * Gets all outgoing connections from a block (all output ports)
 * 
 * @param blockId - The source block ID
 * @param graph - The execution graph
 * @returns Array of all outgoing connections
 */
export function getAllOutgoingConnections(
  blockId: string,
  graph: ExecutionGraph
): Connection[] {
  return graph.connections.get(blockId) || []
}

/**
 * Gets all incoming connections to a block (from all other blocks)
 * 
 * @param targetBlockId - The target block ID
 * @param graph - The execution graph
 * @returns Array of all incoming connections
 */
export function getAllIncomingConnections(
  targetBlockId: string,
  graph: ExecutionGraph
): Connection[] {
  const incomingConnections: Connection[] = []
  
  for (const connections of graph.connections.values()) {
    for (const connection of connections) {
      if (connection.targetBlockId === targetBlockId) {
        incomingConnections.push(connection)
      }
    }
  }
  
  return incomingConnections
}

/**
 * Finds the next block(s) to execute after a given block completes
 * 
 * @param blockId - Current block ID
 * @param outputPortId - Which output port was activated
 * @param graph - The execution graph
 * @returns Array of next block IDs to execute
 */
export function getNextBlocks(
  blockId: string,
  outputPortId: string,
  graph: ExecutionGraph
): string[] {
  const connections = followConnections(blockId, outputPortId, graph)
  return connections.map(conn => conn.targetBlockId)
}

/**
 * Checks if a block has any outgoing connections from a specific port
 * 
 * @param blockId - The block ID to check
 * @param outputPortId - The output port to check
 * @param graph - The execution graph
 * @returns True if there are connections from this port
 */
export function hasConnectionsFromPort(
  blockId: string,
  outputPortId: string,
  graph: ExecutionGraph
): boolean {
  const connections = followConnections(blockId, outputPortId, graph)
  return connections.length > 0
}

/**
 * Gets all possible output ports that have connections for a block
 * 
 * @param blockId - The block ID
 * @param graph - The execution graph
 * @returns Array of output port IDs that have connections
 */
export function getConnectedOutputPorts(
  blockId: string,
  graph: ExecutionGraph
): string[] {
  const connections = getAllOutgoingConnections(blockId, graph)
  const portIds = new Set<string>()
  
  connections.forEach(conn => {
    portIds.add(conn.sourcePortId)
  })
  
  return Array.from(portIds)
}

/**
 * Checks if a connection creates a circular dependency
 * 
 * @param sourceBlockId - Source block
 * @param targetBlockId - Target block
 * @param graph - The execution graph
 * @returns True if adding this connection would create a cycle
 */
export function wouldCreateCycle(
  sourceBlockId: string,
  targetBlockId: string,
  graph: ExecutionGraph
): boolean {
  // If target can reach source, adding source->target creates a cycle
  return canReachBlock(targetBlockId, sourceBlockId, graph)
}

/**
 * Checks if one block can reach another through connections
 * 
 * @param fromBlockId - Starting block
 * @param toBlockId - Target block to reach
 * @param graph - The execution graph
 * @returns True if there's a path from fromBlock to toBlock
 */
export function canReachBlock(
  fromBlockId: string,
  toBlockId: string,
  graph: ExecutionGraph
): boolean {
  if (fromBlockId === toBlockId) return true
  
  const visited = new Set<string>()
  const toVisit = [fromBlockId]
  
  while (toVisit.length > 0) {
    const currentBlockId = toVisit.pop()!
    
    if (visited.has(currentBlockId)) continue
    visited.add(currentBlockId)
    
    const connections = getAllOutgoingConnections(currentBlockId, graph)
    
    for (const connection of connections) {
      if (connection.targetBlockId === toBlockId) {
        return true
      }
      
      if (!visited.has(connection.targetBlockId)) {
        toVisit.push(connection.targetBlockId)
      }
    }
  }
  
  return false
}

/**
 * Gets all blocks that are reachable from a starting block
 * 
 * @param startBlockId - Starting block
 * @param graph - The execution graph
 * @returns Set of all reachable block IDs
 */
export function getAllReachableBlocks(
  startBlockId: string,
  graph: ExecutionGraph
): Set<string> {
  const reachable = new Set<string>()
  const toVisit = [startBlockId]
  
  while (toVisit.length > 0) {
    const currentBlockId = toVisit.pop()!
    
    if (reachable.has(currentBlockId)) continue
    reachable.add(currentBlockId)
    
    const connections = getAllOutgoingConnections(currentBlockId, graph)
    
    for (const connection of connections) {
      if (!reachable.has(connection.targetBlockId)) {
        toVisit.push(connection.targetBlockId)
      }
    }
  }
  
  return reachable
}

/**
 * Finds all terminal blocks (blocks with no outgoing connections)
 * 
 * @param graph - The execution graph
 * @returns Array of block IDs that have no outgoing connections
 */
export function findTerminalBlocks(graph: ExecutionGraph): string[] {
  const terminalBlocks: string[] = []
  
  for (const blockId of graph.blocks.keys()) {
    const outgoingConnections = getAllOutgoingConnections(blockId, graph)
    if (outgoingConnections.length === 0) {
      terminalBlocks.push(blockId)
    }
  }
  
  return terminalBlocks
}

/**
 * Debug helper: prints connection information for a block
 * 
 * @param blockId - Block to analyze
 * @param graph - The execution graph
 * @returns Debug information string
 */
export function debugBlockConnections(
  blockId: string,
  graph: ExecutionGraph
): string {
  const block = graph.blocks.get(blockId)
  if (!block) return `Block ${blockId} not found`
  
  const outgoing = getAllOutgoingConnections(blockId, graph)
  const incoming = getAllIncomingConnections(blockId, graph)
  
  let debug = `Block: ${blockId} (${block.definitionId})\n`
  debug += `Incoming (${incoming.length}):\n`
  incoming.forEach(conn => {
    debug += `  ${conn.sourceBlockId}:${conn.sourcePortId} -> ${conn.targetPortId}\n`
  })
  
  debug += `Outgoing (${outgoing.length}):\n`
  outgoing.forEach(conn => {
    debug += `  ${conn.sourcePortId} -> ${conn.targetBlockId}:${conn.targetPortId}\n`
  })
  
  return debug
}
// ABOUTME: Universal connection validation for all block types checking flowIn/Out and optional ports
// ABOUTME: Validates port compatibility, connection limits and required connections for blocks

import type { BlockInstance, BlockConnection, PortDefinition, ConnectionValidationRules } from '../types/BlockConcept'
import type { ValidationError, ValidationWarning, BlockValidationResult } from './BlockValidator'
import { PortManager } from '../core/ports/PortManager'
import { getBlockDefinition } from '../ui/adapters/BlockFactoryAdapter'

export class ConnectionValidator {
  /**
   * Validates connections for a single block
   */
  static validateBlockConnections(
    block: BlockInstance,
    connections: BlockConnection[]
  ): BlockValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Get connections for this block
    const blockConnections = connections.filter(
      conn => conn.sourceBlockId === block.id || conn.targetBlockId === block.id
    )

    // Get block definition and validation rules
    const blockDef = getBlockDefinition(block.definitionId)
    const validationRules = blockDef?.meta?.validationRules?.connections

    // Check required connections (flowIn/flowOut)
    this.validateRequiredConnections(block, blockConnections, errors, warnings)

    // Check optional connections only if no schema validation was applied
    if (!validationRules) {
      this.validateOptionalConnections(block, blockConnections, warnings)
    }

    // Check port compatibility and connection limits
    this.validatePortCompatibility(block, blockConnections, errors)
    this.validateConnectionLimits(block, blockConnections, errors)

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      status: errors.length > 0 ? 'error' : (warnings.length > 0 ? 'warning' : 'valid'),
      summary: {
        totalIssues: errors.length + warnings.length,
        criticalErrors: errors.filter(e => e.severity === 'critical').length,
        regularErrors: errors.length - errors.filter(e => e.severity === 'critical').length,
        warnings: warnings.length
      }
    }
  }

  /**
   * Validate required connections based on block's validation schema
   */
  private static validateRequiredConnections(
    block: BlockInstance,
    connections: BlockConnection[],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const blockDef = getBlockDefinition(block.definitionId)
    if (!blockDef) return

    const validationRules = blockDef.meta?.validationRules?.connections

    if (validationRules) {
      // Use schema-based validation
      this.validateSchemaRequiredInputs(block, connections, validationRules, errors)
      this.validateSchemaRequiredOutputs(block, connections, validationRules, errors)
      this.validateSchemaRecommendedInputs(block, connections, validationRules, warnings)
      this.validateSchemaRecommendedOutputs(block, connections, validationRules, warnings)
    } else {
      // Fallback to default behavior for blocks without schema
      this.validateDefaultRequiredConnections(block, connections, errors)
    }
  }

  /**
   * Schema-based required input validation
   */
  private static validateSchemaRequiredInputs(
    block: BlockInstance,
    connections: BlockConnection[],
    rules: ConnectionValidationRules,
    errors: ValidationError[]
  ): void {
    // Special case for merge block - requires at least one input connection
    if (block.definitionId === 'merge') {
      const mergeInputPorts = ['flowIn1', 'flowIn2', 'flowIn3', 'flowIn4']
      const hasAnyConnection = mergeInputPorts.some(portId =>
        connections.some(conn => conn.targetBlockId === block.id && conn.targetPortId === portId)
      )
      if (!hasAnyConnection) {
        errors.push({
          code: 'MERGE_NO_INPUTS',
          message: 'Merge блокът трябва да има поне една входна връзка',
          field: 'inputs'
        })
      }
      return
    }

    if (!rules.requiredInputs) return

    rules.requiredInputs.forEach((portId: string) => {
      const hasConnection = connections.some(
        conn => conn.targetBlockId === block.id && conn.targetPortId === portId
      )
      if (!hasConnection) {
        const blockDef = getBlockDefinition(block.definitionId)
        const portLabel = this.getPortLabel(blockDef, portId, 'input') || portId
        errors.push({
          code: 'MISSING_REQUIRED_INPUT',
          message: `Липсва задължителна връзка към "${portLabel}"`,
          field: portId
        })
      }
    })
  }

  /**
   * Schema-based required output validation
   */
  private static validateSchemaRequiredOutputs(
    block: BlockInstance,
    connections: BlockConnection[],
    rules: ConnectionValidationRules,
    errors: ValidationError[]
  ): void {
    if (!rules.requiredOutputs) return

    rules.requiredOutputs.forEach((portId: string) => {
      const hasConnection = connections.some(
        conn => conn.sourceBlockId === block.id && conn.sourcePortId === portId
      )
      if (!hasConnection) {
        const blockDef = getBlockDefinition(block.definitionId)
        const portLabel = this.getPortLabel(blockDef, portId, 'output') || portId
        errors.push({
          code: 'MISSING_REQUIRED_OUTPUT',
          message: `Липсва задължителна връзка от "${portLabel}"`,
          field: portId
        })
      }
    })
  }

  /**
   * Schema-based recommended input validation (warnings)
   */
  private static validateSchemaRecommendedInputs(
    block: BlockInstance,
    connections: BlockConnection[],
    rules: ConnectionValidationRules,
    warnings: ValidationWarning[]
  ): void {
    if (!rules.recommendedInputs) return

    rules.recommendedInputs.forEach((portId: string) => {
      const hasConnection = connections.some(
        conn => conn.targetBlockId === block.id && conn.targetPortId === portId
      )
      if (!hasConnection) {
        const blockDef = getBlockDefinition(block.definitionId)
        const portLabel = this.getPortLabel(blockDef, portId, 'input') || portId
        warnings.push({
          code: 'MISSING_RECOMMENDED_INPUT',
          message: `Препоръчва се връзка към "${portLabel}"`,
          field: portId
        })
      }
    })
  }

  /**
   * Schema-based recommended output validation (warnings)
   */
  private static validateSchemaRecommendedOutputs(
    block: BlockInstance,
    connections: BlockConnection[],
    rules: ConnectionValidationRules,
    warnings: ValidationWarning[]
  ): void {
    if (!rules.recommendedOutputs) return

    rules.recommendedOutputs.forEach((portId: string) => {
      const hasConnection = connections.some(
        conn => conn.sourceBlockId === block.id && conn.sourcePortId === portId
      )
      if (!hasConnection) {
        const blockDef = getBlockDefinition(block.definitionId)
        const portLabel = this.getPortLabel(blockDef, portId, 'output') || portId
        warnings.push({
          code: 'MISSING_RECOMMENDED_OUTPUT',
          message: `Препоръчва се връзка от "${portLabel}"`,
          field: portId
        })
      }
    })
  }

  /**
   * Fallback validation for blocks without validation schema
   */
  private static validateDefaultRequiredConnections(
    block: BlockInstance,
    connections: BlockConnection[],
    errors: ValidationError[]
  ): void {
    // Check flowIn connection
    const hasFlowIn = connections.some(
      conn => conn.targetBlockId === block.id && conn.targetPortId === 'flowIn'
    )
    if (!hasFlowIn) {
      errors.push({
        code: 'MISSING_FLOW_IN',
        message: 'Блокът няма входящ поток',
        field: 'flowIn'
      })
    }

    // Check flowOut connection
    const hasFlowOut = connections.some(
      conn => conn.sourceBlockId === block.id && conn.sourcePortId === 'flowOut'
    )
    if (!hasFlowOut) {
      errors.push({
        code: 'MISSING_FLOW_OUT',
        message: 'Блокът няма изходящ поток',
        field: 'flowOut'
      })
    }
  }

  /**
   * Validate optional connections based on block's validation schema (warnings only)
   */
  private static validateOptionalConnections(
    block: BlockInstance,
    connections: BlockConnection[],
    warnings: ValidationWarning[]
  ): void {
    const blockDef = getBlockDefinition(block.definitionId)
    if (!blockDef) return

    const validationRules = blockDef.meta?.validationRules?.connections

    if (validationRules) {
      // Schema-based validation - check for common optional ports that could be recommended
      this.validateSchemaOptionalConnections(block, connections, warnings)
    } else {
      // Fallback to default behavior for blocks without schema
      this.validateDefaultOptionalConnections(block, connections, warnings)
    }
  }

  /**
   * Schema-based optional connection validation
   */
  private static validateSchemaOptionalConnections(
    block: BlockInstance,
    connections: BlockConnection[],
    warnings: ValidationWarning[]
  ): void {
    const blockDef = getBlockDefinition(block.definitionId)
    if (!blockDef) return

    // Check for common optional ports that might be beneficial to connect
    const optionalPortsToCheck = ['setVarNameIn', 'onErrorIn', 'setVarDataIn']

    blockDef.inputs.forEach(input => {
      if (optionalPortsToCheck.includes(input.id) && !input.required) {
        const hasConnection = connections.some(
          conn => conn.targetBlockId === block.id && conn.targetPortId === input.id
        )
        if (!hasConnection) {
          const warningMessage = this.getOptionalPortWarningMessage(input.id)
          if (warningMessage) {
            warnings.push({
              code: `MISSING_${input.id.toUpperCase()}`,
              message: warningMessage,
              field: input.id
            })
          }
        }
      }
    })
  }

  /**
   * Get appropriate warning message for optional ports
   */
  private static getOptionalPortWarningMessage(portId: string): string | null {
    switch (portId) {
      case 'setVarNameIn':
        return 'Препоръчва се да свържете променлива'
      case 'onErrorIn':
        return 'Препоръчва се обработка на грешки'
      case 'setVarDataIn':
        return 'Препоръчва се да свържете данни'
      default:
        return null
    }
  }

  /**
   * Fallback validation for optional connections for blocks without validation schema
   */
  private static validateDefaultOptionalConnections(
    block: BlockInstance,
    connections: BlockConnection[],
    warnings: ValidationWarning[]
  ): void {
    // Check setVarNameIn connection
    const hasSetVarNameIn = connections.some(
      conn => conn.targetBlockId === block.id && conn.targetPortId === 'setVarNameIn'
    )
    if (!hasSetVarNameIn) {
      warnings.push({
        code: 'MISSING_VAR_NAME',
        message: 'Препоръчва се да свържете променлива',
        field: 'setVarNameIn'
      })
    }

    // Check onErrorIn connection
    const hasErrorHandling = connections.some(
      conn => conn.targetBlockId === block.id && conn.targetPortId === 'onErrorIn'
    )
    if (!hasErrorHandling) {
      warnings.push({
        code: 'MISSING_ERROR_HANDLING',
        message: 'Препоръчва се обработка на грешки',
        field: 'onErrorIn'
      })
    }
  }

  /**
   * Validate port type compatibility for connections
   */
  private static validatePortCompatibility(
    block: BlockInstance,
    connections: BlockConnection[],
    errors: ValidationError[]
  ): void {
    const blockDef = getBlockDefinition(block.definitionId)
    console.log('🔍 BlockDef check:', block.definitionId, blockDef ? 'found' : 'NOT FOUND')
    if (!blockDef) return

    // Check each connection involving this block
    connections.forEach(conn => {
      let sourcePort: PortDefinition | undefined
      let targetPort: PortDefinition | undefined

      if (conn.sourceBlockId === block.id) {
        // This block is source
        sourcePort = blockDef.outputs.find(p => p.id === conn.sourcePortId)
      }

      if (conn.targetBlockId === block.id) {
        // This block is target
        targetPort = blockDef.inputs.find(p => p.id === conn.targetPortId)
      }

      // If we have both ports, check compatibility
      if (sourcePort && targetPort) {
        const sourceType = Array.isArray(sourcePort.type) ? sourcePort.type[0] : sourcePort.type
        const targetType = Array.isArray(targetPort.type) ? targetPort.type[0] : targetPort.type

        // Ensure we have valid port types before checking compatibility
        if (sourceType && targetType) {
          const isCompatible = PortManager.arePortsCompatible(sourceType, targetType)
          if (!isCompatible) {
            errors.push({
              code: 'INCOMPATIBLE_PORTS',
              message: `Несъвместими портове: ${sourceType} → ${targetType}`,
              field: conn.targetPortId
            })
          }
        }
      }
    })
  }

  /**
   * Validate connection limits per port
   */
  private static validateConnectionLimits(
    block: BlockInstance,
    connections: BlockConnection[],
    errors: ValidationError[]
  ): void {
    const blockDef = getBlockDefinition(block.definitionId)
    if (!blockDef) return

    // Check input port limits (typically 1 connection per input)
    blockDef.inputs.forEach(inputPort => {
      const connectionsToPort = connections.filter(
        conn => conn.targetBlockId === block.id && conn.targetPortId === inputPort.id
      )

      if (connectionsToPort.length > 1) {
        errors.push({
          code: 'TOO_MANY_CONNECTIONS',
          message: `Прекалено много връзки към порт ${inputPort.label}`,
          field: inputPort.id
        })
      }
    })

    // Output ports can have unlimited connections (no limits to check)
  }

  /**
   * Helper method to get port label from block definition
   */
  private static getPortLabel(blockDef: any, portId: string, direction: 'input' | 'output'): string | null {
    if (!blockDef) return null
    const ports = direction === 'input' ? blockDef.inputs : blockDef.outputs
    if (!ports) return null
    const port = ports.find((p: any) => p.id === portId)
    return port?.label || null
  }
}
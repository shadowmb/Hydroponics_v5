// ABOUTME: Main block validation coordinator that orchestrates Connection and Parameter validators
// ABOUTME: Provides unified validation results with error/warning priority system for individual blocks

import type { BlockInstance, BlockConnection } from '../types/BlockConcept'
import { ConnectionValidator } from './ConnectionValidator'
import { ParameterValidator } from './ParameterValidator'

export interface ValidationError {
  code: string
  message: string
  field?: string
  severity?: 'critical' | 'high' | 'medium'
}

export interface ValidationWarning {
  code: string
  message: string
  field?: string
  severity?: 'low' | 'info'
}

export interface BlockValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  status: 'valid' | 'error' | 'warning'
  summary: {
    totalIssues: number
    criticalErrors: number
    regularErrors: number
    warnings: number
  }
}

export class BlockValidator {
  /**
   * Validates a single block with its connections and parameters
   */
  static validateBlock(
    block: BlockInstance,
    connections: BlockConnection[],
    allBlocks: BlockInstance[]
  ): BlockValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // 1. Validate connections (universal for all blocks)
    const connectionResult = ConnectionValidator.validateBlockConnections(block, connections)
    errors.push(...connectionResult.errors)
    warnings.push(...connectionResult.warnings)

    // 2. Validate parameters (specific to block type)
    const paramResult = ParameterValidator.validateBlockParameters(block, connections)
    errors.push(...paramResult.errors)
    warnings.push(...paramResult.warnings)

    // Debug logging for validation combination
    if (block.definitionId === 'sensor') {
      console.log(`🔧 [BlockValidator] Sensor block ${block.id} validation:`, {
        connectionErrors: connectionResult.errors.length,
        parameterErrors: paramResult.errors.length,
        totalErrors: errors.length,
        connectionResult,
        paramResult
      })
    }

    // 3. Apply priority system and determine status
    const prioritizedResult = this.applyPrioritySystem(errors, warnings)

    return {
      isValid: errors.length === 0,
      errors: prioritizedResult.errors,
      warnings: prioritizedResult.warnings,
      status: this.determineBlockStatus(errors, warnings),
      summary: this.generateSummary(errors, warnings)
    }
  }

  /**
   * Apply priority system - critical errors first, then regular errors, then warnings
   */
  private static applyPrioritySystem(
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): { errors: ValidationError[], warnings: ValidationWarning[] } {
    // Set default severity for errors that don't have it
    const prioritizedErrors = errors.map(error => ({
      ...error,
      severity: error.severity || this.getDefaultErrorSeverity(error.code)
    }))

    // Set default severity for warnings that don't have it
    const prioritizedWarnings = warnings.map(warning => ({
      ...warning,
      severity: warning.severity || this.getDefaultWarningSeverity(warning.code)
    }))

    // Sort errors by priority (critical > high > medium)
    const sortedErrors = prioritizedErrors.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2 }
      return severityOrder[a.severity!] - severityOrder[b.severity!]
    })

    // Sort warnings by priority (low > info)
    const sortedWarnings = prioritizedWarnings.sort((a, b) => {
      const severityOrder = { low: 0, info: 1 }
      return severityOrder[a.severity!] - severityOrder[b.severity!]
    })

    return { errors: sortedErrors, warnings: sortedWarnings }
  }

  /**
   * Determine block status based on errors/warnings priority
   */
  private static determineBlockStatus(
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): 'valid' | 'error' | 'warning' {
    if (errors.length > 0) return 'error'
    if (warnings.length > 0) return 'warning'
    return 'valid'
  }

  /**
   * Generate validation summary
   */
  private static generateSummary(
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ) {
    const criticalErrors = errors.filter(e => e.severity === 'critical').length
    const regularErrors = errors.length - criticalErrors

    return {
      totalIssues: errors.length + warnings.length,
      criticalErrors,
      regularErrors,
      warnings: warnings.length
    }
  }

  /**
   * Get default error severity based on error code
   */
  private static getDefaultErrorSeverity(code: string): 'critical' | 'high' | 'medium' {
    const criticalCodes = ['MISSING_FLOW_IN', 'MISSING_FLOW_OUT', 'SENSOR_NO_DEVICE', 'ACTUATOR_NO_DEVICE']
    const highCodes = ['INCOMPATIBLE_PORTS', 'TOO_MANY_CONNECTIONS']

    if (criticalCodes.includes(code)) return 'critical'
    if (highCodes.includes(code)) return 'high'
    return 'medium'
  }

  /**
   * Get default warning severity based on warning code
   */
  private static getDefaultWarningSeverity(code: string): 'low' | 'info' {
    const lowCodes = ['MISSING_VAR_NAME', 'MISSING_ERROR_HANDLING']

    if (lowCodes.includes(code)) return 'low'
    return 'info'
  }
}

/**
 * Helper function for external use - validates a single block
 */
export function validateBlock(
  block: BlockInstance,
  connections: BlockConnection[],
  allBlocks: BlockInstance[]
): BlockValidationResult {
  return BlockValidator.validateBlock(block, connections, allBlocks)
}

/**
 * Helper function for batch validation of multiple blocks
 */
export function validateBlocks(
  blocks: BlockInstance[],
  connections: BlockConnection[]
): Map<string, BlockValidationResult> {
  const results = new Map<string, BlockValidationResult>()

  blocks.forEach(block => {
    const result = BlockValidator.validateBlock(block, connections, blocks)
    results.set(block.id, result)
  })

  return results
}
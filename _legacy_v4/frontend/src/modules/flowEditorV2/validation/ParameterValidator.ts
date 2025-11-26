// ABOUTME: Parameter validation using block validation schemas
// ABOUTME: Checks required parameters, alternative sources, and block-specific configurations

import type { BlockInstance, BlockConnection, ParameterValidationRules } from '../types/BlockConcept'
import type { ValidationError, ValidationWarning, BlockValidationResult } from './BlockValidator'
import { getBlockDefinition } from '../ui/adapters/BlockFactoryAdapter'

export class ParameterValidator {
  /**
   * Validates block parameters using validation schema
   */
  static validateBlockParameters(
    block: BlockInstance,
    connections: BlockConnection[]
  ): BlockValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    const blockDef = getBlockDefinition(block.definitionId)
    if (!blockDef) {
      errors.push({
        code: 'BLOCK_DEFINITION_NOT_FOUND',
        message: `Дефиницията на блок ${block.definitionId} не е намерена`,
        field: 'definitionId'
      })
      return this.createValidationResult(errors, warnings)
    }

    const parameterRules = blockDef.meta?.validationRules?.parameters
    const legacyRules = blockDef.meta?.validationRules?.legacy
    if (parameterRules) {
      // Use schema-based validation
      this.validateSchemaRequiredParameters(block, parameterRules, errors)
      this.validateSchemaRecommendedParameters(block, parameterRules, warnings)
      this.validateSchemaParametersWithAlternatives(block, connections, parameterRules, errors)

      // Handle conditional validation if exists
      if (legacyRules?.conditionalRequired) {
        this.validateSchemaConditionalRequired(block, legacyRules.conditionalRequired, errors, connections)
      }

      // Device ID validation will be handled by the UI components directly
    } else {
      // Fallback to legacy validation for blocks without schema
      this.validateLegacyParameters(block, errors, warnings)
    }

    return this.createValidationResult(errors, warnings)
  }

  /**
   * Schema-based required parameter validation
   */
  private static validateSchemaRequiredParameters(
    block: BlockInstance,
    rules: ParameterValidationRules,
    errors: ValidationError[]
  ): void {
    if (!rules.required) return

    rules.required.forEach((paramId: string) => {
      const paramValue = block.parameters[paramId]
      if (paramValue === undefined || paramValue === null || paramValue === '') {
        const blockDef = getBlockDefinition(block.definitionId)
        const paramLabel = this.getParameterLabel(blockDef, paramId) || paramId
        errors.push({
          code: 'MISSING_REQUIRED_PARAMETER',
          message: `Липсва задължителното поле "${paramLabel}"`,
          field: paramId
        })
      }
    })
  }

  /**
   * Schema-based recommended parameter validation (warnings)
   */
  private static validateSchemaRecommendedParameters(
    block: BlockInstance,
    rules: ParameterValidationRules,
    warnings: ValidationWarning[]
  ): void {
    if (!rules.recommended) return

    rules.recommended.forEach((paramId: string) => {
      const paramValue = block.parameters[paramId]
      if (paramValue === undefined || paramValue === null || paramValue === '') {
        const blockDef = getBlockDefinition(block.definitionId)
        const paramLabel = this.getParameterLabel(blockDef, paramId) || paramId
        warnings.push({
          code: 'MISSING_RECOMMENDED_PARAMETER',
          message: `Препоръчва се задаване на полето "${paramLabel}"`,
          field: paramId
        })
      }
    })
  }

  /**
   * Schema-based parameters with alternative sources validation
   */
  private static validateSchemaParametersWithAlternatives(
    block: BlockInstance,
    connections: BlockConnection[],
    rules: ParameterValidationRules,
    errors: ValidationError[]
  ): void {
    if (!rules.requiredWithAlternatives) return

    rules.requiredWithAlternatives.forEach((rule) => {
      const paramValue = block.parameters[rule.field]
      let hasValidSource = false

      // Check if parameter has a value (0 is a valid value, but null/undefined/empty are not)
      if (paramValue !== undefined && paramValue !== null && paramValue !== '' && paramValue !== 0) {
        hasValidSource = true
      }
      // Special case: 0 is valid only if it was explicitly set (not default null)
      if (paramValue === 0 && block.parameters[rule.field] === 0) {
        hasValidSource = true
      }

      // Check alternative sources
      if (!hasValidSource) {
        for (const alternative of rule.alternatives) {
          if (alternative.startsWith('connection:')) {
            const portId = alternative.substring('connection:'.length)
            const hasConnection = connections.some(
              conn => conn.targetBlockId === block.id && conn.targetPortId === portId
            )
            if (hasConnection) {
              hasValidSource = true
              break
            }
          } else if (alternative === 'globalVariable') {
            const useGlobalVar = block.parameters['useGlobalVariable']
            const selectedGlobalVar = block.parameters['selectedGlobalVariable']
            if (useGlobalVar && selectedGlobalVar && selectedGlobalVar !== '') {
              hasValidSource = true
              break
            }
          }
        }
      }

      if (!hasValidSource) {
        const blockDef = getBlockDefinition(block.definitionId)
        const paramLabel = this.getParameterLabel(blockDef, rule.field) || rule.field
        errors.push({
          code: 'MISSING_PARAMETER_OR_ALTERNATIVE',
          message: `Полето "${paramLabel}" няма стойност или алтернативен източник`,
          field: rule.field
        })
      }
    })
  }

  /**
   * Schema-based conditional required parameter validation
   */
  private static validateSchemaConditionalRequired(
    block: BlockInstance,
    conditionalRules: Array<{ condition: string; requiredParams: string[] }>,
    errors: ValidationError[],
    connections: BlockConnection[] = []
  ): void {
    conditionalRules.forEach((rule) => {
      // Evaluate condition
      if (this.evaluateCondition(block, rule.condition)) {
        // Condition is true, check required parameters
        rule.requiredParams.forEach((paramId) => {
          const paramValue = block.parameters[paramId]
          const blockDef = getBlockDefinition(block.definitionId)
          const paramLabel = this.getParameterLabel(blockDef, paramId) || paramId

          // Special validation for duration field - must be > 0 or have alternative source
          if (paramId === 'duration') {
            const numValue = Number(paramValue)
            let hasValidSource = false

            // Check if direct value is valid (> 0)
            if (!isNaN(numValue) && numValue > 0) {
              hasValidSource = true
            }

            // Check alternative sources if no valid direct value
            if (!hasValidSource) {
              // Check connection to setVarDataIn
              const hasConnection = connections.some(
                conn => conn.targetBlockId === block.id && conn.targetPortId === 'setVarDataIn'
              )
              if (hasConnection) {
                hasValidSource = true
              }

              // Check global variable selection
              const useGlobalVar = block.parameters['useGlobalVariable']
              const selectedGlobalVar = block.parameters['selectedGlobalVariable']
              if (useGlobalVar && selectedGlobalVar && selectedGlobalVar !== '') {
                hasValidSource = true
              }
            }

            if (!hasValidSource) {
              errors.push({
                code: 'MISSING_CONDITIONAL_PARAMETER',
                message: `"${paramLabel}" трябва да е по-голямо от 0, да е свързано с променлива или да е избрана глобална променлива`,
                field: paramId
              })
            }
          } else {
            // Standard validation for other fields
            if (paramValue === undefined || paramValue === null || paramValue === '') {
              errors.push({
                code: 'MISSING_CONDITIONAL_PARAMETER',
                message: `Липсва задължителното поле "${paramLabel}"`,
                field: paramId
              })
            }
          }
        })
      }
    })
  }

  /**
   * Simple condition evaluator for parameter validation
   */
  private static evaluateCondition(block: BlockInstance, condition: string): boolean {
    try {
      // Handle OR conditions
      if (condition.includes(' OR ')) {
        const orConditions = condition.split(' OR ').map(c => c.trim())
        return orConditions.some(cond => this.evaluateCondition(block, cond))
      }


      // Parse simple conditions like "deviceType !== ''"
      if (condition.includes('!==')) {
        const [paramId, value] = condition.split('!==').map(s => s.trim())
        const paramValue = block.parameters[paramId.replace(/['"]/g, '')] || ''
        const targetValue = value.replace(/['"]/g, '')
        return paramValue !== targetValue
      }

      if (condition.includes('===')) {
        const [paramId, value] = condition.split('===').map(s => s.trim())
        const paramValue = block.parameters[paramId.replace(/['"]/g, '')] || ''
        const targetValue = value.replace(/['"]/g, '')
        return paramValue === targetValue
      }

      return false
    } catch (error) {
      console.warn('Failed to evaluate condition:', condition, error)
      return false
    }
  }

  /**
   * Legacy validation for blocks without schema
   */
  private static validateLegacyParameters(
    block: BlockInstance,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    switch (block.definitionId) {
      case 'sensor':
        this.validateSensorBlock(block, errors, warnings)
        break
      case 'actuator':
        this.validateActuatorBlock(block, errors, warnings)
        break
      // Add other legacy validations as needed
    }
  }

  /**
   * Helper method to get parameter label from block definition
   */
  private static getParameterLabel(blockDef: any, paramId: string): string | null {
    // Special case for UI-only parameters
    if (paramId === 'toleranceTagId') {
      return 'Толеранс таг'
    }

    if (!blockDef?.parameters) return null
    const param = blockDef.parameters.find((p: any) => p.id === paramId)
    return param?.label || null
  }

  /**
   * Helper method to create validation result
   */
  private static createValidationResult(
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): BlockValidationResult {
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
   * Validate sensor block parameters
   */
  private static validateSensorBlock(
    block: BlockInstance,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // RED STATUS (critical errors)
    if (!block.parameters.deviceId) {
      errors.push({
        code: 'SENSOR_NO_DEVICE',
        message: 'Не е избран сензор',
        field: 'deviceId'
      })
    }

    if (!block.parameters.monitoringTagId) {
      errors.push({
        code: 'SENSOR_NO_MONITORING_TAG',
        message: 'Не е избран мониторинг таг',
        field: 'monitoringTagId'
      })
    }
  }

  /**
   * Validate actuator block parameters
   */
  private static validateActuatorBlock(
    block: BlockInstance,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // RED STATUS (critical errors)
    if (!block.parameters.deviceType) {
      errors.push({
        code: 'ACTUATOR_NO_DEVICE_TYPE',
        message: 'Не е избран тип устройство',
        field: 'deviceType'
      })
    }

    if (!block.parameters.deviceId) {
      errors.push({
        code: 'ACTUATOR_NO_DEVICE',
        message: 'Не е избрано конкретно устройство',
        field: 'deviceId'
      })
    }

    if (!block.parameters.actionType) {
      errors.push({
        code: 'ACTUATOR_NO_ACTION',
        message: 'Не е избрано действие',
        field: 'actionType'
      })
    }
  }

  /**
   * Validate if block parameters
   */
  private static validateIfBlock(
    block: BlockInstance,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // RED STATUS (critical errors)
    if (!block.parameters.conditions || !Array.isArray(block.parameters.conditions) || block.parameters.conditions.length === 0) {
      errors.push({
        code: 'IF_NO_CONDITIONS',
        message: 'Не са зададени условия',
        field: 'conditions'
      })
    } else {
      // Check each condition
      block.parameters.conditions.forEach((condition: any, index: number) => {
        if (!condition.condition) {
          errors.push({
            code: 'IF_INVALID_CONDITION',
            message: `Невалидно условие на позиция ${index + 1}`,
            field: `conditions[${index}].condition`
          })
        }
        if (condition.value === undefined || condition.value === null) {
          errors.push({
            code: 'IF_MISSING_VALUE',
            message: `Липсва стойност за условие на позиция ${index + 1}`,
            field: `conditions[${index}].value`
          })
        }
      })
    }

    if (!block.parameters.logicOperator) {
      warnings.push({
        code: 'IF_NO_LOGIC_OPERATOR',
        message: 'Не е избран логически оператор (по подразбиране: И)',
        field: 'logicOperator'
      })
    }
  }

  /**
   * Validate loop block parameters
   */
  private static validateLoopBlock(
    block: BlockInstance,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // RED STATUS (critical errors)
    if (!block.parameters.maxIterations || block.parameters.maxIterations < 1) {
      errors.push({
        code: 'LOOP_INVALID_MAX_ITERATIONS',
        message: 'Максималният брой итерации трябва да е поне 1',
        field: 'maxIterations'
      })
    }

    if (block.parameters.maxIterations > 100) {
      warnings.push({
        code: 'LOOP_HIGH_ITERATIONS',
        message: 'Много итерации могат да забавят изпълнението',
        field: 'maxIterations'
      })
    }

    // Check delay parameter
    if (block.parameters.delay !== undefined && block.parameters.delay < 0) {
      errors.push({
        code: 'LOOP_NEGATIVE_DELAY',
        message: 'Забавянето не може да е отрицателно',
        field: 'delay'
      })
    }
  }

}
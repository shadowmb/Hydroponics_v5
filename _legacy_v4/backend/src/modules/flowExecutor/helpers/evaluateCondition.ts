// evaluateCondition.ts - Logic evaluation helper for IF and LOOP blocks

import { ComparisonOperator, ConditionConfig } from '../types'

/**
 * Loads tolerance value from monitoring tag
 * 
 * @param toleranceTagId - ID of tolerance tag
 * @returns Tolerance value or 0 if not found/invalid
 */
export async function loadToleranceValue(toleranceTagId?: string): Promise<number> {
  if (!toleranceTagId) {
    return 0
  }

  try {
    const { MonitoringTag } = await import('../../../models/MonitoringTag')
    const tag = await MonitoringTag.findById(toleranceTagId)
    
    if (!tag || tag.type !== 'tolerance' || !tag.isActive) {
      return 0
    }
    
    return tag.tolerance || 0
  } catch (error) {
    console.warn(`Failed to load tolerance tag ${toleranceTagId}:`, error)
    return 0
  }
}

/**
 * Evaluates a single condition comparing two values with tolerance support
 * 
 * @param leftValue - Left side value (usually from variable)
 * @param operator - Comparison operator
 * @param rightValue - Right side value (constant or variable)
 * @param dataType - Expected data type for comparison
 * @param tolerance - Tolerance value for range-based comparison (default: 0)
 * @returns Boolean result of the comparison
 */
export function evaluateCondition(
  leftValue: any,
  operator: ComparisonOperator,
  rightValue: any,
  dataType: 'number' | 'string' | 'boolean' = 'number',
  tolerance: number = 0
): boolean {
  try {
    // Convert values to the expected type
    const left = convertToType(leftValue, dataType)
    const right = convertToType(rightValue, dataType)
    
    // Perform comparison based on operator with tolerance support
    switch (operator) {
      case ComparisonOperator.EQUALS:
        if (dataType === 'number' && tolerance > 0) {
          // Range-based comparison: check if left is within [right - tolerance, right + tolerance]
          const rightNum = right as number
          const leftNum = left as number
          const minValue = rightNum - tolerance
          const maxValue = rightNum + tolerance
          return leftNum >= minValue && leftNum <= maxValue
        }
        return left === right
        
      case ComparisonOperator.NOT_EQUALS:
        if (dataType === 'number' && tolerance > 0) {
          // Inverse of equals with tolerance
          const rightNum = right as number
          const leftNum = left as number
          const minValue = rightNum - tolerance
          const maxValue = rightNum + tolerance
          return !(leftNum >= minValue && leftNum <= maxValue)
        }
        return left !== right
        
      case ComparisonOperator.GREATER_THAN:
        if (dataType === 'number' && tolerance > 0) {
          // Greater than minimum value (target - tolerance)
          const leftNum = left as number
          const rightNum = right as number
          const threshold = rightNum - tolerance
          return leftNum > threshold
        }
        if (dataType === 'number') {
          return (left as number) > (right as number)
        }
        if (dataType === 'string') {
          return (left as string) > (right as string)
        }
        return false
        
      case ComparisonOperator.LESS_THAN:
        if (dataType === 'number' && tolerance > 0) {
          // Less than minimum value (target - tolerance)
          const leftNum = left as number
          const rightNum = right as number
          const threshold = rightNum - tolerance
          return leftNum < threshold
        }
        if (dataType === 'number') {
          return (left as number) < (right as number)
        }
        if (dataType === 'string') {
          return (left as string) < (right as string)
        }
        return false
        
      case ComparisonOperator.GREATER_EQUAL:
        if (dataType === 'number' && tolerance > 0) {
          // Greater than or equal to minimum value (target - tolerance)
          const leftNum = left as number
          const rightNum = right as number
          const threshold = rightNum - tolerance
          return leftNum >= threshold
        }
        if (dataType === 'number') {
          return (left as number) >= (right as number)
        }
        if (dataType === 'string') {
          return (left as string) >= (right as string)
        }
        return false
        
      case ComparisonOperator.LESS_EQUAL:
        if (dataType === 'number' && tolerance > 0) {
          // Less than or equal to maximum value (target + tolerance)
          const leftNum = left as number
          const rightNum = right as number
          const threshold = rightNum + tolerance
          return leftNum <= threshold
        }
        if (dataType === 'number') {
          return (left as number) <= (right as number)
        }
        if (dataType === 'string') {
          return (left as string) <= (right as string)
        }
        return false
        
      default:
        throw new Error(`Unknown comparison operator: ${operator}`)
    }
  } catch (error) {
    console.error('Error evaluating condition:', error)
    return false
  }
}

/**
 * Evaluates a condition configuration object
 * 
 * @param condition - Complete condition configuration
 * @param variables - Available variables map
 * @returns Boolean result
 */
export function evaluateConditionConfig(
  condition: ConditionConfig,
  variables: Record<string, any>
): boolean {
  const leftValue = variables[condition.leftVariable]
  
  if (leftValue === undefined) {
    console.warn(`Variable ${condition.leftVariable} not found for condition evaluation`)
    return false
  }
  
  return evaluateCondition(
    leftValue,
    condition.operator,
    condition.rightValue,
    condition.dataType
  )
}

/**
 * Evaluates multiple conditions with AND/OR logic
 * 
 * @param conditions - Array of condition configurations
 * @param variables - Available variables
 * @param operator - Logic operator ('AND' or 'OR')
 * @returns Boolean result of combined conditions
 */
export function evaluateMultipleConditions(
  conditions: ConditionConfig[],
  variables: Record<string, any>,
  operator: 'AND' | 'OR' = 'AND'
): boolean {
  if (conditions.length === 0) return true
  
  const results = conditions.map(condition => 
    evaluateConditionConfig(condition, variables)
  )
  
  if (operator === 'AND') {
    return results.every(result => result)
  } else {
    return results.some(result => result)
  }
}

/**
 * Converts a value to the specified type with validation
 * 
 * @param value - Value to convert
 * @param targetType - Target type
 * @returns Converted value
 */
export function convertToType(
  value: any,
  targetType: 'number' | 'string' | 'boolean'
): number | string | boolean {
  switch (targetType) {
    case 'number':
      const numValue = Number(value)
      if (isNaN(numValue)) {
        throw new Error(`Cannot convert "${value}" to number`)
      }
      return numValue
      
    case 'string':
      return String(value)
      
    case 'boolean':
      if (typeof value === 'boolean') return value
      if (typeof value === 'string') {
        const lowerValue = value.toLowerCase()
        if (lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes') return true
        if (lowerValue === 'false' || lowerValue === '0' || lowerValue === 'no') return false
      }
      if (typeof value === 'number') {
        return value !== 0
      }
      return Boolean(value)
      
    default:
      throw new Error(`Unknown target type: ${targetType}`)
  }
}

/**
 * Validates if a value is compatible with the expected type
 * 
 * @param value - Value to validate
 * @param expectedType - Expected type
 * @returns True if value can be converted to the expected type
 */
export function isValueCompatible(
  value: any,
  expectedType: 'number' | 'string' | 'boolean'
): boolean {
  try {
    convertToType(value, expectedType)
    return true
  } catch {
    return false
  }
}

/**
 * Gets a human-readable description of a condition
 * 
 * @param condition - Condition configuration
 * @returns Human-readable string
 */
export function getConditionDescription(condition: ConditionConfig): string {
  const operatorDescriptions = {
    [ComparisonOperator.EQUALS]: 'equals',
    [ComparisonOperator.NOT_EQUALS]: 'does not equal',
    [ComparisonOperator.GREATER_THAN]: 'is greater than',
    [ComparisonOperator.LESS_THAN]: 'is less than',
    [ComparisonOperator.GREATER_EQUAL]: 'is greater than or equal to',
    [ComparisonOperator.LESS_EQUAL]: 'is less than or equal to'
  }
  
  return `${condition.leftVariable} ${operatorDescriptions[condition.operator]} ${condition.rightValue}`
}

/**
 * Creates a simple condition configuration
 * 
 * @param variable - Variable name
 * @param operator - Comparison operator
 * @param value - Comparison value
 * @param type - Data type
 * @returns ConditionConfig object
 */
export function createCondition(
  variable: string,
  operator: ComparisonOperator,
  value: any,
  type: 'number' | 'string' | 'boolean' = 'number'
): ConditionConfig {
  return {
    leftVariable: variable,
    operator,
    rightValue: value,
    dataType: type
  }
}

/**
 * Tests a condition with sample data (for debugging)
 * 
 * @param condition - Condition to test
 * @param testValue - Test value for the variable
 * @returns Test result with details
 */
export function testCondition(
  condition: ConditionConfig,
  testValue: any
): { result: boolean; description: string; error?: string } {
  try {
    const variables = { [condition.leftVariable]: testValue }
    const result = evaluateConditionConfig(condition, variables)
    
    return {
      result,
      description: `${condition.leftVariable}=${testValue} ${getConditionDescription(condition)} → ${result}`
    }
  } catch (error) {
    return {
      result: false,
      description: getConditionDescription(condition),
      error: (error as Error).message
    }
  }
}

/**
 * Validates a condition configuration
 * 
 * @param condition - Condition to validate
 * @returns Validation result with errors
 */
export function validateCondition(condition: ConditionConfig): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (!condition.leftVariable || condition.leftVariable.trim() === '') {
    errors.push('Left variable name is required')
  }
  
  if (!Object.values(ComparisonOperator).includes(condition.operator)) {
    errors.push(`Invalid operator: ${condition.operator}`)
  }
  
  if (condition.rightValue === undefined || condition.rightValue === null) {
    errors.push('Right value is required')
  }
  
  if (!['number', 'string', 'boolean'].includes(condition.dataType)) {
    errors.push(`Invalid data type: ${condition.dataType}`)
  }
  
  // Type compatibility check
  if (condition.rightValue !== undefined) {
    if (!isValueCompatible(condition.rightValue, condition.dataType)) {
      errors.push(`Right value "${condition.rightValue}" is not compatible with type ${condition.dataType}`)
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
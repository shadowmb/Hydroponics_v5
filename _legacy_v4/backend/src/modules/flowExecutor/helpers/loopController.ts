// loopController.ts - Loop management and control helper

import { LoopState, LoopType, LoopDecision, ConditionConfig } from '../types'
import { evaluateConditionConfig } from './evaluateCondition'

/**
 * Determines if a loop should continue to the next iteration
 * 
 * @param loopState - Current loop state
 * @param variables - Available variables for condition evaluation
 * @returns Decision about whether to continue the loop
 */
export function shouldContinueLoop(
  loopState: LoopState,
  variables: Record<string, any>
): LoopDecision {
  try {
    switch (loopState.type) {
      case LoopType.REPEAT:
        return evaluateRepeatLoop(loopState)
        
      case LoopType.WHILE:
        return evaluateWhileLoop(loopState, variables)
        
      case LoopType.WHILE_MAX:
        return evaluateWhileMaxLoop(loopState, variables)
        
      default:
        return {
          continue: false,
          reason: `Unknown loop type: ${loopState.type}`
        }
    }
  } catch (error) {
    return {
      continue: false,
      reason: `Error evaluating loop: ${(error as Error).message}`
    }
  }
}

/**
 * Evaluates a REPEAT loop (fixed number of iterations)
 * 
 * @param loopState - Loop state
 * @returns Loop decision
 */
function evaluateRepeatLoop(loopState: LoopState): LoopDecision {
  if (!loopState.maxIterations) {
    return {
      continue: false,
      reason: 'REPEAT loop requires maxIterations'
    }
  }
  
  if (loopState.currentIteration >= loopState.maxIterations) {
    return {
      continue: false,
      reason: `Reached maximum iterations (${loopState.maxIterations})`
    }
  }
  
  return {
    continue: true,
    reason: `Iteration ${loopState.currentIteration + 1} of ${loopState.maxIterations}`
  }
}

/**
 * Evaluates a WHILE loop (condition-based)
 * 
 * @param loopState - Loop state
 * @param variables - Available variables
 * @returns Loop decision
 */
function evaluateWhileLoop(
  loopState: LoopState,
  variables: Record<string, any>
): LoopDecision {
  if (!loopState.condition) {
    return {
      continue: false,
      reason: 'WHILE loop requires a condition'
    }
  }
  
  const conditionResult = evaluateConditionConfig(loopState.condition, variables)
  
  return {
    continue: conditionResult,
    reason: conditionResult 
      ? `Condition is true, continuing loop`
      : `Condition is false, exiting loop`
  }
}

/**
 * Evaluates a WHILE_MAX loop (condition-based with maximum iterations)
 * 
 * @param loopState - Loop state
 * @param variables - Available variables
 * @returns Loop decision
 */
function evaluateWhileMaxLoop(
  loopState: LoopState,
  variables: Record<string, any>
): LoopDecision {
  if (!loopState.condition) {
    return {
      continue: false,
      reason: 'WHILE_MAX loop requires a condition'
    }
  }
  
  if (!loopState.maxIterations) {
    return {
      continue: false,
      reason: 'WHILE_MAX loop requires maxIterations'
    }
  }
  
  // Check iteration limit first
  if (loopState.currentIteration >= loopState.maxIterations) {
    return {
      continue: false,
      reason: `Reached maximum iterations (${loopState.maxIterations})`
    }
  }
  
  // Check condition
  const conditionResult = evaluateConditionConfig(loopState.condition, variables)
  
  if (!conditionResult) {
    return {
      continue: false,
      reason: 'Condition is false, exiting loop'
    }
  }
  
  return {
    continue: true,
    reason: `Condition is true, continuing loop (${loopState.currentIteration + 1}/${loopState.maxIterations})`
  }
}

/**
 * Creates a new loop state
 * 
 * @param blockId - Block ID that contains the loop
 * @param type - Type of loop
 * @param config - Loop configuration
 * @returns New LoopState object
 */
export function createLoopState(
  blockId: string,
  type: LoopType,
  config: {
    maxIterations?: number
    condition?: ConditionConfig
    delay?: number
  } = {}
): LoopState {
  return {
    blockId,
    type,
    currentIteration: 0,
    maxIterations: config.maxIterations,
    condition: config.condition,
    delay: config.delay
  }
}

/**
 * Increments the loop iteration counter
 * 
 * @param loopState - Loop state to update
 * @returns Updated loop state
 */
export function incrementLoopIteration(loopState: LoopState): LoopState {
  return {
    ...loopState,
    currentIteration: loopState.currentIteration + 1
  }
}

/**
 * Resets a loop to its initial state
 * 
 * @param loopState - Loop state to reset
 * @returns Reset loop state
 */
export function resetLoop(loopState: LoopState): LoopState {
  return {
    ...loopState,
    currentIteration: 0
  }
}

/**
 * Checks if a loop has a delay between iterations
 * 
 * @param loopState - Loop state
 * @returns True if loop has delay configured
 */
export function hasLoopDelay(loopState: LoopState): boolean {
  return typeof loopState.delay === 'number' && loopState.delay > 0
}

/**
 * Gets the delay in milliseconds for the next iteration
 * 
 * @param loopState - Loop state
 * @returns Delay in milliseconds, or 0 if no delay
 */
export function getLoopDelay(loopState: LoopState): number {
  return (loopState.delay || 0) * 1000 // Convert seconds to milliseconds
}

/**
 * Validates a loop configuration
 * 
 * @param type - Loop type
 * @param config - Loop configuration
 * @returns Validation result
 */
export function validateLoopConfig(
  type: LoopType,
  config: {
    maxIterations?: number
    condition?: ConditionConfig
    delay?: number
  }
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  switch (type) {
    case LoopType.REPEAT:
      if (!config.maxIterations || config.maxIterations <= 0) {
        errors.push('REPEAT loop requires maxIterations > 0')
      }
      break
      
    case LoopType.WHILE:
      if (!config.condition) {
        errors.push('WHILE loop requires a condition')
      }
      break
      
    case LoopType.WHILE_MAX:
      if (!config.condition) {
        errors.push('WHILE_MAX loop requires a condition')
      }
      if (!config.maxIterations || config.maxIterations <= 0) {
        errors.push('WHILE_MAX loop requires maxIterations > 0')
      }
      break
  }
  
  // Common validations
  if (config.maxIterations && config.maxIterations > 10000) {
    errors.push('maxIterations should not exceed 10000 for safety')
  }
  
  if (config.delay && (config.delay < 0 || config.delay > 3600)) {
    errors.push('delay should be between 0 and 3600 seconds')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Gets a human-readable description of a loop
 * 
 * @param loopState - Loop state
 * @returns Description string
 */
export function getLoopDescription(loopState: LoopState): string {
  let description = `${loopState.type.toUpperCase()} loop`
  
  switch (loopState.type) {
    case LoopType.REPEAT:
      if (loopState.maxIterations) {
        description += ` (${loopState.currentIteration}/${loopState.maxIterations})`
      }
      break
      
    case LoopType.WHILE:
      if (loopState.condition) {
        description += ` while ${loopState.condition.leftVariable} ${loopState.condition.operator} ${loopState.condition.rightValue}`
      }
      break
      
    case LoopType.WHILE_MAX:
      if (loopState.condition && loopState.maxIterations) {
        description += ` while ${loopState.condition.leftVariable} ${loopState.condition.operator} ${loopState.condition.rightValue} (max ${loopState.maxIterations})`
      }
      break
  }
  
  if (loopState.delay) {
    description += ` with ${loopState.delay}s delay`
  }
  
  return description
}

/**
 * Estimates the maximum runtime of a loop (for safety checks)
 * 
 * @param loopState - Loop state
 * @returns Estimated max runtime in milliseconds, or -1 if infinite
 */
export function estimateMaxRuntime(loopState: LoopState): number {
  let maxIterations = 0
  
  switch (loopState.type) {
    case LoopType.REPEAT:
    case LoopType.WHILE_MAX:
      maxIterations = loopState.maxIterations || 0
      break
      
    case LoopType.WHILE:
      // Could be infinite, return -1
      return -1
  }
  
  const delayPerIteration = getLoopDelay(loopState)
  const estimatedTimePerIteration = delayPerIteration + 1000 // 1s for execution
  
  return maxIterations * estimatedTimePerIteration
}

/**
 * Creates a safety timeout for a loop
 * 
 * @param loopState - Loop state
 * @param maxRuntimeMs - Maximum allowed runtime in milliseconds
 * @returns Timeout handler function
 */
export function createLoopTimeout(
  loopState: LoopState,
  maxRuntimeMs: number = 60000 // 1 minute default
): NodeJS.Timeout {
  return setTimeout(() => {
    console.warn(`Loop ${loopState.blockId} exceeded maximum runtime of ${maxRuntimeMs}ms`)
    // Note: Actual loop interruption would be handled by the caller
  }, maxRuntimeMs)
}

/**
 * Debug helper: Gets loop status information
 * 
 * @param loopState - Loop state
 * @param variables - Current variables (optional)
 * @returns Debug information
 */
export function debugLoopState(
  loopState: LoopState,
  variables?: Record<string, any>
): {
  description: string
  progress: string
  nextDecision?: LoopDecision
  estimatedRuntime: number | string
} {
  const description = getLoopDescription(loopState)
  
  let progress = `Iteration ${loopState.currentIteration}`
  if (loopState.maxIterations) {
    progress += ` of ${loopState.maxIterations}`
  }
  
  let nextDecision: LoopDecision | undefined
  if (variables) {
    nextDecision = shouldContinueLoop(loopState, variables)
  }
  
  const estimatedRuntime = estimateMaxRuntime(loopState)
  const runtimeDisplay = estimatedRuntime === -1 ? 'infinite' : `${estimatedRuntime}ms`
  
  return {
    description,
    progress,
    nextDecision,
    estimatedRuntime: runtimeDisplay
  }
}
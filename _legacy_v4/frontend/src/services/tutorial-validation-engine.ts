// ABOUTME: Validation engine for tutorial step completion verification
// ABOUTME: Provides validators for different step types and validation rules

import type { TutorialStep } from './tutorial-service'

// Validation Interfaces
export interface ValidationResult {
  success: boolean
  error?: string
  hint?: string
}

export interface ValidationContext {
  step: TutorialStep
  element?: HTMLElement | null
  userInput?: any
  state?: any
}

// Base Validator Interface
export interface StepValidator {
  validate(context: ValidationContext): Promise<ValidationResult>
}

// Action Validator (for click/hover actions)
export class ActionValidator implements StepValidator {
  async validate(context: ValidationContext): Promise<ValidationResult> {
    const { step, element } = context

    console.log('[ActionValidator] Validating action step:', step.id, 'element:', element)

    if (!element) {
      console.log('[ActionValidator] Element not found - FAIL')
      return {
        success: false,
        error: 'Element not found',
        hint: 'Make sure the element exists on the page'
      }
    }

    // For action steps, success means the action was detected
    // (actual detection happens in TutorialEngine via event listeners)
    console.log('[ActionValidator] Element found - SUCCESS')
    return { success: true }
  }
}

// Input Validator (for form field validation)
export class InputValidator implements StepValidator {
  async validate(context: ValidationContext): Promise<ValidationResult> {
    const { step, element } = context

    if (!element) {
      return {
        success: false,
        error: 'Input element not found'
      }
    }

    const inputElement = element as HTMLInputElement
    const value = inputElement.value

    // Check validation rules if present
    if (step.validationRules) {
      // Required check
      if (step.validationRules.required && !value) {
        return {
          success: false,
          error: 'This field is required',
          hint: 'Please fill in this field before continuing'
        }
      }

      // Pattern check
      if (step.validationRules.pattern && value) {
        const regex = new RegExp(step.validationRules.pattern)
        if (!regex.test(value)) {
          return {
            success: false,
            error: 'Invalid format',
            hint: 'Please check the format of your input'
          }
        }
      }
    }

    return { success: true }
  }
}

// State Validator (for DOM/store state checks)
export class StateValidator implements StepValidator {
  async validate(context: ValidationContext): Promise<ValidationResult> {
    const { step } = context

    // Simple existence check for now
    if (step.targetElement) {
      const element = document.querySelector(step.targetElement)
      if (!element) {
        return {
          success: false,
          error: 'Expected element not found',
          hint: 'Complete the previous steps first'
        }
      }
    }

    return { success: true }
  }
}

// Navigation Validator (for route changes)
export class NavigationValidator implements StepValidator {
  async validate(context: ValidationContext): Promise<ValidationResult> {
    const { step } = context

    // Get current route path
    const currentPath = window.location.pathname

    // Check if step has expected route
    if (step.validationRules?.expectedRoute) {
      const expectedRoute = step.validationRules.expectedRoute

      if (currentPath === expectedRoute || currentPath.startsWith(expectedRoute)) {
        return { success: true }
      }

      return {
        success: false,
        error: `Expected to be on ${expectedRoute}`,
        hint: 'Navigate to the correct page first'
      }
    }

    return { success: true }
  }
}

// Validation Engine Class
export class ValidationEngine {
  private validators: Map<string, StepValidator> = new Map()

  constructor() {
    console.log('[ValidationEngine] Constructor called - registering validators')
    // Register default validators
    this.validators.set('action', new ActionValidator())
    this.validators.set('input', new InputValidator())
    this.validators.set('interaction', new InputValidator()) // Use same as input
    this.validators.set('validation', new StateValidator())
    this.validators.set('navigation', new NavigationValidator())
    console.log('[ValidationEngine] Registered validators:', Array.from(this.validators.keys()))
  }

  async validateStep(context: ValidationContext): Promise<ValidationResult> {
    const { step } = context
    console.log('[ValidationEngine] validateStep called for:', step.id, 'type:', step.type)

    const validator = this.validators.get(step.type)
    console.log('[ValidationEngine] Validator found:', !!validator, 'Available validators:', Array.from(this.validators.keys()))

    if (!validator) {
      console.warn(`[ValidationEngine] No validator for step type: ${step.type}`)
      return { success: true } // Allow by default if no validator
    }

    try {
      console.log('[ValidationEngine] Calling validator.validate()...')
      const result = await validator.validate(context)
      console.log('[ValidationEngine] Validator returned:', result)
      return result
    } catch (error: any) {
      console.error('[ValidationEngine] Validation error:', error)
      return {
        success: false,
        error: error.message || 'Validation failed',
        hint: 'An error occurred during validation'
      }
    }
  }

  registerValidator(type: string, validator: StepValidator): void {
    this.validators.set(type, validator)
  }

  removeValidator(type: string): void {
    this.validators.delete(type)
  }
}

// Export singleton instance
export const validationEngine = new ValidationEngine()

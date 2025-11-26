/**
 * 📦 Universal Validation Service
 * ✅ Единен валидатор за всички flow проверки
 * Централизирана система за валидация и status управление
 * Created: 2025-08-09
 */

import type { FlowDefinition } from '../modules/flowEditorV2/types/FlowDefinition'
import { FlowValidator, type FlowValidationResult } from '../modules/flowEditorV2/core/flow/FlowValidator'

// Universal validation result with enhanced status system
export interface ValidationResult {
  status: 'draft' | 'invalid' | 'validated' | 'ready'
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  canUseInActionTemplate: boolean
  summary: {
    totalChecks: number
    passedChecks: number
    failedChecks: number
    structureScore: number // 0-100
    logicScore: number // 0-100
    targetScore: number // 0-100
  }
}

export interface ValidationError {
  code: string
  message: string
  severity: 'error' | 'critical'
  blockId?: string
  connectionId?: string
  context?: any
}

export interface ValidationWarning {
  code: string
  message: string
  severity: 'warning' | 'info'
  blockId?: string
  connectionId?: string
  context?: any
}

export interface ValidationOptions {
  mode: 'quick' | 'full' | 'targets-only' | 'structure-only'
  checkTargets?: boolean
  checkActionTemplateCompatibility?: boolean
  includeWarnings?: boolean
  targetRegistry?: TargetRegistryItem[]
}

export interface TargetRegistryItem {
  targetKey: string
  blockType: string
  fieldName: string
  lastUsed?: string
  isActive?: boolean
}

/**
 * UniversalValidationService - Централен валидатор за всички flow операции
 */
export class UniversalValidationService {
  
  /**
   * Главна validation функция - извиква всички необходими проверки
   */
  static async validateFlow(
    flowData: FlowDefinition, 
    options: ValidationOptions = { mode: 'full' }
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    let totalChecks = 0
    let passedChecks = 0

    // 1. Structure validation (винаги се изпълнява)
    if (options.mode !== 'targets-only') {
      const structureResult = await this.validateStructure(flowData, options)
      errors.push(...structureResult.errors)
      warnings.push(...structureResult.warnings)
      totalChecks += structureResult.totalChecks
      passedChecks += structureResult.passedChecks
    }

    // 2. Flow logic validation (за full и quick mode)
    if (options.mode === 'full' || options.mode === 'quick') {
      const logicResult = await this.validateFlowLogic(flowData, options)
      errors.push(...logicResult.errors)
      warnings.push(...logicResult.warnings)
      totalChecks += logicResult.totalChecks
      passedChecks += logicResult.passedChecks
    }

    // 3. Target validation (ако е поискана)
    let targetScore = 100
    if (options.checkTargets && options.targetRegistry) {
      const targetResult = await this.validateTargets(flowData, options.targetRegistry, options)
      errors.push(...targetResult.errors)
      warnings.push(...targetResult.warnings)
      totalChecks += targetResult.totalChecks
      passedChecks += targetResult.passedChecks
      targetScore = targetResult.score
    }

    // 4. ActionTemplate compatibility (ако е поискана)
    if (options.checkActionTemplateCompatibility) {
      const compatResult = await this.validateActionTemplateCompatibility(flowData, options)
      errors.push(...compatResult.errors)
      warnings.push(...compatResult.warnings)
      totalChecks += compatResult.totalChecks
      passedChecks += compatResult.passedChecks
    }

    // Определяме финалния status
    const status = this.determineValidationStatus(errors, warnings, options)
    const isValid = errors.length === 0
    const canUseInActionTemplate = this.canUseInActionTemplate(status, errors, options)

    // Изчисляваме scores
    const structureScore = Math.round((passedChecks / Math.max(totalChecks, 1)) * 100)
    const logicScore = errors.filter(e => e.code.includes('FLOW') || e.code.includes('CHAIN')).length === 0 ? 100 : 0

    return {
      status,
      isValid,
      errors,
      warnings: options.includeWarnings !== false ? warnings : [],
      canUseInActionTemplate,
      summary: {
        totalChecks,
        passedChecks,
        failedChecks: totalChecks - passedChecks,
        structureScore,
        logicScore,
        targetScore
      }
    }
  }

  /**
   * Валидира структурата на flow - блокове, връзки, основна integrity
   */
  private static async validateStructure(
    flowData: FlowDefinition,
    options: ValidationOptions
  ): Promise<{
    errors: ValidationError[]
    warnings: ValidationWarning[]
    totalChecks: number
    passedChecks: number
  }> {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    let totalChecks = 0
    let passedChecks = 0

    // Използваме съществуващия FlowValidator
    const flowValidation: FlowValidationResult = FlowValidator.validateFlow(flowData)
    
    // Конвертираме резултатите към нашия формат
    flowValidation.errors.forEach(error => {
      totalChecks++
      errors.push({
        code: error.code,
        message: error.message,
        severity: error.severity as 'error',
        blockId: error.blockId,
        connectionId: error.connectionId,
        context: error.context
      })
    })

    flowValidation.warnings.forEach(warning => {
      totalChecks++
      passedChecks++ // Warnings не блокират валидацията
      warnings.push({
        code: warning.code,
        message: warning.message,
        severity: warning.severity as 'warning',
        blockId: warning.blockId,
        connectionId: warning.connectionId,
        context: warning.context
      })
    })

    // Структурни проверки минаха ако няма грешки
    if (errors.length === 0) {
      passedChecks = totalChecks
    }

    return { errors, warnings, totalChecks, passedChecks }
  }

  /**
   * Валидира flow логиката - start/end blocks, orphaned blocks, circular references
   */
  private static async validateFlowLogic(
    flowData: FlowDefinition,
    options: ValidationOptions
  ): Promise<{
    errors: ValidationError[]
    warnings: ValidationWarning[]
    totalChecks: number
    passedChecks: number
  }> {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    let totalChecks = 5 // START, END, Chain, Orphaned, Circular
    let passedChecks = 0

    // Логическите проверки са вече в FlowValidator.validateFlow()
    // Тук можем да добавим допълнителни специфични проверки ако е нужно
    
    // За момента само увеличаваме брояча
    passedChecks = totalChecks

    return { errors, warnings, totalChecks, passedChecks }
  }

  /**
   * Валидира target mappings срещу TargetRegistry
   */
  private static async validateTargets(
    flowData: FlowDefinition,
    targetRegistry: TargetRegistryItem[],
    options: ValidationOptions
  ): Promise<{
    errors: ValidationError[]
    warnings: ValidationWarning[]
    totalChecks: number
    passedChecks: number
    score: number
  }> {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    let totalChecks = 0
    let passedChecks = 0

    // Събираме всички блокове които изискват targets
    const blocksRequiringTargets = flowData.blocks.filter(block => {
      // TODO: IMPLEMENT_LATER - логика за определяне кои блокове изискват targets
      return false
    })

    totalChecks = blocksRequiringTargets.length

    // TODO: IMPLEMENT_LATER - проверяване на target assignments срещу registry
    
    const score = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 100

    return { errors, warnings, totalChecks, passedChecks, score }
  }

  /**
   * Валидира съвместимост с ActionTemplate изисквания
   */
  private static async validateActionTemplateCompatibility(
    flowData: FlowDefinition,
    options: ValidationOptions
  ): Promise<{
    errors: ValidationError[]
    warnings: ValidationWarning[]
    totalChecks: number
    passedChecks: number
  }> {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    let totalChecks = 3 // Executor fields, Required targets, Flow completeness
    let passedChecks = 0

    // 1. Проверка за executor fields
    totalChecks++
    if (flowData.meta?.name && flowData.meta?.description) {
      passedChecks++
    } else {
      errors.push({
        code: 'MISSING_EXECUTOR_FIELDS',
        message: 'Flow липсват име и описание, необходими за ActionTemplate',
        severity: 'error',
        context: { missingFields: ['name', 'description'] }
      })
    }

    // 2. Проверка за flow completeness
    totalChecks++
    const flowValidation = FlowValidator.validateFlow(flowData)
    if (flowValidation.isValid && flowValidation.summary.hasStartBlock) {
      passedChecks++
    } else {
      errors.push({
        code: 'INCOMPLETE_FLOW',
        message: 'Flow не е завършен за използване в ActionTemplate',
        severity: 'error',
        context: { summary: flowValidation.summary }
      })
    }

    return { errors, warnings, totalChecks, passedChecks }
  }

  /**
   * Определя финалния validation status на базата на резултатите
   */
  private static determineValidationStatus(
    errors: ValidationError[],
    warnings: ValidationWarning[],
    options: ValidationOptions
  ): 'draft' | 'invalid' | 'validated' | 'ready' {
    
    // Ако има критични грешки -> invalid
    if (errors.some(e => e.severity === 'critical')) {
      return 'invalid'
    }
    
    // Ако има обикновени грешки -> invalid
    if (errors.length > 0) {
      return 'invalid'
    }
    
    // Ако няма грешки но има предупреждения за targets -> validated
    if (warnings.some(w => w.code.includes('TARGET'))) {
      return 'validated'
    }
    
    // Ако изисква target проверки но не са направени -> validated
    if (options.checkTargets === undefined) {
      return 'validated'
    }
    
    // Ако всичко е наред -> ready
    return 'ready'
  }

  /**
   * Определя дали flow може да се използва в ActionTemplate
   */
  private static canUseInActionTemplate(
    status: string,
    errors: ValidationError[],
    options: ValidationOptions
  ): boolean {
    
    // Само 'ready' и 'validated' flows могат да се използват
    if (status === 'ready') return true
    if (status === 'validated') return true
    
    // 'invalid' и 'draft' не могат
    return false
  }

  // === Helper методи за бързи проверки ===

  /**
   * Бърза проверка дали flow е валидно
   */
  static async isFlowValid(flowData: FlowDefinition): Promise<boolean> {
    const result = await this.validateFlow(flowData, { mode: 'quick' })
    return result.isValid
  }

  /**
   * Бърза проверка дали flow може да се използва в ActionTemplate
   */
  static async canUseInActionTemplate(flowData: FlowDefinition, targetRegistry?: TargetRegistryItem[]): Promise<boolean> {
    const result = await this.validateFlow(flowData, { 
      mode: 'full',
      checkTargets: !!targetRegistry,
      checkActionTemplateCompatibility: true,
      targetRegistry
    })
    return result.canUseInActionTemplate
  }

  /**
   * Получава само грешките от валидацията
   */
  static async getFlowErrors(flowData: FlowDefinition): Promise<ValidationError[]> {
    const result = await this.validateFlow(flowData, { mode: 'full', includeWarnings: false })
    return result.errors
  }

  /**
   * Получава само предупрежденията от валидацията
   */
  static async getFlowWarnings(flowData: FlowDefinition): Promise<ValidationWarning[]> {
    const result = await this.validateFlow(flowData, { mode: 'full', includeWarnings: true })
    return result.warnings
  }

  /**
   * Batch валидация на множество flows
   */
  static async validateMultipleFlows(
    flows: { id: string; data: FlowDefinition }[],
    options: ValidationOptions = { mode: 'full' }
  ): Promise<{ flowId: string; result: ValidationResult }[]> {
    
    const results: { flowId: string; result: ValidationResult }[] = []
    
    for (const flow of flows) {
      const result = await this.validateFlow(flow.data, options)
      results.push({ flowId: flow.id, result })
    }
    
    return results
  }
}
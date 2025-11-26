/**
 * 📦 Flow Validation Routes
 * ✅ Backend endpoints за flow валидация с UniversalValidationService
 * Поддържа единичен и batch validation
 * Created: 2025-08-09
 */

import { Router, Request, Response } from 'express'
// DEACTIVATED: Target Registry System - Phase 1D
// import { TargetRegistryItem } from '../models/TargetRegistry'

const router = Router()

// Flow Definition interface за backend
interface FlowDefinition {
  version: string
  meta: {
    createdAt: string
    modifiedAt: string
    programId?: string
    name?: string
    description?: string
    author?: string
  }
  blocks: any[]
  startBlock?: string
  globals?: Record<string, any>
  containers?: any[]
  containerMode?: {
    currentContainer?: string
    navigationStack: string[]
    currentMode: string
  }
}

// Validation Options
interface ValidationOptions {
  mode: 'quick' | 'full' | 'targets-only' | 'structure-only'
  checkTargets?: boolean
  checkActionTemplateCompatibility?: boolean
  includeWarnings?: boolean
}

// Validation Result
interface ValidationResult {
  status: 'draft' | 'invalid' | 'validated' | 'ready'
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  canUseInActionTemplate: boolean
  summary: {
    totalChecks: number
    passedChecks: number
    failedChecks: number
    structureScore: number
    logicScore: number
    targetScore: number
  }
}

interface ValidationError {
  code: string
  message: string
  severity: 'error' | 'critical'
  blockId?: string
  connectionId?: string
  context?: any
}

interface ValidationWarning {
  code: string
  message: string
  severity: 'warning' | 'info'
  blockId?: string
  connectionId?: string
  context?: any
}

/**
 * POST /api/v1/flows/validate
 * Валидира единичен flow
 */
router.post('/validate', async (req: Request, res: Response) => {
    try {
      const { flowData, options = { mode: 'full' } } = req.body
      
      // Basic input validation
      if (!flowData) {
        return res.status(400).json({
          success: false,
          error: 'Flow data е задължителен'
        })
      }
      
      // Валидиране на flow
      const flowValidationResult = await validateFlowOnBackend(flowData, options)
      
      res.json({
        success: true,
        data: flowValidationResult
      })
      
    } catch (error: any) {
      console.error('Flow validation error:', error)
      res.status(500).json({
        success: false,
        message: 'Грешка при валидация на flow',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      })
    }
  })

/**
 * POST /api/v1/flows/batch-validate
 * Валидира множество flows едновременно
 */
router.post('/batch-validate', async (req: Request, res: Response) => {
    try {
      const { flowIds, options = { mode: 'full' } } = req.body
      
      // Basic input validation
      if (!Array.isArray(flowIds) || flowIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Flow IDs трябва да са масив и не могат да са празни'
        })
      }
      
      // TODO: IMPLEMENT_LATER - Load flows from FlowTemplate model
      const results: { flowId: string; result: ValidationResult }[] = []
      
      for (const flowId of flowIds) {
        try {
          // TODO: IMPLEMENT_LATER - Load actual flow data
          const mockFlowData: FlowDefinition = {
            version: '1.0',
            meta: {
              createdAt: new Date().toISOString(),
              modifiedAt: new Date().toISOString(),
              name: `Flow ${flowId}`
            },
            blocks: [],
            startBlock: undefined
          }
          
          const flowValidationResult = await validateFlowOnBackend(mockFlowData, options)
          results.push({ flowId, result: flowValidationResult })
          
        } catch (error: any) {
          // Ако валидацията на един flow се провали, продължаваме с останалите
          results.push({
            flowId,
            result: {
              status: 'invalid',
              isValid: false,
              errors: [{
                code: 'VALIDATION_ERROR',
                message: `Грешка при валидация на flow ${flowId}`,
                severity: 'critical',
                context: { error: error.message }
              }],
              warnings: [],
              canUseInActionTemplate: false,
              summary: {
                totalChecks: 1,
                passedChecks: 0,
                failedChecks: 1,
                structureScore: 0,
                logicScore: 0,
                targetScore: 0
              }
            }
          })
        }
      }
      
      res.json({
        success: true,
        data: results,
        summary: {
          totalFlows: flowIds.length,
          validFlows: results.filter(r => r.result.isValid).length,
          invalidFlows: results.filter(r => !r.result.isValid).length
        }
      })
      
    } catch (error: any) {
      console.error('Batch flow validation error:', error)
      res.status(500).json({
        success: false,
        message: 'Грешка при batch валидация на flows',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      })
    }
  })

/**
 * GET /api/v1/flows/validation-status/:flowId
 * Получава само validation статуса на flow без пълна валидация
 */
router.get('/validation-status/:flowId', async (req: Request, res: Response) => {
  try {
    const { flowId } = req.params
    
    // TODO: IMPLEMENT_LATER - Load flow metadata from database
    const mockStatus = {
      flowId,
      status: 'validated' as const,
      lastValidationCheck: new Date().toISOString(),
      canUseInActionTemplate: true
    }
    
    res.json({
      success: true,
      data: mockStatus
    })
    
  } catch (error: any) {
    console.error('Flow validation status error:', error)
    res.status(500).json({
      success: false,
      message: 'Грешка при получаване на validation статус',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
})

/**
 * Backend валидация функция - адаптация на frontend UniversalValidationService
 */
async function validateFlowOnBackend(
  flowData: FlowDefinition,
  options: ValidationOptions
): Promise<ValidationResult> {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []
  let totalChecks = 0
  let passedChecks = 0

  // 1. Basic structure validation
  totalChecks++
  if (!flowData.blocks || flowData.blocks.length === 0) {
    errors.push({
      code: 'NO_BLOCKS',
      message: 'Flow-то не съдържа блокове',
      severity: 'error'
    })
  } else {
    passedChecks++
  }

  // 2. Meta information validation
  totalChecks++
  if (!flowData.meta?.name) {
    warnings.push({
      code: 'MISSING_NAME',
      message: 'Flow няма име',
      severity: 'warning'
    })
  } else {
    passedChecks++
  }

  // 3. Target validation (ако е поискана)
  let targetScore = 100
  if (options.checkTargets) {
    try {
      // DEACTIVATED: Target Registry System - Phase 1D
      // const targetRegistry = await TargetRegistryItem.find({ isActive: true })
      const targetRegistry = []; // Mock empty registry
      totalChecks++
      
      // TODO: IMPLEMENT_LATER - проверяване на target assignments
      passedChecks++
      
    } catch (error: any) {
      errors.push({
        code: 'TARGET_REGISTRY_ERROR',
        message: 'Грешка при достъп до Target Registry',
        severity: 'error',
        context: { error: error.message }
      })
    }
  }

  // 4. ActionTemplate compatibility
  if (options.checkActionTemplateCompatibility) {
    totalChecks += 2
    
    if (flowData.meta?.name && flowData.meta?.description) {
      passedChecks++
    } else {
      errors.push({
        code: 'MISSING_EXECUTOR_FIELDS',
        message: 'Flow липсват име и описание за ActionTemplate',
        severity: 'error'
      })
    }
    
    if (flowData.blocks.length > 0) {
      passedChecks++
    } else {
      errors.push({
        code: 'EMPTY_FLOW',
        message: 'Flow не може да се използва в ActionTemplate без блокове',
        severity: 'error'
      })
    }
  }

  // Определяме status
  const status = determineStatus(errors, warnings, options)
  const isValid = errors.length === 0
  const canUseInActionTemplate = (status === 'ready' || status === 'validated')

  // Scores
  const structureScore = Math.round((passedChecks / Math.max(totalChecks, 1)) * 100)
  const logicScore = errors.filter(e => e.code.includes('FLOW')).length === 0 ? 100 : 0

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
 * Определя validation status
 */
function determineStatus(
  errors: ValidationError[],
  warnings: ValidationWarning[],
  options: ValidationOptions
): 'draft' | 'invalid' | 'validated' | 'ready' {
  if (errors.some(e => e.severity === 'critical')) return 'invalid'
  if (errors.length > 0) return 'invalid'
  if (warnings.some(w => w.code.includes('TARGET'))) return 'validated'
  if (options.checkTargets === undefined) return 'validated'
  return 'ready'
}

export default router
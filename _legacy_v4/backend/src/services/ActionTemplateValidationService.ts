/**
 * 🎯 Phase 4: ActionTemplate Validation Service
 * ✅ Runtime validation за ActionTemplate execution готовност
 * Интегрира с UniversalValidationService за flow проверки
 * Created: 2025-08-09
 */

import { ActionTemplate } from '../models/ActionTemplate'
import { FlowTemplate } from '../models/FlowTemplate'

// Execution Check Result
interface ActionTemplateExecutionCheck {
  canExecute: boolean
  flowValidationStatus: 'draft' | 'invalid' | 'validated' | 'ready'
  blockingErrors: string[]
  warnings: string[]
  templateInfo: {
    templateId: string
    templateName: string
    hasLinkedFlow: boolean
    hasFlowFile: boolean
    targetMappingsCount: number
  }
  lastValidationCheck: string
}

// Flow Definition interface (simplified for backend)
interface FlowDefinition {
  version: string
  meta: {
    createdAt: string
    modifiedAt: string
    name?: string
    description?: string
  }
  blocks: any[]
  startBlock?: string
}

/**
 * ActionTemplate Validation Service Class
 * Проверява готовност на ActionTemplate за execution
 */
export class ActionTemplateValidationService {
  
  /**
   * Validates ActionTemplate for execution readiness
   * Основен метод за проверка преди стартиране на automation
   */
  static async validateForExecution(actionTemplateId: string): Promise<ActionTemplateExecutionCheck> {
    try {
      // 1. Load ActionTemplate
      const actionTemplate = await ActionTemplate.findById(actionTemplateId)
      if (!actionTemplate) {
        throw new Error(`ActionTemplate with ID ${actionTemplateId} not found`)
      }

      const result: ActionTemplateExecutionCheck = {
        canExecute: false,
        flowValidationStatus: 'draft',
        blockingErrors: [],
        warnings: [],
        templateInfo: {
          templateId: actionTemplate._id.toString(),
          templateName: actionTemplate.name,
          hasLinkedFlow: !!actionTemplate.linkedFlowId,
          hasFlowFile: !!actionTemplate.flowFile,
          targetMappingsCount: actionTemplate.targetMappings?.length || 0
        },
        lastValidationCheck: new Date().toISOString()
      }

      // 2. Check for flow reference
      if (!actionTemplate.linkedFlowId && !actionTemplate.flowFile) {
        result.blockingErrors.push('ActionTemplate няма свързан flow (linkedFlowId или flowFile)')
        return result
      }

      // 3. Load flow data
      let flowData: FlowDefinition | null = null
      
      try {
        if (actionTemplate.linkedFlowId) {
          // Load from FlowTemplate (new approach)
          const latestFlow = await FlowTemplate.findLatestVersion(actionTemplate.linkedFlowId)
          if (latestFlow) {
            // Read JSON file data
            const fs = await import('fs').then(m => m.promises)
            const fullFilePath = `${process.cwd()}/../${latestFlow.filePath}${latestFlow.jsonFileName}`
            try {
              const fileContent = await fs.readFile(fullFilePath, 'utf-8')
              flowData = JSON.parse(fileContent) as FlowDefinition
            } catch (fileError) {
              result.blockingErrors.push(`Не може да се прочете flow JSON файл: ${fileError}`)
              return result
            }
          } else {
            result.blockingErrors.push(`Linked flow ${actionTemplate.linkedFlowId} не е намерен`)
            return result
          }
        } else if (actionTemplate.flowFile) {
          // Load from legacy flowFile (fallback)
          const fs = await import('fs').then(m => m.promises)
          const path = await import('path')
          
          const flowFilePath = path.resolve(process.cwd(), '..', 'frontend', 'tasks', actionTemplate.flowFile)
          
          try {
            await fs.access(flowFilePath)
            const fileContent = await fs.readFile(flowFilePath, 'utf-8')
            const parsedData = JSON.parse(fileContent)
            
            flowData = {
              version: parsedData.version || '1.0',
              meta: parsedData.meta || {
                createdAt: new Date().toISOString(),
                modifiedAt: new Date().toISOString(),
                name: actionTemplate.name
              },
              blocks: parsedData.blocks || [],
              startBlock: parsedData.startBlock
            }
          } catch (fileError) {
            result.blockingErrors.push(`Flow file ${actionTemplate.flowFile} не може да се прочете`)
            return result
          }
        }
      } catch (loadError) {
        result.blockingErrors.push(`Грешка при зареждане на flow: ${loadError instanceof Error ? loadError.message : 'Unknown error'}`)
        return result
      }

      if (!flowData) {
        result.blockingErrors.push('Flow data не може да се зареди')
        return result
      }

      // 4. Validate flow със съществуващата backend validation логика
      const validation = await this.validateFlowData(flowData)
      
      result.flowValidationStatus = validation.status
      result.blockingErrors.push(...validation.errors.map(e => e.message))
      result.warnings.push(...validation.warnings.map(w => w.message))

      // 5. ActionTemplate specific checks
      if (validation.status === 'ready' || validation.status === 'validated') {
        // Check target mappings if flow is valid
        if (result.templateInfo.targetMappingsCount === 0) {
          result.warnings.push('ActionTemplate няма конфигурирани target mappings')
        }
      }

      // 6. Update ActionTemplate status ако е нужно
      if (actionTemplate.flowValidationStatus !== validation.status) {
        actionTemplate.flowValidationStatus = validation.status
        actionTemplate.lastFlowCheck = new Date()
        await actionTemplate.save()
      }

      // 7. Determine execution readiness
      result.canExecute = (
        validation.status === 'ready' && 
        result.blockingErrors.length === 0
      )

      return result

    } catch (error) {
      console.error('ActionTemplate validation error:', error)
      
      return {
        canExecute: false,
        flowValidationStatus: 'invalid',
        blockingErrors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
        templateInfo: {
          templateId: actionTemplateId,
          templateName: 'Unknown',
          hasLinkedFlow: false,
          hasFlowFile: false,
          targetMappingsCount: 0
        },
        lastValidationCheck: new Date().toISOString()
      }
    }
  }

  /**
   * Validates multiple ActionTemplates in batch
   * За bulk validation operations
   */
  static async batchValidateForExecution(actionTemplateIds: string[]): Promise<ActionTemplateExecutionCheck[]> {
    const results: ActionTemplateExecutionCheck[] = []

    for (const templateId of actionTemplateIds) {
      try {
        const result = await this.validateForExecution(templateId)
        results.push(result)
      } catch (error) {
        results.push({
          canExecute: false,
          flowValidationStatus: 'invalid',
          blockingErrors: [`Batch validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
          warnings: [],
          templateInfo: {
            templateId,
            templateName: 'Error',
            hasLinkedFlow: false,
            hasFlowFile: false,
            targetMappingsCount: 0
          },
          lastValidationCheck: new Date().toISOString()
        })
      }
    }

    return results
  }

  /**
   * Public method for direct flow validation (for enhanced save endpoint)
   * Directly validates flow data without ActionTemplate context
   */
  static async validateFlowOnly(flowData: FlowDefinition) {
    return this.validateFlowData(flowData)
  }

  /**
   * Simplified flow validation logic (backend version)
   * Използва същата логика като flowValidationRoutes.ts
   */
  private static async validateFlowData(flowData: FlowDefinition) {
    const errors: { code: string; message: string; severity: 'error' | 'critical' }[] = []
    const warnings: { code: string; message: string; severity: 'warning' | 'info' }[] = []
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

    // 3. ActionTemplate compatibility check
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

    // Determine status
    const status = this.determineValidationStatus(errors, warnings)
    const isValid = errors.length === 0

    return {
      status,
      isValid,
      errors,
      warnings,
      canUseInActionTemplate: (status === 'ready' || status === 'validated'),
      summary: {
        totalChecks,
        passedChecks,
        failedChecks: totalChecks - passedChecks,
        structureScore: Math.round((passedChecks / Math.max(totalChecks, 1)) * 100),
        logicScore: errors.filter(e => e.code.includes('FLOW')).length === 0 ? 100 : 0,
        targetScore: 100 // TODO: IMPLEMENT_LATER - target validation
      }
    }
  }

  /**
   * Determines validation status based on errors and warnings
   */
  private static determineValidationStatus(
    errors: { severity: 'error' | 'critical' }[], 
    warnings: { code: string }[]
  ): 'draft' | 'invalid' | 'validated' | 'ready' {
    if (errors.some(e => e.severity === 'critical')) return 'invalid'
    if (errors.length > 0) return 'invalid'
    if (warnings.some(w => w.code.includes('TARGET'))) return 'validated'
    return 'ready'
  }
}

export default ActionTemplateValidationService
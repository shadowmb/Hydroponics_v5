/**
 * 📦 FlowEditor v3 - Validation Service 
 * ✅ Централизирана валидация система за flows и ActionTemplate синхронизация
 * Created: 2025-08-08
 */

import { FlowValidator, validateFlow, type FlowValidationResult } from '../core/flow/FlowValidator';
import type { FlowDefinition } from '../core/flow/FlowDefinition';
import { compareVersions, isNewerVersion } from '../utils/versionUtils';

// ActionTemplate validation types
export interface ActionTemplateValidationResult {
  isValid: boolean;
  syncStatus: 'synced' | 'outdated' | 'broken' | 'unknown';
  errors: ValidationError[];
  warnings: ValidationWarning[];
  flowValidation?: FlowValidationResult;
}

export interface ValidationError {
  code: string;
  message: string;
  severity: 'error';
  context?: any;
}

export interface ValidationWarning extends ValidationError {
  severity: 'warning';
}

// Validation error codes
export const ValidationCodes = {
  // ActionTemplate validation
  TEMPLATE_NO_FLOW: 'TEMPLATE_NO_FLOW',
  TEMPLATE_FLOW_NOT_FOUND: 'TEMPLATE_FLOW_NOT_FOUND',
  TEMPLATE_VERSION_OUTDATED: 'TEMPLATE_VERSION_OUTDATED',
  TEMPLATE_FLOW_INVALID: 'TEMPLATE_FLOW_INVALID',
  TEMPLATE_TARGET_MAPPING_INVALID: 'TEMPLATE_TARGET_MAPPING_INVALID',
  TEMPLATE_TARGET_MAPPING_ORPHANED: 'TEMPLATE_TARGET_MAPPING_ORPHANED',
  
  // Flow-Template synchronization
  FLOW_VERSION_MISMATCH: 'FLOW_VERSION_MISMATCH',
  FLOW_STRUCTURE_CHANGED: 'FLOW_STRUCTURE_CHANGED',
  FLOW_BLOCKS_REMOVED: 'FLOW_BLOCKS_REMOVED',
  FLOW_EXECUTOR_FIELDS_CHANGED: 'FLOW_EXECUTOR_FIELDS_CHANGED',
} as const;

/**
 * Централизирана валидация система
 */
export class ValidationService {
  
  /**
   * Валидира ActionTemplate и свързания flow
   */
  static async validateActionTemplate(
    template: any, 
    flowData?: FlowDefinition
  ): Promise<ActionTemplateValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let syncStatus: 'synced' | 'outdated' | 'broken' | 'unknown' = 'unknown';
    let flowValidation: FlowValidationResult | undefined;

    // 1. Основна проверка за наличие на flow
    if (!template.linkedFlowId && !template.flowFile) {
      errors.push({
        code: ValidationCodes.TEMPLATE_NO_FLOW,
        message: 'ActionTemplate няма свързан flow (нито linkedFlowId, нито flowFile)',
        severity: 'error',
      });
      return { isValid: false, syncStatus: 'broken', errors, warnings };
    }

    // 2. Ако има flow данни, валидираме ги
    if (flowData) {
      flowValidation = validateFlow(flowData);
      
      if (!flowValidation.isValid) {
        errors.push({
          code: ValidationCodes.TEMPLATE_FLOW_INVALID,
          message: `Свързаният flow има ${flowValidation.errors.length} грешки`,
          severity: 'error',
          context: { flowErrors: flowValidation.errors.slice(0, 3) }
        });
        syncStatus = 'broken';
      }

      // 3. Валидираме target mappings спрямо flow blocks
      const targetValidation = this.validateTargetMappings(template, flowData);
      errors.push(...targetValidation.errors);
      warnings.push(...targetValidation.warnings);

      // 4. Проверка за версия несъответствие
      if (template.linkedFlowVersion && flowData.meta.flowVersion) {
        const versionComparison = compareVersions(
          flowData.meta.flowVersion, 
          template.linkedFlowVersion
        );
        
        if (versionComparison > 0) {
          warnings.push({
            code: ValidationCodes.TEMPLATE_VERSION_OUTDATED,
            message: `Flow версията (${flowData.meta.flowVersion}) е по-нова от template версията (${template.linkedFlowVersion})`,
            severity: 'warning',
            context: {
              flowVersion: flowData.meta.flowVersion,
              templateVersion: template.linkedFlowVersion
            }
          });
          syncStatus = 'outdated';
        } else if (versionComparison === 0 && errors.length === 0) {
          syncStatus = 'synced';
        }
      }
    } else {
      // Няма flow данни за валидация
      warnings.push({
        code: ValidationCodes.TEMPLATE_FLOW_NOT_FOUND,
        message: 'Flow данните не могат да бъдат заредени за валидация',
        severity: 'warning'
      });
    }

    // Ако няма грешки и не е определен статус, е неизвестен
    if (errors.length === 0 && syncStatus === 'unknown') {
      syncStatus = 'synced';
    } else if (errors.length > 0 && syncStatus === 'unknown') {
      syncStatus = 'broken';
    }

    return {
      isValid: errors.length === 0,
      syncStatus,
      errors,
      warnings,
      flowValidation
    };
  }

  /**
   * Валидира target mappings спрямо flow блокове
   */
  private static validateTargetMappings(
    template: any,
    flowData: FlowDefinition
  ): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!template.targetMappings || template.targetMappings.length === 0) {
      return { errors, warnings };
    }

    // Създаваме мапа от blockId към executor полета
    const executorBlocksMap = new Map<string, string[]>();
    
    flowData.blocks.forEach(block => {
      // TODO: IMPLEMENT_LATER - Проверка за executor полета от block definition
      // За сега просто предполагаме че всички блокове могат да имат target mappings
      executorBlocksMap.set(block.id, ['deviceType', 'action', 'duration', 'dose']); // Общи полета
    });

    // Валидираме всеки target mapping
    template.targetMappings.forEach((mapping: any, index: number) => {
      const block = flowData.blocks.find(b => b.id === mapping.blockId);
      
      if (!block) {
        errors.push({
          code: ValidationCodes.TEMPLATE_TARGET_MAPPING_ORPHANED,
          message: `Target mapping #${index + 1} сочи към несъществуващ блок: ${mapping.blockId}`,
          severity: 'error',
          context: { mapping, blockId: mapping.blockId }
        });
        return;
      }

      // Проверяваме дали полето съществува в блока
      const blockFields = executorBlocksMap.get(mapping.blockId) || [];
      if (!blockFields.includes(mapping.fieldName)) {
        warnings.push({
          code: ValidationCodes.TEMPLATE_TARGET_MAPPING_INVALID,
          message: `Target mapping #${index + 1}: поле "${mapping.fieldName}" не съществува в блок ${mapping.blockId}`,
          severity: 'warning',
          context: { mapping, availableFields: blockFields }
        });
      }

      // Проверяваме target key формата
      if (!mapping.targetKey || !mapping.targetKey.startsWith('target.')) {
        errors.push({
          code: ValidationCodes.TEMPLATE_TARGET_MAPPING_INVALID,
          message: `Target mapping #${index + 1}: невалиден target key "${mapping.targetKey}"`,
          severity: 'error',
          context: { mapping }
        });
      }
    });

    return { errors, warnings };
  }

  /**
   * Проверява за структурни промени между две flow версии
   */
  static compareFlowStructures(
    currentFlow: FlowDefinition,
    previousFlow: FlowDefinition
  ): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Сравняваме блокове
    const currentBlockIds = new Set(currentFlow.blocks.map(b => b.id));
    const previousBlockIds = new Set(previousFlow.blocks.map(b => b.id));
    
    // Намираме премахнати блокове
    const removedBlocks = Array.from(previousBlockIds).filter(id => !currentBlockIds.has(id));
    if (removedBlocks.length > 0) {
      warnings.push({
        code: ValidationCodes.FLOW_BLOCKS_REMOVED,
        message: `${removedBlocks.length} блокове са премахнати от flow-то`,
        severity: 'warning',
        context: { removedBlocks }
      });
    }

    // Сравняваме връзките
    const currentConnections = currentFlow.connections.length;
    const previousConnections = previousFlow.connections.length;
    
    if (Math.abs(currentConnections - previousConnections) > 2) {
      warnings.push({
        code: ValidationCodes.FLOW_STRUCTURE_CHANGED,
        message: `Значителна промяна в броя връзки (${previousConnections} → ${currentConnections})`,
        severity: 'warning',
        context: { 
          previousCount: previousConnections,
          currentCount: currentConnections
        }
      });
    }

    return { errors, warnings };
  }

  /**
   * Валидира flow готовност за изпълнение
   */
  static validateFlowExecutability(flow: FlowDefinition): {
    isExecutable: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
  } {
    const flowValidation = validateFlow(flow);
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Конвертираме FlowValidation грешки в ValidationService формат
    flowValidation.errors.forEach(error => {
      errors.push({
        code: error.code,
        message: error.message,
        severity: 'error',
        context: error.context
      });
    });

    flowValidation.warnings.forEach(warning => {
      warnings.push({
        code: warning.code,
        message: warning.message,
        severity: 'warning',
        context: warning.context
      });
    });

    // Допълнителни проверки за изпълнимост
    const isExecutable = flowValidation.isValid && 
                        flowValidation.summary.hasStartBlock && 
                        flowValidation.summary.orphanedBlocks === 0;

    return { isExecutable, errors, warnings };
  }

  /**
   * Групира validation резултатите по severity
   */
  static groupValidationResults(
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ) {
    return {
      critical: errors.filter(e => e.code.includes('BROKEN') || e.code.includes('INVALID')),
      errors: errors.filter(e => !e.code.includes('BROKEN') && !e.code.includes('INVALID')),
      warnings: warnings,
      total: errors.length + warnings.length
    };
  }

  /**
   * Проверява дали validation статус е критичен
   */
  static isCriticalValidationStatus(status: string): boolean {
    return status === 'broken';
  }
}
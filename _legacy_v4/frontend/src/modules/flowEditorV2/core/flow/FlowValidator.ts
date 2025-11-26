/**
 * 📦 FlowEditor v3 - Flow Validator
 * ✅ Част от основната редакторна система
 * Валидация на цяло флоу дефиниция
 * Последна проверка: 2025-01-26
 */

import type { FlowDefinition } from './FlowDefinition';
import type { BlockInstance, BlockConnection } from '../../types/BlockConcept';
// ❌ Legacy import removed - BlockValidator moved to legacy-BlockValidator.ts
// import { BlockValidator } from '../blocks/legacy-BlockValidator';
// ❌ Legacy import removed - using adapter now
// import { BlockFactory } from '../blocks/legacy-BlockFactory';
import { PortManager, validateConnection } from '../ports/PortManager';
import { getBlockDefinition, getBlockSchema } from '../../ui/adapters/BlockFactoryAdapter';
import { BlockValidator } from '../../validation/BlockValidator';

// Flow validation result
export interface FlowValidationResult {
  isValid: boolean;
  errors: FlowValidationError[];
  warnings: FlowValidationWarning[];
  blockResults: Map<string, any>; // Block ID -> validation result
  summary: {
    totalBlocks: number;
    validBlocks: number;
    invalidBlocks: number;
    totalConnections: number;
    validConnections: number;
    invalidConnections: number;
    hasStartBlock: boolean;
    hasEndPoints: boolean;
    orphanedBlocks: number;
  };
}

export interface FlowValidationError {
  code: string;
  message: string;
  severity: 'error';
  blockId?: string;
  connectionId?: string;
  context?: any;
}

export interface FlowValidationWarning extends Omit<FlowValidationError, 'severity'> {
  severity: 'warning';
}

// Flow validation error codes (updated for new architecture)
export const FlowValidationCodes = {
  // Structure errors
  NO_BLOCKS: 'NO_BLOCKS',
  NO_START_BLOCK: 'NO_START_BLOCK',
  MULTIPLE_START_BLOCKS: 'MULTIPLE_START_BLOCKS',
  NO_END_POINTS: 'NO_END_POINTS',
  ORPHANED_BLOCKS: 'ORPHANED_BLOCKS',
  
  // New architecture-specific errors (B4.5)
  MISSING_START_BLOCK: 'MISSING_START_BLOCK',           // No system.start block
  MISSING_END_BLOCK: 'MISSING_END_BLOCK',               // No system.end block
  BROKEN_FLOW_CHAIN: 'BROKEN_FLOW_CHAIN',               // START → END chain broken
  UNDEFINED_VARIABLE: 'UNDEFINED_VARIABLE',             // setVarData points to non-existent variable
  INVALID_BLOCK_TYPE: 'INVALID_BLOCK_TYPE',             // Core block without flow ports
  SUPPORT_BLOCK_IN_MAIN_FLOW: 'SUPPORT_BLOCK_IN_MAIN_FLOW', // Support block connected to flow
  
  // Block errors
  INVALID_BLOCK: 'INVALID_BLOCK',
  MISSING_BLOCK_DEFINITION: 'MISSING_BLOCK_DEFINITION',
  DUPLICATE_BLOCK_ID: 'DUPLICATE_BLOCK_ID',
  
  // Connection errors
  INVALID_CONNECTION: 'INVALID_CONNECTION',
  MISSING_SOURCE_BLOCK: 'MISSING_SOURCE_BLOCK',
  MISSING_TARGET_BLOCK: 'MISSING_TARGET_BLOCK',
  MISSING_SOURCE_PORT: 'MISSING_SOURCE_PORT',
  MISSING_TARGET_PORT: 'MISSING_TARGET_PORT',
  PORT_TYPE_MISMATCH: 'PORT_TYPE_MISMATCH',
  REQUIRED_PORT_UNCONNECTED: 'REQUIRED_PORT_UNCONNECTED',
  
  // Flow structure
  CIRCULAR_DEPENDENCY: 'CIRCULAR_DEPENDENCY',
  UNREACHABLE_BLOCKS: 'UNREACHABLE_BLOCKS',
  
  // Variable validation
  VARIABLE_NAME_DUPLICATE: 'VARIABLE_NAME_DUPLICATE',   // Multiple setVarName with same name
  VARIABLE_CHAIN_BROKEN: 'VARIABLE_CHAIN_BROKEN',       // setVarData without corresponding setVarName
  
  // Warnings
  DEPRECATED_BLOCK: 'DEPRECATED_BLOCK',
  EXPERIMENTAL_BLOCK: 'EXPERIMENTAL_BLOCK',
  UNUSED_BLOCK: 'UNUSED_BLOCK',
  ISOLATED_SUPPORT_BLOCK: 'ISOLATED_SUPPORT_BLOCK',    // Support block not connected to core blocks
} as const;

// Flow Validator class
export class FlowValidator {
  /**
   * Вълполна валидация на цял flow с блокове, връзки и логика
   * @param flow - flow дефиницията за валидиране
   * @returns пълен обект с резултати, грешки и статистики
   */
  static validateFlow(flow: FlowDefinition): FlowValidationResult {
    const errors: FlowValidationError[] = [];
    const warnings: FlowValidationWarning[] = [];
    const blockResults = new Map();

    // Основни проверки на структурата
    const structureValidation = this.validateFlowStructure(flow);
    errors.push(...structureValidation.errors);
    warnings.push(...structureValidation.warnings);

    // Валидиране на всички блокове
    const blockValidation = this.validateAllBlocks(flow);
    errors.push(...blockValidation.errors);
    warnings.push(...blockValidation.warnings);
    blockValidation.results.forEach((result, blockId) => {
      blockResults.set(blockId, result);
    });

    // Валидиране на връзките
    const connectionValidation = this.validateAllConnections(flow);
    errors.push(...connectionValidation.errors);
    warnings.push(...connectionValidation.warnings);

    // Валидиране на flow логиката
    const flowLogicValidation = this.validateFlowLogic(flow);
    errors.push(...flowLogicValidation.errors);
    warnings.push(...flowLogicValidation.warnings);

    // Валидиране на блок архитектурата (B4.1: Core vs Support)
    const architectureValidation = this.validateBlockArchitecture(flow);
    errors.push(...architectureValidation.errors);
    warnings.push(...architectureValidation.warnings);

    // Валидиране на главния поток (B4.2: START → END chain)
    const mainFlowValidation = this.validateMainFlowChain(flow);
    errors.push(...mainFlowValidation.errors);
    warnings.push(...mainFlowValidation.warnings);

    // Валидиране на променливите (B4.3: Variable consistency)
    const variableValidation = this.validateVariableConsistency(flow);
    errors.push(...variableValidation.errors);
    warnings.push(...variableValidation.warnings);

    // Детектиране на orphaned блокове (B4.4: Orphaned blocks)
    const orphanedValidation = this.validateOrphanedBlocks(flow);
    errors.push(...orphanedValidation.errors);
    warnings.push(...orphanedValidation.warnings);

    // Създаваме summary
    const summary = this.generateSummary(flow, blockResults, connectionValidation.validConnections);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      blockResults,
      summary,
    };
  }

  /**
   * Проверява основната структура - наличие на блокове и дупликати
   * @param flow - flow дефиниция
   * @returns обект с грешки и предупреждения
   */
  private static validateFlowStructure(flow: FlowDefinition): {
    errors: FlowValidationError[];
    warnings: FlowValidationWarning[];
  } {
    const errors: FlowValidationError[] = [];
    const warnings: FlowValidationWarning[] = [];

    // Проверка за празно flow
    if (!flow.blocks || (flow.blocks || []).length === 0) {
      errors.push({
        code: FlowValidationCodes.NO_BLOCKS,
        message: 'Flow-то не съдържа блокове',
        severity: 'error',
      });
      return { errors, warnings };
    }

    // Проверка за дублирани block IDs
    const blockIds = new Set<string>();
    const duplicates: string[] = [];
    
    (flow.blocks || []).forEach(block => {
      if (blockIds.has(block.id)) {
        duplicates.push(block.id);
      } else {
        blockIds.add(block.id);
      }
    });

    duplicates.forEach(blockId => {
      errors.push({
        code: FlowValidationCodes.DUPLICATE_BLOCK_ID,
        message: `Дублиран block ID: ${blockId}`,
        severity: 'error',
        blockId,
      });
    });

    return { errors, warnings };
  }

  /**
   * Проверява всички блокове за валидни дефиниции и параметри
   * @param flow - flow дефиниция
   * @returns обект с резултати, грешки и валидационни резултати
   */
  private static validateAllBlocks(flow: FlowDefinition): {
    errors: FlowValidationError[];
    warnings: FlowValidationWarning[];
    results: Map<string, any>;
  } {
    const errors: FlowValidationError[] = [];
    const warnings: FlowValidationWarning[] = [];
    const results = new Map();

    (flow.blocks || []).forEach(block => {
      // Проверка за съществуваща дефиниция
      const definition = getBlockDefinition(block.definitionId);
      if (!definition) {
        errors.push({
          code: FlowValidationCodes.MISSING_BLOCK_DEFINITION,
          message: `Block definition не е намерена: ${block.definitionId}`,
          severity: 'error',
          blockId: block.id,
        });
        return;
      }

      // Проверка за deprecated блокове
      const schema = getBlockSchema(block.definitionId);
      if (schema?.deprecated) {
        warnings.push({
          code: FlowValidationCodes.DEPRECATED_BLOCK,
          message: `Блокът '${definition.name}' е остарял`,
          severity: 'warning',
          blockId: block.id,
        });
      }

      // Проверка за експериментални блокове
      if (definition.meta?.experimental) {
        warnings.push({
          code: FlowValidationCodes.EXPERIMENTAL_BLOCK,
          message: `Блокът '${definition.name}' е експериментален`,
          severity: 'warning',
          blockId: block.id,
        });
      }

      // Валидиране с новия BlockValidator
      const blockValidation = BlockValidator.validateBlock(block, flow.connections || [], flow.blocks || []);
      results.set(block.id, blockValidation);

      if (!blockValidation.isValid) {
        errors.push({
          code: FlowValidationCodes.INVALID_BLOCK,
          message: `Невалиден блок '${definition.name}': ${blockValidation.errors[0]?.message}`,
          severity: 'error',
          blockId: block.id,
          context: blockValidation.errors,
        });
      }

      // Добавяме block warnings
      blockValidation.warnings.forEach(warning => {
        warnings.push({
          code: warning.code,
          message: `${definition.name}: ${warning.message}`,
          severity: 'warning',
          blockId: block.id,
        });
      });
    });

    return { errors, warnings, results };
  }

  /**
   * Проверява всички връзки за валидни блокове и съвместими портове
   * @param flow - flow дефиниция 
   * @returns обект с грешки, предупреждения и брояч на валидни връзки
   */
  private static validateAllConnections(flow: FlowDefinition): {
    errors: FlowValidationError[];
    warnings: FlowValidationWarning[];
    validConnections: number;
  } {
    const errors: FlowValidationError[] = [];
    const warnings: FlowValidationWarning[] = [];
    let validConnections = 0;

    const blockMap = new Map((flow.blocks || []).map(block => [block.id, block]));

    (flow.connections || []).forEach(connection => {
      // Проверка за съществуващи блокове
      const sourceBlock = blockMap.get(connection.sourceBlockId);
      const targetBlock = blockMap.get(connection.targetBlockId);

      if (!sourceBlock) {
        errors.push({
          code: FlowValidationCodes.MISSING_SOURCE_BLOCK,
          message: `Source блокът не съществува: ${connection.sourceBlockId}`,
          severity: 'error',
          connectionId: connection.id,
        });
        return;
      }

      if (!targetBlock) {
        errors.push({
          code: FlowValidationCodes.MISSING_TARGET_BLOCK,
          message: `Target блокът не съществува: ${connection.targetBlockId}`,
          severity: 'error',
          connectionId: connection.id,
        });
        return;
      }

      // Проверка за съществуващи портове
      const sourceDefinition = getBlockDefinition(sourceBlock.definitionId);
      const targetDefinition = getBlockDefinition(targetBlock.definitionId);

      if (!sourceDefinition || !targetDefinition) {
        errors.push({
          code: FlowValidationCodes.INVALID_CONNECTION,
          message: `Липсват block definitions за connection ${connection.id}`,
          severity: 'error',
          connectionId: connection.id,
        });
        return;
      }

      const sourcePort = sourceDefinition.outputs.find(p => p.id === connection.sourcePortId);
      const targetPort = targetDefinition.inputs.find(p => p.id === connection.targetPortId);

      if (!sourcePort) {
        errors.push({
          code: FlowValidationCodes.MISSING_SOURCE_PORT,
          message: `Source port не съществува: ${connection.sourcePortId}`,
          severity: 'error',
          connectionId: connection.id,
          blockId: sourceBlock.id,
        });
        return;
      }

      if (!targetPort) {
        errors.push({
          code: FlowValidationCodes.MISSING_TARGET_PORT,
          message: `Target port не съществува: ${connection.targetPortId}`,
          severity: 'error',
          connectionId: connection.id,
          blockId: targetBlock.id,
        });
        return;
      }

      // Валидиране на port compatibility
      const portValidation = validateConnection(sourcePort, targetPort);
      if (!portValidation.isValid) {
        errors.push({
          code: FlowValidationCodes.PORT_TYPE_MISMATCH,
          message: `Несъвместими port типове: ${portValidation.errors[0]}`,
          severity: 'error',
          connectionId: connection.id,
        });
      } else {
        validConnections++;
        
        // Добавяме warnings за port compatibility
        if (portValidation.compatibility === 'warning') {
          warnings.push({
            code: 'PORT_COMPATIBILITY_WARNING',
            message: `Потенциален проблем с връзката: ${portValidation.warnings[0]}`,
            severity: 'warning',
            connectionId: connection.id,
          });
        }
      }
    });

    return { errors, warnings, validConnections };
  }

  /**
   * Анализира flow логиката - стартови блокове, достъпност и цикли
   * @param flow - flow дефиниция
   * @returns обект с грешки и предупреждения от логическата валидация
   */
  private static validateFlowLogic(flow: FlowDefinition): {
    errors: FlowValidationError[];
    warnings: FlowValidationWarning[];
  } {
    const errors: FlowValidationError[] = [];
    const warnings: FlowValidationWarning[] = [];

    // Намиране на start блокове (блокове без input connections или с explicit startBlock)
    const startBlocks = this.findStartBlocks(flow);
    
    if (startBlocks.length === 0) {
      errors.push({
        code: FlowValidationCodes.NO_START_BLOCK,
        message: 'Flow-то няма стартов блок',
        severity: 'error',
      });
    } else if (startBlocks.length > 1) {
      warnings.push({
        code: FlowValidationCodes.MULTIPLE_START_BLOCKS,
        message: `Flow-то има множество стартови блокове: ${startBlocks.length}`,
        severity: 'warning',
      });
    }

    // Намиране на end points (блокове без output connections)
    const endPoints = this.findEndPoints(flow);
    
    if (endPoints.length === 0) {
      warnings.push({
        code: FlowValidationCodes.NO_END_POINTS,
        message: 'Flow-то няма крайни точки',
        severity: 'warning',
      });
    }

    // Проверка за orphaned блокове - използваме подобрена логика като validateOrphanedBlocks()
    const reachableBlocks = this.findReachableBlocks(flow, startBlocks);
    
    // Добавяме support блокове които са свързани към вече достъпни core блокове
    const additionalReachableBlocks = new Set<string>();
    (flow.connections || []).forEach(connection => {
      const sourceBlock = (flow.blocks || []).find(b => b.id === connection.sourceBlockId);
      const targetBlock = (flow.blocks || []).find(b => b.id === connection.targetBlockId);
      
      if (!sourceBlock || !targetBlock) return;
      
      const sourceDefinition = getBlockDefinition(sourceBlock.definitionId);
      const targetDefinition = getBlockDefinition(targetBlock.definitionId);
      
      if (!sourceDefinition || !targetDefinition) return;
      
      // Ако source е support блок и target е достъпен core блок
      if (sourceDefinition.blockType === 'support' && 
          targetDefinition.blockType === 'core' && 
          reachableBlocks.has(connection.targetBlockId)) {
        additionalReachableBlocks.add(connection.sourceBlockId);
      }
      
      // Ако target е support блок и source е достъпен core блок  
      if (targetDefinition.blockType === 'support' && 
          sourceDefinition.blockType === 'core' && 
          reachableBlocks.has(connection.sourceBlockId)) {
        additionalReachableBlocks.add(connection.targetBlockId);
      }
    });
    
    // Добавяме additional blocks към reachable
    additionalReachableBlocks.forEach(blockId => reachableBlocks.add(blockId));
    
    const orphanedBlocks = (flow.blocks || []).filter(block => !reachableBlocks.has(block.id));

    if (orphanedBlocks.length > 0) {
      // Филтрираме само core блоковете за грешка
      const orphanedCore = orphanedBlocks.filter(block => {
        const definition = getBlockDefinition(block.definitionId);
        return definition?.blockType === 'core';
      });
      
      if (orphanedCore.length > 0) {
        warnings.push({
          code: FlowValidationCodes.ORPHANED_BLOCKS,
          message: `${orphanedCore.length} core блокове не могат да бъдат достигнати`,
          severity: 'warning',
          context: orphanedCore.map(b => b.id),
        });
      }
    }

    // Basic circular dependency detection
    const circularDependencies = this.detectCircularDependencies(flow);
    if (circularDependencies.length > 0) {
      errors.push({
        code: FlowValidationCodes.CIRCULAR_DEPENDENCY,
        message: `Открити циклични зависимости: ${circularDependencies.length}`,
        severity: 'error',
        context: circularDependencies,
      });
    }

    // Проверка за required ports без connections
    const unconnectedRequiredPorts = this.findUnconnectedRequiredPorts(flow);
    unconnectedRequiredPorts.forEach(({ blockId, portId, portLabel }) => {
      errors.push({
        code: FlowValidationCodes.REQUIRED_PORT_UNCONNECTED,
        message: `Задължителен port '${portLabel}' не е свързан`,
        severity: 'error',
        blockId,
        context: { portId },
      });
    });

    return { errors, warnings };
  }

  /**
   * Валидира блок архитектурата - Core vs Support блокове (B4.1)
   * @param flow - flow дефиниция
   * @returns обект с грешки и предупреждения за архитектурни нарушения
   */
  private static validateBlockArchitecture(flow: FlowDefinition): {
    errors: FlowValidationError[];
    warnings: FlowValidationWarning[];
  } {
    const errors: FlowValidationError[] = [];
    const warnings: FlowValidationWarning[] = [];

    // Събираме всички блокове с техните дефиниции
    const coreBlocks: BlockInstance[] = [];
    const supportBlocks: BlockInstance[] = [];

    (flow.blocks || []).forEach(block => {
      const definition = getBlockDefinition(block.definitionId);
      if (!definition) return; // Пропускаме блокове без дефиниция (ще се заловят другаде)

      if (definition.blockType === 'core') {
        coreBlocks.push(block);
      } else if (definition.blockType === 'support') {
        supportBlocks.push(block);
      }
    });

    // 1. Проверяваме дали core блоковете имат задължителни flow портове
    coreBlocks.forEach(block => {
      const definition = getBlockDefinition(block.definitionId);
      if (!definition) return;

      const hasFlowIn = definition.inputs.some(port => port.type === 'flowIn');
      const hasFlowOut = definition.outputs.some(port => port.type === 'flowOut');

      // Системни блокове имат специални правила
      if (definition.type === 'start') {
        if (!hasFlowOut) {
          errors.push({
            code: FlowValidationCodes.INVALID_BLOCK_TYPE,
            message: `СТАРТ блок '${definition.name}' трябва да има flowOut порт`,
            severity: 'error',
            blockId: block.id,
          });
        }
      } else if (definition.type === 'end') {
        if (!hasFlowIn) {
          errors.push({
            code: FlowValidationCodes.INVALID_BLOCK_TYPE,
            message: `КРАЙ блок '${definition.name}' трябва да има flowIn порт`,
            severity: 'error',
            blockId: block.id,
          });
        }
      } else {
        // Обикновени core блокове трябва да имат и flowIn и flowOut
        if (!hasFlowIn && !hasFlowOut) {
          errors.push({
            code: FlowValidationCodes.INVALID_BLOCK_TYPE,
            message: `Core блок '${definition.name}' трябва да има поне един flow порт`,
            severity: 'error',
            blockId: block.id,
          });
        }
      }
    });

    // 2. Проверяваме дали support блоковете НЕ участват в главния поток
    supportBlocks.forEach(block => {
      const definition = getBlockDefinition(block.definitionId);
      if (!definition) return;

      const hasFlowPorts = definition.inputs.some(port => port.type === 'flowIn' || port.type === 'flowOut') ||
                          definition.outputs.some(port => port.type === 'flowIn' || port.type === 'flowOut');

      if (hasFlowPorts) {
        errors.push({
          code: FlowValidationCodes.SUPPORT_BLOCK_IN_MAIN_FLOW,
          message: `Support блок '${definition.name}' не трябва да има flow портове`,
          severity: 'error',
          blockId: block.id,
        });
      }
    });

    // 3. Проверяваме дали support блоковете са свързани към core блокове
    supportBlocks.forEach(block => {
      const definition = getBlockDefinition(block.definitionId);
      if (!definition) return;

      let isConnectedToCoreBlock = false;

      // Проверяваме входните връзки
      Object.entries(block.connections?.inputs || {}).forEach(([portId, connectionIds]) => {
        connectionIds.forEach(connectionId => {
          const connection = (flow.connections || []).find(c => c.id === connectionId);
          if (connection) {
            const sourceBlock = (flow.blocks || []).find(b => b.id === connection.sourceBlockId);
            if (sourceBlock) {
              const sourceDef = getBlockDefinition(sourceBlock.definitionId);
              if (sourceDef?.blockType === 'core') {
                isConnectedToCoreBlock = true;
              }
            }
          }
        });
      });

      // Проверяваме изходните връзки
      Object.entries(block.connections?.outputs || {}).forEach(([portId, connectionIds]) => {
        connectionIds.forEach(connectionId => {
          const connection = (flow.connections || []).find(c => c.id === connectionId);
          if (connection) {
            const targetBlock = (flow.blocks || []).find(b => b.id === connection.targetBlockId);
            if (targetBlock) {
              const targetDef = getBlockDefinition(targetBlock.definitionId);
              if (targetDef?.blockType === 'core') {
                isConnectedToCoreBlock = true;
              }
            }
          }
        });
      });

      if (!isConnectedToCoreBlock) {
        warnings.push({
          code: FlowValidationCodes.ISOLATED_SUPPORT_BLOCK,
          message: `Support блок '${definition.name}' не е свързан към core блок`,
          severity: 'warning',
          blockId: block.id,
        });
      }
    });

    return { errors, warnings };
  }

  /**
   * Валидира главния поток - СТАРТ → КРАЙ непрекъсната верига (B4.2)
   * @param flow - flow дефиниция
   * @returns обект с грешки и предупреждения за главния поток
   */
  private static validateMainFlowChain(flow: FlowDefinition): {
    errors: FlowValidationError[];
    warnings: FlowValidationWarning[];
  } {
    const errors: FlowValidationError[] = [];
    const warnings: FlowValidationWarning[] = [];

    // 1. Намираме system.start блок
    const startBlocks = (flow.blocks || []).filter(block => {
      const definition = getBlockDefinition(block.definitionId);
      return definition?.type === 'start';
    });

    if (startBlocks.length === 0) {
      errors.push({
        code: FlowValidationCodes.MISSING_START_BLOCK,
        message: 'Flow-то няма СТАРТ блок (system.start)',
        severity: 'error',
      });
    } else if (startBlocks.length > 1) {
      errors.push({
        code: FlowValidationCodes.MULTIPLE_START_BLOCKS,
        message: `Flow-то има множество СТАРТ блокове: ${startBlocks.length}`,
        severity: 'error',
        context: startBlocks.map(b => b.id),
      });
    }

    // 2. Намираме system.end блок
    const endBlocks = (flow.blocks || []).filter(block => {
      const definition = getBlockDefinition(block.definitionId);
      return definition?.type === 'end';
    });

    if (endBlocks.length === 0) {
      errors.push({
        code: FlowValidationCodes.MISSING_END_BLOCK,
        message: 'Flow-то няма КРАЙ блок (system.end)',
        severity: 'error',
      });
    } else if (endBlocks.length > 1) {
      warnings.push({
        code: FlowValidationCodes.MULTIPLE_START_BLOCKS,
        message: `Flow-то има множество КРАЙ блокове: ${endBlocks.length}`,
        severity: 'warning',
        context: endBlocks.map(b => b.id),
      });
    }

    // Ако няма START или END, не можем да проверим веригата
    if (startBlocks.length === 0 || endBlocks.length === 0) {
      return { errors, warnings };
    }

    // 3. Проверяваме непрекъснатата flowOut → flowIn верига
    const startBlock = startBlocks[0];
    const endBlock = endBlocks[0];
    
    const flowChainResult = this.traceFlowChain(flow, startBlock, endBlock);
    
    if (!flowChainResult.isComplete) {
      errors.push({
        code: FlowValidationCodes.BROKEN_FLOW_CHAIN,
        message: `Прекъсната flow верига между СТАРТ и КРАЙ блок${flowChainResult.brokenAt ? ` в блок: ${flowChainResult.brokenAt}` : ''}`,
        severity: 'error',
        context: {
          startBlockId: startBlock.id,
          endBlockId: endBlock.id,
          brokenAt: flowChainResult.brokenAt,
          visitedBlocks: flowChainResult.visitedBlocks,
        },
      });
    }

    // 4. Проверяваме дали всички core блокове участват в главната верига
    const coreBlocksInFlow = (flow.blocks || []).filter(block => {
      const definition = getBlockDefinition(block.definitionId);
      return definition?.blockType === 'core';
    });

    const orphanedCoreBlocks = coreBlocksInFlow.filter(block => 
      !flowChainResult.visitedBlocks.includes(block.id)
    );

    if (orphanedCoreBlocks.length > 0) {
      warnings.push({
        code: FlowValidationCodes.ORPHANED_BLOCKS,
        message: `${orphanedCoreBlocks.length} core блокове не участват в главната flow верига`,
        severity: 'warning',
        context: orphanedCoreBlocks.map(b => b.id),
      });
    }

    return { errors, warnings };
  }

  /**
   * Проследява flow веригата от start до end блок
   * @param flow - flow дефиниция
   * @param startBlock - началният блок
   * @param endBlock - крайният блок
   * @returns резултат от проследяването
   */
  private static traceFlowChain(
    flow: FlowDefinition, 
    startBlock: BlockInstance, 
    endBlock: BlockInstance
  ): {
    isComplete: boolean;
    visitedBlocks: string[];
    brokenAt?: string;
  } {
    const visitedBlocks: string[] = [];
    const visited = new Set<string>();
    
    // Build flow connection map (само flowOut → flowIn връзки)
    const flowConnections = new Map<string, string[]>();
    
    (flow.connections || []).forEach(connection => {
      const sourceBlock = (flow.blocks || []).find(b => b.id === connection.sourceBlockId);
      const targetBlock = (flow.blocks || []).find(b => b.id === connection.targetBlockId);
      
      if (!sourceBlock || !targetBlock) return;
      
      const sourceDefinition = getBlockDefinition(sourceBlock.definitionId);
      const targetDefinition = getBlockDefinition(targetBlock.definitionId);
      
      if (!sourceDefinition || !targetDefinition) return;
      
      // Проверяваме дали връзката е flowOut → flowIn
      const sourcePort = sourceDefinition.outputs.find(p => p.id === connection.sourcePortId);
      const targetPort = targetDefinition.inputs.find(p => p.id === connection.targetPortId);
      
      if (sourcePort?.type === 'flowOut' && targetPort?.type === 'flowIn') {
        const targets = flowConnections.get(connection.sourceBlockId) || [];
        targets.push(connection.targetBlockId);
        flowConnections.set(connection.sourceBlockId, targets);
      }
    });

    // DFS traversal по flow веригата
    const traverse = (currentBlockId: string): boolean => {
      if (visited.has(currentBlockId)) {
        return false; // Cycle detected, but continue
      }
      
      visited.add(currentBlockId);
      visitedBlocks.push(currentBlockId);
      
      // Ако достигнахме end блока, завършваме успешно
      if (currentBlockId === endBlock.id) {
        return true;
      }
      
      // Намираме следващите блокове в flow веригата
      const nextBlocks = flowConnections.get(currentBlockId) || [];
      
      // Ако няма следващи блокове и не сме в end блока
      if (nextBlocks.length === 0) {
        return false;
      }
      
      // Проследяваме всички следващи блокове (за случаи с разклонения като IF блок)
      for (const nextBlockId of nextBlocks) {
        if (traverse(nextBlockId)) {
          return true; // Намерихме път до края
        }
      }
      
      return false;
    };

    const isComplete = traverse(startBlock.id);
    const brokenAt = !isComplete && visitedBlocks.length > 0 ? 
                    visitedBlocks[visitedBlocks.length - 1] : undefined;

    return {
      isComplete,
      visitedBlocks,
      brokenAt,
    };
  }

  /**
   * Валидира консистентността на променливите (B4.3) - Optimized Version
   * @param flow - flow дефиниция
   * @returns обект с грешки и предупреждения за променливите
   */
  private static validateVariableConsistency(flow: FlowDefinition): {
    errors: FlowValidationError[];
    warnings: FlowValidationWarning[];
  } {
    const errors: FlowValidationError[] = [];
    const warnings: FlowValidationWarning[] = [];

    // Performance optimization: Single pass with cached definitions
    const blockDefinitions = new Map<string, BlockDefinition>();
    const variableNames = new Map<string, string[]>(); // variableName -> [blockId1, blockId2, ...]
    const setVarDataBlocks: { block: BlockInstance; sourceVariable: string | null }[] = [];
    const coreBlocks: { block: BlockInstance; definition: BlockDefinition }[] = [];
    const usedVariables = new Set<string>();

    // Single optimized pass over all blocks
    for (const block of (flow.blocks || [])) {
      let definition = blockDefinitions.get(block.definitionId);
      if (!definition) {
        definition = getBlockDefinition(block.definitionId);
        if (definition) {
          blockDefinitions.set(block.definitionId, definition);
        }
      }

      if (!definition) continue;

      // Process setVarName blocks
      if (definition.type === 'setVarName') {
        const variableName = block.parameters.internalVar; // ✅ ПОПРАВЕН - използва internalVar
        if (variableName && typeof variableName === 'string') {
          const existingBlocks = variableNames.get(variableName) || [];
          existingBlocks.push(block.id);
          variableNames.set(variableName, existingBlocks);
        }
      }
      // Process setVarData blocks
      else if (definition.type === 'setVarData') {
        const sourceVariable = block.parameters.sourceVariable;
        const sourceVarString = sourceVariable && typeof sourceVariable === 'string' ? sourceVariable : null;
        setVarDataBlocks.push({ block, sourceVariable: sourceVarString });
        
        if (sourceVarString) {
          usedVariables.add(sourceVarString);
        }
      }
      // Cache core blocks for port validation
      else if (definition.blockType === 'core') {
        coreBlocks.push({ block, definition });
      }
    }

    // Fast duplicate variable name detection
    for (const [variableName, blockIds] of variableNames) {
      if (blockIds.length > 1) {
        warnings.push({
          code: FlowValidationCodes.VARIABLE_NAME_DUPLICATE,
          message: `Променливата '${variableName}' е дефинирана в множество setVarName блокове`,
          severity: 'warning',
          context: { variableName, duplicateBlocks: blockIds },
        });
      }
    }

    // Optimized variable reference validation
    const definedVariables = new Set(variableNames.keys());
    for (const { block, sourceVariable } of setVarDataBlocks) {
      if (sourceVariable) {
        if (!definedVariables.has(sourceVariable)) {
          errors.push({
            code: FlowValidationCodes.UNDEFINED_VARIABLE,
            message: `setVarData блок сочи към недефинирана променлива: '${sourceVariable}'`,
            severity: 'error',
            blockId: block.id,
            context: {
              referencedVariable: sourceVariable,
              availableVariables: Array.from(definedVariables),
            },
          });
        }
      } else {
        warnings.push({
          code: FlowValidationCodes.VARIABLE_CHAIN_BROKEN,
          message: `setVarData блок няма конфигурирана променлива за четене`,
          severity: 'warning',
          blockId: block.id,
        });
      }
    }

    // Fast unused variables detection
    const unusedVariables = Array.from(definedVariables).filter(varName => !usedVariables.has(varName));
    if (unusedVariables.length > 0) {
      warnings.push({
        code: FlowValidationCodes.UNUSED_BLOCK,
        message: `${unusedVariables.length} променливи не се използват: ${unusedVariables.join(', ')}`,
        severity: 'warning',
        context: { unusedVariables },
      });
    }

    // Optimized core block port validation
    for (const { block, definition } of coreBlocks) {
      // Check setVarNameIn ports
      for (const port of definition.inputs) {
        if (port.type === 'setVarNameIn' && port.required) {
          const connections = block.connections?.inputs?.[port.id] || [];
          if (connections.length === 0) {
            errors.push({
              code: FlowValidationCodes.REQUIRED_PORT_UNCONNECTED,
              message: `Core блок '${definition.name}' изисква setVarName връзка за порт '${port.label}'`,
              severity: 'error',
              blockId: block.id,
              context: { portId: port.id },
            });
          }
        }
        // Check setVarDataIn ports
        else if (port.type === 'setVarDataIn' && port.required) {
          const connections = block.connections?.inputs?.[port.id] || [];
          if (connections.length === 0) {
            errors.push({
              code: FlowValidationCodes.REQUIRED_PORT_UNCONNECTED,
              message: `Core блок '${definition.name}' изисква setVarData връзка за порт '${port.label}'`,
              severity: 'error',
              blockId: block.id,
              context: { portId: port.id },
            });
          }
        }
      }
    }

    return { errors, warnings };
  }

  /**
   * Детектира orphaned блокове извън главната верига (B4.4)
   * @param flow - flow дефиниция
   * @returns обект с грешки и предупреждения за orphaned блокове
   */
  private static validateOrphanedBlocks(flow: FlowDefinition): {
    errors: FlowValidationError[];
    warnings: FlowValidationWarning[];
  } {
    const errors: FlowValidationError[] = [];
    const warnings: FlowValidationWarning[] = [];

    // Намираме START блок
    const startBlocks = (flow.blocks || []).filter(block => {
      const definition = getBlockDefinition(block.definitionId);
      return definition?.type === 'start';
    });

    // Ако няма START блок, не можем да проверим orphaned блокове
    if (startBlocks.length === 0) {
      return { errors, warnings };
    }

    const startBlock = startBlocks[0];

    // 1. Намираме всички блокове достъпни от START чрез всякакви връзки (не само flow)
    const allReachableBlocks = this.findAllReachableBlocks(flow, startBlock);
    
    // Добавяме support блокове които са свързани към вече достъпни core блокове
    const additionalReachableBlocks = new Set<string>();
    (flow.connections || []).forEach(connection => {
      const sourceBlock = (flow.blocks || []).find(b => b.id === connection.sourceBlockId);
      const targetBlock = (flow.blocks || []).find(b => b.id === connection.targetBlockId);
      
      if (!sourceBlock || !targetBlock) return;
      
      const sourceDefinition = getBlockDefinition(sourceBlock.definitionId);
      const targetDefinition = getBlockDefinition(targetBlock.definitionId);
      
      if (!sourceDefinition || !targetDefinition) return;
      
      // Ако source е support блок и target е достъпен core блок
      if (sourceDefinition.blockType === 'support' && 
          targetDefinition.blockType === 'core' && 
          allReachableBlocks.has(connection.targetBlockId)) {
        additionalReachableBlocks.add(connection.sourceBlockId);
      }
      
      // Ако target е support блок и source е достъпен core блок  
      if (targetDefinition.blockType === 'support' && 
          sourceDefinition.blockType === 'core' && 
          allReachableBlocks.has(connection.sourceBlockId)) {
        additionalReachableBlocks.add(connection.targetBlockId);
      }
    });
    
    // Добавяме additional blocks към reachable
    additionalReachableBlocks.forEach(blockId => allReachableBlocks.add(blockId));
    
    // 2. Идентифицираме orphaned блокове
    const allBlocks = (flow.blocks || []).map(b => b.id);
    const orphanedBlockIds = allBlocks.filter(blockId => !allReachableBlocks.has(blockId));

    if (orphanedBlockIds.length > 0) {
      // Разделяме orphaned блоковете по тип
      const orphanedCore: string[] = [];
      const orphanedSupport: string[] = [];
      const orphanedUnknown: string[] = [];

      orphanedBlockIds.forEach(blockId => {
        const block = (flow.blocks || []).find(b => b.id === blockId);
        if (!block) return;

        const definition = getBlockDefinition(block.definitionId);
        if (!definition) {
          orphanedUnknown.push(blockId);
        } else if (definition.blockType === 'core') {
          orphanedCore.push(blockId);
        } else if (definition.blockType === 'support') {
          orphanedSupport.push(blockId);
        } else {
          orphanedUnknown.push(blockId);
        }
      });

      // Core блокове извън главната верига са грешка
      if (orphanedCore.length > 0) {
        errors.push({
          code: FlowValidationCodes.ORPHANED_BLOCKS,
          message: `${orphanedCore.length} core блокове не могат да бъдат достигнати от СТАРТ блока`,
          severity: 'error',
          context: {
            orphanedCoreBlocks: orphanedCore,
            totalOrphaned: orphanedBlockIds.length,
          },
        });
      }

      // Проверяваме дали support блоковете са свързани към core блокове (не само в главния поток)
      const actuallyOrphanedSupport = orphanedSupport.filter(supportBlockId => {
        const supportBlock = (flow.blocks || []).find(b => b.id === supportBlockId);
        if (!supportBlock) return true;
        
        // Проверяваме дали support блокът е свързан към някой core блок
        let isConnectedToCoreBlock = false;
        
        // Проверяваме всички връзки в flow-то
        (flow.connections || []).forEach(connection => {
          let otherBlockId = null;
          
          // Ако support блокът е source, проверяваме target блока
          if (connection.sourceBlockId === supportBlockId) {
            otherBlockId = connection.targetBlockId;
          }
          // Ако support блокът е target, проверяваме source блока
          else if (connection.targetBlockId === supportBlockId) {
            otherBlockId = connection.sourceBlockId;
          }
          
          if (otherBlockId) {
            const otherBlock = (flow.blocks || []).find(b => b.id === otherBlockId);
            if (otherBlock) {
              const otherDefinition = getBlockDefinition(otherBlock.definitionId);
              if (otherDefinition?.blockType === 'core') {
                isConnectedToCoreBlock = true;
              }
            }
          }
        });
        
        return !isConnectedToCoreBlock; // Връщаме true ако НЕ е свързан към core блок
      });
      
      // Support блокове които наистина са изолирани са предупреждение
      if (actuallyOrphanedSupport.length > 0) {
        warnings.push({
          code: FlowValidationCodes.ISOLATED_SUPPORT_BLOCK,
          message: `${actuallyOrphanedSupport.length} support блокове не са свързани към core блокове`,
          severity: 'warning',
          context: {
            orphanedSupportBlocks: actuallyOrphanedSupport,
          },
        });
      }

      // Неизвестни блокове също са предупреждение
      if (orphanedUnknown.length > 0) {
        warnings.push({
          code: FlowValidationCodes.ORPHANED_BLOCKS,
          message: `${orphanedUnknown.length} блокове с неизвестен тип не са достъпни`,
          severity: 'warning',
          context: {
            orphanedUnknownBlocks: orphanedUnknown,
          },
        });
      }
    }

    // 3. Специална проверка за END блокове - те трябва да са достъпни
    const endBlocks = (flow.blocks || []).filter(block => {
      const definition = getBlockDefinition(block.definitionId);
      return definition?.type === 'end';
    });

    endBlocks.forEach(endBlock => {
      if (!allReachableBlocks.has(endBlock.id)) {
        errors.push({
          code: FlowValidationCodes.UNREACHABLE_BLOCKS,
          message: `КРАЙ блок не може да бъде достигнат от СТАРТ блока`,
          severity: 'error',
          blockId: endBlock.id,
        });
      }
    });

    return { errors, warnings };
  }

  /**
   * Намира всички блокове достъпни от даден блок чрез всякакви връзки
   * @param flow - flow дефиниция
   * @param startBlock - началният блок
   * @returns Set с ID-тата на всички достъпни блокове
   */
  private static findAllReachableBlocks(flow: FlowDefinition, startBlock: BlockInstance): Set<string> {
    const reachable = new Set<string>();
    const toVisit = [startBlock.id];
    
    // Build adjacency map за всички връзки (input и output)
    const adjacencyMap = new Map<string, string[]>();
    
    (flow.connections || []).forEach(connection => {
      // Source → Target
      const sourceTargets = adjacencyMap.get(connection.sourceBlockId) || [];
      sourceTargets.push(connection.targetBlockId);
      adjacencyMap.set(connection.sourceBlockId, sourceTargets);
      
      // Target → Source (bidirectional за orphaned detection)
      const targetSources = adjacencyMap.get(connection.targetBlockId) || [];
      targetSources.push(connection.sourceBlockId);
      adjacencyMap.set(connection.targetBlockId, targetSources);
    });
    
    // DFS traversal
    while (toVisit.length > 0) {
      const current = toVisit.pop()!;
      if (reachable.has(current)) continue;
      
      reachable.add(current);
      const neighbors = adjacencyMap.get(current) || [];
      toVisit.push(...neighbors);
    }
    
    return reachable;
  }

  /**
   * Определя кои блокове могат да служат като стартови точки
   * @param flow - flow дефиниция
   * @returns масив със системни START блокове
   */
  private static findStartBlocks(flow: FlowDefinition): BlockInstance[] {
    // Only system.start blocks are considered starting blocks
    return (flow.blocks || []).filter(block => {
      const definition = getBlockDefinition(block.definitionId);
      return definition?.type === 'start' || block.definitionId === 'system.start';
    });
  }

  /**
   * Намира end points (без output connections)
   */
  private static findEndPoints(flow: FlowDefinition): BlockInstance[] {
    const blocksWithOutputs = new Set<string>();
    
    (flow.connections || []).forEach(conn => {
      blocksWithOutputs.add(conn.sourceBlockId);
    });
    
    return (flow.blocks || []).filter(block => !blocksWithOutputs.has(block.id));
  }

  /**
   * Изчислява всички блокове достъпни от стартовите чрез DFS обход
   * @param flow - flow дефиниция
   * @param startBlocks - масив със стартови блокове
   * @returns Set с ID-тата на всички достъпни блокове
   */
  private static findReachableBlocks(flow: FlowDefinition, startBlocks: BlockInstance[]): Set<string> {
    const reachable = new Set<string>();
    const toVisit = [...startBlocks.map(b => b.id)];
    
    // Build adjacency map
    const adjacencyMap = new Map<string, string[]>();
    (flow.connections || []).forEach(conn => {
      const targets = adjacencyMap.get(conn.sourceBlockId) || [];
      targets.push(conn.targetBlockId);
      adjacencyMap.set(conn.sourceBlockId, targets);
    });
    
    // DFS traversal
    while (toVisit.length > 0) {
      const current = toVisit.pop()!;
      if (reachable.has(current)) continue;
      
      reachable.add(current);
      const neighbors = adjacencyMap.get(current) || [];
      toVisit.push(...neighbors);
    }
    
    return reachable;
  }

  /**
   * Basic circular dependency detection
   */
  private static detectCircularDependencies(flow: FlowDefinition): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    // Build adjacency map
    const adjacencyMap = new Map<string, string[]>();
    (flow.connections || []).forEach(conn => {
      const targets = adjacencyMap.get(conn.sourceBlockId) || [];
      targets.push(conn.targetBlockId);
      adjacencyMap.set(conn.sourceBlockId, targets);
    });
    
    // DFS to detect cycles
    const dfs = (blockId: string, path: string[]): boolean => {
      if (recursionStack.has(blockId)) {
        // Found cycle
        const cycleStart = path.indexOf(blockId);
        cycles.push(path.slice(cycleStart));
        return true;
      }
      
      if (visited.has(blockId)) return false;
      
      visited.add(blockId);
      recursionStack.add(blockId);
      
      const neighbors = adjacencyMap.get(blockId) || [];
      for (const neighbor of neighbors) {
        if (dfs(neighbor, [...path, neighbor])) {
          return true;
        }
      }
      
      recursionStack.delete(blockId);
      return false;
    };
    
    // Check all blocks
    (flow.blocks || []).forEach(block => {
      if (!visited.has(block.id)) {
        dfs(block.id, [block.id]);
      }
    });
    
    return cycles;
  }

  /**
   * Намира required ports без connections
   */
  private static findUnconnectedRequiredPorts(flow: FlowDefinition): Array<{
    blockId: string;
    portId: string;
    portLabel: string;
  }> {
    const unconnected: Array<{ blockId: string; portId: string; portLabel: string }> = [];
    
    (flow.blocks || []).forEach(block => {
      const definition = getBlockDefinition(block.definitionId);
      if (!definition) return;
      
      // Check required input ports
      definition.inputs.forEach(port => {
        if (!port.required) return;
        
        const connections = block.connections.inputs[port.id] || [];
        if (connections.length === 0) {
          unconnected.push({
            blockId: block.id,
            portId: port.id,
            portLabel: port.label,
          });
        }
      });
    });
    
    return unconnected;
  }

  /**
   * Генерира summary статистики
   */
  private static generateSummary(
    flow: FlowDefinition,
    blockResults: Map<string, any>,
    validConnections: number
  ) {
    const startBlocks = this.findStartBlocks(flow);
    const endPoints = this.findEndPoints(flow);
    const reachableBlocks = this.findReachableBlocks(flow, startBlocks);
    
    let validBlocks = 0;
    blockResults.forEach(result => {
      if (result.isValid) validBlocks++;
    });

    return {
      totalBlocks: (flow.blocks || []).length,
      validBlocks,
      invalidBlocks: (flow.blocks || []).length - validBlocks,
      totalConnections: (flow.connections || []).length,
      validConnections,
      invalidConnections: (flow.connections || []).length - validConnections,
      hasStartBlock: startBlocks.length > 0,
      hasEndPoints: endPoints.length > 0,
      orphanedBlocks: (flow.blocks || []).length - reachableBlocks.size,
    };
  }

  /**
   * Проверява дали flow може да бъде изпълнен без грешки
   * @param flow - flow дефиниция за проверка
   * @returns true ако е изпълним, false при проблеми
   */
  static isFlowExecutable(flow: FlowDefinition): boolean {
    const result = this.validateFlow(flow);
    
    // За да е изпълнимо, flow-то трябва:
    // - Да няма грешки
    // - Да има поне един start блок
    // - Всички блокове да са достъпни
    
    return result.isValid && 
           result.summary.hasStartBlock && 
           result.summary.orphanedBlocks === 0;
  }

  /**
   * Получава само грешките от валидацията
   */
  static getFlowErrors(flow: FlowDefinition): FlowValidationError[] {
    return this.validateFlow(flow).errors;
  }

  /**
   * Получава само предупрежденията от валидацията
   */
  static getFlowWarnings(flow: FlowDefinition): FlowValidationWarning[] {
    return this.validateFlow(flow).warnings;
  }
}

// Helper functions for export
export function validateFlow(flow: FlowDefinition): FlowValidationResult {
  return FlowValidator.validateFlow(flow);
}

export function isFlowValid(flow: FlowDefinition): boolean {
  return FlowValidator.validateFlow(flow).isValid;
}

export function isFlowExecutable(flow: FlowDefinition): boolean {
  return FlowValidator.isFlowExecutable(flow);
}
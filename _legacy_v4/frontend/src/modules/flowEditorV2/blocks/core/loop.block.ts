/**
 * 📦 Loop Block Definition
 * ✅ Core loop control block
 * Part of Phase B: Block File Creation - Day 3
 */

import { 
  FLOW_IN_PORT, 
  FLOW_OUT_PORT,
  LOOP_OUT_PORT,
  SET_VAR_DATA_IN_PORT,
  SET_VAR_DATA_IN_2_PORT, 
  ON_ERROR_IN_PORT 
} from '../shared/helpers/PortHelpers';
import { 
  LOOP_PARAMS,
  withCommonParams 
} from '../shared/helpers/ParameterHelpers';
import type { BlockDefinition } from '../../types/BlockConcept';

/**
 * Loop block - Iteration control for repeated execution
 * Executes loop cycles with configurable iterations and delays
 */
const loopBlockDefinition: BlockDefinition = {
  id: 'loop',
  type: 'loop',
  blockType: 'core',
  name: 'ЦИКЪЛ',
  category: 'Операции',
  description: 'Изпълнява цикъл докато условието се изпълни',
  icon: 'loop',
  color: '#9C27B0',
  
  // DEACTIVATED: Executor Mode System - Phase 2A
  // Executor fields for Target Registry support - only comparisonValue
  // executorFields: ['comparisonValue'],
  executorFields: [], // Deactivated executor fields
  
  // Loop block inputs: flow control + variable data + comparison value + error handling  
  inputs: [
    FLOW_IN_PORT,         // Flow control input - starts the loop
    SET_VAR_DATA_IN_PORT, // Variable data for loop condition  
    SET_VAR_DATA_IN_2_PORT, // Second variable data for comparison value
    ON_ERROR_IN_PORT      // Error handling input
  ],
  
  // Loop block outputs: flow control + loop cycle
  outputs: [
    FLOW_OUT_PORT,        // Continue after loop completion
    LOOP_OUT_PORT         // Start loop cycle - connects to blocks inside loop
  ],
  
  // Loop parameters: iteration control + timing + common visual params
  parameters: withCommonParams([
    // 📦 Основна конфигурация
    {
      id: 'maxIterations',
      label: 'Максимален брой итерации',
      type: 'number',
      required: true,
      defaultValue: 10,
      validation: { min: 1, max: 100 },
      description: 'Максимален брой итерации за предотвратяване на безкрайни цикли'
    },
    {
      id: 'delay',
      label: 'Забавяне между итерации (секунди)',
      type: 'number',
      required: false,
      defaultValue: 1,
      validation: { min: 0, max: 60 },
      description: 'Време за пауза между итерации в секунди'
    },
    
    // ⚙️ Условие за продължаване
    {
      id: 'connectedVariableName',
      label: 'Закачена променлива',
      type: 'string',
      required: false,
      defaultValue: '',
      description: 'Променлива от закачения setVarData блок (автоматично)'
    },
    {
      id: 'manualConditionValue',
      label: 'Входна стойност',
      type: 'number',
      required: false,
      defaultValue: null,
      validation: { min: -1000, max: 1000 },
      description: 'Въведете входна стойност (когато няма закачена променлива)'
    },
    {
      id: 'conditionOperator',
      label: 'Оператор за сравнение',
      type: 'select',
      required: false,
      defaultValue: 'less_than',
      options: [
        { label: 'По-малко от', value: 'less_than' },
        { label: 'По-голямо от', value: 'greater_than' },
        { label: 'Равно на', value: 'equals' },
        { label: 'Не е равно на', value: 'not_equals' },
        { label: 'По-малко или равно', value: 'less_equal' },
        { label: 'По-голямо или равно', value: 'greater_equal' }
      ],
      description: 'Оператор за сравнение на променливата'
    },
    {
      id: 'useGlobalVariable',
      label: 'От глобална променлива',
      type: 'boolean',
      required: false,
      defaultValue: false,
      description: 'Използвай глобална променлива вместо ръчна стойност'
    },
    {
      id: 'selectedGlobalVariable', 
      label: 'Избери глобална променлива',
      type: 'select',
      required: false,
      defaultValue: '',
      options: [
        { label: 'globalVar1', value: 'globalVar1' },
        { label: 'globalVar2', value: 'globalVar2' },
        { label: 'globalVar3', value: 'globalVar3' },
        { label: 'globalVar4', value: 'globalVar4' },
        { label: 'globalVar5', value: 'globalVar5' },
        { label: 'globalVar6', value: 'globalVar6' },
        { label: 'globalVar7', value: 'globalVar7' },
        { label: 'globalVar8', value: 'globalVar8' },
        { label: 'globalVar9', value: 'globalVar9' },
        { label: 'globalVar10', value: 'globalVar10' }
      ],
      description: 'Избери коя глобална променлива да се използва'
    },
    {
      id: 'comparisonValue',
      label: 'Целева стойност',
      type: 'number',
      required: false,
      defaultValue: null,
      validation: { min: -1000, max: 1000 },
      description: 'Стойност за сравнение с входната променлива'
    }
  ]),
  
  // Core block metadata
  meta: {
    version: '1.0.0',
    experimental: false,
    validationRules: {
      connections: {
        requiredInputs: ['flowIn'],
        requiredOutputs: ['flowOut', 'loopOut'],
        recommendedInputs: ['setVarDataIn', 'setVarDataIn2', 'onErrorIn']
      },
      parameters: {
        required: ['toleranceTagId'],
        requiredWithAlternatives: [
          {
            field: 'manualConditionValue',
            alternatives: ['connection:setVarDataIn']
          },
          {
            field: 'comparisonValue',
            alternatives: ['connection:setVarDataIn2', 'globalVariable']
          }
        ]
      }
    }
  }
};

export default loopBlockDefinition;
export const version = '1.0.0';
export const deprecated = false;
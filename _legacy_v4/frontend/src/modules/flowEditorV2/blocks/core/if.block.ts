/**
 * 📦 If Block Definition
 * ✅ Core conditional logic block
 * Part of Phase B: Block File Creation - Day 3
 */

import { 
  FLOW_IN_PORT, 
  SET_VAR_DATA_IN_PORT,
  SET_VAR_DATA_IN_3_PORT, 
  ON_ERROR_IN_PORT 
} from '../shared/helpers/PortHelpers';
import { 
  LOGIC_PARAMS,
  withCommonParams 
} from '../shared/helpers/ParameterHelpers';
import type { BlockDefinition } from '../../types/BlockConcept';

/**
 * If block - Conditional logic for flow branching
 * Evaluates conditions and directs flow to appropriate path
 */
const ifBlockDefinition: BlockDefinition = {
  id: 'if',
  type: 'if',
  blockType: 'core',
  name: 'УСЛОВИЕ',
  category: 'Операции',
  description: 'Проверява множество условия и разклонява потока',
  icon: 'alt_route',
  color: '#FF9800',
  
  // If block inputs: primary flow + optional second flow + variable data + comparison data + error handling
  inputs: [
    FLOW_IN_PORT,         // Primary flow input
    // {
    //   id: 'flowIn2',
    //   label: 'Вход 2',
    //   type: 'flowIn',
    //   required: false,
    //   description: 'Втори навигационен вход за условие'
    // },
    SET_VAR_DATA_IN_PORT, // Variable data for comparison
    SET_VAR_DATA_IN_3_PORT, // Second variable data for comparison value
    ON_ERROR_IN_PORT      // Error handling input
  ],
  
  // If block outputs: true and false branches
  outputs: [
    {
      id: 'flowOutTrue',
      label: 'Да',
      type: 'flowOut',
      required: false,
      description: 'Навигационен изход при изпълнено условие'
    },
    {
      id: 'flowOutFalse', 
      label: 'Не',
      type: 'flowOut',
      required: false,
      description: 'Навигационен изход при неизпълнено условие'
    }
  ],
  
  // If parameters: multiple conditions + logic operator + common visual params
  parameters: withCommonParams([
    {
      id: 'conditionOperator',
      label: 'Тип условие',
      type: 'select',
      required: false,
      defaultValue: 'greater_than',
      options: [
        { label: 'По-голямо от', value: 'greater_than' },
        { label: 'По-малко от', value: 'less_than' },
        { label: 'Равно на', value: 'equals' },
        { label: 'Не е равно на', value: 'not_equals' },
        { label: 'По-малко или равно', value: 'less_equal' },
        { label: 'По-голямо или равно', value: 'greater_equal' }
      ],
      description: 'Оператор за сравнение на променливата'
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
    // {
    //   id: 'comparisonValue',
    //   label: 'Стойност за сравнение',
    //   type: 'number',
    //   required: false,
    //   defaultValue: null,
    //   validation: { min: -1000, max: 1000 },
    //   description: 'Втора стойност за сравнение в условията'
    // },
    {
      id: 'connectedComparisonVariable',
      label: 'Закачена променлива за сравнение',
      type: 'string',
      required: false,
      defaultValue: '',
      description: 'Променлива от закачения setVarData блок за сравнение (автоматично)'
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
    //     {
    //   id: 'manualComparisonValue',
    //   label: 'Ръчна стойност за сравнение',
    //   type: 'number',
    //   required: false,
    //   defaultValue: null,
    //   validation: { min: -1000, max: 1000 },
    //   description: 'Въведете стойност за сравнение (когато няма закачена променлива)'
    // }
   


  ]),
  
  // DEACTIVATED: Executor Mode System - Phase 2A
  // Executor fields - parameters that support target. values
  // executorFields: ['manualComparisonValue'],
  executorFields: [], // Deactivated executor fields
  
  // Core block metadata
  meta: {
    version: '2.0.0',
    experimental: false,
    validationRules: {
      connections: {
        requiredInputs: ['flowIn'],
        requiredOutputs: ['flowOutTrue', 'flowOutFalse'],
        recommendedInputs: ['setVarDataIn', 'setVarDataIn3', 'onErrorIn']
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
            alternatives: ['connection:setVarDataIn3', 'globalVariable']
          }
        ]
      }
    }
  }
};

export default ifBlockDefinition;
export const version = '1.0.0';
export const deprecated = false;
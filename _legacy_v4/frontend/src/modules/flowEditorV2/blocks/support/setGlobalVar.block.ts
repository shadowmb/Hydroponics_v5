/**
 * 🌍 SetGlobalVar Block Definition
 * ✅ Support block for global variable name setting
 * Based on setVarName block - adapted for global variables
 */

import { 
  FLOW_IN_PORT, 
  FLOW_OUT_PORT,
  SET_GLOBAL_VAR_OUT_PORT 
} from '../shared/helpers/PortHelpers';
import { 
  withCommonParams 
} from '../shared/helpers/ParameterHelpers';
import type { BlockDefinition } from '../../types/BlockConcept';

/**
 * SetGlobalVar block - Sets global variable name for data flow
 * Defines global variable names that can be used by other blocks
 */
const setGlobalVarBlockDefinition: BlockDefinition = {
  id: 'setGlobalVar',
  type: 'setGlobalVar',
  blockType: 'support',
  name: 'ГЛОБАЛНА ПРОМЕНЛИВА',
  category: 'Поддържащи',
  description: 'Задава име на глобална променлива за използване в потока',
  icon: 'public',
  color: '#FF9800',
  
  // SetGlobalVar block inputs: flow control only
  inputs: [
    //FLOW_IN_PORT          // Flow control input
  ],
  
  // SetGlobalVar block outputs: flow control + global variable name
  outputs: [
    //FLOW_OUT_PORT,        // Continue flow
    SET_GLOBAL_VAR_OUT_PORT // Global variable name output
  ],
  
  // SetGlobalVar parameters: hybrid approach with internal variables + display names
  parameters: withCommonParams([
    {
      id: 'internalVar',
      label: 'Глобална променлива',
      type: 'select',
      required: true,
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
      description: 'Вътрешно име на глобалната променлива (използва се в системата)'
    },
    {
      id: 'displayName',
      label: 'Визуално име (незадължително)',
      type: 'string',
      required: false,
      defaultValue: '',
      validation: { 
        min: 0, 
        max: 30
      },
      description: 'Описателно име за показване в блока (напр. "Глобална стойност на ЕС")'
    },
    {
      id: 'dataType',
      label: 'Тип данни',
      type: 'select',
      required: false,
      defaultValue: 'auto',
      options: [
        { label: 'Автоматично определяне', value: 'auto' },
        { label: 'Число', value: 'number' },
        { label: 'Текст', value: 'string' },
        { label: 'Булева стойност', value: 'boolean' },
        { label: 'Обект/JSON', value: 'object' }
      ],
      description: 'Очакваният тип данни на глобалната променлива'
    }
  ]),
  
  // Support block metadata
  meta: {
    version: '1.0.0',
    experimental: false,
  }
};

export default setGlobalVarBlockDefinition;
export const version = '1.0.0';
export const deprecated = false;
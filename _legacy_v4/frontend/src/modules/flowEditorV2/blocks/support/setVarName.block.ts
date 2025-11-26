/**
 * 📦 SetVarName Block Definition
 * ✅ Support block for variable name setting
 * Part of Phase C: Integration Testing - Day 1
 */

import { 
  FLOW_IN_PORT, 
  FLOW_OUT_PORT,
  SET_VAR_NAME_OUT_PORT 
} from '../shared/helpers/PortHelpers';
import { 
  withCommonParams 
} from '../shared/helpers/ParameterHelpers';
import type { BlockDefinition } from '../../types/BlockConcept';

/**
 * SetVarName block - Sets variable name for data flow
 * Defines variable names that can be used by other blocks
 */
const setVarNameBlockDefinition: BlockDefinition = {
  id: 'setVarName',
  type: 'setVarName',
  blockType: 'support',
  name: 'ИМЕ НА ПРОМЕНЛИВА',
  category: 'Поддържащи',
  description: 'Задава име на променлива за използване в потока',
  icon: 'badge',
  color: '#4CAF50',
  
  // SetVarName block inputs: flow control only
  inputs: [
    //FLOW_IN_PORT          // Flow control input
  ],
  
  // SetVarName block outputs: flow control + variable name
  outputs: [
    //FLOW_OUT_PORT,        // Continue flow
    SET_VAR_NAME_OUT_PORT // Variable name output
  ],
  
  // SetVarName parameters: hybrid approach with internal variables + display names
  parameters: withCommonParams([
    {
      id: 'internalVar',
      label: 'Променлива',
      type: 'select',
      required: true,
      defaultValue: '',
      options: [
        { label: 'var1', value: 'var1' },
        { label: 'var2', value: 'var2' },
        { label: 'var3', value: 'var3' },
        { label: 'var4', value: 'var4' },
        { label: 'var5', value: 'var5' },
        { label: 'var6', value: 'var6' },
        { label: 'var7', value: 'var7' },
        { label: 'var8', value: 'var8' },
        { label: 'var9', value: 'var9' },
        { label: 'var10', value: 'var10' }
      ],
      description: 'Вътрешно име на променливата (използва се в системата)'
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
      description: 'Описателно име за показване в блока (напр. "Стойност на ЕС")'
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
      description: 'Очакваният тип данни на променливата'
    }
  ]),
  
  // Support block metadata
  meta: {
    version: '1.0.0',
    experimental: false,
    validationRules: {
      connections: {
        requiredInputs: [], // No inputs required
        requiredOutputs: ['setVarNameOut'],
        recommendedInputs: [],
        recommendedOutputs: []
      },
      parameters: {
        required: ['internalVar'],
        recommended: ['displayName'] // displayName is recommended but not required
        // dataType is ignored per user's specification
      }
    }
  }
};

export default setVarNameBlockDefinition;
export const version = '1.0.0';
export const deprecated = false;
/**
 * 📦 Actuator Block Definition
 * ✅ Core actuator block for controlling devices
 * Part of Phase B: Block File Creation - Day 2
 */

import { 
  FLOW_IN_PORT, 
  FLOW_OUT_PORT, 
  SET_VAR_DATA_IN_PORT, 
  ON_ERROR_IN_PORT 
} from '../shared/helpers/PortHelpers';
import { 
  withCommonParams 
} from '../shared/helpers/ParameterHelpers';
import type { BlockDefinition } from '../../types/BlockConcept';

/**
 * Actuator block - Controls devices (pumps, valves, fans, etc.)
 * Core functionality block for hydroponics system control
 */
const actuatorBlockDefinition: BlockDefinition = {
  id: 'actuator',
  type: 'actuator',
  blockType: 'core',
  name: 'УСТРОЙСТВО',
  category: 'Основни',
  description: 'Контролира устройство (помпа, клапан и др.)',
  icon: 'power',
  color: '#795548',
  
  // Actuator block inputs: flow control + optional variable data + error handling
  inputs: [
    FLOW_IN_PORT,         // Flow control input
    {
      id: 'setVarDataIn',
      label: 'Данни',
      type: 'setVarDataIn',
      required: false,
      description: 'Получава стойност за параметъра на устройството'
    },
    ON_ERROR_IN_PORT      // Error handling input
  ],
  
  // Actuator block outputs: flow control only
  outputs: [
    FLOW_OUT_PORT         // Continue to next block after action
  ],
  
  // Actuator parameters: device type and action + common visual params
  parameters: withCommonParams([
    {
      id: 'deviceType',
      label: 'Тип устройство',
      type: 'select',
      required: true,
      defaultValue: '',
      options: [],
      description: 'Избира типа устройство за контрол'
    },
    {
      id: 'deviceId',
      label: 'Конкретно устройство',
      type: 'select',
      required: false,
      defaultValue: '',
      options: [],
      description: 'Избира конкретното устройство от избрания тип',
      //dependsOn: 'deviceType'
    },
    {
      id: 'actionType',
      label: 'Действие',
      type: 'select',
      required: true,
      defaultValue: 'on_off_timed',
      options: [
        { label: 'Включи/Изключи (с време)', value: 'on_off_timed' },
        { label: 'Изключи/Включи (с време)', value: 'off_on_timed' },
        { label: 'Включи', value: 'on' },
        { label: 'Изключи', value: 'off' },
        { label: 'Задай мощност %', value: 'set_power' },
        { label: 'Плавно нарастване', value: 'fade_up' },
        { label: 'Плавно намаляване', value: 'fade_down' }
      ],
      description: 'Действието което да се изпълни върху устройството'
    },
    // {
    //   id: 'useGlobalVariable',
    //   label: 'От глобална променлива',
    //   type: 'boolean',
    //   required: false,
    //   defaultValue: false,
    //   description: 'Използвай глобална променлива вместо ръчна стойност'
    // },
    {
      id: 'duration',
      label: 'Продължителност (сек)',
      type: 'number',
      required: false,
      defaultValue: 0,
      validation: { min: 1, max: 3600 },
      description: 'Продължителност на действието в секунди'
    },
    {
      id: 'stopOnDisconnect',
      label: 'Спирай при загуба на връзка',
      type: 'boolean',
      required: false,
      defaultValue: true,
      description: 'При загуба на WiFi връзка, изключва пина автоматично (безопасност)'
    },
    {
      id: 'powerLevel',
      label: 'Мощност (%)',
      type: 'number',
      required: false,
      defaultValue: 0,
      validation: { min: 0, max: 100 },
      description: 'Ниво на мощност за PWM устройства (0-100%)'
    },
    {
      id: 'powerFrom',
      label: 'От мощност (%)',
      type: 'number',
      required: false,
      defaultValue: 0,
      validation: { min: 0, max: 100 },
      description: 'Начална мощност за плавни преходи'
    },
    {
      id: 'powerTo',
      label: 'До мощност (%)',
      type: 'number',
      required: false,
      defaultValue: 0,
      validation: { min: 0, max: 100 },
      description: 'Крайна мощност за плавни преходи'
    },
    {
      id: 'useGlobalVariable',
      label: 'Използвай глобална променлива',
      type: 'boolean',
      required: false,
      defaultValue: false,
      description: 'Използвай глобална променлива за duration'
    },
    {
      id: 'selectedGlobalVariable',
      label: 'Глобална променлива',
      type: 'select',
      required: false,
      defaultValue: '',
      options: [
        { label: 'globalVar1', value: 'globalVar1' },
        { label: 'globalVar2', value: 'globalVar2' },
        { label: 'globalVar3', value: 'globalVar3' },
        { label: 'globalVar4', value: 'globalVar4' },
        { label: 'globalVar5', value: 'globalVar5' }
      ],
      description: 'Избери коя глобална променлива да се използва'
    }
    
  ]),
  
  // DEACTIVATED: Executor Mode System - Phase 2A
  // Executor fields - parameters that support target values
  // executorFields: ['duration', 'powerLevel', 'powerFrom', 'powerTo'],
  executorFields: [], // Deactivated executor fields
  
  // Core block metadata
  meta: {
    version: '1.0.0',
    experimental: false,
    validationRules: {
      connections: {
        requiredInputs: ['flowIn'],
        requiredOutputs: ['flowOut'],
        recommendedInputs: ['setVarDataIn', 'onErrorIn']
      },
      parameters: {
        required: ['deviceType', 'actionType'],
        recommended: [],
        requiredWithAlternatives: [
          {
            field: 'duration',
            alternatives: ['connection:setVarDataIn', 'globalVariable']
          }
        ]
      },
      legacy: {
        conditionalRequired: [
          {
            condition: 'deviceType !== ""',
            requiredParams: ['deviceId']
          },
          {
            condition: 'actionType === "on_off_timed" OR actionType === "off_on_timed"',
            requiredParams: ['duration']
          }
        ]
      }
    }
  }
};

export default actuatorBlockDefinition;
export const version = '1.0.0';
export const deprecated = false;
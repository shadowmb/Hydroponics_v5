/**
 * 📦 Sensor Block Definition
 * ✅ Core sensor block for reading sensor data
 * Part of Phase B: Block File Creation - Day 2
 */

import { 
  FLOW_IN_PORT, 
  FLOW_OUT_PORT, 
  SET_VAR_NAME_IN_PORT, 
  ON_ERROR_IN_PORT 
} from './shared/helpers/PortHelpers';
import { 
  SENSOR_TYPE_PARAM, 
  withCommonParams 
} from './shared/helpers/ParameterHelpers';
import type { BlockDefinition } from '../types/BlockConcept';

/**
 * Sensor block - Reads data from sensors and stores in variables
 * Core functionality block for hydroponics system monitoring
 */
const sensorBlockDefinition: BlockDefinition = {
  id: 'sensor',
  type: 'sensor',
  blockType: 'core',
  name: 'СЕНЗОР',
  category: 'Основни',
  description: 'Чете данни от сензор и ги записва в променлива',
  icon: 'sensors',
  color: '#2196F3',
  
  // Sensor block inputs: flow control + variable name + error handling
  inputs: [
    FLOW_IN_PORT,         // Flow control input
    SET_VAR_NAME_IN_PORT, // Variable name for storing data
    ON_ERROR_IN_PORT      // Error handling input
  ],
  
  // Sensor block outputs: flow control only (data goes to variable)
  outputs: [
    FLOW_OUT_PORT         // Continue to next block after reading
  ],
  
  // Sensor parameters: device selection from database + monitoring + common visual params
  parameters: withCommonParams([
    {
      id: 'deviceId',
      label: 'Избери сензор',
      type: 'select',
      required: true,
      defaultValue: '',
      options: [], // Will be loaded dynamically from database
      description: 'Избира физически сензор от базата данни'
    },
    {
      id: 'monitoringTagId',
      label: 'Мониторинг таг',
      type: 'select',
      required: false,
      defaultValue: '',
      options: [], // Will be loaded dynamically from monitoring tags API
      description: 'Избира таг за автоматично записване на данните в мониторинг системата'
    }
  ]),
  
  // Core block metadata
  meta: {
    version: '1.0.0',
    experimental: false,
    validationRules: {
      connections: {
        requiredInputs: ['flowIn'],
        requiredOutputs: ['flowOut'],
        recommendedInputs: ['setVarNameIn', 'onErrorIn']
      },
      parameters: {
        required: ['deviceId'],
        recommended: ['monitoringTagId']
      }
    }
  }
};

export default sensorBlockDefinition;
export const version = '1.0.0';
export const deprecated = false;
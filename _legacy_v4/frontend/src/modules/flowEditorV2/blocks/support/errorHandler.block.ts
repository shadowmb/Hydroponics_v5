/**
 * 📦 ErrorHandler Block Definition
 * ✅ Support block for error handling and recovery
 * Part of Phase C: Integration Testing - Day 1
 */

import { 
  FLOW_IN_PORT, 
  FLOW_OUT_PORT,
  ON_ERROR_IN_PORT,
  ON_ERROR_OUT_PORT 
} from '../shared/helpers/PortHelpers';
import { 
  withCommonParams 
} from '../shared/helpers/ParameterHelpers';
import type { BlockDefinition } from '../../types/BlockConcept';

/**
 * ErrorHandler block - Handles errors and provides recovery mechanisms
 * Catches errors from the flow and provides appropriate responses
 */
const errorHandlerBlockDefinition: BlockDefinition = {
  id: 'errorHandler',
  type: 'errorHandler',
  blockType: 'support',
  name: 'ОБРАБОТКА НА ГРЕШКИ',
  category: 'Поддържащи',
  description: 'Улавя и обработва грешки в потока',
  icon: 'error_outline',
  color: '#F44336',
  
  // ErrorHandler block inputs: support blocks have no inputs (triggered automatically)
  inputs: [],
  
  // ErrorHandler block outputs: single error output only
  outputs: [
    ON_ERROR_OUT_PORT    // Primary error handling output only
  ],
  
  // ErrorHandler parameters: simplified error handling with 3 logical sections
  parameters: withCommonParams([
    {
      id: 'enableRetry',
      label: 'Пробвай отново при грешка',
      type: 'boolean',
      required: false,
      defaultValue: false,
      description: 'Дали да се правят повторни опити преди да се приложи основната стратегия'
    },
    {
      id: 'maxRetries',
      label: 'Брой повторни опити',
      type: 'number',
      required: false,
      defaultValue: 3,
      validation: { min: 1, max: 10 },
      description: 'Максимален брой повторни опити'
    },
    {
      id: 'retryDelay',
      label: 'Изчакване между опитите (сек)',
      type: 'number',
      required: false,
      defaultValue: 5,
      validation: { min: 0.1, max: 300 },
      description: 'Време за изчакване преди повторен опит'
    },
    {
      id: 'fallbackStrategy',
      label: 'След неуспешните опити направи',
      type: 'select',
      required: true,
      defaultValue: 'continue',
      options: [
        { label: 'Продължи със следващия блок', value: 'continue' },
        { label: 'Спри програмата', value: 'stop' },
        { label: 'Постави програмата на пауза', value: 'pause' }
      ],
      description: 'Какво да се направи ако retry опитите се провалят (или ако retry е изключен)'
    },
    {
      id: 'pauseTimeout',
      label: 'Време за пауза (сек)',
      type: 'number',
      required: false,
      defaultValue: 300,
      validation: { min: 10, max: 3600 },
      description: 'След колко секунди да се спре програмата ако остане на пауза'
    },
    {
      id: 'userMessage',
      label: 'Съобщение към потребителя',
      type: 'string',
      required: false,
      defaultValue: '',
      description: 'Съобщение което да се покаже при грешка (по избор)'
    },
    {
      id: 'enableNotification',
      label: 'Прати уведомление при грешка',
      type: 'boolean',
      required: false,
      defaultValue: false,
      description: 'Дали да се изпрати уведомление когато този ErrorHandler се активира'
    },
    {
      id: 'includeContextData',
      label: 'Включи данни от блока',
      type: 'boolean',
      required: false,
      defaultValue: false,
      description: 'Включи device ID, sensor стойности или actuator статус в съобщението'
    }
  ]),
  
  // Core block metadata
  meta: {
    version: '1.0.0',
    experimental: false,
    validationRules: {
      connections: {
        requiredInputs: [], // No inputs required - support block triggered automatically
        requiredOutputs: ['onErrorOut'], // Primary error handling output required
        recommendedInputs: [],
        recommendedOutputs: [] // All other outputs ignored per user's specification
      },
      parameters: {
        required: [], // All parameters are optional per user's specification
        recommended: [] // Parameters are ignored for validation
      }
    }
  }
};

export default errorHandlerBlockDefinition;
export const version = '1.0.0';
export const deprecated = false;
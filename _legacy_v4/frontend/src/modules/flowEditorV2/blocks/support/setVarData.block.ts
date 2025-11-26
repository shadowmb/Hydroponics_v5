/**
 * 📦 SetVarData Block Definition
 * ✅ Support block for variable data setting
 * Part of Phase C: Integration Testing - Day 1
 */

import { 
  FLOW_IN_PORT, 
  FLOW_OUT_PORT,
  SET_VAR_NAME_IN_PORT,
  SET_VAR_DATA_OUT_PORT 
} from '../shared/helpers/PortHelpers';
import { 
  withCommonParams 
} from '../shared/helpers/ParameterHelpers';
import type { BlockDefinition } from '../../types/BlockConcept';

/**
 * SetVarData block - Sets variable data value
 * Assigns values to variables for use in data flow
 */
const setVarDataBlockDefinition: BlockDefinition = {
  id: 'setVarData',
  type: 'setVarData',
  blockType: 'support',
  name: 'СТОЙНОСТ НА ПРОМЕНЛИВА',
  category: 'Поддържащи',
  description: 'Задава стойност на променлива в потока',
  icon: 'edit',
  color: '#f58f1bff',
  
  // SetVarData block inputs: flow control + variable name
  inputs: [
    // FLOW_IN_PORT,         // Flow control input
    // SET_VAR_NAME_IN_PORT  // Variable name input
  ],
  
  // SetVarData block outputs: flow control + variable data
  outputs: [
    //FLOW_OUT_PORT,        // Continue flow
    SET_VAR_DATA_OUT_PORT // Variable data output
  ],
  
  // SetVarData parameters: source variable selection + common visual params
  parameters: withCommonParams([
    {
      id: 'sourceVariable',
      label: 'Променлива',
      type: 'select',
      required: true,
      defaultValue: '',
      options: [], // Dynamic options populated by ControlPanel
      description: 'Изберете променлива от setVarName блоковете'
    }
  ]),
  
  // Support block metadata
  meta: {
    version: '1.0.0',
    experimental: false,
    validationRules: {
      connections: {
        requiredInputs: [], // No inputs required
        requiredOutputs: ['setVarDataOut'],
        recommendedInputs: [],
        recommendedOutputs: []
      },
      parameters: {
        required: ['sourceVariable'],
        recommended: []
      }
    }
  }
};

export default setVarDataBlockDefinition;
export const version = '1.0.0';
export const deprecated = false;
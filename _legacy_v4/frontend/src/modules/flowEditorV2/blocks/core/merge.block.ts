/**
 * 📦 Merge Block Definition
 * ✅ Core flow merge block
 * Part of Phase B: Block File Creation - Day 3
 */

import { 
  FLOW_OUT_PORT
} from '../shared/helpers/PortHelpers';
import { 
  withCommonParams 
} from '../shared/helpers/ParameterHelpers';
import type { BlockDefinition } from '../../types/BlockConcept';

/**
 * Merge block - Combines multiple flows into one
 * Synchronizes and merges parallel execution paths
 */
const mergeBlockDefinition: BlockDefinition = {
  id: 'merge',
  type: 'merge',
  blockType: 'core',
  name: 'ОБЕДИНЯВАНЕ',
  category: 'Операции',
  description: 'Обединява няколко потока в един',
  icon: 'merge',
  color: '#607D8B',
  
  // Merge block inputs: multiple flow inputs for synchronization
  inputs: [
    {
      id: 'flowIn1',
      label: 'Вход 1',
      type: 'flowIn',
      required: true,
      description: 'Първи навигационен вход'
    },
    {
      id: 'flowIn2',
      label: 'Вход 2',
      type: 'flowIn',
      required: true,
      description: 'Втори навигационен вход'
    },
    {
      id: 'flowIn3',
      label: 'Вход 3',
      type: 'flowIn',
      required: false,
      description: 'Трети навигационен вход (опционален)'
    },
    {
      id: 'flowIn4',
      label: 'Вход 4',
      type: 'flowIn',
      required: false,
      description: 'Четвърти навигационен вход (опционален)'
    }
  ],
  
  // Merge block outputs: single unified flow
  outputs: [
    FLOW_OUT_PORT         // Unified output after merge
  ],
  
  // Merge parameters: only common visual params (no functional parameters)
  parameters: withCommonParams([]),
  
  // Core block metadata
  meta: {
    version: '1.0.0',
    experimental: false,
    validationRules: {
      connections: {
        requiredInputs: [], // At least one input required - handled by custom logic
        requiredOutputs: ['flowOut'],
        recommendedInputs: ['flowIn1', 'flowIn2', 'flowIn3', 'flowIn4']
      },
      parameters: {
        required: [],
        recommended: []
      },
    }
  }
};

export default mergeBlockDefinition;
export const version = '1.0.0';
export const deprecated = false;
/**
 * 📦 Goto Block Definition
 * ✅ Flow redirection block for jumping to specific blocks
 * Implementation for goto functionality in loops
 */

import { 
  FLOW_IN_PORT
} from '../shared/helpers/PortHelpers';
import { 
  withCommonParams 
} from '../shared/helpers/ParameterHelpers';
import type { BlockDefinition } from '../../types/BlockConcept';

/**
 * Goto block - Redirects flow to a specific target block
 * Used primarily for loop returns and conditional jumps
 */
const gotoBlockDefinition: BlockDefinition = {
  id: 'goto',
  type: 'goto',
  blockType: 'core',
  name: 'ПРЕХОД',
  category: 'Основни',
  description: 'Пренасочва потока към избран блок',
  icon: 'call_made',
  color: '#9C27B0',
  
  // Goto block input: only flow control
  inputs: [
    FLOW_IN_PORT         // Flow control input only
  ],
  
  // Goto block has no outputs - redirection happens internally
  outputs: [],
  
  // Goto parameters: target block selection + common visual params
  parameters: withCommonParams([
    {
      id: 'targetBlockId',
      label: 'Целеви блок',
      type: 'select',
      required: true,
      defaultValue: '',
      options: [], // Will be populated dynamically with available blocks
      description: 'Избира блока към който да се пренасочи потока'
    }
  ]),
  
  // DEACTIVATED: Executor Mode System - Phase 2A (already empty)
  // No executor fields for goto block
  executorFields: [], // Already empty, kept for consistency
  
  // Core block metadata
  meta: {
    version: '1.0.0',
    experimental: false,
    validationRules: {
      connections: {
        requiredInputs: ['flowIn'],
        requiredOutputs: [] // No outputs - internal redirection
      },
      parameters: {
        required: ['targetBlockId'],
        recommended: []
      }
    }
  }
};

export default gotoBlockDefinition;
export const version = '1.0.0';
export const deprecated = false;
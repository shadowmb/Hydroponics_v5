/**
 * 📦 System End Block Definition
 * ✅ Second migrated block file - system.end
 * Part of Phase B: Block File Creation - Day 1
 */

import { FLOW_IN_PORT } from '../shared/helpers/PortHelpers';
import { withCommonParams } from '../shared/helpers/ParameterHelpers';
import type { BlockDefinition } from '../../types/BlockConcept';

/**
 * System END block - Terminal point of the flow
 * Always present in every flow, serves as exit point
 */
const endBlockDefinition: BlockDefinition = {
  id: 'system.end',
  type: 'end',
  blockType: 'core',
  name: 'КРАЙ',
  category: 'Система',
  description: 'Крайна точка на потока - винаги присъства',
  icon: 'stop',
  color: '#252525ff',
  
  // Single flow input from previous block
  inputs: [FLOW_IN_PORT],
  
  // System end block has no outputs (it's the terminal point)
  outputs: [],
  
  // Only common visual parameters (no specific functionality parameters)
  parameters: withCommonParams([]),
  
  // System block metadata
  meta: {
    version: '1.0.0',
    experimental: false,
    system: true, // Mark as system block - cannot be deleted
    validationRules: {
      connections: {
        requiredInputs: ['flowIn']
      }
    }
  }
};

export default endBlockDefinition;
export const version = '1.0.0';
export const deprecated = false;
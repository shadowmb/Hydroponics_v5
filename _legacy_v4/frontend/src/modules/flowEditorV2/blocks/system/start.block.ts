/**
 * 📦 System Start Block Definition
 * ✅ First migrated block file - system.start
 * Part of Phase B: Block File Creation - Day 1
 */

import { FLOW_OUT_PORT } from '../shared/helpers/PortHelpers';
import { withCommonParams } from '../shared/helpers/ParameterHelpers';
import type { BlockDefinition } from '../../types/BlockConcept';

/**
 * System START block - Beginning point of the flow
 * Always present in every flow, serves as entry point
 */
const startBlockDefinition: BlockDefinition = {
  id: 'system.start',
  type: 'start',
  blockType: 'core',
  name: 'СТАРТ',
  category: 'Система',
  description: 'Начална точка на потока - винаги присъства',
  icon: 'play_arrow',
  color: '#007209ff',
  
  // System start block has no inputs (it's the beginning)
  inputs: [],
  
  // Single flow output to continue to next block
  outputs: [FLOW_OUT_PORT],
  
  // Only common visual parameters (no specific functionality parameters)
  parameters: withCommonParams([]),
  
  // System block metadata
  meta: {
    version: '1.0.0',
    experimental: false,
    system: true, // Mark as system block - cannot be deleted
    validationRules: {
      connections: {
        requiredOutputs: ['flowOut']
      }
    }
  }
};

export default startBlockDefinition;
export const version = '1.0.0';
export const deprecated = false;
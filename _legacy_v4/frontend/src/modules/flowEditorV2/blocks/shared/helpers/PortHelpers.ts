/**
 * 📦 Block Migration - Port Helpers
 * ✅ Shared port definitions for all block types
 * Part of Phase A: Foundation Setup - Day 1
 */

import type { PortDefinition } from '../../../types/BlockConcept';

// Standard Flow Ports - Navigation/Execution
export const FLOW_IN_PORT: PortDefinition = {
  id: 'flowIn',
  label: 'Вход',
  type: 'flowIn',
  required: false,
  description: 'Вход за навигация - започва изпълнението на блока'
};

export const FLOW_OUT_PORT: PortDefinition = {
  id: 'flowOut', 
  label: 'Изход',
  type: 'flowOut',
  required: false,
  description: 'Изход за навигация - продължава към следващия блок'
};

// Variable Name Ports - Variable Name Passing
export const SET_VAR_NAME_IN_PORT: PortDefinition = {
  id: 'setVarNameIn',
  label: 'Име (вход)',
  type: 'setVarNameIn',
  required: false,
  description: 'Вход за име на променлива - получава име за записване'
};

export const SET_VAR_NAME_OUT_PORT: PortDefinition = {
  id: 'setVarNameOut',
  label: 'Име (изход)',
  type: 'setVarNameOut', 
  required: false,
  description: 'Изход за име на променлива - предава име на променлива'
};

// Global Variable Name Ports - Global Variable Name Passing
export const SET_GLOBAL_VAR_OUT_PORT: PortDefinition = {
  id: 'setGlobalVarOut',
  label: 'Глобално име (изход)',
  type: 'setVarDataOut', 
  required: false,
  description: 'Изход за име на глобална променлива - предава име на глобална променлива (съвместим с setVarDataIn)'
};

// Variable Data Ports - Variable Data Passing
export const SET_VAR_DATA_IN_PORT: PortDefinition = {
  id: 'setVarDataIn',
  label: 'Данни (вход)',
  type: 'setVarDataIn',
  required: false,
  description: 'Вход за данни на променлива - получава стойност за използване'
};

export const SET_VAR_DATA_IN_2_PORT: PortDefinition = {
  id: 'setVarDataIn2',
  label: 'Сравни с (вход)',
  type: 'setVarDataIn',
  required: false,
  description: 'Втори вход за данни - стойност за сравнение в условия'
};

export const SET_VAR_DATA_IN_3_PORT: PortDefinition = {
  id: 'setVarDataIn3',
  label: 'Сравни с (If)',
  type: 'setVarDataIn',
  required: false,
  description: 'Трети вход за данни - втора стойност за сравнение в If блок условия'
};

export const SET_VAR_DATA_OUT_PORT: PortDefinition = {
  id: 'setVarDataOut',
  label: 'Данни (изход)',
  type: 'setVarDataOut',
  required: false,
  description: 'Изход за данни на променлива - предава стойност от променлива'
};

// Error Handling Ports - Error Signal Passing
export const ON_ERROR_IN_PORT: PortDefinition = {
  id: 'onErrorIn',
  label: 'Грешка (вход)',
  type: 'onErrorIn',
  required: false,
  description: 'Вход за грешки - получава сигнал при проблем'
};

export const ON_ERROR_OUT_PORT: PortDefinition = {
  id: 'onErrorOut',
  label: 'Грешка (изход)',
  type: 'onErrorOut',
  required: false,
  description: 'Изход за грешки - предава сигнал при проблем'
};

// Loop Control Ports - Cycle Flow Management  
export const LOOP_OUT_PORT: PortDefinition = {
  id: 'loopOut',
  label: 'Цикъл',
  type: 'loopOut',
  required: false,
  description: 'Изход за цикъл - започва блоковете в цикъла'
};

// Port Collections for easy use
export const STANDARD_PORTS = {
  // Flow ports
  flowIn: FLOW_IN_PORT,
  flowOut: FLOW_OUT_PORT,
  
  // Variable name ports
  setVarNameIn: SET_VAR_NAME_IN_PORT,
  setVarNameOut: SET_VAR_NAME_OUT_PORT,
  
  // Variable data ports
  setVarDataIn: SET_VAR_DATA_IN_PORT,
  setVarDataOut: SET_VAR_DATA_OUT_PORT,
  
  // Error ports
  onErrorIn: ON_ERROR_IN_PORT,
  onErrorOut: ON_ERROR_OUT_PORT,
} as const;

// Helper functions for common port combinations
export function createFlowPorts(): { inputs: PortDefinition[]; outputs: PortDefinition[] } {
  return {
    inputs: [FLOW_IN_PORT],
    outputs: [FLOW_OUT_PORT]
  };
}

export function createVariablePorts(): { 
  inputs: PortDefinition[]; 
  outputs: PortDefinition[] 
} {
  return {
    inputs: [SET_VAR_NAME_IN_PORT, SET_VAR_DATA_IN_PORT],
    outputs: [SET_VAR_NAME_OUT_PORT, SET_VAR_DATA_OUT_PORT]
  };
}

export function createErrorPorts(): { inputs: PortDefinition[]; outputs: PortDefinition[] } {
  return {
    inputs: [ON_ERROR_IN_PORT],
    outputs: [ON_ERROR_OUT_PORT]
  };
}

export function createAllStandardPorts(): { 
  inputs: PortDefinition[]; 
  outputs: PortDefinition[] 
} {
  return {
    inputs: [FLOW_IN_PORT, SET_VAR_NAME_IN_PORT, SET_VAR_DATA_IN_PORT, ON_ERROR_IN_PORT],
    outputs: [FLOW_OUT_PORT, SET_VAR_NAME_OUT_PORT, SET_VAR_DATA_OUT_PORT, ON_ERROR_OUT_PORT]
  };
}

// Utility functions for port manipulation
export function withRequiredPorts(
  ports: PortDefinition[], 
  requiredIds: string[]
): PortDefinition[] {
  return ports.map(port => ({
    ...port,
    required: requiredIds.includes(port.id)
  }));
}

export function withOptionalPorts(
  ports: PortDefinition[], 
  optionalIds: string[]
): PortDefinition[] {
  return ports.map(port => ({
    ...port,
    required: !optionalIds.includes(port.id)
  }));
}

export function filterPorts(
  ports: PortDefinition[], 
  includeIds: string[]
): PortDefinition[] {
  return ports.filter(port => includeIds.includes(port.id));
}
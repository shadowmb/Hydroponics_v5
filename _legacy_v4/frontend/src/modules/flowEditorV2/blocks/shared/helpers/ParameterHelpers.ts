/**
 * 📦 Block Migration - Parameter Helpers
 * ✅ Shared parameter definitions for all block types  
 * Part of Phase A: Foundation Setup - Day 1
 */

import type { BlockParameter } from '../../../types/BlockConcept';

// Common Visual Parameters
export const CUSTOM_HEADER_COLOR_PARAM: BlockParameter = {
  id: 'customHeaderColor',
  label: 'Цвят на хедъра',
  type: 'color',
  required: false,
  defaultValue: null,
  description: 'Персонализиран цвят на header-а на блока'
};

export const BLOCK_NAME_PARAM: BlockParameter = {
  id: 'name',
  label: 'Име на блока',
  type: 'string',
  required: false,
  defaultValue: '',
  description: 'Персонализирано име на блока'
};

// Container Parameters
export const CONTAINER_NAME_PARAM: BlockParameter = {
  id: 'name',
  label: 'Име на контейнера',
  type: 'string',
  required: true,
  defaultValue: 'Нов Контейнер',
  description: 'Дисплейното име на контейнера'
};

export const CONTAINER_ID_PARAM: BlockParameter = {
  id: 'containerId',
  label: 'Container ID',
  type: 'string',
  required: true,
  hidden: true,
  description: 'Уникален идентификатор на контейнера'
};

export const CONTAINER_BLOCK_COUNT_PARAM: BlockParameter = {
  id: 'blockCount',
  label: 'Брой блокове',
  type: 'number',
  required: false,
  defaultValue: 0,
  description: 'Брой блокове в контейнера'
};

// Sensor Parameters
export const SENSOR_TYPE_PARAM: BlockParameter = {
  id: 'sensorType',
  label: 'Тип сензор',
  type: 'sensor',
  required: true,
  description: 'Избира сензор от системата'
};

export const READING_INTERVAL_PARAM: BlockParameter = {
  id: 'readingInterval',
  label: 'Интервал (сек)',
  type: 'number',
  required: false,
  defaultValue: 5,
  validation: { min: 1, max: 3600 },
  description: 'Интервал между четенията в секунди'
};

// Actuator Parameters
export const ACTUATOR_TYPE_PARAM: BlockParameter = {
  id: 'actuatorType',
  label: 'Тип актуатор',
  type: 'actuator',
  required: true,
  description: 'Избира актуатор от системата'
};

export const ACTUATOR_ACTION_PARAM: BlockParameter = {
  id: 'action',
  label: 'Действие',
  type: 'select',
  required: true,
  options: [
    { value: 'on', label: 'Включи' },
    { value: 'off', label: 'Изключи' },
    { value: 'toggle', label: 'Превключи' }
  ],
  defaultValue: 'on',
  description: 'Действието което да се изпълни'
};

export const DURATION_PARAM: BlockParameter = {
  id: 'duration',
  label: 'Продължителност (сек)',
  type: 'number',
  required: false,
  defaultValue: 0,
  validation: { min: 0, max: 86400 },
  description: 'Продължителност на действието в секунди (0 = безкрайно)'
};

// Logic Parameters  
export const CONDITION_PARAM: BlockParameter = {
  id: 'condition',
  label: 'Условие',
  type: 'select',
  required: true,
  options: [
    { value: 'equals', label: 'Равно на (=)' },
    { value: 'not_equals', label: 'Различно от (≠)' },
    { value: 'greater', label: 'По-голямо от (>)' },
    { value: 'greater_equal', label: 'По-голямо или равно (≥)' },
    { value: 'less', label: 'По-малко от (<)' },
    { value: 'less_equal', label: 'По-малко или равно (≤)' }
  ],
  defaultValue: 'equals',
  description: 'Условието за сравнение'
};

export const COMPARISON_VALUE_PARAM: BlockParameter = {
  id: 'comparisonValue',
  label: 'Стойност за сравнение',
  type: 'string',
  required: true,
  description: 'Стойността с която да се сравни'
};

// Loop Parameters
export const LOOP_TYPE_PARAM: BlockParameter = {
  id: 'loopType',
  label: 'Тип цикъл',
  type: 'select',
  required: true,
  options: [
    { value: 'count', label: 'Определен брой пъти' },
    { value: 'while', label: 'Докато условието е вярно' },
    { value: 'infinite', label: 'Безкраен цикъл' }
  ],
  defaultValue: 'count',
  description: 'Типът на цикъла'
};

export const LOOP_COUNT_PARAM: BlockParameter = {
  id: 'count',
  label: 'Брой повторения',
  type: 'number',
  required: false,
  defaultValue: 1,
  validation: { min: 1, max: 10000 },
  description: 'Брой повторения на цикъла'
};

export const LOOP_DELAY_PARAM: BlockParameter = {
  id: 'delay',
  label: 'Забавяне (сек)',
  type: 'number',
  required: false,
  defaultValue: 0,
  validation: { min: 0, max: 3600 },
  description: 'Забавяне между итерациите в секунди'
};

// Variable Parameters
export const VARIABLE_NAME_PARAM: BlockParameter = {
  id: 'variableName',
  label: 'Име на променливата',
  type: 'string',
  required: true,
  validation: { pattern: '^[a-zA-Z_][a-zA-Z0-9_]*$' },
  description: 'Име на променливата (букви, цифри, _ )'
};

export const VARIABLE_VALUE_PARAM: BlockParameter = {
  id: 'value',
  label: 'Стойност',
  type: 'string',
  required: true,
  description: 'Стойността която да се запише'
};

// Error Handler Parameters
export const ERROR_MESSAGE_PARAM: BlockParameter = {
  id: 'errorMessage',
  label: 'Съобщение за грешка',
  type: 'string',
  required: false,
  defaultValue: 'Възникна грешка',
  description: 'Персонализирано съобщение при грешка'
};

export const RETRY_COUNT_PARAM: BlockParameter = {
  id: 'retryCount',
  label: 'Брой опити',
  type: 'number',
  required: false,
  defaultValue: 0,
  validation: { min: 0, max: 10 },
  description: 'Брой опити за повторение при грешка'
};

export const RETRY_DELAY_PARAM: BlockParameter = {
  id: 'retryDelay',
  label: 'Забавяне между опитите (сек)',
  type: 'number',
  required: false,
  defaultValue: 1,
  validation: { min: 0, max: 60 },
  description: 'Забавяне между опитите в секунди'
};

// Parameter Collections
export const COMMON_VISUAL_PARAMS = [
  CUSTOM_HEADER_COLOR_PARAM,
  BLOCK_NAME_PARAM
] as const;

export const CONTAINER_PARAMS = [
  CONTAINER_NAME_PARAM,
  CONTAINER_ID_PARAM,
  CONTAINER_BLOCK_COUNT_PARAM
] as const;

export const SENSOR_PARAMS = [
  SENSOR_TYPE_PARAM,
  READING_INTERVAL_PARAM
] as const;

export const ACTUATOR_PARAMS = [
  ACTUATOR_TYPE_PARAM,
  ACTUATOR_ACTION_PARAM,
  DURATION_PARAM
] as const;

export const LOGIC_PARAMS = [
  CONDITION_PARAM,
  COMPARISON_VALUE_PARAM
] as const;

export const LOOP_PARAMS = [
  LOOP_TYPE_PARAM,
  LOOP_COUNT_PARAM,
  LOOP_DELAY_PARAM
] as const;

export const VARIABLE_PARAMS = [
  VARIABLE_NAME_PARAM,
  VARIABLE_VALUE_PARAM
] as const;

export const ERROR_HANDLER_PARAMS = [
  ERROR_MESSAGE_PARAM,
  RETRY_COUNT_PARAM,
  RETRY_DELAY_PARAM
] as const;

// Helper functions
export function createParameterSet(
  ...paramSets: readonly BlockParameter[][]
): BlockParameter[] {
  return paramSets.flat();
}

export function withCommonParams(
  params: BlockParameter[]
): BlockParameter[] {
  // Note: Common visual params (name, color) are handled by ControlPanel UI
  // No need to add them as block parameters since they cause duplication
  return params;
}

export function withCustomDefaults(
  params: BlockParameter[],
  customDefaults: Record<string, any>
): BlockParameter[] {
  return params.map(param => ({
    ...param,
    defaultValue: customDefaults[param.id] ?? param.defaultValue
  }));
}

export function withRequired(
  params: BlockParameter[],
  requiredIds: string[]
): BlockParameter[] {
  return params.map(param => ({
    ...param,
    required: requiredIds.includes(param.id) || param.required
  }));
}

export function withOptional(
  params: BlockParameter[],
  optionalIds: string[]
): BlockParameter[] {
  return params.map(param => ({
    ...param,
    required: optionalIds.includes(param.id) ? false : param.required
  }));
}
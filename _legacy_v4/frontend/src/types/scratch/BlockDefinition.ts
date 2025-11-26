/**
 * TypeScript типове за Scratch-подобен визуален редактор
 * Хидропонна система - блокове за автоматизация
 */

// Основни типове блокове
export type BlockType = 'sensor' | 'device' | 'logic' | 'control' | 'variable'

// Типове данни за connectors
export type ConnectorDataType = 'trigger' | 'number' | 'boolean' | 'text' | 'any'

// Позиция на connector
export type ConnectorPosition = 'left' | 'right' | 'top' | 'bottom'

// Типове параметри
export type ParameterType = 'text' | 'number' | 'select' | 'boolean' | 'textarea' | 'color' | 'slider'

/**
 * Дефиниция на параметър на блок
 */
export interface BlockParameter {
  name: string
  label: string
  type: ParameterType
  required?: boolean
  default?: any
  options?: Array<{ label: string; value: any }>
  min?: number
  max?: number
  step?: number
  placeholder?: string
  helpText?: string
  validation?: {
    pattern?: string
    message?: string
  }
}

/**
 * Дефиниция на connector точка
 */
export interface ConnectorDefinition {
  id: string
  label: string
  dataType: ConnectorDataType
  position: ConnectorPosition
  required?: boolean
  multiple?: boolean // Позволява множество връзки
  description?: string
}

/**
 * Дефиниция на input connector
 */
export interface InputConnector extends ConnectorDefinition {
  position: 'left' | 'top'
  defaultValue?: any
}

/**
 * Дефиниция на output connector
 */
export interface OutputConnector extends ConnectorDefinition {
  position: 'right' | 'bottom'
}

/**
 * Основна дефиниция на блок
 */
export interface BlockDefinition {
  // Идентификация
  id: string
  type: BlockType
  category: string
  
  // Визуални свойства
  label: string
  description: string
  icon: string // Emoji или Quasar icon име
  color: string // Hex цвят
  
  // Структура
  inputs?: InputConnector[]
  outputs?: OutputConnector[]
  parameters?: BlockParameter[]
  
  // Поведение
  isContainer?: boolean // За logic блокове с контейнери
  containerSlots?: string[] // Имена на slot-ове за контейнери
  isEntryPoint?: boolean // Започва workflow (напр. "Започни")
  isExitPoint?: boolean // Завършва workflow (напр. "Край")
  
  // Метаданни
  tags?: string[]
  helpUrl?: string
  version?: string
  deprecated?: boolean
}

/**
 * Инстанция на блок в workspace
 */
export interface BlockInstance {
  // Идентификация
  instanceId: string
  definitionId: string
  definition: BlockDefinition
  
  // Позиция в workspace
  position: {
    x: number
    y: number
  }
  
  // Стойности на параметри
  parameterValues: Record<string, any>
  
  // Състояние
  selected?: boolean
  collapsed?: boolean // За контейнер блокове
  executing?: boolean
  hasError?: boolean
  errorMessage?: string
  
  // Контейнер данни (за logic блокове)
  containerBlocks?: Record<string, BlockInstance[]>
  
  // Метаданни
  createdAt: Date
  updatedAt: Date
}

/**
 * Връзка между блокове
 */
export interface BlockConnection {
  id: string
  fromBlockId: string
  fromConnectorId: string
  toBlockId: string
  toConnectorId: string
  
  // Визуални свойства
  highlighted?: boolean
  animated?: boolean
  
  // Валидация
  isValid?: boolean
  validationError?: string
}

/**
 * Workspace състояние
 */
export interface WorkspaceState {
  blocks: BlockInstance[]
  connections: BlockConnection[]
  
  // Selection
  selectedBlocks: string[]
  
  // View
  zoom: number
  panX: number
  panY: number
  
  // Grid
  gridEnabled: boolean
  snapToGrid: boolean
  gridSize: number
}

/**
 * Drag & Drop състояние
 */
export interface DragState {
  isDragging: boolean
  dragType: 'block' | 'connection' | 'selection'
  draggedItem?: {
    type: 'new-block' | 'existing-block' | 'connector'
    data: any
  }
  dragPreview?: {
    x: number
    y: number
    element?: HTMLElement
  }
  validDropZones: string[]
  hoveredDropZone?: string
}

/**
 * Валидационно правило
 */
export interface ValidationRule {
  id: string
  type: 'error' | 'warning' | 'info'
  message: string
  check: (workspace: WorkspaceState) => boolean
  suggestedFix?: string
}

/**
 * Категория блокове за Toolbox
 */
export interface BlockCategory {
  id: string
  name: string
  icon: string
  color: string
  description?: string
  blocks: BlockDefinition[]
  collapsed?: boolean
  order: number
}

/**
 * Настройки на редактора
 */
export interface EditorSettings {
  // Визуални
  theme: 'light' | 'dark' | 'auto'
  fontSize: 'small' | 'medium' | 'large'
  showGrid: boolean
  snapToGrid: boolean
  gridSize: number
  
  // Поведение
  autoSave: boolean
  autoSaveInterval: number // milliseconds
  undoStackSize: number
  
  // Достъпност
  highContrast: boolean
  reducedMotion: boolean
  screenReaderMode: boolean
  touchMode: boolean
  
  // Debug
  showBlockIds: boolean
  showConnectorTypes: boolean
  logDragEvents: boolean
}

/**
 * Събитие в редактора
 */
export interface EditorEvent {
  type: string
  timestamp: Date
  data?: any
  blockId?: string
  connectionId?: string
}

/**
 * Snapshot за undo/redo
 */
export interface WorkspaceSnapshot {
  id: string
  timestamp: Date
  state: WorkspaceState
  description: string
}

/**
 * Export/Import формати
 */
export interface TaskExport {
  version: string
  name: string
  description?: string
  workspace: WorkspaceState
  metadata: {
    createdAt: Date
    exportedAt: Date
    editorVersion: string
  }
}

// Utility типове
export type BlockId = string
export type ConnectionId = string
export type ConnectorId = string
export type ParameterName = string
export type CategoryId = string

// Type guards
export function isBlockDefinition(obj: any): obj is BlockDefinition {
  return typeof obj === 'object' && 
         typeof obj.id === 'string' &&
         typeof obj.type === 'string' &&
         typeof obj.label === 'string'
}

export function isBlockInstance(obj: any): obj is BlockInstance {
  return typeof obj === 'object' && 
         typeof obj.instanceId === 'string' &&
         typeof obj.definitionId === 'string' &&
         isBlockDefinition(obj.definition)
}

export function isBlockConnection(obj: any): obj is BlockConnection {
  return typeof obj === 'object' && 
         typeof obj.id === 'string' &&
         typeof obj.fromBlockId === 'string' &&
         typeof obj.toBlockId === 'string'
}

// Константи
export const BLOCK_COLORS = {
  sensor: '#3B82F6',
  device: '#10B981', 
  logic: '#F59E0B',
  control: '#8B5CF6',
  variable: '#EF4444'
} as const

export const CONNECTOR_COLORS = {
  trigger: '#10B981',
  number: '#6366F1',
  boolean: '#F59E0B',
  text: '#8B5A2B',
  any: '#6B7280'
} as const

export const DEFAULT_GRID_SIZE = 20
export const DEFAULT_ZOOM = 1.0
export const MIN_ZOOM = 0.25
export const MAX_ZOOM = 3.0

// Helper функции
export function createBlockInstance(
  definition: BlockDefinition, 
  position: { x: number; y: number },
  parameterValues: Record<string, any> = {}
): BlockInstance {
  return {
    instanceId: `${definition.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    definitionId: definition.id,
    definition,
    position,
    parameterValues,
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

export function createConnection(
  fromBlockId: string,
  fromConnectorId: string,
  toBlockId: string,
  toConnectorId: string
): BlockConnection {
  return {
    id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    fromBlockId,
    fromConnectorId,
    toBlockId,
    toConnectorId
  }
}

export function getBlockColor(blockType: BlockType): string {
  return BLOCK_COLORS[blockType] || '#6B7280'
}

export function getConnectorColor(dataType: ConnectorDataType): string {
  return CONNECTOR_COLORS[dataType] || '#6B7280'
}
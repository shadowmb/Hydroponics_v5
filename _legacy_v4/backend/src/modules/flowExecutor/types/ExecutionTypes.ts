// ExecutionTypes.ts - Core execution types for FlowExecutor

export interface FlowDefinition {
  id: string
  name: string
  version: string
  blocks: BlockDefinition[]
  connections: ConnectionDefinition[]
  metadata: FlowMetadata
}

export interface BlockDefinition {
  id: string
  definitionId: string
  parameters: Record<string, any>
  position: { x: number, y: number }
  inputPorts: PortDefinition[]
  outputPorts: PortDefinition[]
}

export interface ConnectionDefinition {
  id: string
  sourceBlockId: string
  sourcePortId: string
  targetBlockId: string
  targetPortId: string
}

export interface PortDefinition {
  id: string
  name: string
  type: 'input' | 'output'
}

export interface FlowMetadata {
  description?: string
  author?: string
  createdAt: Date
  updatedAt: Date
  tags?: string[]
}

export interface ExecutionGraph {
  blocks: Map<string, BlockNode>
  connections: Map<string, Connection[]>
  startBlocks: string[]
  metadata: FlowMetadata
}

export interface BlockNode {
  id: string
  definitionId: string
  parameters: Record<string, any>
  inputPorts: Port[]
  outputPorts: Port[]
}

export interface Port {
  id: string
  name: string
  type: 'input' | 'output'
}

export interface Connection {
  sourceBlockId: string
  sourcePortId: string
  targetBlockId: string
  targetPortId: string
}

export interface ExecutionResult {
  success: boolean
  outputPort: string
  data?: any
  error?: ExecutionError
  variables?: Record<string, any>
  nextDelay?: number
}

export interface ExecutionError {
  type: ErrorType
  severity: ErrorSeverity
  message: string
  blockId?: string
  timestamp: Date
  stack?: string
}

export enum BlockType {
  SENSOR = 'sensor',
  SET_VAR_NAME = 'setVarName',
  SET_VAR_DATA = 'setVarData',
  ACTUATOR = 'actuator',
  WAIT = 'wait',
  IF = 'if',
  LOOP = 'loop',
  GOTO = 'goto',
  ERROR_HANDLER = 'errorHandler'
}

export enum ErrorType {
  SENSOR_TIMEOUT = 'sensor_timeout',
  DEVICE_NOT_RESPONDING = 'device_not_responding',
  HARDWARE_FAILURE = 'hardware_failure',
  INVALID_BLOCK_TYPE = 'invalid_block_type',
  MISSING_PARAMETER = 'missing_parameter',
  CONDITION_ERROR = 'condition_error',
  MEMORY_LIMIT = 'memory_limit',
  EXECUTION_TIMEOUT = 'execution_timeout',
  FLOW_VALIDATION_ERROR = 'flow_validation_error'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface VariableMetadata {
  name: string
  displayName: string
  type: 'number' | 'string' | 'boolean'
  source: string
  lastUpdated: Date
  unit?: string
}

export interface ExecutionLog {
  id: string
  blockId: string
  message: string
  level: LogLevel
  timestamp: Date
  data?: any
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LoopState {
  blockId: string
  type: LoopType
  currentIteration: number
  maxIterations?: number
  condition?: ConditionConfig
  delay?: number
}

export enum LoopType {
  WHILE = 'while',
  REPEAT = 'repeat',
  WHILE_MAX = 'while_max'
}

export interface ConditionConfig {
  leftVariable: string
  operator: ComparisonOperator
  rightValue: any
  dataType: 'number' | 'string' | 'boolean'
}

export enum ComparisonOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  GREATER_EQUAL = 'greater_equal',
  LESS_EQUAL = 'less_equal'
}

export interface LoopDecision {
  continue: boolean
  reason: string
}

export interface ExecutionSnapshot {
  flowId: string
  executionId: string
  currentBlockId: string | null
  variables: Record<string, any>
  executedBlocks: string[]
  activeLoops: LoopState[]
  timestamp: Date
}
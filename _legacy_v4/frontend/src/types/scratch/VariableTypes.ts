/**
 * VariableTypes.ts - Типове за променливи и изрази във визуалния редактор
 */

// Типове данни за променливи
export type VariableDataType = 'number' | 'text' | 'boolean' | 'auto'

// Аритметични оператори
export type ArithmeticOperator = '+' | '-' | '*' | '/'

// Сравнителни оператори
export type ComparisonOperator = '=' | '!=' | '>' | '<' | '>=' | '<='

// Логически оператори
export type LogicalOperator = '&&' | '||' | '!'

// Всички оператори
export type ExpressionOperator = ArithmeticOperator | ComparisonOperator | LogicalOperator

// Типове изрази
export type ExpressionType = 'arithmetic' | 'comparison' | 'logical'

// Дефиниция на променлива
export interface VariableDefinition {
  id: string
  name: string
  type: VariableDataType
  initialValue: any
  description?: string
  readonly?: boolean
  createdAt: Date
  updatedAt: Date
}

// Operand в израз (може да е променлива или константа)
export interface ExpressionOperand {
  type: 'variable' | 'constant'
  value: string | number | boolean
  variableId?: string // ако type === 'variable'
  dataType: VariableDataType
}

// Единичен израз (operand operator operand)
export interface SimpleExpression {
  id: string
  left: ExpressionOperand
  operator: ExpressionOperator
  right: ExpressionOperand
  resultType: VariableDataType
}

// Сложен израз (може да съдържа подизрази)
export interface ComplexExpression {
  id: string
  type: ExpressionType
  expressions: (SimpleExpression | ComplexExpression)[]
  operator?: LogicalOperator // за свързване на подизразите
  parentheses?: boolean
  resultType: VariableDataType
}

// Union тип за всички изрази
export type Expression = SimpleExpression | ComplexExpression

// Резултат от оценка на израз
export interface ExpressionResult {
  value: any
  type: VariableDataType
  isValid: boolean
  error?: string
}

// Context за оценка на изрази
export interface EvaluationContext {
  variables: Map<string, any>
  functions?: Map<string, Function>
}

// Validation резултат за израз
export interface ExpressionValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
  resultType: VariableDataType
}

// Оператор групи за UI
export interface OperatorGroup {
  id: string
  name: string
  description: string
  operators: {
    symbol: ExpressionOperator
    label: string
    description: string
    inputTypes: VariableDataType[]
    outputType: VariableDataType
  }[]
}

// Variable Manager събития
export interface VariableManagerEvents {
  'update:variables': [variables: VariableDefinition[]]
  'variable-added': [variable: VariableDefinition]
  'variable-updated': [variable: VariableDefinition]
  'variable-deleted': [variableId: string]
}

// Expression Builder събития
export interface ExpressionBuilderEvents {
  'update:modelValue': [expression: Expression | null]
  'expression-changed': [expression: Expression | null]
  'validation-changed': [validation: ExpressionValidation]
}

// Константи за оператори
export const ARITHMETIC_OPERATORS: OperatorGroup = {
  id: 'arithmetic',
  name: 'Аритметични',
  description: 'Математически операции',
  operators: [
    { symbol: '+', label: 'Плюс', description: 'Събиране', inputTypes: ['number'], outputType: 'number' },
    { symbol: '-', label: 'Минус', description: 'Изваждане', inputTypes: ['number'], outputType: 'number' },
    { symbol: '*', label: 'По', description: 'Умножение', inputTypes: ['number'], outputType: 'number' },
    { symbol: '/', label: 'Разделено на', description: 'Деление', inputTypes: ['number'], outputType: 'number' }
  ]
}

export const COMPARISON_OPERATORS: OperatorGroup = {
  id: 'comparison',
  name: 'Сравнителни',
  description: 'Сравняване на стойности',
  operators: [
    { symbol: '=', label: 'Равно', description: 'Проверява дали стойностите са равни', inputTypes: ['number', 'text', 'boolean'], outputType: 'boolean' },
    { symbol: '!=', label: 'Различно', description: 'Проверява дали стойностите са различни', inputTypes: ['number', 'text', 'boolean'], outputType: 'boolean' },
    { symbol: '>', label: 'По-голямо', description: 'По-голямо от', inputTypes: ['number'], outputType: 'boolean' },
    { symbol: '<', label: 'По-малко', description: 'По-малко от', inputTypes: ['number'], outputType: 'boolean' },
    { symbol: '>=', label: 'По-голямо или равно', description: 'По-голямо или равно на', inputTypes: ['number'], outputType: 'boolean' },
    { symbol: '<=', label: 'По-малко или равно', description: 'По-малко или равно на', inputTypes: ['number'], outputType: 'boolean' }
  ]
}

export const LOGICAL_OPERATORS: OperatorGroup = {
  id: 'logical',
  name: 'Логически',
  description: 'Логически операции',
  operators: [
    { symbol: '&&', label: 'И', description: 'Връща истина ако и двете условия са истинни', inputTypes: ['boolean'], outputType: 'boolean' },
    { symbol: '||', label: 'ИЛИ', description: 'Връща истина ако поне едно условие е истинно', inputTypes: ['boolean'], outputType: 'boolean' },
    { symbol: '!', label: 'НЕ', description: 'Обръща логическата стойност', inputTypes: ['boolean'], outputType: 'boolean' }
  ]
}

export const ALL_OPERATOR_GROUPS = [
  ARITHMETIC_OPERATORS,
  COMPARISON_OPERATORS,
  LOGICAL_OPERATORS
]

// Helper функции
export function getOperatorInfo(operator: ExpressionOperator) {
  for (const group of ALL_OPERATOR_GROUPS) {
    const operatorInfo = group.operators.find(op => op.symbol === operator)
    if (operatorInfo) {
      return operatorInfo
    }
  }
  return null
}

export function getOperatorGroup(operator: ExpressionOperator): OperatorGroup | null {
  for (const group of ALL_OPERATOR_GROUPS) {
    if (group.operators.some(op => op.symbol === operator)) {
      return group
    }
  }
  return null
}

export function isArithmeticOperator(operator: ExpressionOperator): operator is ArithmeticOperator {
  return ARITHMETIC_OPERATORS.operators.some(op => op.symbol === operator)
}

export function isComparisonOperator(operator: ExpressionOperator): operator is ComparisonOperator {
  return COMPARISON_OPERATORS.operators.some(op => op.symbol === operator)
}

export function isLogicalOperator(operator: ExpressionOperator): operator is LogicalOperator {
  return LOGICAL_OPERATORS.operators.some(op => op.symbol === operator)
}

// Type guards
export function isSimpleExpression(expr: Expression): expr is SimpleExpression {
  return 'left' in expr && 'operator' in expr && 'right' in expr
}

export function isComplexExpression(expr: Expression): expr is ComplexExpression {
  return 'expressions' in expr && Array.isArray((expr as ComplexExpression).expressions)
}

// Utility функции за типове
export function inferVariableType(value: any): VariableDataType {
  if (typeof value === 'number') return 'number'
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'string') return 'text'
  return 'auto'
}

export function validateTypeCompatibility(
  operator: ExpressionOperator, 
  leftType: VariableDataType, 
  rightType: VariableDataType
): boolean {
  const operatorInfo = getOperatorInfo(operator)
  if (!operatorInfo) return false
  
  // Проверява дали типовете са съвместими с оператора
  const compatibleTypes = operatorInfo.inputTypes
  return compatibleTypes.includes(leftType) && compatibleTypes.includes(rightType)
}

export function getResultType(
  operator: ExpressionOperator, 
  leftType: VariableDataType, 
  rightType: VariableDataType
): VariableDataType {
  const operatorInfo = getOperatorInfo(operator)
  if (!operatorInfo) return 'auto'
  
  return operatorInfo.outputType
}

// Константи за UI
export const VARIABLE_TYPE_LABELS: Record<VariableDataType, string> = {
  number: 'Число',
  text: 'Текст',
  boolean: 'Да/Не',
  auto: 'Автоматично'
}

export const VARIABLE_TYPE_ICONS: Record<VariableDataType, string> = {
  number: 'tag',
  text: 'format_quote',
  boolean: 'check_box',
  auto: 'auto_awesome'
}

export const VARIABLE_TYPE_COLORS: Record<VariableDataType, string> = {
  number: 'blue',
  text: 'green',
  boolean: 'orange',
  auto: 'purple'
}
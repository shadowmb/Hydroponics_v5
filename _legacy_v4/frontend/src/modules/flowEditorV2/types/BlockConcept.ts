/**
 * 📦 FlowEditor v3 - Block Concept Types
 * ✅ Част от основната редакторна система
 * Базови типове за блок концепция
 * Последна проверка: 2025-01-26
 */

// Port типове според новата концепция (4 двойки + 1 специален)
export type PortType = 
  | 'flowIn' | 'flowOut'                    // Навигация/изпълнение
  | 'setVarNameIn' | 'setVarNameOut'        // Имена на променливи
  | 'setVarDataIn' | 'setVarDataOut'        // Данни на променливи  
  | 'onErrorIn' | 'onErrorOut'              // Грешки
  | 'loopOut';                              // Цикли - V4.4 (само изход)

// Port посока за логическо групиране
export type PortDirection = 'in' | 'out';

// Composite port type - може да приема няколко типа
export type CompositePortType = PortType | PortType[];

// Block типове според концепцията
export type BlockType = 'core' | 'support' | 'special' | 'container' | 'container_start' | 'container_end';

// Port дефиниция
export interface PortDefinition {
  id: string;
  label: string;
  type: CompositePortType;
  required: boolean;
  description?: string;
}

// Блок параметър
export interface BlockParameter {
  id: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'sensor' | 'actuator' | 'color' | 'conditionArray';
  required: boolean;
  defaultValue?: any;
  options?: Array<{ value: any; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  description?: string;
}

// Validation schema interfaces
export interface ConnectionValidationRules {
  maxInputs?: number;
  maxOutputs?: number;
  requiredInputs?: string[]; // port IDs that must be connected
  requiredOutputs?: string[]; // port IDs that must be connected
  recommendedInputs?: string[]; // port IDs that should be connected (warnings)
  recommendedOutputs?: string[]; // port IDs that should be connected (warnings)
  forbiddenConnections?: Array<{
    sourcePort: string;
    targetPort: string;
    reason?: string;
  }>;
}

// Parameter validation with alternative sources
export interface ParameterValidationRules {
  required?: string[]; // always required parameters
  recommended?: string[]; // recommended parameters (warnings)
  requiredWithAlternatives?: Array<{
    field: string; // parameter ID
    alternatives: string[]; // alternative sources like 'connection:portId' or 'globalVariable'
  }>;
}

export interface BlockValidationRules {
  connections?: ConnectionValidationRules;
  parameters?: ParameterValidationRules;
  legacy?: {
    conditionalRequired?: Array<{
      condition: string; // parameter condition (e.g., "type === 'sensor'")
      requiredParams: string[]; // parameter IDs that become required
    }>;
    mutuallyExclusive?: string[][]; // groups of parameters that can't be set together
  };
  positioning?: {
    containerOnly?: boolean; // can only be placed in containers
    topLevelOnly?: boolean; // can't be placed in containers
    afterBlocks?: string[]; // must come after specific block types
    beforeBlocks?: string[]; // must come before specific block types
  };
}

// Блок дефиниция според концепцията
export interface BlockDefinition {
  id: string;
  type: string;
  blockType: BlockType; // Основен или поддържащ блок
  name: string;
  category: string;
  description: string;
  icon?: string;
  color?: string;
  
  // Портове
  inputs: PortDefinition[];
  outputs: PortDefinition[];
  
  // Параметри
  parameters: BlockParameter[];
  
  // Executor поддръжка - полета които могат да използват target. стойности
  executorFields?: string[];
  
  // Метаданни
  meta?: {
    version?: string;
    deprecated?: boolean;
    experimental?: boolean;
    // 🆕 Container-specific fields
    containerId?: string; // За container_start/container_end blocks
    isContainerBlock?: boolean; // За container blocks
    // 🆕 Validation rules
    validationRules?: BlockValidationRules;
  };
}

// Блок инстанция в flow-то
export interface BlockInstance {
  id: string;
  definitionId: string;
  position: {
    x: number;
    y: number;
  };
  parameters: Record<string, any>;
  connections: {
    inputs: Record<string, string[]>;  // port_id -> [connection_ids]
    outputs: Record<string, string[]>; // port_id -> [connection_ids]
  };
  meta?: {
    status?: 'valid' | 'invalid' | 'warning';
    errors?: string[];
    warnings?: string[];
    // 🆕 Container instance fields
    containerId?: string; // Ако е част от контейнер
    isContainerMarker?: boolean; // Ако е start/end marker
    system?: boolean; // Системен блок (start/end)
  };
  // 🆕 Container system marker
  containerId?: string; // За блокове в контейнер
  containerSystem?: boolean; // Маркира системни блокове на контейнер
}

// Връзка между блокове
export interface BlockConnection {
  id: string;
  sourceBlockId: string;
  sourcePortId: string;
  targetBlockId: string;
  targetPortId: string;
  meta?: {
    status?: 'valid' | 'invalid';
    error?: string;
  };
}

// Основна позиция
export interface Position {
  x: number;
  y: number;
}

// Размери
export interface Dimensions {
  width: number;
  height: number;
}
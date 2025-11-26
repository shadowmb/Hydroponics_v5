/**
 * 📦 FlowEditor v3 - Port Manager
 * ✅ Част от основната редакторна система
 * Манаджър за port съвместимост и връзки
 * Последна проверка: 2025-01-26
 */

import type { 
  PortType,
  CompositePortType,
  PortDefinition,
  BlockConnection,
  BlockInstance
} from '../../types/BlockConcept';

// Port compatibility matrix
export interface PortCompatibilityRule {
  sourceType: PortType;
  targetTypes: PortType[];
  bidirectional?: boolean;
  description?: string;
}

// Connection validation result
export interface ConnectionValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  compatibility: 'perfect' | 'compatible' | 'warning' | 'incompatible';
}

// New port compatibility rules (4 simple pairs)
export const DEFAULT_PORT_RULES: PortCompatibilityRule[] = [
  // Flow навигация/изпълнение
  {
    sourceType: 'flowOut',
    targetTypes: ['flowIn'],
    bidirectional: false,
    description: 'Навигация между блокове - flowOut може да се свърже само към flowIn',
  },
  
  // Loop навигация/изпълнение - V4.4
  {
    sourceType: 'loopOut',
    targetTypes: ['flowIn'],
    bidirectional: false,
    description: 'Loop навигация - loopOut може да се свърже към flowIn за започване на цикъл',
  },
  
  // Имена на променливи
  {
    sourceType: 'setVarNameOut',
    targetTypes: ['setVarNameIn'],
    bidirectional: false,
    description: 'Предаване на имена на променливи - setVarNameOut може да се свърже само към setVarNameIn',
  },
  
  // Данни на променливи
  {
    sourceType: 'setVarDataOut',
    targetTypes: ['setVarDataIn'],
    bidirectional: false,
    description: 'Предаване на данни на променливи - setVarDataOut може да се свърже само към setVarDataIn',
  },
  
  // Обработка на грешки
  {
    sourceType: 'onErrorOut',
    targetTypes: ['onErrorIn'],
    bidirectional: false,
    description: 'Обработка на грешки - onErrorOut може да се свърже само към onErrorIn',
  },
];

// Port Manager клас с performance optimizations
export class PortManager {
  private static compatibilityRules: PortCompatibilityRule[] = [...DEFAULT_PORT_RULES];
  
  // Performance optimization: Pre-computed lookup tables
  private static compatibilityMatrix: Map<string, Set<PortType>> = new Map();
  private static isMatrixInitialized = false;
  
  // Cache for frequently accessed color and description data
  private static colorCache: Map<PortType, string> = new Map();
  private static descriptionCache: Map<PortType, string> = new Map();
  private static isCacheInitialized = false;
  
  /**
   * Инициализира compatibility матрицата за O(1) lookups
   */
  private static initializeCompatibilityMatrix(): void {
    if (this.isMatrixInitialized) return;
    
    // Build fast lookup matrix from rules
    for (const rule of this.compatibilityRules) {
      const sourceSet = this.compatibilityMatrix.get(rule.sourceType) || new Set<PortType>();
      
      // Add all target types for this source
      for (const targetType of rule.targetTypes) {
        sourceSet.add(targetType);
      }
      
      // Handle bidirectional rules
      if (rule.bidirectional) {
        for (const targetType of rule.targetTypes) {
          const targetSet = this.compatibilityMatrix.get(targetType) || new Set<PortType>();
          targetSet.add(rule.sourceType);
          this.compatibilityMatrix.set(targetType, targetSet);
        }
      }
      
      this.compatibilityMatrix.set(rule.sourceType, sourceSet);
    }
    
    this.isMatrixInitialized = true;
  }
  
  /**
   * Инициализира cache за цветове и описания
   */
  private static initializeCache(): void {
    if (this.isCacheInitialized) return;
    
    // Pre-compute all colors and descriptions
    const colors: Record<PortType, string> = {
      // Flow портове - синьо (светло/тъмно за in/out)
      'flowIn': '#64B5F6',        // светло синьо
      'flowOut': '#2196F3',       // тъмно синьо
      
      // SetVarName портове - зелено (светло/тъмно за in/out)
      'setVarNameIn': '#81C784',  // светло зелено
      'setVarNameOut': '#4CAF50', // тъмно зелено
      
      // SetVarData портове - оранжево (светло/тъмно за in/out)
      'setVarDataIn': '#FFB74D',  // светло оранжево
      'setVarDataOut': '#FF9800', // тъмно оранжево
      
      // OnError портове - червено (светло/тъмно за in/out)
      'onErrorIn': '#E57373',     // светло червено
      'onErrorOut': '#F44336',    // тъмно червено
      
      // Loop портове - лилаво - V4.4
      'loopOut': '#9C27B0',       // лилаво за loop
    };
    
    const descriptions: Record<PortType, string> = {
      'flowIn': 'Вход за навигация - започва изпълнението на блока',
      'flowOut': 'Изход за навигация - продължава към следващия блок',
      'setVarNameIn': 'Вход за име на променлива - получава име за записване',
      'setVarNameOut': 'Изход за име на променлива - предава име на променлива',
      'setVarDataIn': 'Вход за данни на променлива - получава стойност за използване',
      'setVarDataOut': 'Изход за данни на променлива - предава стойност от променлива',
      'onErrorIn': 'Вход за грешки - получава сигнал при проблем',
      'onErrorOut': 'Изход за грешки - предава сигнал при проблем',
      'loopOut': 'Изход за цикъл - започва блоковете в цикъла',
    };
    
    // Populate caches
    for (const portType of this.getAllPortTypes()) {
      this.colorCache.set(portType, colors[portType] || '#9E9E9E');
      this.descriptionCache.set(portType, descriptions[portType] || 'Неизвестен port тип');
    }
    
    this.isCacheInitialized = true;
  }
  
  /**
   * Добавя нови compatibility правила
   */
  static addCompatibilityRule(rule: PortCompatibilityRule): void {
    this.compatibilityRules.push(rule);
    this.isMatrixInitialized = false; // Invalidate cache
  }
  
  /**
   * Премахва compatibility правило
   */
  static removeCompatibilityRule(sourceType: PortType, targetType: PortType): boolean {
    const index = this.compatibilityRules.findIndex(
      rule => rule.sourceType === sourceType && rule.targetTypes.includes(targetType)
    );
    
    if (index !== -1) {
      this.compatibilityRules.splice(index, 1);
      this.isMatrixInitialized = false; // Invalidate cache
      return true;
    }
    
    return false;
  }
  
  /**
   * Проверява дали два port типа са съвместими - Optimized O(1) version
   */
  static arePortsCompatible(sourceType: PortType, targetType: PortType): boolean {
    // Ensure matrix is initialized
    this.initializeCompatibilityMatrix();
    
    // O(1) lookup in pre-computed matrix
    const compatibleTargets = this.compatibilityMatrix.get(sourceType);
    return compatibleTargets ? compatibleTargets.has(targetType) : false;
  }
  
  /**
   * Проверява съвместимост с CompositePortType
   */
  static isCompatibleWithComposite(
    sourceType: PortType, 
    targetComposite: CompositePortType
  ): boolean {
    // Ако target е единичен тип
    if (typeof targetComposite === 'string') {
      return this.arePortsCompatible(sourceType, targetComposite);
    }
    
    // Ако target е масив от типове
    if (Array.isArray(targetComposite)) {
      return targetComposite.some(targetType => 
        this.arePortsCompatible(sourceType, targetType)
      );
    }
    
    return false;
  }
  
  /**
   * Валидира връзка между два порта
   */
  static validateConnection(
    sourcePort: PortDefinition,
    targetPort: PortDefinition
  ): ConnectionValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
        // Основни проверки
    if (!sourcePort || !targetPort) {
      errors.push('Източник или цел port липсва');
      return { isValid: false, errors, warnings, compatibility: 'incompatible' };
    }
    
    // Проверка на съвместимост на типовете
    const sourceType = typeof sourcePort.type === 'string' ? sourcePort.type : sourcePort.type[0];
    
    if (!sourceType || !this.isCompatibleWithComposite(sourceType, targetPort.type)) {
      errors.push(`Port типовете не са съвместими: ${sourceType} -> ${JSON.stringify(targetPort.type)}`);
      return { isValid: false, errors, warnings, compatibility: 'incompatible' };
    }
    
    // Определяме compatibility level
    let compatibility: 'perfect' | 'compatible' | 'warning' | 'incompatible' = 'compatible';
    
    // Perfect match - еднакви типове
    if (typeof targetPort.type === 'string' && sourceType === targetPort.type) {
      compatibility = 'perfect';
    }
    // Warning за някои специални случаи (временно коментирано - невалидни port типове)
    // else if (sourceType && ((sourceType === 'sensor' && targetPort.type === 'flow') ||
    //          (sourceType === 'logic' && targetPort.type === 'actuator'))) {
    //   compatibility = 'warning';
    //   warnings.push('Тази връзка може да не работи както се очаква');
    // }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      compatibility,
    };
  }
  
  /**
   * Валидира връзка между блокове
   */
  static validateBlockConnection(
    sourceBlock: BlockInstance,
    sourcePortId: string,
    targetBlock: BlockInstance,
    targetPortId: string
  ): ConnectionValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // TODO: Get block definitions to check ports
    // За сега използваме базова проверка
    
    // Проверяваме за self-connection
    if (sourceBlock.id === targetBlock.id) {
      errors.push('Блок не може да се свърже към себе си');
      return { isValid: false, errors, warnings, compatibility: 'incompatible' };
    }
    
    // TODO: Добавяме проверки за circular dependencies
    // TODO: Добавяме проверки за port existence in definitions
    
    return { isValid: true, errors, warnings, compatibility: 'compatible' };
  }
  
  /**
   * Получава всички compatible target типове за даден source тип - Optimized
   */
  static getCompatibleTargets(sourceType: PortType): PortType[] {
    this.initializeCompatibilityMatrix();
    
    const compatibleTargets = this.compatibilityMatrix.get(sourceType);
    return compatibleTargets ? Array.from(compatibleTargets) : [];
  }
  
  /**
   * Получава всички compatible source типове за даден target тип - Optimized
   */
  static getCompatibleSources(targetType: PortType): PortType[] {
    this.initializeCompatibilityMatrix();
    
    const compatibleSources: PortType[] = [];
    
    // O(n) where n = number of port types (8), but cached lookup
    for (const [sourceType, targets] of this.compatibilityMatrix) {
      if (targets.has(targetType)) {
        compatibleSources.push(sourceType as PortType);
      }
    }
    
    return compatibleSources;
  }
  
  /**
   * Получава всички налични port типове
   */
  static getAllPortTypes(): PortType[] {
    return ['flowIn', 'flowOut', 'setVarNameIn', 'setVarNameOut', 'setVarDataIn', 'setVarDataOut', 'onErrorIn', 'onErrorOut', 'loopOut'];
  }
  
  /**
   * Получава описанието на port тип - Cached version
   */
  static getPortTypeDescription(portType: PortType): string {
    this.initializeCache();
    return this.descriptionCache.get(portType) || 'Неизвестен port тип';
  }
  
  /**
   * Получава цвета за визуализация на port тип - Cached version
   */
  static getPortTypeColor(portType: PortType): string {
    this.initializeCache();
    return this.colorCache.get(portType) || '#9E9E9E';
  }
}

// Helper functions for export
export function arePortsCompatible(sourceType: PortType, targetType: PortType): boolean {
  return PortManager.arePortsCompatible(sourceType, targetType);
}

export function validateConnection(
  sourcePort: PortDefinition, 
  targetPort: PortDefinition
): ConnectionValidationResult {
  return PortManager.validateConnection(sourcePort, targetPort);
}

export function getCompatibleTargets(sourceType: PortType): PortType[] {
  return PortManager.getCompatibleTargets(sourceType);
}

export function getPortTypeColor(portType: PortType): string {
  return PortManager.getPortTypeColor(portType);
}

export function getPortTypeDescription(portType: PortType): string {
  return PortManager.getPortTypeDescription(portType);
}
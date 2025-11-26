/**
 * 📦 FlowEditor v3 - Variable Workspace Tracker
 * ✅ Проследява променливи в workspace за динамично подаване на options
 * Източва всички setVarName блокове и предоставя уникални имена за setVarData
 * Създаден: 2025-07-29
 */

import type { BlockInstance } from '../types/BlockConcept';
import { ref, computed, type Ref } from 'vue';

export interface VariableOption {
  label: string;
  value: string;
}

/**
 * VariableWorkspaceTracker клас за проследяване на променливи в workspace
 */
export class VariableWorkspaceTracker {
  private static instance: VariableWorkspaceTracker | null = null;
  private workspaceBlocks: Ref<BlockInstance[]> = ref([]);
  
  private constructor() {}
  
  /**
   * Singleton pattern - връща единствената инстанция
   */
  static getInstance(): VariableWorkspaceTracker {
    if (!this.instance) {
      this.instance = new VariableWorkspaceTracker();
    }
    return this.instance;
  }
  
  /**
   * Обновява списъка с блокове от workspace
   * @param blocks - масив с всички блокове от workspace
   */
  updateWorkspaceBlocks(blocks: BlockInstance[]): void {
    this.workspaceBlocks.value = [...blocks];
  }
  
  /**
   * Компютнато свойство за получаване на всички setVarName блокове
   */
  private get setVarNameBlocks(): BlockInstance[] {
    return this.workspaceBlocks.value.filter(
      block => block.definitionId === 'support.setVarName'
    );
  }
  
  /**
   * Получава всички дефинирани променливи от setVarName блоковете
   * @returns масив с уникални имена на променливи
   */
  getDefinedVariables(): string[] {
    const variables = new Set<string>();
    
    this.setVarNameBlocks.forEach(block => {
      const variableName = block.parameters?.variableName;
      if (variableName && typeof variableName === 'string' && variableName.trim()) {
        variables.add(variableName.trim());
      }
    });
    
    return Array.from(variables).sort();
  }
  
  /**
   * Получава опции за setVarData падащо меню
   * @returns масив с опции за select компонент
   */
  getVariableOptions(): VariableOption[] {
    const variables = this.getDefinedVariables();
    
    if (variables.length === 0) {
      return [
        { 
          label: '(няма създадени променливи)', 
          value: '' 
        }
      ];
    }
    
    return variables.map(variable => ({
      label: variable,
      value: variable
    }));
  }
  
  /**
   * Реактивно computed свойство за variable options
   * Автоматично се обновява при промени в workspace
   */
  get reactiveVariableOptions() {
    return computed(() => this.getVariableOptions());
  }
  
  /**
   * Проверява дали дадена променлива съществува в workspace
   * @param variableName - име на променливата за проверка
   * @returns true ако променливата съществува
   */
  hasVariable(variableName: string): boolean {
    return this.getDefinedVariables().includes(variableName);
  }
  
  /**
   * Получава брой на setVarName блоковете
   * @returns брой блокове
   */
  getVariableBlocksCount(): number {
    return this.setVarNameBlocks.length;
  }
  
  /**
   * Получава брой на дефинираните уникални променливи
   * @returns брой уникални променливи
   */
  getUniqueVariablesCount(): number {
    return this.getDefinedVariables().length;
  }
  
  /**
   * Debug информация за текущо състояние
   * @returns обект с debug данни
   */
  getDebugInfo(): {
    totalBlocks: number;
    setVarNameBlocks: number;
    uniqueVariables: number;
    variables: string[];
    options: VariableOption[];
  } {
    return {
      totalBlocks: this.workspaceBlocks.value.length,
      setVarNameBlocks: this.getVariableBlocksCount(),
      uniqueVariables: this.getUniqueVariablesCount(),
      variables: this.getDefinedVariables(),
      options: this.getVariableOptions()
    };
  }
}

/**
 * Глобална инстанция за лесно използване
 */
export const variableTracker = VariableWorkspaceTracker.getInstance();

/**
 * Composable за използване във Vue компоненти
 * @returns обект с реактивни properties и методи
 */
export function useVariableTracker() {
  const tracker = VariableWorkspaceTracker.getInstance();
  
  return {
    // Реактивни свойства
    variableOptions: tracker.reactiveVariableOptions,
    
    // Методи
    updateWorkspace: (blocks: BlockInstance[]) => tracker.updateWorkspaceBlocks(blocks),
    getDefinedVariables: () => tracker.getDefinedVariables(),
    hasVariable: (name: string) => tracker.hasVariable(name),
    getDebugInfo: () => tracker.getDebugInfo(),
    
    // Статистики
    getVariableBlocksCount: () => tracker.getVariableBlocksCount(),
    getUniqueVariablesCount: () => tracker.getUniqueVariablesCount()
  };
}

export default variableTracker;
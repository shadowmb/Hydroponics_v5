/**
 * 📦 Variable Manager Service
 * ✅ Global management of visual variable names
 * Manages mapping between internal variables (var1-var10) and display names
 */

import { reactive, watch } from 'vue';

// Visual variable names mapping
interface VariableMapping {
  [key: string]: {
    displayName: string;
    dataType: string;
  };
}

// Reactive global state
const variableState = reactive({
  visualVariableNames: {} as VariableMapping
});

/**
 * Variable Manager Service
 * Handles global variable name mapping and synchronization
 */
export class VariableManager {
  
  /**
   * Get display name for a variable
   */
  static getDisplayName(internalVar: string): string {
    const mapping = variableState.visualVariableNames[internalVar];
    return mapping?.displayName || '';
  }

  /**
   * Set display name for a variable
   */
  static setDisplayName(internalVar: string, displayName: string, dataType: string = 'auto'): void {
    if (!variableState.visualVariableNames[internalVar]) {
      variableState.visualVariableNames[internalVar] = {
        displayName: '',
        dataType: 'auto'
      };
    }
    
    variableState.visualVariableNames[internalVar].displayName = displayName.trim();
    variableState.visualVariableNames[internalVar].dataType = dataType;

    // Clean up empty entries
    if (!displayName.trim()) {
      delete variableState.visualVariableNames[internalVar];
    }

    // Trigger update event for all blocks using this variable
    this.notifyVariableChange(internalVar);
  }

  /**
   * Get data type for a variable
   */
  static getDataType(internalVar: string): string {
    const mapping = variableState.visualVariableNames[internalVar];
    return mapping?.dataType || 'auto';
  }

  /**
   * Check if a variable is used by any blocks
   */
  static isVariableUsed(internalVar: string): { isUsed: boolean; blockCount: number } {
    // This will be connected to the block system
    // For now, return mock data - will be implemented with actual block checking
    const mockUsage = Object.keys(variableState.visualVariableNames).includes(internalVar);
    return {
      isUsed: mockUsage,
      blockCount: mockUsage ? 1 : 0 // TODO: Implement actual block counting
    };
  }

  /**
   * Get all visual variable names for JSON export
   */
  static getVisualVariableNames(): Record<string, string> {
    const result: Record<string, string> = {};
    
    Object.entries(variableState.visualVariableNames).forEach(([key, value]) => {
      if (value.displayName.trim()) {
        result[key] = value.displayName;
      }
    });
    
    return result;
  }

  /**
   * Load visual variable names from JSON import
   */
  static loadVisualVariableNames(names: Record<string, string>): void {
    // Clear existing names
    variableState.visualVariableNames = {};
    
    // Load new names
    Object.entries(names).forEach(([internalVar, displayName]) => {
      if (displayName && displayName.trim()) {
        variableState.visualVariableNames[internalVar] = {
          displayName: displayName.trim(),
          dataType: 'auto'
        };
      }
    });

    console.log('[VariableManager] Loaded visual variable names:', names);
  }

  /**
   * Clear all visual variable names (for new flow)
   */
  static clearAll(): void {
    variableState.visualVariableNames = {};
    console.log('[VariableManager] Cleared all visual variable names');
  }

  /**
   * Get reactive state for Vue components
   */
  static getReactiveState() {
    return variableState;
  }

  /**
   * Notify all components about variable change
   */
  private static notifyVariableChange(internalVar: string): void {
    // Dispatch custom event for block updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('variableNameChanged', {
        detail: {
          internalVar,
          displayName: this.getDisplayName(internalVar),
          dataType: this.getDataType(internalVar)
        }
      }));
    }
  }

  /**
   * Get formatted display text for a variable (for block rendering)
   */
  static getDisplayText(internalVar: string): string {
    const displayName = this.getDisplayName(internalVar);
    return displayName || internalVar;
  }

  /**
   * Validate variable name format
   */
  static isValidInternalVar(varName: string): boolean {
    return /^var([1-9]|10)$/.test(varName);
  }

  /**
   * Get list of all valid internal variables
   */
  static getAllInternalVars(): string[] {
    return ['var1', 'var2', 'var3', 'var4', 'var5', 'var6', 'var7', 'var8', 'var9', 'var10'];
  }
}

// Export for direct access if needed
export { variableState };

// Development helper
if (process.env.NODE_ENV === 'development') {
  (window as any).VariableManager = VariableManager;
}
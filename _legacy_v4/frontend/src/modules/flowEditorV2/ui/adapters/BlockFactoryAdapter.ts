/**
 * 📦 Simple Block Adapter - Clean UI Integration
 * ✅ Clean sync wrapper for the new BlockFactory system
 * 🎯 No fallbacks, no legacy code, just simple async→sync conversion
 */

import type { BlockDefinition } from '../../types/BlockConcept';
import { BlockFactory } from '../../blocks/BlockFactory';

// Simple adapter configuration
export interface SimpleAdapterConfig {
  enableLogging: boolean;
  refreshOnInit: boolean;
}

// Loading state for UI
export interface AdapterState {
  isLoading: boolean;
  isReady: boolean;
  lastUpdate: string;
  error?: string;
}

// Default configuration
const DEFAULT_CONFIG: SimpleAdapterConfig = {
  enableLogging: false,
  refreshOnInit: true
};

/**
 * Simple Block Adapter - Clean sync wrapper for UI components
 * No fallbacks, no complexity - just cached data from BlockFactory
 */
class SimpleBlockAdapter {
  private static instance: SimpleBlockAdapter;
  private config: SimpleAdapterConfig;
  private blockFactory?: BlockFactory;
  
  // Cached data for sync access
  private cachedDefinitions: BlockDefinition[] = [];
  private cachedCategories: string[] = [];
  private state: AdapterState = {
    isLoading: false,
    isReady: false,
    lastUpdate: new Date().toISOString()
  };

  private constructor(config: Partial<SimpleAdapterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Singleton pattern
   */
  static getInstance(config?: Partial<SimpleAdapterConfig>): SimpleBlockAdapter {
    if (!SimpleBlockAdapter.instance) {
      SimpleBlockAdapter.instance = new SimpleBlockAdapter(config);
    }
    return SimpleBlockAdapter.instance;
  }

  /**
   * Initialize adapter - loads and caches all block data
   */
  async initialize(): Promise<void> {
    if (this.state.isReady) return;

    this.log('[SimpleBlockAdapter] Initializing...');
    this.setState({ isLoading: true, error: undefined });

    try {
      // Get BlockFactory instance
      this.blockFactory = BlockFactory.getInstance({
        enableCaching: true,
        enableLogging: this.config.enableLogging
      });

      // Initialize BlockFactory
      await this.blockFactory.initialize();

      // Cache all data for sync access
      await this.refreshCache();

      this.setState({ 
        isLoading: false, 
        isReady: true,
        lastUpdate: new Date().toISOString()
      });

      this.log(`[SimpleBlockAdapter] Ready with ${this.cachedDefinitions.length} blocks`);

      // Notify UI components
      this.notifyReady();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.setState({ 
        isLoading: false, 
        isReady: false,
        error: errorMessage
      });
      
      console.error('[SimpleBlockAdapter] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Refresh cached data from BlockFactory
   */
  private async refreshCache(): Promise<void> {
    if (!this.blockFactory) return;

    try {
      const [definitions, categories] = await Promise.all([
        this.blockFactory.getAllDefinitions(),
        this.blockFactory.getCategories()
      ]);

      this.cachedDefinitions = definitions;
      this.cachedCategories = categories;
      
      this.log(`[SimpleBlockAdapter] Cache refreshed: ${definitions.length} blocks, ${categories.length} categories`);
    } catch (error) {
      console.error('[SimpleBlockAdapter] Failed to refresh cache:', error);
      throw error;
    }
  }

  /**
   * Get all block definitions (sync API for UI)
   */
  getAllBlockDefinitions(): BlockDefinition[] {
    if (!this.state.isReady) {
      this.log('[SimpleBlockAdapter] Not ready yet, returning empty array');
      return [];
    }
    return [...this.cachedDefinitions];
  }

  /**
   * Get block categories (sync API for UI)
   */
  getBlockCategories(): string[] {
    if (!this.state.isReady) {
      this.log('[SimpleBlockAdapter] Not ready yet, returning empty array');
      return [];
    }
    return [...this.cachedCategories];
  }

  /**
   * Get single block definition (sync API for UI)
   */
  getBlockDefinition(definitionId: string): BlockDefinition | undefined {
    if (!this.state.isReady) {
      this.log(`[SimpleBlockAdapter] Not ready yet, cannot get block: ${definitionId}`);
      return undefined;
    }
    
    return this.cachedDefinitions.find(def => def.id === definitionId);
  }

  /**
   * Search blocks (sync API for UI)
   */
  searchBlocks(query: string): BlockDefinition[] {
    if (!this.state.isReady) {
      return [];
    }

    const lowerQuery = query.toLowerCase();
    return this.cachedDefinitions.filter(definition => 
      definition.name.toLowerCase().includes(lowerQuery) ||
      definition.description.toLowerCase().includes(lowerQuery) ||
      definition.category.toLowerCase().includes(lowerQuery) ||
      definition.id.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get blocks by category (sync API for UI)
   */
  getBlocksByCategory(category: string): BlockDefinition[] {
    if (!this.state.isReady) {
      return [];
    }
    
    return this.cachedDefinitions.filter(def => def.category === category);
  }

  /**
   * Get adapter state for UI feedback
   */
  getState(): AdapterState {
    return { ...this.state };
  }

  /**
   * Check if adapter is ready
   */
  isReady(): boolean {
    return this.state.isReady;
  }

  /**
   * Force refresh from BlockFactory
   */
  async refresh(): Promise<void> {
    if (!this.blockFactory) {
      throw new Error('BlockFactory not initialized');
    }

    this.log('[SimpleBlockAdapter] Force refreshing...');
    this.setState({ isLoading: true });

    try {
      // Refresh BlockFactory
      await this.blockFactory.refresh();
      
      // Refresh our cache
      await this.refreshCache();
      
      this.setState({ 
        isLoading: false,
        lastUpdate: new Date().toISOString()
      });

      // Notify UI components
      this.notifyRefresh();
      
      this.log('[SimpleBlockAdapter] Refresh completed');
    } catch (error) {
      this.setState({ isLoading: false });
      console.error('[SimpleBlockAdapter] Refresh failed:', error);
      throw error;
    }
  }

  /**
   * Get system information
   */
  getSystemInfo(): {
    adapterVersion: string;
    isReady: boolean;
    blocksCount: number;
    categoriesCount: number;
    lastUpdate: string;
    blockFactory?: any;
  } {
    return {
      adapterVersion: '1.0.0-simple',
      isReady: this.state.isReady,
      blocksCount: this.cachedDefinitions.length,
      categoriesCount: this.cachedCategories.length,
      lastUpdate: this.state.lastUpdate,
      blockFactory: this.blockFactory?.getSystemInfo()
    };
  }

  /**
   * Update internal state
   */
  private setState(updates: Partial<AdapterState>): void {
    this.state = { ...this.state, ...updates };
  }

  /**
   * Notify UI components that adapter is ready
   */
  private notifyReady(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('simpleBlockAdapterReady', {
        detail: {
          blocksCount: this.cachedDefinitions.length,
          categoriesCount: this.cachedCategories.length
        }
      }));
    }
  }

  /**
   * Notify UI components of refresh
   */
  private notifyRefresh(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('simpleBlockAdapterRefresh', {
        detail: {
          blocksCount: this.cachedDefinitions.length,
          categoriesCount: this.cachedCategories.length
        }
      }));
    }
  }

  /**
   * Logging helper
   */
  private log(message: string, ...args: any[]): void {
    if (this.config.enableLogging) {
      console.log(message, ...args);
    }
  }
}

// Export singleton instance
const simpleBlockAdapter = SimpleBlockAdapter.getInstance();

/**
 * Export functions that maintain API compatibility
 */
export function getAllBlockDefinitions(): BlockDefinition[] {
  return simpleBlockAdapter.getAllBlockDefinitions();
}

export function getBlockCategories(): string[] {
  return simpleBlockAdapter.getBlockCategories();
}

export function getBlockDefinition(definitionId: string): BlockDefinition | undefined {
  return simpleBlockAdapter.getBlockDefinition(definitionId);
}

export function searchBlocks(query: string): BlockDefinition[] {
  return simpleBlockAdapter.searchBlocks(query);
}

export function getBlocksByCategory(category: string): BlockDefinition[] {
  return simpleBlockAdapter.getBlocksByCategory(category);
}

/**
 * Get block schema (wraps definition in schema format for compatibility)
 */
export function getBlockSchema(definitionId: string): any {
  const definition = simpleBlockAdapter.getBlockDefinition(definitionId);
  if (!definition) {
    return undefined;
  }
  
  // Wrap definition in schema format for legacy compatibility
  return {
    definition,
    version: '1.0.0',
    deprecated: false
  };
}

// Development/debugging exports
export const simpleBlockAdapterInstance = simpleBlockAdapter;
export { simpleBlockAdapter };

// Initialize immediately (async)
simpleBlockAdapter.initialize().catch(console.error);
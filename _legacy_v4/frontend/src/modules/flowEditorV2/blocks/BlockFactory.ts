/**
 * 📦 New Block Factory - Modern Clean Implementation
 * ✅ Based on RealBlockLoader with automatic file scanning
 * 🎯 Simple, efficient, future-ready architecture
 */

import type { BlockDefinition, BlockInstance, Position } from '../types/BlockConcept';
import { RealBlockLoader } from './BlockLoader';

// Block instance creation interface
export interface CreateBlockInstanceOptions {
  position: Position;
  parameters?: Record<string, any>;
  meta?: Record<string, any>;
}

// Factory configuration
export interface BlockFactoryConfig {
  enableCaching: boolean;
  enableLogging: boolean;
  autoInitialize: boolean;
}

// Default configuration
const DEFAULT_CONFIG: BlockFactoryConfig = {
  enableCaching: true,
  enableLogging: false,
  autoInitialize: true
};

/**
 * New Block Factory - Clean modern implementation
 * Uses RealBlockLoader for automatic block discovery and loading
 */
export class BlockFactory {
  private static instance: BlockFactory;
  private config: BlockFactoryConfig;
  private loader: RealBlockLoader;
  private availableBlocks: Map<string, BlockDefinition> = new Map();
  private isInitialized = false;

  private constructor(config: Partial<BlockFactoryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loader = RealBlockLoader.getInstance({
      enableCaching: this.config.enableCaching,
      enableLogging: this.config.enableLogging
    });
  }

  /**
   * Singleton pattern
   */
  static getInstance(config?: Partial<BlockFactoryConfig>): BlockFactory {
    if (!BlockFactory.instance) {
      BlockFactory.instance = new BlockFactory(config);
    }
    return BlockFactory.instance;
  }

  /**
   * Initialize factory - loads all available blocks
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.log('[NewBlockFactory] Initializing with RealBlockLoader...');
    
    try {
      // Load all blocks using RealBlockLoader
      const blocks = await this.loader.scanAndLoad();
      this.availableBlocks = blocks;
      
      this.isInitialized = true;
      this.log(`[NewBlockFactory] Initialized with ${blocks.size} blocks available`);
      
    } catch (error) {
      console.error('[NewBlockFactory] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Get all available block definitions
   */
  async getAllDefinitions(): Promise<BlockDefinition[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    return Array.from(this.availableBlocks.values());
  }

  /**
   * Get block definition by ID
   */
  async getDefinition(blockId: string): Promise<BlockDefinition | undefined> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    return this.availableBlocks.get(blockId);
  }

  /**
   * Get all available categories
   */
  async getCategories(): Promise<string[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    return this.loader.getCategories();
  }

  /**
   * Get blocks by category
   */
  async getBlocksByCategory(category: string): Promise<BlockDefinition[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    const allBlocks = Array.from(this.availableBlocks.values());
    return allBlocks.filter(block => block.category === category);
  }

  /**
   * Check if block exists
   */
  async hasBlock(blockId: string): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    return this.availableBlocks.has(blockId);
  }

  /**
   * Create block instance from definition
   */
  async createInstance(
    blockId: string, 
    options: CreateBlockInstanceOptions
  ): Promise<BlockInstance> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const definition = this.availableBlocks.get(blockId);
    if (!definition) {
      throw new Error(`Block definition not found: ${blockId}`);
    }

    this.log(`[NewBlockFactory] Creating instance of: ${blockId}`);

    // Generate unique block instance ID
    const instanceId = `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Prepare default parameters
    const defaultParams: Record<string, any> = {};
    definition.parameters.forEach(param => {
      if (param.defaultValue !== undefined) {
        defaultParams[param.id] = param.defaultValue;
      }
    });
    
    // Merge with provided parameters
    const parameters = { ...defaultParams, ...options.parameters };
    
    // Initialize connection arrays
    const inputConnections: Record<string, string[]> = {};
    const outputConnections: Record<string, string[]> = {};
    
    definition.inputs.forEach(input => {
      inputConnections[input.id] = [];
    });
    
    definition.outputs.forEach(output => {
      outputConnections[output.id] = [];
    });
    
    // Create block instance
    const instance: BlockInstance = {
      id: instanceId,
      definitionId: blockId,
      position: { ...options.position },
      parameters,
      connections: {
        inputs: inputConnections,
        outputs: outputConnections,
      },
      meta: {
        status: 'valid',
        errors: [],
        warnings: [],
        ...options.meta
      },
    };

    this.log(`[NewBlockFactory] Created instance: ${instanceId} of type ${blockId}`);
    return instance;
  }

  /**
   * Get factory statistics
   */
  getStats(): {
    totalBlocks: number;
    categories: string[];
    loaderStats: any;
    isInitialized: boolean;
  } {
    return {
      totalBlocks: this.availableBlocks.size,
      categories: this.loader.getCategories(),
      loaderStats: this.loader.getStats(),
      isInitialized: this.isInitialized
    };
  }

  /**
   * Refresh all blocks (reload from files)
   */
  async refresh(): Promise<void> {
    this.log('[NewBlockFactory] Refreshing all blocks...');
    
    this.isInitialized = false;
    this.availableBlocks.clear();
    
    // Force reload from loader
    await this.loader.forceReload();
    await this.initialize();
    
    this.log('[NewBlockFactory] Refresh completed');
  }

  /**
   * Search blocks by name, description, or category
   */
  async searchBlocks(query: string): Promise<BlockDefinition[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const lowerQuery = query.toLowerCase();
    const allBlocks = Array.from(this.availableBlocks.values());
    
    return allBlocks.filter(block => 
      block.name.toLowerCase().includes(lowerQuery) ||
      block.description.toLowerCase().includes(lowerQuery) ||
      block.category.toLowerCase().includes(lowerQuery) ||
      block.id.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Validate block definition structure
   */
  validateDefinition(definition: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!definition) {
      errors.push('Definition is null or undefined');
      return { isValid: false, errors };
    }
    
    // Required fields
    if (!definition.id) errors.push('Missing required field: id');
    if (!definition.name) errors.push('Missing required field: name');
    if (!definition.category) errors.push('Missing required field: category');
    
    // Array fields
    if (!Array.isArray(definition.inputs)) errors.push('inputs must be an array');
    if (!Array.isArray(definition.outputs)) errors.push('outputs must be an array');
    if (!Array.isArray(definition.parameters)) errors.push('parameters must be an array');
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get system information
   */
  getSystemInfo(): {
    factoryVersion: string;
    loaderType: string;
    blocksLoaded: number;
    categoriesAvailable: number;
    cacheEnabled: boolean;
  } {
    return {
      factoryVersion: '2.0.0-clean',
      loaderType: 'RealBlockLoader',
      blocksLoaded: this.availableBlocks.size,
      categoriesAvailable: this.loader.getCategories().length,
      cacheEnabled: this.config.enableCaching
    };
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

// Export convenience functions
export async function createBlockFactory(config?: Partial<BlockFactoryConfig>): Promise<BlockFactory> {
  const factory = BlockFactory.getInstance(config);
  if (factory.getStats().isInitialized === false) {
    await factory.initialize();
  }
  return factory;
}

export function getBlockFactory(): BlockFactory {
  return BlockFactory.getInstance();
}
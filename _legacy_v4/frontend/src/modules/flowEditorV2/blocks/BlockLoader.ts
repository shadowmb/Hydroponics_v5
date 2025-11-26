/**
 * 📦 Real Block Loader
 * ✅ Сканира и зарежда реални .block.ts файлове
 * Замества старите хибридни loader компоненти
 */

import type { BlockDefinition } from '../types/BlockConcept';

// Block file module interface (what we expect from .block.ts files)
export interface BlockFileModule {
  default: BlockDefinition;
  version?: string;
  deprecated?: boolean;
  replacedBy?: string;
}

// Load statistics for debugging and monitoring
export interface LoaderStats {
  totalScanned: number;
  successfullyLoaded: number;
  failedToLoad: number;
  categories: string[];
  loadErrors: Array<{ file: string; error: string }>;
}

// Loader configuration
export interface LoaderConfig {
  baseDirectory: string;
  enableCaching: boolean;
  enableLogging: boolean;
}

// Default configuration
const DEFAULT_CONFIG: LoaderConfig = {
  baseDirectory: '/blocks',
  enableCaching: true,
  enableLogging: false
};

/**
 * Real Block Loader - сканира и зарежда реални .block.ts файлове
 */
export class RealBlockLoader {
  private static instance: RealBlockLoader;
  private config: LoaderConfig;
  private loadedBlocks: Map<string, BlockDefinition> = new Map();
  private loadedCategories: Set<string> = new Set();
  private stats: LoaderStats;
  private isInitialized = false;

  private constructor(config: Partial<LoaderConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.stats = {
      totalScanned: 0,
      successfullyLoaded: 0,
      failedToLoad: 0,
      categories: [],
      loadErrors: []
    };
  }

  /**
   * Singleton pattern
   */
  static getInstance(config?: Partial<LoaderConfig>): RealBlockLoader {
    if (!RealBlockLoader.instance) {
      RealBlockLoader.instance = new RealBlockLoader(config);
    }
    return RealBlockLoader.instance;
  }

  /**
   * Сканира и зарежда всички .block.ts файлове
   */
  async scanAndLoad(): Promise<Map<string, BlockDefinition>> {
    if (this.isInitialized && this.config.enableCaching) {
      this.log('[RealBlockLoader] Returning cached blocks');
      return new Map(this.loadedBlocks);
    }

    this.log('[RealBlockLoader] Starting scan and load process...');

    try {
      // Reset stats
      this.resetStats();

      // Get all .block.ts module loaders
      const blockModuleLoaders = await this.getBlockModuleLoaders();
      this.stats.totalScanned = Object.keys(blockModuleLoaders).length;

      // Load and process each module
      for (const [filePath, loader] of Object.entries(blockModuleLoaders)) {
        await this.loadAndProcessModule(filePath, loader);
      }

      // Update categories
      this.updateCategories();

      this.isInitialized = true;
      this.log(`[RealBlockLoader] Loaded ${this.stats.successfullyLoaded}/${this.stats.totalScanned} blocks successfully`);

      return new Map(this.loadedBlocks);
    } catch (error) {
      console.error('[RealBlockLoader] Failed to scan and load blocks:', error);
      throw error;
    }
  }

  /**
   * Получава всички .block.ts module loaders
   */
  private async getBlockModuleLoaders(): Promise<Record<string, () => Promise<BlockFileModule>>> {
    try {
      // import.meta.glob връща обект от функции които правят dynamic import
      // В dev mode и production mode работи еднакво
      const blockModuleLoaders = (import.meta as any).glob('./**/*.block.ts');

      this.log(`[RealBlockLoader] Found ${Object.keys(blockModuleLoaders).length} module loaders`);

      return blockModuleLoaders as Record<string, () => Promise<BlockFileModule>>;
    } catch (error) {
      console.error('[RealBlockLoader] Failed to get block module loaders:', error);
      return {};
    }
  }

  /**
   * Зарежда и обработва един модул
   */
  private async loadAndProcessModule(filePath: string, loader: () => Promise<BlockFileModule>): Promise<void> {
    try {
      this.log(`[RealBlockLoader] Loading: ${filePath}`);

      // Извикваме loader функцията за да заредим модула
      const module = await loader();

      if (!module.default) {
        this.addLoadError(filePath, 'Missing default export');
        return;
      }

      const blockDefinition = module.default;

      // Валидация на блока
      if (!this.validateBlockDefinition(blockDefinition)) {
        this.addLoadError(filePath, 'Invalid block definition structure');
        return;
      }

      // Успешно зареждане
      this.loadedBlocks.set(blockDefinition.id, blockDefinition);
      this.loadedCategories.add(blockDefinition.category);
      this.stats.successfullyLoaded++;

      this.log(`[RealBlockLoader] Successfully loaded: ${blockDefinition.id} (${blockDefinition.name})`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.addLoadError(filePath, errorMessage);
      this.log(`[RealBlockLoader] Failed to load ${filePath}: ${errorMessage}`);
    }
  }

  /**
   * Валидира структурата на блок дефиниция
   */
  private validateBlockDefinition(definition: any): definition is BlockDefinition {
    return (
      typeof definition === 'object' &&
      typeof definition.id === 'string' &&
      typeof definition.name === 'string' &&
      typeof definition.category === 'string' &&
      Array.isArray(definition.inputs) &&
      Array.isArray(definition.outputs) &&
      Array.isArray(definition.parameters)
    );
  }

  /**
   * Получава всички заредени блокове
   */
  getAllBlocks(): Map<string, BlockDefinition> {
    return new Map(this.loadedBlocks);
  }

  /**
   * Получава блок по ID
   */
  getBlock(blockId: string): BlockDefinition | undefined {
    return this.loadedBlocks.get(blockId);
  }

  /**
   * Получава всички категории
   */
  getCategories(): string[] {
    return Array.from(this.loadedCategories).sort();
  }

  /**
   * Получава блокове по категория
   */
  getBlocksByCategory(category: string): BlockDefinition[] {
    return Array.from(this.loadedBlocks.values())
      .filter(block => block.category === category);
  }

  /**
   * Проверява дали има блок с даден ID
   */
  hasBlock(blockId: string): boolean {
    return this.loadedBlocks.has(blockId);
  }

  /**
   * Получава статистики за зареждането
   */
  getStats(): LoaderStats {
    return {
      ...this.stats,
      categories: this.getCategories()
    };
  }

  /**
   * Принудително презареждане (изчиства кеша)
   */
  async forceReload(): Promise<Map<string, BlockDefinition>> {
    this.log('[RealBlockLoader] Force reloading all blocks...');
    this.isInitialized = false;
    this.loadedBlocks.clear();
    this.loadedCategories.clear();
    return await this.scanAndLoad();
  }

  /**
   * Изчиства статистиките
   */
  private resetStats(): void {
    this.stats = {
      totalScanned: 0,
      successfullyLoaded: 0,
      failedToLoad: 0,
      categories: [],
      loadErrors: []
    };
  }

  /**
   * Добавя грешка при зареждане
   */
  private addLoadError(fileName: string, error: string): void {
    this.stats.failedToLoad++;
    this.stats.loadErrors.push({ file: fileName, error });
  }

  /**
   * Обновява списъка с категории
   */
  private updateCategories(): void {
    this.stats.categories = this.getCategories();
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
export async function createRealBlockLoader(config?: Partial<LoaderConfig>): Promise<RealBlockLoader> {
  const loader = RealBlockLoader.getInstance(config);
  await loader.scanAndLoad();
  return loader;
}

export function getRealBlockLoader(): RealBlockLoader {
  return RealBlockLoader.getInstance();
}
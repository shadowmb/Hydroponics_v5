/**
 * 📦 FlowEditor v3 - Flow Exporter
 * ✅ Част от основната редакторна система
 * JSON export/import за флоу дефиниции
 * Последна проверка: 2025-01-26
 */

import type { FlowDefinition, FlowMeta } from './FlowDefinition';
import { FlowValidator } from './FlowValidator';
import { BlockFactory } from '../../blocks/BlockFactory';
import { getBlockDefinition, getBlockSchema } from '../../ui/adapters/BlockFactoryAdapter';

// Export/Import result types
export interface ExportResult {
  success: boolean;
  data?: string;
  error?: string;
  warnings?: string[];
}

export interface ImportResult {
  success: boolean;
  flow?: FlowDefinition;
  error?: string;
  warnings?: string[];
  validationResult?: any;
}

// Export format metadata
export interface FlowExportMeta extends FlowMeta {
  exportedAt: string;
  exportedBy: string;
  flowEditorVersion: string;
  formatVersion: string;
}

// Current export format version
const CURRENT_EXPORT_VERSION = '3.0.0';
const FLOW_EDITOR_VERSION = '3.0.0';

// FlowExporter class
export class FlowExporter {
  /**
   * Експортира flow като JSON string
   */
  static exportFlow(
    flow: FlowDefinition,
    options: {
      pretty?: boolean;
      includeValidation?: boolean;
      exportedBy?: string;
      isMonitoring?: boolean;
      monitoringInterval?: number;
    } = {}
  ): ExportResult {
    try {
      const warnings: string[] = [];

      // Валидираме flow преди export
      let validationSummary = undefined;
      console.log('[FlowExporter] options.includeValidation:', options.includeValidation);
      if (options.includeValidation === true) {
        console.log('[FlowExporter] Starting validation...');
        const validationResult = FlowValidator.validateFlow(flow);

        // Добавяме validation summary
        validationSummary = {
          isValid: validationResult.isValid,
          lastValidatedAt: new Date().toISOString(),
          criticalErrors: validationResult.errors.length,
          warnings: validationResult.warnings.length,
          canExecute: validationResult.isValid
        };

        if (!validationResult.isValid) {
          warnings.push(`Flow има ${validationResult.errors.length} критични грешки`);
        }
        if (validationResult.warnings.length > 0) {
          warnings.push(`Flow има ${validationResult.warnings.length} предупреждения`);
        }
      }

      // Transform IF/LOOP blocks from old format to new format
      const transformedBlocks = this.transformIfLoopBlocks(flow.blocks);

      // Създаваме export обект с enhanced метаданни
      const exportData = {
        ...flow,
        blocks: transformedBlocks,
        meta: {
          ...flow.meta,
          exportedAt: new Date().toISOString(),
          exportedBy: options.exportedBy || 'FlowEditor v3',
          flowEditorVersion: FLOW_EDITOR_VERSION,
          formatVersion: CURRENT_EXPORT_VERSION,
          // 📊 Monitoring metadata
          isMonitoring: options.isMonitoring || false,
          monitoringInterval: options.monitoringInterval || 5,
        } as FlowExportMeta & { isMonitoring?: boolean; monitoringInterval?: number },

        // Добавяме export статистики
        exportStats: {
          totalBlocks: transformedBlocks.length,
          totalConnections: flow.connections.length,
          blockTypes: this.getBlockTypeStats(flow),
          categories: this.getCategoryStats(flow),
        },

        // Добавяме validation summary ако е заявена валидация
        ...(validationSummary && { validationSummary }),
      };

      // Проверяваме за deprecated блокове
      const deprecatedBlocks = this.findDeprecatedBlocks(flow);
      if (deprecatedBlocks.length > 0) {
        warnings.push(`Flow съдържа ${deprecatedBlocks.length} остарели блокове`);
        exportData.exportStats = {
          ...exportData.exportStats,
          deprecatedBlocks,
        };
      }

      // Serialize to JSON
      const jsonString = options.pretty 
        ? JSON.stringify(exportData, null, 2)
        : JSON.stringify(exportData);

      return {
        success: true,
        data: jsonString,
        warnings: warnings.length > 0 ? warnings : undefined,
      };

    } catch (error) {
      return {
        success: false,
        error: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Импортира flow от JSON string
   */
  static importFlow(
    jsonString: string,
    options: {
      validateAfterImport?: boolean;
      updateTimestamps?: boolean;
      preserveIds?: boolean;
    } = {}
  ): ImportResult {
    try {
      const warnings: string[] = [];

      // Parse JSON
      let data: any;
      try {
        data = JSON.parse(jsonString);
      } catch (parseError) {
        return {
          success: false,
          error: `Invalid JSON format: ${parseError instanceof Error ? parseError.message : 'Parse failed'}`,
        };
      }

      // Основни проверки на структурата
      if (!data || typeof data !== 'object') {
        return {
          success: false,
          error: 'Invalid flow data structure',
        };
      }

      if (!data.blocks || !Array.isArray(data.blocks)) {
        return {
          success: false,
          error: 'Missing or invalid blocks array',
        };
      }

      if (!data.connections || !Array.isArray(data.connections)) {
        return {
          success: false,
          error: 'Missing or invalid connections array',
        };
      }

      // Проверка на format версията
      const formatVersion = data.meta?.formatVersion;
      if (formatVersion && formatVersion !== CURRENT_EXPORT_VERSION) {
        if (this.isVersionCompatible(formatVersion)) {
          warnings.push(`Flow е от по-стара версия: ${formatVersion}`);
        } else {
          return {
            success: false,
            error: `Incompatible format version: ${formatVersion}. Current version: ${CURRENT_EXPORT_VERSION}`,
          };
        }
      }

      // Проверяваме дали всички block definitions съществуват
      const missingDefinitions = this.findMissingBlockDefinitions(data.blocks);
      if (missingDefinitions.length > 0) {
        warnings.push(`${missingDefinitions.length} block definitions липсват: ${missingDefinitions.join(', ')}`);
      }

      // Създаваме flow обект
      const flow: FlowDefinition = {
        id: data.id || `imported_flow_${Date.now()}`,
        meta: {
          version: data.meta?.version || CURRENT_EXPORT_VERSION,
          createdAt: data.meta?.createdAt || new Date().toISOString(),
          modifiedAt: options.updateTimestamps ? new Date().toISOString() : data.meta?.modifiedAt || new Date().toISOString(),
          name: data.meta?.name || 'Импортиран Flow',
          description: data.meta?.description,
          programId: data.meta?.programId,
          author: data.meta?.author,
        },
        blocks: options.preserveIds ? data.blocks : this.regenerateBlockIds(data.blocks),
        connections: options.preserveIds ? data.connections : this.regenerateConnectionIds(data.connections, data.blocks),
        globals: data.globals,
        startBlockId: data.startBlockId,
        canvas: data.canvas || {
          zoom: 1,
          pan: { x: 0, y: 0 },
          grid: { enabled: true, size: 20 },
        },
      };

      // Валидация след import
      // TODO: IMPLEMENT_LATER - Валидацията се прави в FlowEditor при зареждане
      // let validationResult;
      // if (options.validateAfterImport !== false) {
      //   validationResult = FlowValidator.validateFlow(flow);
      //   
      //   if (!validationResult.isValid) {
      //     warnings.push(`Импортираният flow има ${validationResult.errors.length} грешки при валидация`);
      //   }
      //   
      //   if (validationResult.warnings.length > 0) {
      //     warnings.push(`Импортираният flow има ${validationResult.warnings.length} предупреждения`);
      //   }
      // }

      return {
        success: true,
        flow,
        warnings: warnings.length > 0 ? warnings : undefined,
        // validationResult, // TODO: IMPLEMENT_LATER - Валидацията се прави в FlowEditor
      };

    } catch (error) {
      return {
        success: false,
        error: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Експортира flow за споделяне (compact format)
   */
  static exportForSharing(flow: FlowDefinition): ExportResult {
    return this.exportFlow(flow, {
      pretty: false,
      includeValidation: false, // TODO: IMPLEMENT_LATER - Валидацията се прави в FlowEditor
      exportedBy: 'FlowEditor v3 Share',
    });
  }

  /**
   * Експортира flow за debug (pretty format с много детайли)
   */
  static exportForDebug(flow: FlowDefinition): ExportResult {
    // TODO: IMPLEMENT_LATER - Валидацията се прави в FlowEditor
    // const validationResult = FlowValidator.validateFlow(flow);
    
    const debugData = {
      flow,
      // validation: validationResult, // TODO: IMPLEMENT_LATER - Коментирано заедно с валидацията
      schemaInfo: this.getSchemaInfo(flow),
      exportedAt: new Date().toISOString(),
      exportType: 'debug',
    };

    try {
      return {
        success: true,
        data: JSON.stringify(debugData, null, 2),
      };
    } catch (error) {
      return {
        success: false,
        error: `Debug export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Създава backup на flow
   */
  static createBackup(flow: FlowDefinition): ExportResult {
    return this.exportFlow(flow, {
      pretty: true,
      includeValidation: false, // TODO: IMPLEMENT_LATER - Валидацията се прави в FlowEditor
      exportedBy: 'FlowEditor v3 Backup',
    });
  }

  /**
   * Експортира flow за запис в backend (пълен формат)
   */
  static exportForSave(
    flow: FlowDefinition, 
    monitoringOptions?: { isMonitoring?: boolean; monitoringInterval?: number }
  ): ExportResult {
    return this.exportFlow(flow, {
      pretty: true,
      includeValidation: false,
      exportedBy: 'FlowExporter Backend Save',
      ...monitoringOptions,
    });
  }

  // Private helper methods

  /**
   * Transform IF/LOOP blocks from old format to new format
   */
  static transformIfLoopBlocks(blocks: any[]): any[] {
    return blocks.map(block => {
      if ((block.definitionId === 'if' || block.definitionId === 'loop') && block.parameters) {
        const params = block.parameters;

        // Check if old format exists (conditionOperator) and new format doesn't exist
        if (params.conditionOperator && !params.conditions) {
          return {
            ...block,
            parameters: {
              ...params,
              conditions: [
                {
                  condition: params.conditionOperator,
                  dataType: params.dataType || 'number'
                }
              ],
              // Remove old fields
              conditionOperator: undefined,
              dataType: undefined
            }
          };
        }
      }
      return block;
    });
  }

  /**
   * Получава статистики за block типовете
   */
  private static getBlockTypeStats(flow: FlowDefinition): Record<string, number> {
    const stats: Record<string, number> = {};
    
    flow.blocks.forEach(block => {
      const definition = getBlockDefinition(block.definitionId);
      const type = definition?.type || 'unknown';
      stats[type] = (stats[type] || 0) + 1;
    });
    
    return stats;
  }

  /**
   * Получава статистики за категориите
   */
  private static getCategoryStats(flow: FlowDefinition): Record<string, number> {
    const stats: Record<string, number> = {};
    
    flow.blocks.forEach(block => {
      const definition = getBlockDefinition(block.definitionId);
      const category = definition?.category || 'unknown';
      stats[category] = (stats[category] || 0) + 1;
    });
    
    return stats;
  }

  /**
   * Намира deprecated блокове
   */
  private static findDeprecatedBlocks(flow: FlowDefinition): string[] {
    const deprecated: string[] = [];
    
    flow.blocks.forEach(block => {
      const schema = getBlockSchema(block.definitionId);
      if (schema?.deprecated) {
        deprecated.push(block.definitionId);
      }
    });
    
    return [...new Set(deprecated)]; // Remove duplicates
  }

  /**
   * Проверява дали версията е съвместима
   */
  private static isVersionCompatible(version: string): boolean {
    const [currentMajor, currentMinor] = CURRENT_EXPORT_VERSION.split('.').map(Number);
    const [importMajor, importMinor] = version.split('.').map(Number);
    
    // Съвместими са версии със същия major number
    return importMajor === currentMajor;
  }

  /**
   * Намира липсващи block definitions
   */
  private static findMissingBlockDefinitions(blocks: any[]): string[] {
    const missing: string[] = [];
    const checked = new Set<string>();
    
    blocks.forEach(block => {
      if (checked.has(block.definitionId)) return;
      checked.add(block.definitionId);
      
      const definition = getBlockDefinition(block.definitionId);
      if (!definition) {
        missing.push(block.definitionId);
      }
    });
    
    return missing;
  }

  /**
   * Генерира нови block IDs
   */
  private static regenerateBlockIds(blocks: any[]): any[] {
    const idMapping = new Map<string, string>();
    
    return blocks.map((block, index) => {
      const newId = `block_${Date.now()}_${index + 1}`;
      idMapping.set(block.id, newId);
      
      return {
        ...block,
        id: newId,
      };
    });
  }

  /**
   * Генерира нови connection IDs и обновява block references
   */
  private static regenerateConnectionIds(connections: any[], blocks: any[]): any[] {
    // Създаваме mapping на старите към новите block IDs
    const blockIdMapping = new Map<string, string>();
    blocks.forEach((block, index) => {
      const newId = `block_${Date.now()}_${index + 1}`;
      blockIdMapping.set(block.id, newId);
    });
    
    return connections.map((connection, index) => ({
      ...connection,
      id: `conn_${Date.now()}_${index + 1}`,
      sourceBlockId: blockIdMapping.get(connection.sourceBlockId) || connection.sourceBlockId,
      targetBlockId: blockIdMapping.get(connection.targetBlockId) || connection.targetBlockId,
    }));
  }

  /**
   * Получава schema информация за debug
   */
  private static getSchemaInfo(flow: FlowDefinition): any {
    const schemaInfo: any = {};
    
    flow.blocks.forEach(block => {
      if (schemaInfo[block.definitionId]) return;
      
      const schema = getBlockSchema(block.definitionId);
      const definition = getBlockDefinition(block.definitionId);
      
      schemaInfo[block.definitionId] = {
        exists: !!definition,
        version: schema?.version,
        deprecated: schema?.deprecated,
        replacedBy: schema?.replacedBy,
        category: definition?.category,
        inputCount: definition?.inputs.length || 0,
        outputCount: definition?.outputs.length || 0,
        paramCount: definition?.parameters.length || 0,
      };
    });
    
    return schemaInfo;
  }

  /**
   * Проверява дали JSON string е валиден flow export
   */
  static isValidFlowExport(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      return data && 
             typeof data === 'object' &&
             Array.isArray(data.blocks) &&
             Array.isArray(data.connections) &&
             data.meta &&
             typeof data.meta === 'object';
    } catch {
      return false;
    }
  }

  /**
   * Получава metadata от export без пълно парсиране
   */
  static getExportMetadata(jsonString: string): FlowExportMeta | null {
    try {
      const data = JSON.parse(jsonString);
      return data.meta || null;
    } catch {
      return null;
    }
  }
}

// Helper functions for export
export function exportFlow(flow: FlowDefinition, pretty = true): ExportResult {
  return FlowExporter.exportFlow(flow, { pretty });
}

export function importFlow(jsonString: string): ImportResult {
  return FlowExporter.importFlow(jsonString);
}

export function exportForSharing(flow: FlowDefinition): ExportResult {
  return FlowExporter.exportForSharing(flow);
}

export function createBackup(flow: FlowDefinition): ExportResult {
  return FlowExporter.createBackup(flow);
}

export function exportForSave(
  flow: FlowDefinition, 
  monitoringOptions?: { isMonitoring?: boolean; monitoringInterval?: number }
): ExportResult {
  return FlowExporter.exportForSave(flow, monitoringOptions);
}

export function isValidFlowExport(jsonString: string): boolean {
  return FlowExporter.isValidFlowExport(jsonString);
}
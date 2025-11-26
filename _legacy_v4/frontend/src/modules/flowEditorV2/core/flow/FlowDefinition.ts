/**
 * 📦 FlowEditor v3 - Flow Definition
 * ✅ Част от основната редакторна система
 * Основна дефиниция на flow с блокове и връзки
 * Последна проверка: 2025-01-26
 */

import type { BlockInstance, BlockConnection } from '../../types/BlockConcept';

// Flow метаданни
export interface FlowMeta {
  version: string;                 // Format version (e.g., "3.0.0") - schema version
  createdAt: string;
  modifiedAt: string;
  name?: string;
  description?: string;
  programId?: string;
  author?: string;
  
  // 🆕 Flow versioning fields - for flow content versioning
  flowId?: string;                // Unique flow identifier (e.g., "flow_mixing_process")
  flowVersion?: string;           // Semantic version of flow content (e.g., "1.2.3")
  versionId?: string;             // Full version ID (e.g., "flow_mixing_process_v1_2_3")  
  templateId?: string;            // ActionTemplate ID if created from template
  linkedFlowId?: string;          // Reference to parent flow ID for template flows
  
  // Export metadata
  exportType?: 'main' | 'container' | 'template';
  exportedAt?: string;
  exportedBy?: string;
  flowEditorVersion?: string;     // FlowEditor version used to create/modify
  formatVersion?: string;         // JSON format version
}

// Глобални променливи в flow-то
export interface FlowGlobals {
  [key: string]: {
    type: 'string' | 'number' | 'boolean';
    value: any;
    description?: string;
  };
}

// Canvas настройки
export interface CanvasSettings {
  zoom: number;
  pan: {
    x: number;
    y: number;
  };
  grid: {
    enabled: boolean;
    size: number;
  };
}

// Основна Flow дефиниция
export interface FlowDefinition {
  id: string;
  meta: FlowMeta;
  
  // Основно съдържание
  blocks: BlockInstance[];
  connections: BlockConnection[];
  
  // Опционални елементи
  globals?: FlowGlobals;
  startBlockId?: string;
  
  // UI настройки
  canvas?: CanvasSettings;
  
  // Validation status
  status?: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    lastValidated?: string;
  };
}

// Помощни типове за създаване на нов flow
export interface CreateFlowOptions {
  name?: string;
  description?: string;
  programId?: string;
}

// Default настройки за нов flow
export const DEFAULT_FLOW_META: Omit<FlowMeta, 'createdAt' | 'modifiedAt'> = {
  version: '3.0.0',
  name: 'Нов Flow',
};

export const DEFAULT_CANVAS_SETTINGS: CanvasSettings = {
  zoom: 1,
  pan: { x: 0, y: 0 },
  grid: {
    enabled: true,
    size: 20,
  },
};
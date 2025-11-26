/**
 * 📦 FlowEditor v3 - Flow Definition Types
 * ✅ Част от основната редакторна система
 * Общи типове за flow дефиниция + Container support
 * Последна проверка: 2025-07-30
 */
import { FlowBlock } from './FlowBlock';
import type { ContainerMetadata } from './ContainerTypes';
import type { NavigationMode } from './ContainerNavigation';

export interface FlowDefinition {
  version: string; // Версия на формата
  meta: {
    createdAt: string;
    modifiedAt: string;
    programId?: string;
    name?: string;
    description?: string;
    author?: string;
  };
  blocks: FlowBlock[];
  startBlock?: string; // ID на първия блок за изпълнение
  globals?: Record<string, any>; // Глобални променливи
  
  // 🆕 Container support
  containers?: ContainerMetadata[]; // Container metadata
  containerMode?: {
    currentContainer?: string;
    navigationStack: string[];
    currentMode: NavigationMode;
  };
}

// Резултат от валидация
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  blockId: string;
  field?: string;
  message: string;
  type: 'missing_param' | 'invalid_value' | 'broken_connection' | 'circular_reference';
}

export interface ValidationWarning {
  blockId: string;
  field?: string;
  message: string;
  type: 'unused_output' | 'performance' | 'best_practice';
}

// Позиция за визуализация
export interface BlockPosition {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

// Връзка между блокове за визуализация
export interface BlockConnection {
  fromBlockId: string;
  toBlockId: string;
  fromOutput?: string; // За блокове с множество изходи
  toInput?: string;
  meta?: {
    color?: string;
    style?: 'solid' | 'dashed' | 'dotted';
  };
}
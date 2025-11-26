/**
 * 📦 Container Blocks - Type Definitions
 * ✅ Прости типове за Container Blocks система
 * Последна проверка: 2025-07-30
 */

import type { Position } from './BlockConcept'

// Основен container metadata интерфейс
export interface ContainerMetadata {
  id: string
  name: string
  type: 'container'
  startBlockId: string
  endBlockId: string
  containedBlocks: string[]
  position: Position
  status: ContainerStatus
}

// Container статус types
export type ContainerStatus = 'valid' | 'error' | 'warning'

// Container creation options
export interface CreateContainerOptions {
  name: string
  selectedBlocks?: string[]
  position?: Position
  id?: string // Опционално ID - ако не е подадено се генерира автоматично
}

// Container template за export/import
export interface ContainerTemplate {
  id: string
  name: string
  description?: string
  version: string
  createdAt: string
  blocks: any[] // Blocks в контейнера
  connections: any[] // Connections в контейнера
  meta: {
    author?: string
    category?: string
    tags?: string[]
  }
}

// Container validation result
export interface ContainerValidationResult {
  isValid: boolean
  errors: ContainerError[]
  warnings: ContainerWarning[]
}

export interface ContainerError {
  containerId: string
  blockId?: string
  message: string
  type: 'missing_start' | 'missing_end' | 'broken_connection' | 'invalid_block'
}

export interface ContainerWarning {
  containerId: string
  blockId?: string
  message: string
  type: 'unused_port' | 'performance' | 'best_practice'
}

// Container export/import types
export interface ContainerExportData {
  template: ContainerTemplate
  exportedAt: string
  exportedBy?: string
  formatVersion: string
}

export interface ContainerImportResult {
  success: boolean
  template?: ContainerTemplate
  error?: string
  warnings?: string[]
}
/**
 * 📦 Container Manager - Core CRUD Operations
 * ✅ Прост manager за container операции
 * Последна проверка: 2025-07-30
 */

import type { 
  ContainerMetadata, 
  CreateContainerOptions,
  ContainerStatus 
} from '../../types/ContainerTypes'
import type { BlockInstance } from '../../types/BlockConcept'
import { generateId } from '../../utils/IdGenerator'

export class ContainerManager {
  private static instance: ContainerManager | null = null
  private containers: Map<string, ContainerMetadata> = new Map()
  private listeners: Array<(containers: ContainerMetadata[]) => void> = []

  private constructor() {
    // Private constructor за singleton pattern
  }

  /**
   * Singleton pattern - получава единствената инстанция
   */
  static getInstance(): ContainerManager {
    if (!ContainerManager.instance) {
      ContainerManager.instance = new ContainerManager()
    }
    return ContainerManager.instance
  }

  /**
   * Създава нов контейнер от селектирани блокове
   */
  createContainer(options: CreateContainerOptions): ContainerMetadata {
    const containerId = options.id || generateId('container')
    const startBlockId = generateId('start')
    const endBlockId = generateId('end')

    const container: ContainerMetadata = {
      id: containerId,
      name: options.name || 'Нов Контейнер',
      type: 'container',
      startBlockId,
      endBlockId,
      containedBlocks: options.selectedBlocks || [],
      position: options.position || { x: 100, y: 100 },
      status: 'valid'
    }

    this.containers.set(containerId, container)
    this.notifyListeners()
    
    return container
  }

  /**
   * Създава системни START/END блокове за контейнер
   */
  createContainerSystemBlocks(containerId: string): { startBlock: BlockInstance, endBlock: BlockInstance } {
    const container = this.containers.get(containerId)
    if (!container) {
      throw new Error(`Container ${containerId} not found`)
    }

    const startBlock: BlockInstance = {
      id: container.startBlockId,
      definitionId: 'system.start',
      position: { x: 100, y: 100 },
      parameters: {},
      connections: {
        inputs: {},
        outputs: { flowOut: [] }
      },
      meta: {
        status: 'valid',
        errors: [],
        warnings: [],
        system: true
      },
      containerId,
      containerSystem: true // Маркира като системен блок на контейнер
    }

    const endBlock: BlockInstance = {
      id: container.endBlockId,
      definitionId: 'system.end',
      position: { x: 600, y: 500 },
      parameters: {},
      connections: {
        inputs: { flowIn: [] },
        outputs: {}
      },
      meta: {
        status: 'valid',
        errors: [],
        warnings: [],
        system: true
      },
      containerId,
      containerSystem: true // Маркира като системен блок на контейнер
    }

    console.log(`🏗️ Created system blocks for container ${containerId}:`, {
      startBlockId: startBlock.id,
      endBlockId: endBlock.id
    })

    return { startBlock, endBlock }
  }

  /**
   * Получава контейнер по ID
   */
  getContainer(id: string): ContainerMetadata | undefined {
    return this.containers.get(id)
  }

  /**
   * Получава всички контейнери
   */
  getAllContainers(): ContainerMetadata[] {
    return Array.from(this.containers.values())
  }

  /**
   * Актуализира контейнер
   */
  updateContainer(id: string, updates: Partial<ContainerMetadata>): boolean {
    const container = this.containers.get(id)
    if (!container) return false

    const updated = { ...container, ...updates, id } // Запази ID
    this.containers.set(id, updated)
    this.notifyListeners()
    
    return true
  }

  /**
   * Изтрива контейнер
   */
  deleteContainer(id: string): boolean {
    const deleted = this.containers.delete(id)
    if (deleted) {
      this.notifyListeners()
    }
    return deleted
  }

  /**
   * Проверява дали блок е в контейнер
   */
  getContainerForBlock(blockId: string): ContainerMetadata | undefined {
    for (const container of this.containers.values()) {
      if (container.containedBlocks.includes(blockId)) {
        return container
      }
    }
    return undefined
  }

  /**
   * Добавя блок към контейнер
   */
  addBlockToContainer(containerId: string, blockId: string): boolean {
    const container = this.containers.get(containerId)
    if (!container) return false

    if (!container.containedBlocks.includes(blockId)) {
      container.containedBlocks.push(blockId)
      this.notifyListeners()
    }
    
    return true
  }

  /**
   * Премахва блок от контейнер
   */
  removeBlockFromContainer(containerId: string, blockId: string): boolean {
    const container = this.containers.get(containerId)
    if (!container) return false

    const index = container.containedBlocks.indexOf(blockId)
    if (index > -1) {
      container.containedBlocks.splice(index, 1)
      this.notifyListeners()
      return true
    }
    
    return false
  }

  /**
   * Актуализира статуса на контейнер
   */
  updateContainerStatus(id: string, status: ContainerStatus): boolean {
    return this.updateContainer(id, { status })
  }

  /**
   * Проверява дали контейнер е празен
   */
  isContainerEmpty(id: string): boolean {
    const container = this.containers.get(id)
    return !container || container.containedBlocks.length === 0
  }

  /**
   * Брой блокове в контейнер
   */
  getContainerBlockCount(id: string): number {
    const container = this.containers.get(id)
    return container ? container.containedBlocks.length : 0
  }

  /**
   * Подписване за промени
   */
  subscribe(listener: (containers: ContainerMetadata[]) => void): () => void {
    this.listeners.push(listener)
    
    // Връща unsubscribe функция
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * Известяване на listeners
   */
  private notifyListeners(): void {
    const containers = this.getAllContainers()
    this.listeners.forEach(listener => listener(containers))
  }

  /**
   * Изчистване на всички контейнери
   */
  clear(): void {
    this.containers.clear()
    this.notifyListeners()
  }

  /**
   * Получава статистики
   */
  getStats() {
    const containers = this.getAllContainers()
    return {
      total: containers.length,
      valid: containers.filter(c => c.status === 'valid').length,
      error: containers.filter(c => c.status === 'error').length,
      warning: containers.filter(c => c.status === 'warning').length,
      totalBlocks: containers.reduce((sum, c) => sum + c.containedBlocks.length, 0)
    }
  }
}

// Singleton instance - използвай ContainerManager.getInstance()
// export const containerManager = new ContainerManager() // Премахнато - използвай getInstance()
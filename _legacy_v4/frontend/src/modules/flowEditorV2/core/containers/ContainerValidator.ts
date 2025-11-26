/**
 * 📦 Container Validator - Validation Logic
 * ✅ Проста валидационна логика за контейнери
 * Последна проверка: 2025-07-30
 */

import type { 
  ContainerMetadata,
  ContainerValidationResult,
  ContainerError,
  ContainerWarning
} from '../../types/ContainerTypes'
import type { BlockInstance } from '../../types/BlockConcept'

export class ContainerValidator {
  
  /**
   * Валидира един контейнер
   */
  validateContainer(
    container: ContainerMetadata, 
    allBlocks: BlockInstance[]
  ): ContainerValidationResult {
    const errors: ContainerError[] = []
    const warnings: ContainerWarning[] = []

    // Проверка за Start block
    if (!this.hasStartBlock(container, allBlocks)) {
      errors.push({
        containerId: container.id,
        message: 'Container няма Start блок',
        type: 'missing_start'
      })
    }

    // Проверка за End block  
    if (!this.hasEndBlock(container, allBlocks)) {
      errors.push({
        containerId: container.id,
        message: 'Container няма End блок',
        type: 'missing_end'
      })
    }

    // Проверка за валидни блокове
    const invalidBlocks = this.getInvalidBlocks(container, allBlocks)
    invalidBlocks.forEach(blockId => {
      errors.push({
        containerId: container.id,
        blockId,
        message: `Блок ${blockId} не съществува`,
        type: 'invalid_block'
      })
    })

    // Проверка за празен контейнер
    if (container.containedBlocks.length === 0) {
      warnings.push({
        containerId: container.id,
        message: 'Container е празен',
        type: 'best_practice'
      })
    }

    // Проверка за много блокове (performance)
    if (container.containedBlocks.length > 20) {
      warnings.push({
        containerId: container.id,
        message: 'Container има много блокове (>20) - може да повлияе на производителността',
        type: 'performance'
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Валидира множество контейнери
   */
  validateContainers(
    containers: ContainerMetadata[],
    allBlocks: BlockInstance[]
  ): ContainerValidationResult {
    const allErrors: ContainerError[] = []
    const allWarnings: ContainerWarning[] = []

    // Валидация на всеки контейнер
    containers.forEach(container => {
      const result = this.validateContainer(container, allBlocks)
      allErrors.push(...result.errors)
      allWarnings.push(...result.warnings)
    })

    // Проверка за дублирани имена
    const duplicateNames = this.findDuplicateNames(containers)
    duplicateNames.forEach(name => {
      allWarnings.push({
        containerId: 'multiple',
        message: `Има няколко контейнера с име "${name}"`,
        type: 'best_practice'
      })
    })

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    }
  }

  /**
   * Проверява дали контейнер има Start block
   */
  private hasStartBlock(container: ContainerMetadata, allBlocks: BlockInstance[]): boolean {
    return allBlocks.some(block => 
      block.id === container.startBlockId && 
      block.meta?.isContainerMarker === true
    )
  }

  /**
   * Проверява дали контейнер има End block
   */
  private hasEndBlock(container: ContainerMetadata, allBlocks: BlockInstance[]): boolean {
    return allBlocks.some(block => 
      block.id === container.endBlockId && 
      block.meta?.isContainerMarker === true
    )
  }

  /**
   * Намира невалидни блокове в контейнера
   */
  private getInvalidBlocks(container: ContainerMetadata, allBlocks: BlockInstance[]): string[] {
    const existingBlockIds = new Set(allBlocks.map(b => b.id))
    
    return container.containedBlocks.filter(blockId => 
      !existingBlockIds.has(blockId)
    )
  }

  /**
   * Намира дублирани имена на контейнери
   */
  private findDuplicateNames(containers: ContainerMetadata[]): string[] {
    const nameCount = new Map<string, number>()
    
    containers.forEach(container => {
      const count = nameCount.get(container.name) || 0
      nameCount.set(container.name, count + 1)
    })

    return Array.from(nameCount.entries())
      .filter(([_, count]) => count > 1)
      .map(([name, _]) => name)
  }

  /**
   * Проверява дали блок може да бъде добавен към контейнер
   */
  canAddBlockToContainer(
    blockId: string,
    containerId: string,
    allBlocks: BlockInstance[],
    allContainers: ContainerMetadata[]
  ): { canAdd: boolean; reason?: string } {
    
    // Проверка дали блокът съществува
    const block = allBlocks.find(b => b.id === blockId)
    if (!block) {
      return { canAdd: false, reason: 'Блокът не съществува' }
    }

    // Проверка дали блокът вече е в друг контейнер
    const existingContainer = allContainers.find(c => 
      c.id !== containerId && c.containedBlocks.includes(blockId)
    )
    if (existingContainer) {
      return { 
        canAdd: false, 
        reason: `Блокът вече е в контейнер "${existingContainer.name}"` 
      }
    }

    // Проверка дали блокът е container marker
    if (block.meta?.isContainerMarker) {
      return { 
        canAdd: false, 
        reason: 'Container marker блоковете не могат да бъдат добавяни' 
      }
    }

    return { canAdd: true }
  }

  /**
   * Бърза проверка дали контейнер е валиден
   */
  isContainerValid(container: ContainerMetadata, allBlocks: BlockInstance[]): boolean {
    const result = this.validateContainer(container, allBlocks)
    return result.isValid
  }
}

// Singleton instance
export const containerValidator = new ContainerValidator()
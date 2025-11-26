/**
 * 📦 Container Storage - LocalStorage Wrapper  
 * ✅ Прост localStorage wrapper за containers
 * Последна проверка: 2025-07-30
 */

import type { ContainerMetadata } from '../types/ContainerTypes'
import type { FlowDefinition } from '../types/FlowDefinition'
import type { BlockInstance } from '../types/BlockConcept'

const STORAGE_KEY = 'hydroponics_containers'

export class ContainerStorage {

  /**
   * Запазва containers в localStorage
   */
  saveContainers(containers: ContainerMetadata[]): void {
    try {
      const data = JSON.stringify(containers)
      localStorage.setItem(STORAGE_KEY, data)
    } catch (error) {
      console.error('Грешка при запазване на контейнери:', error)
    }
  }

  /**
   * Зарежда containers от localStorage
   */
  loadContainers(): ContainerMetadata[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Грешка при зареждане на контейнери:', error)
      return []
    }
  }

  /**
   * Експортира цял поток като JSON
   */
  exportMainFlow(flowDefinition: FlowDefinition): string {
    const exportData = {
      ...flowDefinition,
      exportedAt: new Date().toISOString(),
      exportType: 'main_flow'
    }
    
    return JSON.stringify(exportData, null, 2)
  }

  /**
   * Експортира само текущия контейнер като поток
   */
  exportContainer(
    containerId: string, 
    containerBlocks: BlockInstance[],
    containerConnections: any[],
    containerName: string
  ): string {
    const exportData: FlowDefinition = {
      version: '4.0.0',
      meta: {
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        name: containerName,
        description: `Експортиран контейнер: ${containerName}`
      },
      blocks: containerBlocks,
      globals: {},
      // Не включваме containers - това е обикновен поток
    }

    const finalExport = {
      ...exportData,
      exportedAt: new Date().toISOString(),
      exportType: 'container_as_flow',
      originalContainerId: containerId
    }

    return JSON.stringify(finalExport, null, 2)
  }

  /**
   * Импортира поток от JSON string
   */
  importFlow(jsonString: string): { 
    success: boolean; 
    data?: FlowDefinition; 
    error?: string;
    exportType?: string;
  } {
    try {
      const parsed = JSON.parse(jsonString)
      
      // Проверка за основни полета
      if (!parsed.version || !parsed.meta || !parsed.blocks) {
        return {
          success: false,
          error: 'Невалиден формат на JSON файла'
        }
      }

      // Премахваме export metadata преди връщане
      const { exportedAt, exportType, originalContainerId, ...flowData } = parsed
      
      return {
        success: true,
        data: flowData as FlowDefinition,
        exportType: exportType || 'unknown'
      }
    } catch (error) {
      return {
        success: false,
        error: `Грешка при парсиране на JSON: ${error.message}`
      }
    }
  }

  /**
   * Създава download link за JSON файл
   */
  downloadJSON(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /**
   * Чете JSON файл от input element
   */
  readJSONFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (event) => {
        const content = event.target?.result as string
        resolve(content)
      }
      
      reader.onerror = () => {
        reject(new Error('Грешка при четене на файла'))
      }
      
      reader.readAsText(file)
    })
  }

  /**
   * Генерира име на файл за export
   */
  generateFilename(baseName: string, exportType: 'main' | 'container'): string {
    const timestamp = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    const type = exportType === 'main' ? 'flow' : 'container'
    const safeName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_')
    
    return `${safeName}_${type}_${timestamp}.json`
  }

  /**
   * Проверява дали localStorage е достъпен
   */
  isStorageAvailable(): boolean {
    try {
      const testKey = 'storage_test'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Изчистване на containers от localStorage
   */
  clearContainers(): void {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Грешка при изчистване на контейнери:', error)
    }
  }
}

// Singleton instance
export const containerStorage = new ContainerStorage()
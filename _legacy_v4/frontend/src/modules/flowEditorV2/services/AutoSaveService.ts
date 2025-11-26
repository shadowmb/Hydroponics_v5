/**
 * 📦 AutoSave Service
 * ✅ Прост auto-save с temp файл на 1 минута
 * Защитава от загуба на данни при crash/refresh
 * Created: 2025-08-09
 */

import type { FlowDefinition } from '../types/FlowDefinition'

export interface TempFileData {
  currentFlowId: string | null
  savedAt: string
  flowData: FlowDefinition
}

/**
 * AutoSaveService - простa защита от загуба на данни
 */
export class AutoSaveService {
  private static timer: NodeJS.Timeout | null = null
  private static autoSaveInterval = 60000 // 1 минута
  private static tempKey = 'floweditor_auto_recovery'
  private static getCurrentFlowData: (() => FlowDefinition) | null = null
  private static currentFlowId: string | null = null

  /**
   * Стартира auto-save timer
   */
  static startAutoSave(getCurrentFlow: () => FlowDefinition, flowId: string | null = null): void {
    this.getCurrentFlowData = getCurrentFlow
    this.currentFlowId = flowId
    
    // Спираме предишен timer ако има
    this.stopAutoSave()
    
    // Стартираме нов timer
    this.timer = setInterval(() => {
      this.performAutoSave()
    }, this.autoSaveInterval)
    
    console.log('🔄 AutoSave стартиран (1 минута interval)')
  }

  /**
   * Спира auto-save timer
   */
  static stopAutoSave(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
      console.log('⏹️ AutoSave спрян')
    }
  }

  /**
   * Изпълнява auto-save операцията
   */
  private static performAutoSave(): void {
    if (!this.getCurrentFlowData) return

    try {
      const flowData = this.getCurrentFlowData()
      
      // Проверяваме дали flow-то има съдържание
      if (!flowData.blocks || flowData.blocks.length === 0) {
        return // Не запазваме празни flows
      }

      this.saveToTemp(flowData)
    } catch (error) {
      console.error('❌ AutoSave грешка:', error)
    }
  }

  /**
   * Запазва flow data в localStorage като temp файл
   */
  static saveToTemp(flowData: FlowDefinition): void {
    try {
      const tempData: TempFileData = {
        currentFlowId: this.currentFlowId,
        savedAt: new Date().toISOString(),
        flowData
      }

      localStorage.setItem(this.tempKey, JSON.stringify(tempData))
      console.log('💾 AutoSave: temp файл запазен')
      
    } catch (error) {
      console.error('❌ AutoSave save грешка:', error)
    }
  }

  /**
   * Зарежда temp файл от localStorage
   */
  static loadFromTemp(): TempFileData | null {
    try {
      const tempJson = localStorage.getItem(this.tempKey)
      if (!tempJson) return null

      const tempData: TempFileData = JSON.parse(tempJson)
      
      // Проверяваме дали файлът не е твърде стар (над 24 часа)
      const savedAt = new Date(tempData.savedAt)
      const now = new Date()
      const hoursOld = (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60)
      
      if (hoursOld > 24) {
        console.log('🗑️ Temp файл е твърде стар, изтриваме го')
        this.clearTemp()
        return null
      }

      return tempData
      
    } catch (error) {
      console.error('❌ AutoSave load грешка:', error)
      return null
    }
  }

  /**
   * Изтрива temp файла
   */
  static clearTemp(): void {
    try {
      localStorage.removeItem(this.tempKey)
      console.log('🗑️ AutoSave: temp файл изтрит')
    } catch (error) {
      console.error('❌ AutoSave clear грешка:', error)
    }
  }

  /**
   * Проверява дали има temp файл за възстановяване
   */
  static hasTempFile(): boolean {
    const tempData = this.loadFromTemp()
    return tempData !== null
  }

  /**
   * Получава информация за temp файла без да го зарежда
   */
  static getTempFileInfo(): { savedAt: string; flowId: string | null } | null {
    try {
      const tempJson = localStorage.getItem(this.tempKey)
      if (!tempJson) return null

      const tempData = JSON.parse(tempJson)
      return {
        savedAt: tempData.savedAt,
        flowId: tempData.currentFlowId
      }
      
    } catch (error) {
      return null
    }
  }

  /**
   * Форматира дата за показване
   */
  static formatSaveTime(isoString: string): string {
    try {
      const date = new Date(isoString)
      const now = new Date()
      const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      
      if (diffMinutes < 1) return 'току-що'
      if (diffMinutes < 60) return `преди ${diffMinutes} минути`
      if (diffMinutes < 1440) return `преди ${Math.floor(diffMinutes / 60)} часа`
      return date.toLocaleDateString('bg-BG') + ' ' + date.toLocaleTimeString('bg-BG')
      
    } catch (error) {
      return 'неизвестно време'
    }
  }

  /**
   * Настройва интервала на auto-save (за testing)
   */
  static setAutoSaveInterval(intervalMs: number): void {
    this.autoSaveInterval = intervalMs
    
    // Рестартираме timer ако работи
    if (this.timer && this.getCurrentFlowData) {
      this.stopAutoSave()
      this.startAutoSave(this.getCurrentFlowData, this.currentFlowId)
    }
  }
}
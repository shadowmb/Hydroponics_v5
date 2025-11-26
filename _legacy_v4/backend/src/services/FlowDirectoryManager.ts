/**
 * 📁 FlowDirectoryManager
 * ✅ Прост сервис за автоматично управление на директории базирано на validation status
 * Следва existing service patterns в системата
 * Created: 2025-08-10
 */

import { FlowTemplate } from '../models/FlowTemplate'
import fs from 'fs/promises'
import path from 'path'

// Directory mapping базиран на validation status
const DIRECTORY_MAP = {
  draft: '/flow-templates/drafts/',
  invalid: '/flow-templates/drafts/',
  validated: '/flow-templates/flows/',
  ready: '/flow-templates/flows/',
  monitoring: '/flow-templates/monitoring/'
} as const

type ValidationStatus = keyof typeof DIRECTORY_MAP

interface DirectoryResult {
  targetDirectory: string
  needsMove: boolean
  currentPath?: string
  newPath?: string
}

/**
 * FlowDirectoryManager Class
 * Автоматично определя и управлява файлови директории базирано на validation status
 */
export class FlowDirectoryManager {
  
  /**
   * Определя правилната директория базирано на validation status
   */
  static determineTargetDirectory(validationStatus: ValidationStatus): string {
    return DIRECTORY_MAP[validationStatus] || DIRECTORY_MAP.draft
  }

  /**
   * Проверява дали flow е в правилната директория
   */
  static async checkFlowLocation(flowId: string, validationStatus: ValidationStatus): Promise<DirectoryResult> {
    try {
      const targetDirectory = this.determineTargetDirectory(validationStatus)
      
      // Намери текущия flow в базата данни
      const flow = await FlowTemplate.findOne({ flowId, isActive: true })
      if (!flow) {
        throw new Error(`Flow with ID ${flowId} not found`)
      }

      const needsMove = flow.filePath !== targetDirectory
      
      const result: DirectoryResult = {
        targetDirectory,
        needsMove
      }

      if (needsMove) {
        const currentPath = `${process.cwd()}/../${flow.filePath}${flow.jsonFileName}`
        const newPath = `${process.cwd()}/../${targetDirectory}${flow.jsonFileName}`
        
        result.currentPath = currentPath
        result.newPath = newPath
      }

      return result
      
    } catch (error) {
      console.error('Error in checkFlowLocation:', error)
      throw error
    }
  }

  /**
   * Мести flow файл в правилната директория
   */
  static async moveFlowToCorrectDirectory(
    flowId: string, 
    validationStatus: ValidationStatus
  ): Promise<{ success: boolean; message: string }> {
    try {
      const locationCheck = await this.checkFlowLocation(flowId, validationStatus)
      
      if (!locationCheck.needsMove) {
        return {
          success: true,
          message: 'Flow е вече в правилната директория'
        }
      }

      const { currentPath, newPath, targetDirectory } = locationCheck
      
      if (!currentPath || !newPath) {
        throw new Error('Missing path information')
      }

      // Създай target директория ако не съществува
      const targetDir = path.dirname(newPath)
      await fs.mkdir(targetDir, { recursive: true })
      
      // Провери дали source файлът съществува
      try {
        await fs.access(currentPath)
      } catch {
        // Файлът не съществува - само update-ни базата данни
        await FlowTemplate.findOneAndUpdate(
          { flowId, isActive: true },
          { filePath: targetDirectory }
        )
        
        return {
          success: true,
          message: 'Database updated (file was missing)'
        }
      }
      
      // Мести файла
      await fs.rename(currentPath, newPath)
      
      // Update-ни базата данни
      await FlowTemplate.findOneAndUpdate(
        { flowId, isActive: true },
        { filePath: targetDirectory }
      )

      return {
        success: true,
        message: `Flow moved to ${targetDirectory}`
      }
      
    } catch (error) {
      console.error('Error moving flow:', error)
      return {
        success: false,
        message: `Error moving flow: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Auto-assign directory за нов flow базирано на validation
   */
  static getDirectoryForNewFlow(validationStatus: ValidationStatus = 'draft'): string {
    return this.determineTargetDirectory(validationStatus)
  }

  /**
   * Batch организиране на всички flows в правилните директории
   */
  static async organizeAllFlows(): Promise<{
    processed: number
    moved: number
    errors: string[]
  }> {
    const result = {
      processed: 0,
      moved: 0,
      errors: [] as string[]
    }
    
    try {
      // Намери всички активни flows
      const flows = await FlowTemplate.find({ isActive: true })
      
      for (const flow of flows) {
        try {
          result.processed++
          
          // Използвай draft като default ако няма validation status
          const validationStatus = ((flow as any).validationStatus || 'draft') as ValidationStatus
          
          const moveResult = await this.moveFlowToCorrectDirectory(flow.flowId, validationStatus)
          
          if (moveResult.success && moveResult.message.includes('moved')) {
            result.moved++
          }
          
        } catch (error) {
          result.errors.push(`${flow.flowId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
      
    } catch (error) {
      result.errors.push(`Global error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    
    return result
  }

  /**
   * Получава статистика за файлове по директории
   */
  static async getDirectoryStats(): Promise<{
    drafts: number
    flows: number
    monitoring: number
    total: number
  }> {
    try {
      const stats = await FlowTemplate.aggregate([
        { $match: { isActive: true } },
        { $group: {
          _id: '$filePath',
          count: { $sum: 1 }
        }}
      ])
      
      let drafts = 0
      let flows = 0
      let monitoring = 0
      
      stats.forEach(stat => {
        if (stat._id?.includes('/drafts/')) {
          drafts += stat.count
        } else if (stat._id?.includes('/monitoring/')) {
          monitoring += stat.count
        } else if (stat._id?.includes('/flows/')) {
          flows += stat.count
        }
      })
      
      return {
        drafts,
        flows,
        monitoring,
        total: drafts + flows + monitoring
      }
      
    } catch (error) {
      console.error('Error getting directory stats:', error)
      return { drafts: 0, flows: 0, monitoring: 0, total: 0 }
    }
  }

  /**
   * Създава monitoring директория ако не съществува
   */
  static async ensureMonitoringDirectory(): Promise<void> {
    try {
      const monitoringDir = `${process.cwd()}/../flow-templates/monitoring/`
      await fs.mkdir(monitoringDir, { recursive: true })
    } catch (error) {
      console.error('Error creating monitoring directory:', error)
      throw error
    }
  }
}
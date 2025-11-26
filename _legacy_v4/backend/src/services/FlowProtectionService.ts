/**
 * 🛡️ FlowProtectionService
 * ✅ Прост сервис за проверка на ActionTemplate usage
 * Следва existing service patterns в системата
 * Created: 2025-08-10
 */

import { ActionTemplate } from '../models/ActionTemplate'
import { FlowTemplate } from '../models/FlowTemplate'

// Protection Check Result
interface ProtectionCheckResult {
  isProtected: boolean
  canEdit: boolean
  usageCount: number
  linkedTemplates: {
    templateId: string
    templateName: string
    syncStatus: string
  }[]
  message?: string
}

/**
 * FlowProtectionService Class
 * Проста логика за проверка дали flow е защитен от редакция
 */
export class FlowProtectionService {
  
  /**
   * Проверява дали flow е използван в ActionTemplates
   */
  static async checkFlowProtection(flowId: string): Promise<ProtectionCheckResult> {
    try {
      // Намери всички ActionTemplates които използват този flow
      const linkedTemplates = await ActionTemplate.find(
        { 
          linkedFlowId: flowId,
          isActive: true 
        },
        'name syncStatus'
      ).lean()

      const usageCount = linkedTemplates.length
      const isProtected = usageCount > 0
      
      const result: ProtectionCheckResult = {
        isProtected,
        canEdit: !isProtected,
        usageCount,
        linkedTemplates: linkedTemplates.map(template => ({
          templateId: template._id.toString(),
          templateName: template.name,
          syncStatus: template.syncStatus || 'unknown'
        }))
      }

      if (isProtected) {
        result.message = `Потокът се използва в ${usageCount} ActionTemplate${usageCount > 1 ? 'а' : ''} и не може да се редактира.`
      }

      return result
      
    } catch (error) {
      console.error('Error in checkFlowProtection:', error)
      return {
        isProtected: false,
        canEdit: true,
        usageCount: 0,
        linkedTemplates: [],
        message: 'Грешка при проверка на защитата'
      }
    }
  }

  /**
   * Проверява дали flow може да се изтрие
   */
  static async canDeleteFlow(flowId: string): Promise<{ canDelete: boolean; message?: string }> {
    try {
      const protection = await this.checkFlowProtection(flowId)
      
      return {
        canDelete: !protection.isProtected,
        message: protection.isProtected ? 
          'Потокът не може да се изтрие защото се използва в ActionTemplates' : 
          undefined
      }
      
    } catch (error) {
      console.error('Error in canDeleteFlow:', error)
      return {
        canDelete: false,
        message: 'Грешка при проверка за изтриване'
      }
    }
  }

  /**
   * Получава списък с всички protected flows
   */
  static async getProtectedFlows(): Promise<{
    flowId: string
    usageCount: number
  }[]> {
    try {
      const usageStats = await ActionTemplate.aggregate([
        { $match: { linkedFlowId: { $exists: true, $ne: null }, isActive: true } },
        { $group: { 
          _id: '$linkedFlowId', 
          usageCount: { $sum: 1 } 
        }},
        { $project: {
          flowId: '$_id',
          usageCount: 1,
          _id: 0
        }}
      ])

      return usageStats
      
    } catch (error) {
      console.error('Error in getProtectedFlows:', error)
      return []
    }
  }

  /**
   * Update linkedActionTemplates count в FlowTemplate (optional)
   * Използва се за кеширане на usage count
   */
  static async updateFlowUsageCount(flowId: string): Promise<void> {
    try {
      const protection = await this.checkFlowProtection(flowId)
      
      await FlowTemplate.updateMany(
        { flowId },
        { linkedActionTemplates: protection.usageCount }
      )
      
    } catch (error) {
      console.error('Error updating flow usage count:', error)
    }
  }

  /**
   * Batch update на всички flow usage counts
   * Използва се за периодична синхронизация
   */
  static async syncAllFlowUsageCounts(): Promise<void> {
    try {
      const protectedFlows = await this.getProtectedFlows()
      
      for (const flow of protectedFlows) {
        await this.updateFlowUsageCount(flow.flowId)
      }
      
      // Reset count за flows без usage
      await FlowTemplate.updateMany(
        { 
          flowId: { $nin: protectedFlows.map(f => f.flowId) },
          linkedActionTemplates: { $gt: 0 }
        },
        { linkedActionTemplates: 0 }
      )
      
    } catch (error) {
      console.error('Error in syncAllFlowUsageCounts:', error)
    }
  }
}
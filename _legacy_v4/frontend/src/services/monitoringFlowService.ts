import { api } from './api'

export interface MonitoringFlow {
  _id: string
  flowTemplateId: {
    _id: string
    name: string
    description?: string
    version: string
    jsonFileName: string
  }
  name: string
  description?: string
  monitoringInterval: number
  isActive: boolean
  lastExecuted?: Date
  nextExecution?: Date
  executionCount: number
  lastError?: string
  createdAt: Date
  updatedAt: Date
}

export interface AvailableFlow {
  _id: string
  name: string
  description?: string
  version: string
  jsonFileName: string
  hasMonitoringTags: boolean
  monitoringBlocksCount: number
}

export interface CreateMonitoringFlowRequest {
  flowTemplateId: string
  name: string
  description?: string
  monitoringInterval: number
}

export interface UpdateMonitoringFlowRequest {
  name?: string
  description?: string
  monitoringInterval?: number
  isActive?: boolean
}

class MonitoringFlowService {
  /**
   * Get all monitoring flows
   */
  async getMonitoringFlows(): Promise<MonitoringFlow[]> {
    return await api.get<MonitoringFlow[]>('/monitoring-flows')
  }

  /**
   * Get single monitoring flow by ID
   */
  async getMonitoringFlow(id: string): Promise<MonitoringFlow> {
    return await api.get<MonitoringFlow>(`/monitoring-flows/${id}`)
  }

  /**
   * Get available FlowTemplates with monitoring tags
   */
  async getAvailableFlows(): Promise<AvailableFlow[]> {
    return await api.get<AvailableFlow[]>('/monitoring-flows/available-flows')
  }

  /**
   * Create new monitoring flow
   */
  async createMonitoringFlow(data: CreateMonitoringFlowRequest): Promise<MonitoringFlow> {
    return await api.post<MonitoringFlow>('/monitoring-flows', data)
  }

  /**
   * Update existing monitoring flow
   */
  async updateMonitoringFlow(id: string, data: UpdateMonitoringFlowRequest): Promise<MonitoringFlow> {
    return await api.put<MonitoringFlow>(`/monitoring-flows/${id}`, data)
  }

  /**
   * Delete monitoring flow
   */
  async deleteMonitoringFlow(id: string): Promise<void> {
    await api.delete(`/monitoring-flows/${id}`)
  }

  /**
   * Activate monitoring flow
   */
  async activateMonitoringFlow(id: string): Promise<MonitoringFlow> {
    return await api.post<MonitoringFlow>(`/monitoring-flows/${id}/activate`)
  }

  /**
   * Deactivate monitoring flow
   */
  async deactivateMonitoringFlow(id: string): Promise<MonitoringFlow> {
    return await api.post<MonitoringFlow>(`/monitoring-flows/${id}/deactivate`)
  }

  /**
   * Get all monitoring flows (active and inactive)
   */
  async getAllMonitoringFlows(): Promise<MonitoringFlow[]> {
    return await this.getMonitoringFlows()
  }

  /**
   * Get only active monitoring flows
   */
  async getActiveMonitoringFlows(): Promise<MonitoringFlow[]> {
    const flows = await this.getMonitoringFlows()
    return flows.filter(flow => flow.isActive)
  }

  /**
   * Update monitoring interval
   */
  async updateMonitoringInterval(id: string, interval: number): Promise<MonitoringFlow> {
    return await this.updateMonitoringFlow(id, {
      monitoringInterval: interval
    })
  }

  /**
   * Get flow status display text
   */
  getFlowStatusText(flow: MonitoringFlow): string {
    if (!flow.isActive) return 'Неактивен'
    if (flow.lastError) return 'Грешка'
    if (flow.lastExecuted) return 'Активен'
    return 'Очакване'
  }

  /**
   * Get flow status color
   */
  getFlowStatusColor(flow: MonitoringFlow): string {
    if (!flow.isActive) return 'grey'
    if (flow.lastError) return 'negative'
    if (flow.lastExecuted) return 'positive'
    return 'warning'
  }

  /**
   * Get flow status icon
   */
  getFlowStatusIcon(flow: MonitoringFlow): string {
    if (!flow.isActive) return 'pause_circle'
    if (flow.lastError) return 'error'
    if (flow.lastExecuted) return 'play_circle'
    return 'schedule'
  }

  /**
   * Format interval display text
   */
  formatIntervalText(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} мин`
    } else if (minutes === 60) {
      return '1 час'
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60)
      const remainingMinutes = minutes % 60
      if (remainingMinutes === 0) {
        return `${hours} часа`
      } else {
        return `${hours}ч ${remainingMinutes}м`
      }
    } else {
      const days = Math.floor(minutes / 1440)
      const remainingMinutes = minutes % 1440
      if (remainingMinutes === 0) {
        return `${days} дни`
      } else {
        const hours = Math.floor(remainingMinutes / 60)
        const mins = remainingMinutes % 60
        return `${days}д ${hours}ч ${mins}м`
      }
    }
  }

  /**
   * Format next execution time
   */
  formatNextExecution(nextExecution?: Date): string {
    if (!nextExecution) return 'Не е планирано'
    
    const now = new Date()
    const next = new Date(nextExecution)
    const diffMs = next.getTime() - now.getTime()
    
    if (diffMs < 0) {
      return 'Просрочено'
    }
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    
    if (diffMinutes < 1) {
      return 'Скоро'
    } else if (diffMinutes < 60) {
      return `След ${diffMinutes} мин`
    } else if (diffMinutes < 1440) {
      const hours = Math.floor(diffMinutes / 60)
      const minutes = diffMinutes % 60
      if (minutes === 0) {
        return `След ${hours} ч`
      } else {
        return `След ${hours}ч ${minutes}м`
      }
    } else {
      return next.toLocaleDateString('bg-BG')
    }
  }
}

export const monitoringFlowService = new MonitoringFlowService()
import { api } from './api'
import type { ApiResponse } from '../types'

export interface IActionTemplate {
  name: string
  icon?: string
  description?: string
}

export interface IActionTemplateParameter {
  name: string
  displayName: string
  value: any
  comment?: string
}

export interface IActionTemplateParameters {
  actionTemplateId: string
  actionTemplateName: string
  actionTemplateDescription?: string
  actionIndex: number
  parameters: IActionTemplateParameter[]
}

export interface IActiveCycle {
  cycleId: string
  taskId: string
  startTime: string
  duration?: number
  lastExecuted?: Date
  nextExecution: Date
  executionCount: number
  isActive: boolean
  isCurrentlyExecuting: boolean
  actionTemplates?: IActionTemplate[]
  cycleGlobalParameters?: IActionTemplateParameters[]
}


export interface ISkippedCycle {
  cycleId: string
  skipUntil: Date
  reason?: string
}

export interface IActiveProgram {
  _id: string
  programId: {
    _id: string
    name: string
    description?: string
  }
  controllerId: {
    _id: string
    name: string
  }
  name: string
  status: 'loaded' | 'scheduled' | 'running' | 'paused' | 'stopped' | 'error' | 'completed'
  startedAt: Date
  pausedAt?: Date
  stoppedAt?: Date
  scheduledStartDate?: Date
  delayDays?: number
  minCycleInterval?: number
  maxExecutionTime?: number
  activeCycles: IActiveCycle[]
  skippedCycles: ISkippedCycle[]
  totalExecutions: number
  lastError?: string
  estimatedCompletion?: Date
  createdAt: Date
  updatedAt: Date
}

export interface IStatusInfo {
  hasActive: boolean
  status?: string
  timeRemaining?: number
  nextExecution?: Date
}

export interface ILoadProgramRequest {
  controllerId: string
}

export interface IScheduleProgramRequest {
  delayDays: number
}


export interface ISkipCycleRequest {
  cycleId: string
  skipDays: number
  reason?: string
}

class ActiveProgramService {
  
  /**
   * Get current active program
   */
  async getCurrentActive(): Promise<IActiveProgram | null> {
    return await api.get<IActiveProgram | null>('/active-programs')
  }

  /**
   * Load a program as active
   */
  async loadProgram(programId: string, data: ILoadProgramRequest): Promise<IActiveProgram> {
    return await api.post<IActiveProgram>(
      `/active-programs/load/${programId}`, 
      data
    )
  }

  /**
   * Schedule program with delayed start
   */
  async scheduleProgram(data: IScheduleProgramRequest): Promise<IActiveProgram> {
    return await api.put<IActiveProgram>(
      '/active-programs/schedule', 
      data
    )
  }

  /**
   * Start active program immediately
   */
  async startProgram(): Promise<IActiveProgram> {
    return await api.put<IActiveProgram>('/active-programs/start')
  }

  /**
   * Pause active program
   */
  async pauseProgram(): Promise<IActiveProgram> {
    return await api.put<IActiveProgram>('/active-programs/pause')
  }

  /**
   * Stop active program
   */
  async stopProgram(): Promise<IActiveProgram> {
    return await api.put<IActiveProgram>('/active-programs/stop')
  }

  /**
   * Remove active program
   */
  async removeActiveProgram(): Promise<void> {
    await api.delete('/active-programs')
  }


  /**
   * Skip cycle for specified period
   */
  async skipCycle(data: ISkipCycleRequest): Promise<IActiveProgram> {
    return await api.put<IActiveProgram>(
      '/active-programs/skip-cycle', 
      data
    )
  }

  /**
   * Get active program status info
   */
  async getStatusInfo(): Promise<IStatusInfo> {
    const activeProgram = await this.getCurrentActive()
    
    if (!activeProgram) {
      return { hasActive: false }
    }

    let timeRemaining: number | undefined
    if (activeProgram.status === 'scheduled' && activeProgram.scheduledStartDate) {
      timeRemaining = Math.max(0, new Date(activeProgram.scheduledStartDate).getTime() - Date.now())
    }

    const nextExecution = activeProgram.activeCycles
      .filter(cycle => cycle.isActive)
      .map(cycle => new Date(cycle.nextExecution))
      .sort((a, b) => a.getTime() - b.getTime())[0]

    return {
      hasActive: true,
      status: activeProgram.status,
      timeRemaining,
      nextExecution
    }
  }

  /**
   * Check if cycle is currently skipped
   */
  isCycleSkipped(activeProgram: IActiveProgram, cycleId: string): boolean {
    const skip = activeProgram.skippedCycles.find(skip => skip.cycleId === cycleId)
    if (!skip) return false
    
    return new Date() < new Date(skip.skipUntil)
  }

  /**
   * Get time remaining for delayed start in human readable format
   */
  getTimeRemainingString(timeRemaining: number): string {
    const days = Math.floor(timeRemaining / (24 * 60 * 60 * 1000))
    const hours = Math.floor((timeRemaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
    const minutes = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000))

    if (days > 0) {
      return `${days}д ${hours}ч ${minutes}м`
    } else if (hours > 0) {
      return `${hours}ч ${minutes}м`
    } else {
      return `${minutes}м`
    }
  }

  /**
   * Get status display text in Bulgarian
   */
  getStatusDisplayText(status: string): string {
    const statusMap: Record<string, string> = {
      'loaded': 'Заредена',
      'scheduled': 'Планирана',
      'running': 'Изпълнява се',
      'paused': 'На пауза',
      'stopped': 'Спряна',
      'error': 'Грешка',
      'completed': 'Завършена'
    }
    return statusMap[status] || status
  }

  /**
   * Get status color for UI display
   */
  getStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      'loaded': 'blue',
      'scheduled': 'orange',
      'running': 'green',
      'paused': 'amber',
      'stopped': 'red',
      'error': 'negative',
      'completed': 'positive'
    }
    return colorMap[status] || 'grey'
  }

  /**
   * Get status icon for UI display
   */
  getStatusIcon(status: string): string {
    const iconMap: Record<string, string> = {
      'loaded': 'radio_button_unchecked',
      'scheduled': 'schedule',
      'running': 'play_circle',
      'paused': 'pause_circle',
      'stopped': 'stop_circle',
      'error': 'error',
      'completed': 'check_circle'
    }
    return iconMap[status] || 'help'
  }

  /**
   * Update specific ActionTemplate parameters
   */
  async updateActionTemplateParameters(cycleId: string, actionTemplateId: string, parameters: Record<string, any>): Promise<void> {
    await api.put(`/active-programs/cycle-parameters/${cycleId}/${actionTemplateId}`, { parameters })
  }

  /**
   * Update cycle start time
   */
  async updateCycleStartTime(cycleId: string, startTime: string): Promise<void> {
    await api.put('/active-programs/cycle-time', { cycleId, startTime })
  }

  /**
   * Update minimum cycle interval
   */
  async updateMinCycleInterval(minCycleInterval: number): Promise<IActiveProgram> {
    return await api.put<IActiveProgram>(
      '/active-programs/min-cycle-interval',
      { minCycleInterval }
    )
  }

  /**
   * Update maximum execution time
   */
  async updateMaxExecutionTime(maxExecutionTime: number): Promise<IActiveProgram> {
    return await api.put<IActiveProgram>(
      '/active-programs/max-execution-time',
      { maxExecutionTime }
    )
  }
}

export const activeProgramService = new ActiveProgramService()
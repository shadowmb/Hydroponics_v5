import { api } from './api'

export interface Program {
  _id: string
  name: string
  description?: string
  cycles: any[]
  maxExecutionTime?: number
  isActive: boolean
  isRunning: boolean
  isMonitoring: boolean
  monitoringInterval: number
  startDate?: Date
  endDate?: Date
  createdAt: Date
  updatedAt: Date
}

export interface CreateProgramRequest {
  name: string
  description?: string
  cycles: any[]
  maxExecutionTime?: number
}

export interface UpdateProgramRequest {
  name?: string
  description?: string
  cycles?: any[]
  maxExecutionTime?: number
  isMonitoring?: boolean
  monitoringInterval?: number
  isActive?: boolean
}

class ProgramService {
  /**
   * Get all programs
   */
  async getPrograms(): Promise<Program[]> {
    return await api.get<Program[]>('/programs')
  }

  /**
   * Get single program by ID
   */
  async getProgram(id: string): Promise<Program> {
    return await api.get<Program>(`/programs/${id}`)
  }

  /**
   * Create new program
   */
  async createProgram(data: CreateProgramRequest): Promise<Program> {
    return await api.post<Program>('/programs', data)
  }

  /**
   * Update existing program
   */
  async updateProgram(id: string, data: UpdateProgramRequest): Promise<Program> {
    return await api.put<Program>(`/programs/${id}`, data)
  }

  /**
   * Delete program
   */
  async deleteProgram(id: string): Promise<void> {
    await api.delete(`/programs/${id}`)
  }

  /**
   * Get only monitoring programs
   */
  async getMonitoringPrograms(): Promise<Program[]> {
    const programs = await this.getPrograms()
    return programs.filter(program => program.isMonitoring && program.isActive)
  }

  /**
   * Get only non-monitoring programs
   */
  async getNonMonitoringPrograms(): Promise<Program[]> {
    const programs = await this.getPrograms()
    return programs.filter(program => !program.isMonitoring && program.isActive)
  }

  /**
   * Activate monitoring for a program
   */
  async activateMonitoring(id: string, interval: number): Promise<Program> {
    return await this.updateProgram(id, {
      isMonitoring: true,
      monitoringInterval: interval
    })
  }

  /**
   * Deactivate monitoring for a program
   */
  async deactivateMonitoring(id: string): Promise<Program> {
    return await this.updateProgram(id, {
      isMonitoring: false,
      monitoringInterval: 0
    })
  }

  /**
   * Update monitoring interval for a program
   */
  async updateMonitoringInterval(id: string, interval: number): Promise<Program> {
    return await this.updateProgram(id, {
      monitoringInterval: interval
    })
  }
}

export const programService = new ProgramService()
// ABOUTME: Tutorial service providing API methods for tutorial system with TypeScript interfaces
// ABOUTME: Handles tutorial data, progress tracking, and mock data for demo mode

import { api, ApiService } from './api'

// Tutorial Interfaces
export interface TutorialStep {
  id: string
  title: string
  description: string
  type: 'action' | 'explanation' | 'validation' | 'interaction'
  targetElement?: string   // CSS selector for highlighting element (backend compatibility)
  targetSelector?: string  // CSS selector for highlighting element (frontend preferred)
  expectedResult?: string
  hints?: string[]
  validationRules?: Record<string, any>
  isOptional?: boolean
  estimatedMinutes?: number
  // Interactive tutorial fields
  action?: 'click' | 'hover' | 'input' | 'navigate' | 'wait'
  actionData?: {
    suggestedValue?: string
    info?: string
  }
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  nextButtonText?: string
  prevButtonText?: string
  skipable?: boolean
  validationFn?: string
}

export interface Tutorial {
  _id: string
  id: string
  title: string
  description: string
  category: 'basics' | 'advanced' | 'troubleshooting' | 'maintenance'
  prerequisites: string[]
  estimatedMinutes: number  // in minutes
  isActive: boolean
  isCompleted: boolean
  steps: TutorialStep[]
  mockData: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface TutorialProgress {
  _id: string
  tutorialId: string
  status: 'in_progress'
  currentStep: string
  completedSteps: string[]
  startedAt?: string
  totalAttempts: number
  sessionData?: Record<string, any>  // Store demo mode data during session
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface TutorialSessionData {
  controllers: any[]
  devices: any[]
  flows: any[]
  programs: any[]
  isDemo: boolean
  originalData?: any  // Backup of original data to restore after tutorial
}

// Tutorial Service Class
export class TutorialService extends ApiService {
  private readonly baseUrl = '/tutorials'

  // Core CRUD Operations
  async getAllTutorials(options?: {
    category?: string
    isActive?: boolean
  }): Promise<Tutorial[]> {
    const params: any = {}
    if (options?.category) params.category = options.category
    if (options?.isActive !== undefined) params.isActive = options.isActive

    return this.get(this.baseUrl, { params })
  }

  async getTutorialById(id: string): Promise<Tutorial> {
    return this.get(`${this.baseUrl}/${id}`)
  }

  async getTutorialByTutorialId(tutorialId: string): Promise<Tutorial> {
    return this.get(`${this.baseUrl}/by-id/${tutorialId}`)
  }

  // Progress Management
  async getTutorialProgress(tutorialId: string): Promise<TutorialProgress | null> {
    try {
      return await this.get(`${this.baseUrl}/${tutorialId}/progress`)
    } catch (error: any) {
      if (error.status === 404) return null
      throw error
    }
  }

  async startTutorial(tutorialId: string, restart?: boolean): Promise<TutorialProgress> {
    const body: any = {}
    if (restart) body.restart = restart

    return this.post(`${this.baseUrl}/${tutorialId}/start`, body)
  }

  async updateTutorialProgress(
    tutorialId: string,
    updates: {
      currentStep?: string
      completedSteps?: string[]
      status?: 'in_progress'
      sessionData?: Record<string, any>
      notes?: string
    }
  ): Promise<TutorialProgress> {
    return this.put(`${this.baseUrl}/${tutorialId}/progress`, updates)
  }

  async completeTutorial(tutorialId: string): Promise<TutorialProgress> {
    return this.post(`${this.baseUrl}/${tutorialId}/complete`, {})
  }

  async resetTutorialProgress(options?: {
    tutorialId?: string
  }): Promise<{ message: string; affected: number }> {
    return this.post(`${this.baseUrl}/reset`, options || {})
  }

  // Direct TutorialProgress manipulation by progress ID
  async updateProgressById(
    progressId: string,
    updates: {
      currentStep?: string
      completedSteps?: string[]
      status?: 'in_progress'
      sessionData?: Record<string, any>
      notes?: string
    }
  ): Promise<TutorialProgress> {
    return this.put(`${this.baseUrl}/progress/${progressId}`, updates)
  }

  async completeProgressById(progressId: string): Promise<TutorialProgress> {
    return this.post(`${this.baseUrl}/progress/${progressId}/complete`, {})
  }

  // Demo Data Management
  async getDemoData(tutorialId: string): Promise<TutorialSessionData> {
    return this.get(`${this.baseUrl}/${tutorialId}/demo-data`)
  }

  // Tutorial Categories
  async getTutorialsByCategory(category: string): Promise<Tutorial[]> {
    return this.getAllTutorials({ category, isActive: true })
  }

  // Helper Methods
  async getAvailableTutorials(): Promise<Tutorial[]> {
    const tutorials = await this.getAllTutorials({ isActive: true })

    // Return all active tutorials since there's no user system
    return tutorials.filter(tutorial => tutorial.isActive)
  }

  async getTutorialStats(): Promise<{
    total: number
    completed: number
    inProgress: number
    available: number
  }> {
    const tutorials = await this.getAllTutorials({ isActive: true })
    const total = tutorials.length

    // Count completed tutorials (marked as isCompleted in Tutorial model)
    const completed = tutorials.filter(t => t.isCompleted).length

    // Count tutorials with active progress
    const progressPromises = tutorials.map(t =>
      this.getTutorialProgress(t._id).catch(() => null)
    )
    const progressResults = await Promise.all(progressPromises)
    const inProgress = progressResults.filter(p => p !== null).length

    const available = await this.getAvailableTutorials().then(t => t.length)

    return { total, completed, inProgress, available }
  }
}

// Export singleton instance
export const tutorialService = new TutorialService()

// Export convenience functions
export const tutorialApi = {
  getAll: (options?: { category?: string; isActive?: boolean }) =>
    tutorialService.getAllTutorials(options),

  getById: (id: string) =>
    tutorialService.getTutorialById(id),

  getByTutorialId: (tutorialId: string) =>
    tutorialService.getTutorialByTutorialId(tutorialId),

  getProgress: (tutorialId: string) =>
    tutorialService.getTutorialProgress(tutorialId),

  start: (tutorialId: string, restart?: boolean) =>
    tutorialService.startTutorial(tutorialId, restart),

  updateProgress: (tutorialId: string, updates: any) =>
    tutorialService.updateTutorialProgress(tutorialId, updates),

  complete: (tutorialId: string) =>
    tutorialService.completeTutorial(tutorialId),

  reset: (options?: { tutorialId?: string }) =>
    tutorialService.resetTutorialProgress(options),

  getDemoData: (tutorialId: string) =>
    tutorialService.getDemoData(tutorialId),

  getByCategory: (category: string) =>
    tutorialService.getTutorialsByCategory(category),

  getAvailable: () =>
    tutorialService.getAvailableTutorials(),

  getStats: () =>
    tutorialService.getTutorialStats(),

  // Direct progress manipulation
  updateProgressById: (progressId: string, updates: any) =>
    tutorialService.updateProgressById(progressId, updates),

  completeProgressById: (progressId: string) =>
    tutorialService.completeProgressById(progressId)
}
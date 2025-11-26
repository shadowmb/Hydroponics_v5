// ABOUTME: Manages demo/sandbox mode for tutorials - handles backup/restore and mock data injection
// ABOUTME: Prevents production DB writes during tutorial execution

import { Controller } from '../types'

/**
 * Demo mode configuration
 */
export interface DemoModeConfig {
  isSandboxMode: boolean
  preventWrites: boolean
  mockData: {
    controllers: Controller[]
  }
}

/**
 * Backup state for restoration
 */
interface BackupState {
  controllers: Controller[]
  timestamp: Date
}

/**
 * Mock data for tutorials
 */
const TUTORIAL_MOCK_CONTROLLERS: Controller[] = [
  {
    _id: 'demo-controller-1',
    name: 'Arduino Main',
    status: 'online',
    executionState: {
      isRunning: false,
      executionCount: 0
    },
    logs: [],
    systemInfo: {
      version: '1.2.0',
      uptime: 3600,
      memoryUsage: 45,
      cpuUsage: 12
    },
    lastHeartbeat: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

/**
 * DemoModeManager - Singleton service for managing tutorial demo mode
 *
 * Responsibilities:
 * - Enable/disable sandbox mode
 * - Backup and restore real data
 * - Inject mock data for tutorials
 * - Prevent production DB writes
 */
export class DemoModeManager {
  private config: DemoModeConfig = {
    isSandboxMode: false,
    preventWrites: true,
    mockData: {
      controllers: []
    }
  }

  private backup: BackupState | null = null
  private eventListeners: Map<string, Set<Function>> = new Map()

  /**
   * Check if sandbox mode is active
   */
  get isActive(): boolean {
    return this.config.isSandboxMode
  }

  /**
   * Check if writes should be prevented
   */
  get shouldPreventWrites(): boolean {
    return this.config.isSandboxMode && this.config.preventWrites
  }

  /**
   * Get current mock data
   */
  get mockData(): DemoModeConfig['mockData'] {
    return this.config.mockData
  }

  /**
   * Enable demo mode with mock data
   */
  async enableDemoMode(realControllers: Controller[] = []): Promise<void> {
    if (this.config.isSandboxMode) {
      console.warn('[DemoModeManager] Demo mode already enabled')
      return
    }

    // Backup real data
    this.backup = {
      controllers: JSON.parse(JSON.stringify(realControllers)),
      timestamp: new Date()
    }

    // Enable sandbox mode
    this.config.isSandboxMode = true
    this.config.preventWrites = true
    this.config.mockData.controllers = JSON.parse(JSON.stringify(TUTORIAL_MOCK_CONTROLLERS))

    console.log('[DemoModeManager] Demo mode enabled', {
      backedUpControllers: this.backup.controllers.length,
      mockControllers: this.config.mockData.controllers.length
    })

    this.emit('demo:enabled')
  }

  /**
   * Disable demo mode and restore real data
   */
  async disableDemoMode(): Promise<BackupState | null> {
    if (!this.config.isSandboxMode) {
      console.warn('[DemoModeManager] Demo mode not active')
      return null
    }

    const restoredData = this.backup

    // Disable sandbox mode
    this.config.isSandboxMode = false
    this.config.preventWrites = false
    this.config.mockData.controllers = []

    console.log('[DemoModeManager] Demo mode disabled', {
      restoredControllers: restoredData?.controllers.length || 0
    })

    this.emit('demo:disabled', restoredData)

    // Clear backup
    this.backup = null

    return restoredData
  }

  /**
   * Get mock controllers for tutorial
   */
  getMockControllers(): Controller[] {
    if (!this.config.isSandboxMode) {
      console.warn('[DemoModeManager] Cannot get mock data - demo mode not active')
      return []
    }
    return JSON.parse(JSON.stringify(this.config.mockData.controllers))
  }

  /**
   * Add a new mock controller (for tutorial steps)
   */
  addMockController(controller: Partial<Controller>): Controller {
    if (!this.config.isSandboxMode) {
      throw new Error('Cannot add mock controller - demo mode not active')
    }

    const newController: Controller = {
      _id: `demo-controller-${Date.now()}`,
      name: controller.name || 'New Controller',
      status: controller.status || 'offline',
      executionState: controller.executionState || {
        isRunning: false,
        executionCount: 0
      },
      logs: controller.logs || [],
      systemInfo: controller.systemInfo || {
        version: '1.0.0',
        uptime: 0,
        memoryUsage: 0,
        cpuUsage: 0
      },
      lastHeartbeat: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    this.config.mockData.controllers.push(newController)
    this.emit('mock:controller-added', newController)

    return newController
  }

  /**
   * Update mock controller
   */
  updateMockController(id: string, updates: Partial<Controller>): Controller | null {
    if (!this.config.isSandboxMode) {
      throw new Error('Cannot update mock controller - demo mode not active')
    }

    const index = this.config.mockData.controllers.findIndex(c => c._id === id)
    if (index === -1) {
      console.warn(`[DemoModeManager] Mock controller not found: ${id}`)
      return null
    }

    this.config.mockData.controllers[index] = {
      ...this.config.mockData.controllers[index],
      ...updates,
      _id: id, // Preserve ID
      updatedAt: new Date().toISOString()
    }

    const updated = this.config.mockData.controllers[index]
    this.emit('mock:controller-updated', updated)

    return updated
  }

  /**
   * Delete mock controller
   */
  deleteMockController(id: string): boolean {
    if (!this.config.isSandboxMode) {
      throw new Error('Cannot delete mock controller - demo mode not active')
    }

    const index = this.config.mockData.controllers.findIndex(c => c._id === id)
    if (index === -1) {
      return false
    }

    const deleted = this.config.mockData.controllers.splice(index, 1)[0]
    this.emit('mock:controller-deleted', deleted)

    return true
  }

  /**
   * Check if a write operation should be blocked
   */
  shouldBlockWrite(operation: 'create' | 'update' | 'delete'): boolean {
    if (!this.shouldPreventWrites) {
      return false
    }

    console.warn(`[DemoModeManager] Blocking ${operation} operation - sandbox mode active`)
    return true
  }

  /**
   * Get backup state
   */
  getBackup(): BackupState | null {
    return this.backup ? JSON.parse(JSON.stringify(this.backup)) : null
  }

  /**
   * Event emitter - subscribe to demo mode events
   */
  on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event)!.add(listener)
  }

  /**
   * Event emitter - unsubscribe from demo mode events
   */
  off(event: string, listener: Function): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.delete(listener)
    }
  }

  /**
   * Emit event to all listeners
   */
  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data)
        } catch (error) {
          console.error(`[DemoModeManager] Error in event listener for ${event}:`, error)
        }
      })
    }
  }

  /**
   * Cleanup - remove all event listeners
   */
  cleanup(): void {
    this.eventListeners.clear()
  }
}

// Export singleton instance
export const demoModeManager = new DemoModeManager()

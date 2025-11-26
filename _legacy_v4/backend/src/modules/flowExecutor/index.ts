// FlowExecutor module main export
import { SystemStateManager } from './core/SystemStateManager'
import { FlowInterpreter } from './core/FlowInterpreter'
import { ExecutionContext } from './core/ExecutionContext'
import { BlockExecutor } from './core/BlockExecutor'
import { CancellationToken } from './core/CancellationToken'
import { HardwareService } from '../../hardware'
import { HardwareHealthChecker } from '../../services/HardwareHealthChecker'

// Core components
export { SystemStateManager } from './core/SystemStateManager'
export { FlowInterpreter } from './core/FlowInterpreter'
export { ExecutionContext } from './core/ExecutionContext'
export { BlockExecutor } from './core/BlockExecutor'

// Helper modules
export * from './helpers'

// Types
export * from './types'

// Main FlowExecutor class
export class FlowExecutor {
  private systemStateManager: SystemStateManager
  private blockExecutor: BlockExecutor
  private flowInterpreter: FlowInterpreter
  private hardwareHealthChecker: HardwareHealthChecker

  constructor(options: {
    hardwareService?: HardwareService
    alertService?: any
    mockMode?: boolean // Deprecated - kept for backward compatibility
    cancellationToken?: CancellationToken
  } = {}) {
    // 🚩 NEW: Използвай споделен cancellationToken или създай нов
    const cancellationToken = options.cancellationToken || new CancellationToken()
    
    this.systemStateManager = new SystemStateManager(cancellationToken)
    
    this.blockExecutor = new BlockExecutor(
      options.hardwareService,
      options.alertService,
      undefined, // blockStates
      cancellationToken
    )
    
    this.flowInterpreter = new FlowInterpreter(
      this.systemStateManager,
      this.blockExecutor,
      cancellationToken
    )

    // Initialize HardwareHealthChecker
    this.hardwareHealthChecker = HardwareHealthChecker.getInstance()
  }

  // Main execution method
  async executeFlow(flowDefinition: any, globalVariables?: Record<string, any>): Promise<boolean> {
    try {
      // PRE-EXECUTION HARDWARE VALIDATION
      const validationResult = await this.hardwareHealthChecker.validateFlowDevices(flowDefinition)
      
      if (!validationResult.canExecute) {
        const errorMessage = `Flow execution blocked due to hardware issues: ${validationResult.criticalFailures.join(', ')}`
        console.error(`❌ [FlowExecutor] ${errorMessage}`)
        
        // Throw specific error that can be caught by calling services
        const error = new Error(errorMessage)
        ;(error as any).code = 'HARDWARE_VALIDATION_FAILED'
        ;(error as any).details = validationResult
        throw error
      }

      if (!validationResult.isValid) {
        console.warn(`⚠️ [FlowExecutor] Hardware validation warnings: ${validationResult.issues.join(', ')}`)
      }

      console.log(`✅ [FlowExecutor] Hardware validation passed - executing flow`)
      
      return await this.flowInterpreter.executeFlow(flowDefinition, globalVariables)
    } catch (error) {
      // Re-throw to allow SchedulerService to handle properly
      throw error
    }
  }

  // Control methods
  pause(): boolean {
    return this.flowInterpreter.pause()
  }

  resume(): boolean {
    return this.flowInterpreter.resume()
  }

  stop(): boolean {
    return this.flowInterpreter.stop()
  }

  // Status methods
  getSystemState() {
    return this.systemStateManager.getCurrentState()
  }

  getSystemStateManager(): SystemStateManager {
    return this.systemStateManager
  }

  getExecutionContext() {
    return this.flowInterpreter.getExecutionContext()
  }

  isExecuting(): boolean {
    return this.flowInterpreter.isFlowExecuting()
  }

  // Service injection
  setHardwareService(service: HardwareService): void {
    this.blockExecutor.setHardwareService(service)
  }

  setAlertService(service: any): void {
    this.blockExecutor.setAlertService(service)
  }

  // Hardware health validation methods
  async validateHardwareForFlow(flowDefinition: any): Promise<any> {
    return await this.hardwareHealthChecker.validateFlowDevices(flowDefinition)
  }

  // Cleanup
  cleanup(): void {
    this.systemStateManager.cleanup()
  }
}
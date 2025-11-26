// loggingExamples.ts - Примери за използване на централизираната logging система

import { UnifiedLoggingService } from '../services/UnifiedLoggingService'
import { trace, log, analytics, monitor } from './loggingDecorators'

/**
 * Пример 1: Използване на Module Logger Pattern
 */
export class FlowExecutorExample {
  private logger = UnifiedLoggingService.createModuleLogger('flow-executor')

  async executeFlow(flowId: string, data: any): Promise<void> {
    // Просто логване без decorators
    this.logger.info('flow-start', { flowId, timestamp: new Date().toISOString() })

    try {
      // Simulate flow execution
      await this.processBlocks(data.blocks)
      
      this.logger.info('flow-success', { flowId, blocksProcessed: data.blocks?.length || 0 })
    } catch (error) {
      this.logger.error('flow-error', { 
        flowId, 
        error: error instanceof Error ? error.message : String(error) 
      })
      throw error
    }
  }

  private async processBlocks(blocks: any[]): Promise<void> {
    for (const block of blocks) {
      this.logger.debug('block-processing', { blockId: block.id, type: block.type })
      
      // Simulate block processing
      await new Promise(resolve => setTimeout(resolve, 100))
      
      this.logger.debug('block-completed', { blockId: block.id })
    }
  }
}

/**
 * Пример 2: Използване на @trace decorator
 */
export class SensorServiceExample {
  
  @trace('sensor-reading', { logArgs: true, logResult: true, logDuration: true })
  async readSensorValue(sensorId: string, type: string): Promise<number> {
    // Simulate sensor reading
    await new Promise(resolve => setTimeout(resolve, 50))
    
    const value = Math.random() * 100
    return value
  }

  @trace('sensor-calibration', { logArgs: false, logResult: false, level: 'info' })
  async calibrateSensor(sensorId: string, calibrationData: any): Promise<void> {
    // Simulate calibration process
    await new Promise(resolve => setTimeout(resolve, 200))
    
    if (Math.random() > 0.9) {
      throw new Error('Calibration failed')
    }
  }
}

/**
 * Пример 3: Използване на @analytics decorator за бизнес метрики
 */
export class ProgramAnalyticsExample {
  
  @analytics('program-execution')
  async executeProgram(programId: string, settings: any): Promise<void> {
    // Simulate program execution
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  @analytics('user-action')
  async saveUserPreferences(userId: string, preferences: any): Promise<void> {
    // Simulate saving preferences
    await new Promise(resolve => setTimeout(resolve, 100))
  }
}

/**
 * Пример 4: Използване на @monitor decorator за performance tracking
 */
export class DatabaseServiceExample {
  
  @monitor('db-query', 500) // Warning ако отнеме повече от 500ms
  async findUser(userId: string): Promise<any> {
    // Simulate database query
    const delay = Math.random() * 1000 // 0-1000ms
    await new Promise(resolve => setTimeout(delay, resolve))
    
    return { id: userId, name: 'Test User' }
  }

  @monitor('db-bulk-operation', 2000) // Warning ако отнеме повече от 2s
  async bulkInsert(records: any[]): Promise<void> {
    // Simulate bulk operation
    const delay = records.length * 10 // 10ms per record
    await new Promise(resolve => setTimeout(resolve, delay))
  }
}

/**
 * Пример 5: Комбинирано използване на decorators
 */
export class ComplexServiceExample {
  private logger = UnifiedLoggingService.createModuleLogger('complex-service')

  @trace('complex-operation', { level: 'info' })
  @monitor('complex-performance', 1000)
  @analytics('complex-analytics')
  async complexOperation(data: any): Promise<any> {
    // Manual logging в комбинация с decorators
    this.logger.debug('complex-operation-details', { 
      inputSize: data?.length || 0,
      timestamp: new Date().toISOString()
    })

    // Simulate complex processing
    for (let i = 0; i < (data?.length || 10); i++) {
      await this.processItem(data?.[i] || { id: i })
    }

    return { processed: data?.length || 10 }
  }

  private async processItem(item: any): Promise<void> {
    // Context-aware logging
    this.logger.debug('item-processing', item, { 
      itemId: item.id,
      sessionId: 'session-123' 
    })

    await new Promise(resolve => setTimeout(resolve, 50))
  }
}

/**
 * Пример 6: Използване без decorators (за функции или existing код)
 */
export class LegacyServiceExample {
  private logger = UnifiedLoggingService.createModuleLogger('legacy-service')

  async processLegacyData(data: any): Promise<void> {
    const startTime = Date.now()
    
    this.logger.info('legacy-process-start', { 
      dataType: typeof data,
      timestamp: new Date().toISOString() 
    })

    try {
      // Legacy processing logic
      await this.legacyMethod1(data)
      await this.legacyMethod2(data)
      
      const duration = Date.now() - startTime
      this.logger.info('legacy-process-success', { 
        duration: `${duration}ms`,
        success: true 
      })
      
    } catch (error) {
      const duration = Date.now() - startTime
      this.logger.error('legacy-process-error', {
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
      throw error
    }
  }

  private async legacyMethod1(data: any): Promise<void> {
    this.logger.debug('legacy-method1', { step: 1 })
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  private async legacyMethod2(data: any): Promise<void> {
    this.logger.debug('legacy-method2', { step: 2 })
    await new Promise(resolve => setTimeout(resolve, 100))
  }
}

/**
 * Пример 7: Conditional logging според environment
 */
export class ConditionalLoggingExample {
  private logger = UnifiedLoggingService.createModuleLogger('conditional-service')

  async processData(data: any): Promise<void> {
    // Production-safe logging
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug('detailed-debug', { 
        fullData: data,
        timestamp: new Date().toISOString()
      })
    } else {
      this.logger.info('production-info', { 
        dataSize: data?.length || 0,
        timestamp: new Date().toISOString()
      })
    }

    // Always log important events
    this.logger.analytics('data-processing', {
      environment: process.env.NODE_ENV,
      dataProcessed: true
    })
  }
}

/**
 * Пример 8: Error handling с contextual информация
 */
export class ErrorHandlingExample {
  private logger = UnifiedLoggingService.createModuleLogger('error-handler')

  async handleUserRequest(userId: string, action: string, data: any): Promise<void> {
    const context = {
      userId,
      sessionId: this.generateSessionId(),
      requestId: this.generateRequestId()
    }

    this.logger.info('user-request-start', { action }, context)

    try {
      await this.processUserAction(action, data, context)
      
      this.logger.analytics('user-action-success', { action }, context)
      
    } catch (error) {
      // Structured error logging с context
      this.logger.error('user-request-error', {
        action,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userData: this.sanitizeUserData(data)
      }, context)
      
      // Additional error analytics
      this.logger.analytics('user-action-failed', {
        action,
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        timestamp: new Date().toISOString()
      }, context)
      
      throw error
    }
  }

  private async processUserAction(action: string, data: any, context: any): Promise<void> {
    this.logger.debug('processing-action', { action }, context)
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Random failure for demo
    if (Math.random() > 0.8) {
      throw new Error(`Action ${action} failed`)
    }
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private sanitizeUserData(data: any): any {
    // Remove sensitive information
    const { password, token, ...safeData } = data || {}
    return safeData
  }
}

/**
 * Utility functions за лесно създаване на loggers
 */
export const LoggerFactory = {
  /**
   * Създава logger за конкретен модул
   */
  createLogger(moduleName: string) {
    return UnifiedLoggingService.createModuleLogger(moduleName)
  },

  /**
   * Създава logger със предварително зададен context
   */
  createContextLogger(moduleName: string, defaultContext: any) {
    const logger = UnifiedLoggingService.createModuleLogger(moduleName)
    
    return {
      debug: (tag: string, data: any, context = {}) => 
        logger.debug(tag, data, { ...defaultContext, ...context }),
      info: (tag: string, data: any, context = {}) => 
        logger.info(tag, data, { ...defaultContext, ...context }),
      warn: (tag: string, data: any, context = {}) => 
        logger.warn(tag, data, { ...defaultContext, ...context }),
      error: (tag: string, data: any, context = {}) => 
        logger.error(tag, data, { ...defaultContext, ...context }),
      analytics: (tag: string, data: any, context = {}) => 
        logger.analytics(tag, data, { ...defaultContext, ...context })
    }
  },

  /**
   * Създава logger за конкретна програма/сесия
   */
  createProgramLogger(programId: string, cycleId?: string) {
    const context = { programId, cycleId }
    return this.createContextLogger('program-execution', context)
  }
}
// loggingDecorators.ts - Декоратори за лесна интеграция на logging в съществуващ код

import { UnifiedLoggingService, LogContext } from '../services/UnifiedLoggingService'

export interface TraceOptions {
  logArgs?: boolean
  logResult?: boolean
  logDuration?: boolean
  logErrors?: boolean
  context?: LogContext
  level?: 'debug' | 'info' | 'warn' | 'error'
}

export interface LogOptions {
  tag?: string
  context?: LogContext
  level?: 'debug' | 'info' | 'warn' | 'error' | 'analytics'
  skipArgs?: string[]
  skipResult?: boolean
}

/**
 * @trace декоратор - автоматично логване на method execution
 * 
 * @param tag - Таг за логовете
 * @param options - Опции за логването
 * 
 * @example
 * class FlowExecutor {
 *   @trace('block-execution')
 *   async executeBlock(block: Block): Promise<void> {
 *     // method implementation
 *   }
 * }
 */
export function trace(tag: string, options: TraceOptions = {}) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    const className = target.constructor.name
    const methodName = propertyKey
    
    const defaultOptions: TraceOptions = {
      logArgs: true,
      logResult: true,
      logDuration: true,
      logErrors: true,
      level: 'debug',
      ...options
    }

    descriptor.value = async function(...args: any[]) {
      const startTime = Date.now()
      const logger = UnifiedLoggingService.createModuleLogger(className)
      const context = { ...defaultOptions.context }

      try {
        // Log method start
        if (defaultOptions.logArgs) {
          logger.debug(`${tag}-start`, {
            method: methodName,
            args: sanitizeArgs(args),
            timestamp: new Date().toISOString()
          }, context)
        } else {
          logger.debug(`${tag}-start`, {
            method: methodName,
            timestamp: new Date().toISOString()
          }, context)
        }

        // Execute original method
        const result = await originalMethod.apply(this, args)
        const duration = Date.now() - startTime

        // Log successful completion
        const successData: any = {
          method: methodName,
          success: true
        }

        if (defaultOptions.logDuration) {
          successData.duration = `${duration}ms`
        }

        if (defaultOptions.logResult && result !== undefined) {
          successData.result = sanitizeData(result)
        }

        logger[defaultOptions.level!](`${tag}-success`, successData, context)

        return result
      } catch (error) {
        const duration = Date.now() - startTime

        // Log error
        if (defaultOptions.logErrors) {
          const errorData: any = {
            method: methodName,
            success: false,
            error: error instanceof Error ? error.message : String(error),
            duration: `${duration}ms`
          }

          if (error instanceof Error && error.stack) {
            errorData.stack = error.stack
          }

          logger.error(`${tag}-error`, errorData, context)
        }

        throw error
      }
    }

    return descriptor
  }
}

/**
 * @log декоратор - просто логване без execution tracking
 * 
 * @param tag - Таг за лога
 * @param message - Съобщение за логване
 * @param options - Опции за логването
 * 
 * @example
 * class SensorReader {
 *   @log('sensor-reading', 'Reading pH sensor value')
 *   readPHSensor(): number {
 *     return 6.8
 *   }
 * }
 */
export function log(tag: string, message: string, options: LogOptions = {}) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    const className = target.constructor.name
    const methodName = propertyKey
    
    const defaultOptions: LogOptions = {
      level: 'info',
      skipResult: false,
      ...options
    }

    descriptor.value = async function(...args: any[]) {
      const logger = UnifiedLoggingService.createModuleLogger(className)
      const context = { ...defaultOptions.context }

      // Log the message
      const logData: any = {
        method: methodName,
        message
      }

      // Add arguments if not skipped
      if (!defaultOptions.skipArgs) {
        logData.args = sanitizeArgs(args)
      } else {
        // Add only non-skipped arguments
        const filteredArgs = args.filter((_, index) => 
          !defaultOptions.skipArgs?.includes(String(index))
        )
        if (filteredArgs.length > 0) {
          logData.args = sanitizeArgs(filteredArgs)
        }
      }

      logger[defaultOptions.level!](defaultOptions.tag || tag, logData, context)

      // Execute original method
      const result = await originalMethod.apply(this, args)

      // Log result if not skipped
      if (!defaultOptions.skipResult && result !== undefined) {
        logger[defaultOptions.level!](`${defaultOptions.tag || tag}-result`, {
          method: methodName,
          result: sanitizeData(result)
        }, context)
      }

      return result
    }

    return descriptor
  }
}

/**
 * @analytics декоратор - логване за аналитични цели
 * 
 * @param tag - Таг за analytics
 * @param options - Опции за логването
 * 
 * @example
 * class ProgramExecutor {
 *   @analytics('program-execution')
 *   async executeProgram(program: Program): Promise<void> {
 *     // method implementation
 *   }
 * }
 */
export function analytics(tag: string, options: LogOptions = {}) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    const className = target.constructor.name
    const methodName = propertyKey

    descriptor.value = async function(...args: any[]) {
      const logger = UnifiedLoggingService.createModuleLogger(className)
      const context = { ...options.context }
      const startTime = Date.now()

      try {
        const result = await originalMethod.apply(this, args)
        const duration = Date.now() - startTime

        // Log analytics data
        logger.analytics(tag, {
          method: methodName,
          success: true,
          duration,
          timestamp: new Date().toISOString(),
          args: sanitizeArgs(args),
          result: sanitizeData(result)
        }, context)

        return result
      } catch (error) {
        const duration = Date.now() - startTime

        // Log failed analytics
        logger.analytics(`${tag}-failed`, {
          method: methodName,
          success: false,
          duration,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        }, context)

        throw error
      }
    }

    return descriptor
  }
}

/**
 * @monitor декоратор - мониториране на performance
 * 
 * @param tag - Таг за мониторинга
 * @param thresholdMs - Праг за warning при бавно изпълнение
 * 
 * @example
 * class DatabaseService {
 *   @monitor('db-query', 1000)
 *   async findUser(id: string): Promise<User> {
 *     // method implementation
 *   }
 * }
 */
export function monitor(tag: string, thresholdMs: number = 1000) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    const className = target.constructor.name
    const methodName = propertyKey

    descriptor.value = async function(...args: any[]) {
      const logger = UnifiedLoggingService.createModuleLogger(className)
      const startTime = Date.now()

      try {
        const result = await originalMethod.apply(this, args)
        const duration = Date.now() - startTime

        // Log performance data
        const performanceData = {
          method: methodName,
          duration,
          threshold: thresholdMs,
          slow: duration > thresholdMs
        }

        if (duration > thresholdMs) {
          logger.warn(`${tag}-slow`, performanceData)
        } else {
          logger.info(`${tag}-performance`, performanceData)
        }

        return result
      } catch (error) {
        const duration = Date.now() - startTime

        logger.error(`${tag}-error`, {
          method: methodName,
          duration,
          error: error instanceof Error ? error.message : String(error)
        })

        throw error
      }
    }

    return descriptor
  }
}

/**
 * Sanitize arguments for logging (remove sensitive data)
 */
function sanitizeArgs(args: any[]): any[] {
  return args.map(arg => sanitizeData(arg))
}

/**
 * Sanitize data for logging (remove sensitive data, prevent circular references)
 */
function sanitizeData(data: any): any {
  if (data === null || data === undefined) {
    return data
  }

  if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
    return data
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item))
  }

  if (typeof data === 'object') {
    try {
      // Check for circular references and sanitize sensitive fields
      const sanitized: any = {}
      
      for (const [key, value] of Object.entries(data)) {
        // Skip sensitive fields
        if (isSensitiveField(key)) {
          sanitized[key] = '[REDACTED]'
          continue
        }

        // Handle nested objects carefully
        if (typeof value === 'object' && value !== null) {
          sanitized[key] = sanitizeData(value)
        } else {
          sanitized[key] = value
        }
      }

      return sanitized
    } catch (error) {
      return '[CIRCULAR_REFERENCE]'
    }
  }

  return String(data)
}

/**
 * Check if field contains sensitive information
 */
function isSensitiveField(fieldName: string): boolean {
  const sensitiveFields = [
    'password', 'token', 'secret', 'key', 'auth', 'credential',
    'passwd', 'pwd', 'apikey', 'authorization', 'bearer'
  ]
  
  return sensitiveFields.some(sensitive => 
    fieldName.toLowerCase().includes(sensitive)
  )
}

/**
 * Function decorator за standalone функции
 * 
 * @example
 * const loggedFunction = logFunction(
 *   'calculation',
 *   (x: number, y: number) => x + y,
 *   { level: 'debug' }
 * )
 */
export function logFunction<T extends (...args: any[]) => any>(
  tag: string,
  fn: T,
  options: LogOptions = {}
): T {
  const functionName = fn.name || 'anonymous'
  const logger = UnifiedLoggingService.createModuleLogger('function')

  return ((...args: any[]) => {
    const startTime = Date.now()

    try {
      logger.debug(`${tag}-start`, {
        function: functionName,
        args: sanitizeArgs(args)
      }, options.context)

      const result = fn(...args)
      const duration = Date.now() - startTime

      logger.debug(`${tag}-success`, {
        function: functionName,
        duration: `${duration}ms`,
        result: sanitizeData(result)
      }, options.context)

      return result
    } catch (error) {
      const duration = Date.now() - startTime

      logger.error(`${tag}-error`, {
        function: functionName,
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : String(error)
      }, options.context)

      throw error
    }
  }) as T
}
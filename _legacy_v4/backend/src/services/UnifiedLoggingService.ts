// UnifiedLoggingService.ts - Централизиран logging модул за цялата система

export interface LogContext {
  // Existing fields remain
  programId?: string
  cycleId?: string
  blockId?: string
  sessionId?: string
  deviceId?: string
  controllerId?: string
  module?: string

  // NEW: Source location tracking
  source?: {
    file: string
    method?: string
    line?: number
  }

  // NEW: Business context
  business?: {
    category: 'device' | 'sensor' | 'flow' | 'system' | 'recovery' | 'network' | 'controller'
    operation: string
    severity?: 'low' | 'medium' | 'high' | 'critical'
  }
}

export interface LogEntry {
  timestamp: Date
  level: 'debug' | 'info' | 'warn' | 'error' | 'analytics'
  tag: string
  module: string
  data: any
  context?: LogContext
  storage: 'memory' | 'session' | 'persistent'
}

export interface LogFilter {
  level?: string[]
  tag?: string
  module?: string
  startTime?: Date
  endTime?: Date
  limit?: number

  // NEW: Business context filters
  category?: string[]    // ['device', 'sensor', 'flow'] - comma-separated from frontend
  severity?: string[]    // ['high', 'critical'] - comma-separated from frontend
  operation?: string     // 'health_check' - single operation filter
}

export class ModuleLogger {
  constructor(private module: string) {}

  debug(tag: string, data: any, context?: LogContext): void {
    UnifiedLoggingService.debug(tag, data, { ...context, module: this.module })
  }

  info(tag: string, data: any, context?: LogContext): void {
    UnifiedLoggingService.info(tag, data, { ...context, module: this.module })
  }

  warn(tag: string, data: any, context?: LogContext): void {
    UnifiedLoggingService.warn(tag, data, { ...context, module: this.module })
  }

  error(tag: string, data: any, context?: LogContext): void {
    UnifiedLoggingService.error(tag, data, { ...context, module: this.module })
  }

  analytics(tag: string, data: any, context?: LogContext): void {
    UnifiedLoggingService.analytics(tag, data, { ...context, module: this.module })
  }
}

export class UnifiedLoggingService {
  private static isEnabled: boolean = true
  private static debugMode: boolean = process.env.NODE_ENV === 'development'

  /**
   * Debug level logging - Memory only, session-based
   */
  static debug(tag: string, data: any, context?: LogContext): void {
    if (!this.debugMode) return
    
    this.createLogEntry('debug', tag, data, context, 'memory')
  }

  /**
   * Info level logging - Short-term DB storage (24h)
   */
  static info(tag: string, data: any, context?: LogContext): void {
    this.createLogEntry('info', tag, data, context, 'session')
  }

  /**
   * Warning level logging - Medium-term DB storage (7 days)  
   */
  static warn(tag: string, data: any, context?: LogContext): void {
    this.createLogEntry('warn', tag, data, context, 'persistent')
  }

  /**
   * Error level logging - Long-term DB storage (30 days)
   */
  static error(tag: string, data: any, context?: LogContext): void {
    this.createLogEntry('error', tag, data, context, 'persistent')
  }

  /**
   * Analytics level logging - Long-term DB storage (90 days)
   */
  static analytics(tag: string, data: any, context?: LogContext): void {
    this.createLogEntry('analytics', tag, data, context, 'persistent')
  }

  /**
   * Create module-specific logger
   */
  static createModuleLogger(module: string): ModuleLogger {
    return new ModuleLogger(module)
  }

  /**
   * Enable/disable logging system
   */
  static setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
  }

  /**
   * Enable/disable debug mode
   */
  static setDebugMode(enabled: boolean): void {
    this.debugMode = enabled
  }

  /**
   * Internal method to create log entry
   */
  private static createLogEntry(
    level: LogEntry['level'],
    tag: string,
    data: any,
    context?: LogContext,
    storage: LogEntry['storage'] = 'memory'
  ): void {
    if (!this.isEnabled) return

    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      tag,
      module: context?.module || 'unknown',
      data: this.sanitizeData(data),
      context: context ? { ...context } : undefined,
      storage
    }

    // Send to storage manager (will be implemented in next step)
    this.sendToStorage(logEntry)

    // Console fallback for development
    if (this.debugMode) {
      this.consoleOutput(logEntry)
    }
  }

  /**
   * Sanitize data to prevent circular references and sensitive info
   */
  private static sanitizeData(data: any): any {
    try {
      return JSON.parse(JSON.stringify(data))
    } catch (error) {
      return { error: 'Data serialization failed', original: String(data) }
    }
  }

  /**
   * Send log entry to storage manager
   */
  private static sendToStorage(entry: LogEntry): void {
    // Import LogStorageManager dynamically to avoid circular dependencies
    import('./LogStorageManager').then(({ LogStorageManager }) => {
      LogStorageManager.store(entry).catch(error => {
        console.error('LogStorageManager failed:', error)
      })
    }).catch(error => {
      console.error('Failed to import LogStorageManager:', error)
      // Fallback to temp storage
      this.tempStorageFallback(entry)
    })
  }

  /**
   * Fallback storage method
   */
  private static tempStorageFallback(entry: LogEntry): void {
    if (!UnifiedLoggingService.tempStorage) {
      UnifiedLoggingService.tempStorage = []
    }
    UnifiedLoggingService.tempStorage.push(entry)
    
    // Keep only last 1000 entries in memory
    if (UnifiedLoggingService.tempStorage.length > 1000) {
      UnifiedLoggingService.tempStorage = UnifiedLoggingService.tempStorage.slice(-1000)
    }
  }

  /**
   * Console output for development
   */
  private static consoleOutput(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString()
    //const prefix = `[${timestamp}] ${entry.level.toUpperCase()} [${entry.module}:${entry.tag}]`
    const prefix = ``
    switch (entry.level) {
      case 'debug':
        console.log(`🔍 ${prefix}`, entry.data)
        break
      case 'info':
        console.log(`ℹ️ ${prefix}`, entry.data)
        break
      case 'warn':
        console.warn(`⚠️ ${prefix}`, entry.data)
        break
      case 'error':
        console.error(`🔴 ${prefix}`, entry.data)
        break
      case 'analytics':
        console.log(`📊 ${prefix}`, entry.data)
        break
    }
  }

  // Temporary storage until LogStorageManager is implemented
  private static tempStorage: LogEntry[] = []

  /**
   * Get current memory logs (temporary method)
   */
  static getMemoryLogs(filter?: LogFilter): LogEntry[] {
    let logs = [...(this.tempStorage || [])]

    if (filter) {
      if (filter.level) {
        logs = logs.filter(log => filter.level!.includes(log.level))
      }
      if (filter.tag) {
        logs = logs.filter(log => log.tag.includes(filter.tag!))
      }
      if (filter.module) {
        logs = logs.filter(log => log.module.includes(filter.module!))
      }
      if (filter.startTime) {
        logs = logs.filter(log => log.timestamp >= filter.startTime!)
      }
      if (filter.endTime) {
        logs = logs.filter(log => log.timestamp <= filter.endTime!)
      }
      if (filter.limit) {
        logs = logs.slice(-filter.limit)
      }
    }

    return logs
  }

  /**
   * Clear memory logs
   */
  static clearMemoryLogs(): void {
    this.tempStorage = []
  }
}
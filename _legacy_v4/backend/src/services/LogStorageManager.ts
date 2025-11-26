// LogStorageManager.ts - Управление на съхранение на логове според стратегия

import { LogEntry as LogEntryModel, ILogEntry } from '../models/LogEntry'
import { LogEntry, LogFilter } from './UnifiedLoggingService'

export interface StorageStats {
  memoryEntries: number
  databaseEntries: number
  memoryUsage: string
  oldestEntry?: Date
  newestEntry?: Date
}

export class LogStorageManager {
  private static memoryBuffer: LogEntry[] = []
  private static readonly MAX_MEMORY_ENTRIES = 1000
  private static eventCallbacks: ((entry: LogEntry) => void)[] = []

  /**
   * Store log entry based on storage strategy
   */
  static async store(entry: LogEntry): Promise<void> {
    // За мониторинг на hybrid storage - log entry storage decision според storage strategy
    try {
      // Always add to memory buffer for real-time access
      this.addToMemoryBuffer(entry)

      // Notify real-time listeners
      this.notifyListeners(entry)

      // Store in database based on storage type
      if (entry.storage === 'session' || entry.storage === 'persistent') {
        await this.storeInDatabase(entry)
      }
    } catch (error) {
      console.error('Failed to store log entry:', error)
      
      // Fallback to console logging
      console.log(`[FALLBACK] ${entry.level.toUpperCase()} [${entry.module}:${entry.tag}]`, entry.data)
    }
  }

  /**
   * Add entry to memory buffer with size management
   */
  private static addToMemoryBuffer(entry: LogEntry): void {
    // За мониторинг на memory buffer management - circular buffer operations с size control
    this.memoryBuffer.push(entry)

    // Keep only the latest MAX_MEMORY_ENTRIES
    if (this.memoryBuffer.length > this.MAX_MEMORY_ENTRIES) {
      this.memoryBuffer = this.memoryBuffer.slice(-this.MAX_MEMORY_ENTRIES)
    }
  }

  /**
   * Store entry in MongoDB
   */
  private static async storeInDatabase(entry: LogEntry): Promise<void> {
    // За мониторинг на database persistence - MongoDB storage за session/persistent entries
    try {
      const dbEntry = new LogEntryModel({
        timestamp: entry.timestamp,
        level: entry.level,
        tag: entry.tag,
        module: entry.module,
        data: entry.data,
        context: entry.context,
        storage: entry.storage
      })

      await dbEntry.save()
    } catch (error) {
      console.error('Database storage failed:', error)
      throw error
    }
  }

  /**
   * Get logs from memory buffer
   */
  static getMemoryLogs(filter?: LogFilter): LogEntry[] {
    // За мониторинг на memory log retrieval - fast memory buffer access с filtering
    let logs = [...this.memoryBuffer]

    if (filter) {
      logs = this.applyFilter(logs, filter)
    }

    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  /**
   * Get logs from database
   */
  static async getPersistedLogs(filter?: LogFilter): Promise<ILogEntry[]> {
    // За мониторинг на database queries - MongoDB query execution с complex filters
    try {
      let query = LogEntryModel.find()

      if (filter) {
        const conditions: any = {}

        if (filter.level && filter.level.length > 0) {
          conditions.level = { $in: filter.level }
        }

        if (filter.tag) {
          conditions.tag = { $regex: filter.tag, $options: 'i' }
        }

        if (filter.module) {
          conditions.module = { $regex: filter.module, $options: 'i' }
        }

        if (filter.startTime || filter.endTime) {
          conditions.timestamp = {}
          if (filter.startTime) {
            conditions.timestamp.$gte = filter.startTime
          }
          if (filter.endTime) {
            conditions.timestamp.$lte = filter.endTime
          }
        }

        // NEW: Business context filters
        if (filter.category && filter.category.length > 0) {
          conditions['context.business.category'] = { $in: filter.category }
        }

        if (filter.severity && filter.severity.length > 0) {
          conditions['context.business.severity'] = { $in: filter.severity }
        }

        if (filter.operation) {
          conditions['context.business.operation'] = { $regex: filter.operation, $options: 'i' }
        }

        query = query.where(conditions)
      }

      query = query.sort({ timestamp: -1 })

      if (filter?.limit) {
        query = query.limit(filter.limit)
      } else {
        query = query.limit(1000) // Default limit
      }

      const results = await query.exec()
      return results
    } catch (error) {
      console.error('Database query failed:', error)
      return []
    }
  }

  /**
   * Get combined logs (memory + database)
   */
  static async getAllLogs(filter?: LogFilter): Promise<LogEntry[]> {
    // За мониторинг на unified log retrieval - memory + database combination с deduplication
    try {
      // Get memory logs
      const memoryLogs = this.getMemoryLogs(filter)

      // Get database logs
      const dbLogs = await this.getPersistedLogs(filter)

      // Convert database logs to LogEntry format
      const convertedDbLogs: LogEntry[] = dbLogs.map(dbLog => ({
        timestamp: dbLog.timestamp,
        level: dbLog.level,
        tag: dbLog.tag,
        module: dbLog.module,
        data: dbLog.data,
        context: dbLog.context,
        storage: dbLog.storage
      }))

      // Combine and deduplicate
      const allLogs = [...memoryLogs, ...convertedDbLogs]
      const uniqueLogs = this.deduplicateLogs(allLogs)

      // Sort by timestamp (newest first)
      uniqueLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

      // Apply limit if specified
      if (filter?.limit) {
        return uniqueLogs.slice(0, filter.limit)
      }

      return uniqueLogs
    } catch (error) {
      console.error('Failed to get all logs:', error)
      return this.getMemoryLogs(filter)
    }
  }

  /**
   * Apply filter to log entries
   */
  private static applyFilter(logs: LogEntry[], filter: LogFilter): LogEntry[] {
    // За мониторинг на filtering operations - consistent filter application across storage layers
    let filtered = logs

    if (filter.level && filter.level.length > 0) {
      filtered = filtered.filter(log => filter.level!.includes(log.level))
    }

    if (filter.tag) {
      filtered = filtered.filter(log => 
        log.tag.toLowerCase().includes(filter.tag!.toLowerCase())
      )
    }

    if (filter.module) {
      filtered = filtered.filter(log => 
        log.module.toLowerCase().includes(filter.module!.toLowerCase())
      )
    }

    if (filter.startTime) {
      filtered = filtered.filter(log => log.timestamp >= filter.startTime!)
    }

    if (filter.endTime) {
      filtered = filtered.filter(log => log.timestamp <= filter.endTime!)
    }

    // NEW: Business context filters
    if (filter.category && filter.category.length > 0) {
      filtered = filtered.filter(log =>
        log.context?.business?.category && filter.category!.includes(log.context.business.category)
      )
    }

    if (filter.severity && filter.severity.length > 0) {
      filtered = filtered.filter(log =>
        log.context?.business?.severity && filter.severity!.includes(log.context.business.severity)
      )
    }

    if (filter.operation) {
      filtered = filtered.filter(log =>
        log.context?.business?.operation?.toLowerCase().includes(filter.operation!.toLowerCase())
      )
    }

    if (filter.limit) {
      filtered = filtered.slice(-filter.limit)
    }

    return filtered
  }

  /**
   * Remove duplicate log entries (based on timestamp + content hash)
   */
  private static deduplicateLogs(logs: LogEntry[]): LogEntry[] {
    // За мониторинг на deduplication - hash-based duplicate removal за combined datasets
    const seen = new Set<string>()
    return logs.filter(log => {
      const hash = `${log.timestamp.getTime()}_${log.level}_${log.tag}_${log.module}`
      if (seen.has(hash)) {
        return false
      }
      seen.add(hash)
      return true
    })
  }

  /**
   * Clear memory buffer
   */
  static clearMemoryLogs(): void {
    // За мониторинг на data cleanup - memory buffer и database cleanup operations
    this.memoryBuffer = []
    console.log('🗑️ Memory logs cleared')
  }

  /**
   * Clear database logs based on criteria
   */
  static async clearDatabaseLogs(filter?: LogFilter): Promise<number> {
    try {
      let query: any = {}

      if (filter) {
        if (filter.level && filter.level.length > 0) {
          query.level = { $in: filter.level }
        }

        if (filter.module) {
          query.module = { $regex: filter.module, $options: 'i' }
        }

        if (filter.startTime || filter.endTime) {
          query.timestamp = {}
          if (filter.startTime) {
            query.timestamp.$gte = filter.startTime
          }
          if (filter.endTime) {
            query.timestamp.$lte = filter.endTime
          }
        }
      }

      const result = await LogEntryModel.deleteMany(query)
      console.log(`🗑️ Deleted ${result.deletedCount} database log entries`)
      return result.deletedCount || 0
    } catch (error) {
      console.error('Failed to clear database logs:', error)
      return 0
    }
  }

  /**
   * Get storage statistics
   */
  static async getStorageStats(): Promise<StorageStats> {
    // За мониторинг на storage analytics - memory usage, database counts и health metrics
    try {
      const memoryEntries = this.memoryBuffer.length
      const dbCount = await LogEntryModel.countDocuments()

      const memoryUsage = this.calculateMemoryUsage()

      let oldestEntry: Date | undefined
      let newestEntry: Date | undefined

      if (memoryEntries > 0) {
        const timestamps = this.memoryBuffer.map(log => log.timestamp)
        oldestEntry = new Date(Math.min(...timestamps.map(t => t.getTime())))
        newestEntry = new Date(Math.max(...timestamps.map(t => t.getTime())))
      }

      return {
        memoryEntries,
        databaseEntries: dbCount,
        memoryUsage,
        oldestEntry,
        newestEntry
      }
    } catch (error) {
      console.error('Failed to get storage stats:', error)
      return {
        memoryEntries: this.memoryBuffer.length,
        databaseEntries: 0,
        memoryUsage: 'unknown'
      }
    }
  }

  /**
   * Calculate approximate memory usage
   */
  private static calculateMemoryUsage(): string {
    try {
      const jsonString = JSON.stringify(this.memoryBuffer)
      const bytes = new Blob([jsonString]).size
      
      if (bytes < 1024) return `${bytes} B`
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    } catch (error) {
      return 'unknown'
    }
  }

  /**
   * Subscribe to real-time log events
   */
  static subscribe(callback: (entry: LogEntry) => void): void {
    // За мониторинг на event subscriptions - observer pattern registration и cleanup
    this.eventCallbacks.push(callback)
  }

  /**
   * Unsubscribe from real-time log events
   */
  static unsubscribe(callback: (entry: LogEntry) => void): void {
    const index = this.eventCallbacks.indexOf(callback)
    if (index > -1) {
      this.eventCallbacks.splice(index, 1)
    }
  }

  /**
   * Notify all listeners about new log entry
   */
  private static notifyListeners(entry: LogEntry): void {
    // За мониторинг на callback execution - safe listener notification със error handling
    this.eventCallbacks.forEach(callback => {
      try {
        callback(entry)
      } catch (error) {
        console.error('Log listener callback failed:', error)
      }
    })
  }

  /**
   * Get analytics data
   */
  static async getAnalytics(startTime: Date, endTime: Date): Promise<any[]> {
    // За мониторинг на performance metrics - retrieval times, memory footprint и query efficiency
    try {
      return await LogEntryModel.getAnalytics(startTime, endTime)
    } catch (error) {
      console.error('Failed to get analytics:', error)
      return []
    }
  }
}
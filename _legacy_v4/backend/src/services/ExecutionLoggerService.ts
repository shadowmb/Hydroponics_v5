// ExecutionLoggerService.ts - Raw execution data logging service

import fs from 'fs/promises'
import path from 'path'

interface ExecutionLogEntry {
  timestamp: string
  type: string
  data: any
}

interface ExecutionLogMetadata {
  programId: string
  programName: string
  cycleIndex: number
  cycleId: string
  actionIndex: number
  flowId: string
  startTime: string
  endTime?: string
}

interface ExecutionLog {
  metadata: ExecutionLogMetadata
  entries: ExecutionLogEntry[]
}

export class ExecutionLoggerService {
  private logsDir: string
  private currentLog: ExecutionLog | null = null
  private currentLogFile: string | null = null

  constructor() {
    this.logsDir = path.join(process.cwd(), 'logs', 'execution')
    this.ensureLogsDirectory()
  }

  private async ensureLogsDirectory() {
    // За мониторинг на logs directory initialization - recursive directory creation със error handling
    try {
      await fs.mkdir(this.logsDir, { recursive: true })
    } catch (error) {
      console.error('Failed to create logs directory:', error)
    }
  }

  async startExecutionLog(metadata: Omit<ExecutionLogMetadata, 'startTime' | 'endTime'>) {
    // За мониторинг на execution log startup - metadata initialization и unique filename generation
    const startTime = new Date().toISOString()
    const timestamp = startTime.replace(/[:.]/g, '-').replace('T', '_').split('.')[0]
    
    this.currentLog = {
      metadata: {
        ...metadata,
        startTime
      },
      entries: []
    }

    this.currentLogFile = path.join(
      this.logsDir,
      `execution_${timestamp}_${metadata.programName}_${metadata.cycleId}_action${metadata.actionIndex}.json`
    )

    //console.log(`📝 [ExecutionLogger] Started logging to: ${path.basename(this.currentLogFile)}`)
  }

  async logEntry(type: string, data: any) {
    // За мониторинг на selective event filtering - relevant event type identification
    if (!this.currentLog) {
      return
    }

    // Filter relevant events for raw logging
    const relevantTypes = ['block_executed', 'status_change', 'variable_updated']
    if (!relevantTypes.includes(type)) {
      return
    }

    // За мониторинг на block type filtering - sensor/actuator focus за hardware operations
    // Filter only sensor/actuator blocks for block_executed
    if (type === 'block_executed') {
      const blockType = data.blockType
      if (blockType !== 'sensor' && blockType !== 'actuator') {
        return
      }
    }

    // За мониторинг на data cloning - deep clone operations за reference safety
    const entry: ExecutionLogEntry = {
      timestamp: new Date().toISOString(),
      type,
      data: JSON.parse(JSON.stringify(data)) // Deep clone to avoid references
    }

    this.currentLog.entries.push(entry)
  }

  async endExecutionLog() {
    // За мониторинг на log finalization - JSON file writing със entry count statistics
    if (!this.currentLog || !this.currentLogFile) {
      return
    }

    this.currentLog.metadata.endTime = new Date().toISOString()

    try {
      const logContent = JSON.stringify(this.currentLog, null, 2)
      await fs.writeFile(this.currentLogFile, logContent, 'utf8')
      
      console.log(`📝 [ExecutionLogger] Log saved: ${path.basename(this.currentLogFile)} (${this.currentLog.entries.length} entries)`)
    } catch (error) {
      console.error('Failed to save execution log:', error)
    }

    this.currentLog = null
    this.currentLogFile = null
  }

  async getLogFiles(): Promise<string[]> {
    // За мониторинг на log file management - directory listing и JSON file reading operations
    try {
      const files = await fs.readdir(this.logsDir)
      return files.filter(file => file.startsWith('execution_') && file.endsWith('.json'))
    } catch (error) {
      console.error('Failed to read logs directory:', error)
      return []
    }
  }

  async readLogFile(filename: string): Promise<ExecutionLog | null> {
    // За мониторинг на file I/O operations - JSON file parsing със error handling
    try {
      const filePath = path.join(this.logsDir, filename)
      const content = await fs.readFile(filePath, 'utf8')
      return JSON.parse(content)
    } catch (error) {
      console.error('Failed to read log file:', error)
      return null
    }
  }
}
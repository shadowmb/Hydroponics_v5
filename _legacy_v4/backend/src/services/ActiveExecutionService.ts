import { ActiveExecution, IActiveExecution } from '../models/ActiveExecution'

/**
 * @deprecated This service is deprecated. Use ExecutionSession tracking instead.
 * Will be removed in future versions.
 */
export class ActiveExecutionService {
  
  /**
   * Record the start of a block execution
   */
  static async recordBlockStart(data: {
    programId: string
    cycleId: string
    blockId: string
    blockType: 'actuator' | 'sensor'
    action: string
    actionTemplateId: string
    actionIndex: number
  }): Promise<IActiveExecution> {
    return await ActiveExecution.create({
      ...data,
      status: 'in_progress',
      startTime: new Date()
    })
  }

  /**
   * Record the completion of a block execution
   */
  static async recordBlockComplete(
    blockId: string,
    endTime: Date,
    result?: any
  ): Promise<IActiveExecution | null> {
    return await ActiveExecution.findOneAndUpdate(
      { blockId, status: 'in_progress' },
      { 
        status: 'completed',
        endTime,
        duration: result?.executionTime,
        result 
      },
      { new: true }
    )
  }

  /**
   * Record the failure of a block execution
   */
  static async recordBlockFailed(
    blockId: string,
    error: any
  ): Promise<IActiveExecution | null> {
    return await ActiveExecution.findOneAndUpdate(
      { blockId, status: 'in_progress' },
      { 
        status: 'failed',
        endTime: new Date(),
        result: { error: error.message }
      },
      { new: true }
    )
  }

  /**
   * Get all active (in_progress) executions
   */
  static async getActiveExecutions(): Promise<IActiveExecution[]> {
    return await ActiveExecution.find({ status: 'in_progress' })
      .sort({ startTime: -1 })
      .lean()
  }

  /**
   * Get recent completed executions
   */
  static async getRecentExecutions(limit: number = 4): Promise<IActiveExecution[]> {
    return await ActiveExecution.find({ status: { $in: ['completed', 'failed'] } })
      .sort({ endTime: -1 })
      .limit(limit)
      .lean()
  }

  /**
   * Check for interrupted cycle executions and clean them up before starting new cycle
   */
  static async cleanupInterruptedCycle(programId: string, cycleId: string, programName: string): Promise<void> {
    const existingExecutions = await ActiveExecution.find({ programId, cycleId }).lean()
    
    if (existingExecutions.length > 0) {
      console.log(`🔧 Found ${existingExecutions.length} interrupted executions for cycle ${cycleId}`)
      
      // Generate interrupted cycle log
      await this.generateInterruptedCycleLog(programId, cycleId, programName, existingExecutions)
      
      // Clean up interrupted executions
      await ActiveExecution.deleteMany({ programId, cycleId })
      console.log(`🗑️ Cleaned up interrupted executions for cycle ${cycleId}`)
    }
  }

  /**
   * Generate cycle execution log and clean up executions for a completed cycle
   */
  static async cleanupCycle(programId: string, cycleId: string, programName: string): Promise<void> {
    // Generate execution log before cleanup
    await this.generateCycleExecutionLog(programId, cycleId, programName)
    
    // Clean up from database
    await ActiveExecution.deleteMany({ programId, cycleId })
  }

  /**
   * Get execution history for a specific cycle (for logging)
   */
  static async getCycleHistory(programId: string, cycleId: string): Promise<IActiveExecution[]> {
    return await ActiveExecution.find({ programId, cycleId })
      .sort({ startTime: 1 })
      .lean()
  }

  /**
   * Generate interrupted cycle execution log file from database records
   */
  private static async generateInterruptedCycleLog(programId: string, cycleId: string, programName: string, executions: any[]): Promise<void> {
    try {
      if (executions.length === 0) {
        return
      }

      // Generate filename: execution_YYYY-MM-DD_HH-mm-ss-SSS_programName_cycleId_INTERRUPTED.json
      const now = new Date()
      const timestamp = now.toISOString().replace(/:/g, '-').replace('T', '_').replace(/\./g, '-').replace('Z', 'Z')
      const filename = `execution_${timestamp}_${programName}_${cycleId}_INTERRUPTED.json`
      
      // Group executions by actionTemplateId and actionIndex
      const actionTemplates = new Map()
      
      executions.forEach(execution => {
        const key = `${execution.actionTemplateId}_${execution.actionIndex}`
        if (!actionTemplates.has(key)) {
          actionTemplates.set(key, {
            actionTemplateId: execution.actionTemplateId,
            actionIndex: execution.actionIndex,
            executions: []
          })
        }
        actionTemplates.get(key).executions.push({
          blockId: execution.blockId,
          blockType: execution.blockType,
          action: execution.action,
          status: execution.status,
          startTime: execution.startTime,
          endTime: execution.endTime,
          duration: execution.duration,
          result: execution.result
        })
      })

      // Create log structure
      const logData = {
        programId,
        programName,
        cycleId,
        cycleNumber: parseInt(cycleId.split('-')[1] || '0'),
        timestamp: now.toISOString(),
        status: 'INTERRUPTED',
        totalExecutions: executions.length,
        actionTemplates: Array.from(actionTemplates.values()).sort((a, b) => a.actionIndex - b.actionIndex)
      }

      // Ensure logs directory exists
      const fs = await import('fs').then(m => m.promises)
      const path = await import('path')
      const logsDir = path.join(process.cwd(), 'logs', 'execution')
      
      try {
        await fs.access(logsDir)
      } catch {
        await fs.mkdir(logsDir, { recursive: true })
      }

      // Write log file
      const filePath = path.join(logsDir, filename)
      await fs.writeFile(filePath, JSON.stringify(logData, null, 2), 'utf-8')
      
      console.log(`📝 [ActiveExecutionService] Interrupted cycle log saved: ${filename} (${executions.length} executions)`)
      
    } catch (error) {
      // За мониторинг на file system error handling - graceful error recovery при file operations
      console.error('Failed to generate interrupted cycle execution log:', error)
    }
  }

  /**
   * Generate cycle execution log file from database records
   */
  private static async generateCycleExecutionLog(programId: string, cycleId: string, programName: string): Promise<void> {
    try {
      const executions = await this.getCycleHistory(programId, cycleId)
      
      if (executions.length === 0) {
        console.log(`📝 No executions to log for cycle ${cycleId}`)
        return
      }

      // Generate filename: execution_YYYY-MM-DD_HH-mm-ss-SSS_programName_cycleId.json
      const now = new Date()
      const timestamp = now.toISOString().replace(/:/g, '-').replace('T', '_').replace(/\./g, '-').replace('Z', 'Z')
      const filename = `execution_${timestamp}_${programName}_${cycleId}.json`
      
      // За мониторинг на actionTemplate grouping - execution organization по template и action index
      // Group executions by actionTemplateId and actionIndex
      const actionTemplates = new Map()
      
      executions.forEach(execution => {
        const key = `${execution.actionTemplateId}_${execution.actionIndex}`
        if (!actionTemplates.has(key)) {
          actionTemplates.set(key, {
            actionTemplateId: execution.actionTemplateId,
            actionIndex: execution.actionIndex,
            executions: []
          })
        }
        actionTemplates.get(key).executions.push({
          blockId: execution.blockId,
          blockType: execution.blockType,
          action: execution.action,
          status: execution.status,
          startTime: execution.startTime,
          endTime: execution.endTime,
          duration: execution.duration,
          result: execution.result
        })
      })

      // Create log structure
      const logData = {
        programId,
        programName,
        cycleId,
        cycleNumber: parseInt(cycleId.split('-')[1] || '0'),
        timestamp: now.toISOString(),
        totalExecutions: executions.length,
        actionTemplates: Array.from(actionTemplates.values()).sort((a, b) => a.actionIndex - b.actionIndex)
      }

      // Ensure logs directory exists
      const fs = await import('fs').then(m => m.promises)
      const path = await import('path')
      const logsDir = path.join(process.cwd(), 'logs', 'execution')
      
      try {
        await fs.access(logsDir)
      } catch {
        await fs.mkdir(logsDir, { recursive: true })
      }

      // Write log file
      const filePath = path.join(logsDir, filename)
      await fs.writeFile(filePath, JSON.stringify(logData, null, 2), 'utf-8')
      
      console.log(`📝 [ActiveExecutionService] Cycle execution log saved: ${filename} (${executions.length} executions)`)
      
    } catch (error) {
      console.error('Failed to generate cycle execution log:', error)
    }
  }
}
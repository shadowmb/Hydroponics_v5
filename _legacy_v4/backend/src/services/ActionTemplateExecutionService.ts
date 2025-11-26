// ABOUTME: Singleton service for standalone ActionTemplate execution
// ABOUTME: Manages flow loading, ExecutionSession creation, and FlowExecutor lifecycle

import { ActionTemplate, IActionTemplate } from '../models/ActionTemplate'
import { FlowTemplate } from '../models/FlowTemplate'
import { ExecutionSession } from '../models/ExecutionSession'
import { FlowExecutor } from '../modules/flowExecutor'
import { CancellationToken } from '../modules/flowExecutor/core/CancellationToken'
import fs from 'fs/promises'

export class ActionTemplateExecutionService {
  private static instance: ActionTemplateExecutionService
  private flowExecutor: FlowExecutor
  private cancellationToken: CancellationToken

  private constructor() {
    this.cancellationToken = new CancellationToken()
    this.flowExecutor = new FlowExecutor({
      cancellationToken: this.cancellationToken
    })
  }

  static getInstance(): ActionTemplateExecutionService {
    if (!ActionTemplateExecutionService.instance) {
      ActionTemplateExecutionService.instance = new ActionTemplateExecutionService()
    }
    return ActionTemplateExecutionService.instance
  }

  /**
   * Start standalone ActionTemplate execution
   */
  async startActionTemplate(
    actionTemplateId: string,
    globalVariablesOverride?: Record<string, any>
  ): Promise<{ success: boolean; executionSessionId?: string; message: string }> {
    let sessionId: string | null = null

    try {
      // Load ActionTemplate flow
      const { actionTemplate, flowData } = await this.loadActionTemplateFlow(actionTemplateId)

      // Create ExecutionSession
      sessionId = await this.createStandaloneExecutionSession(
        actionTemplate.name,
        actionTemplateId
      )

      // Update runStatus: true (ATOMIC LOCK)
      await ActionTemplate.findByIdAndUpdate(actionTemplateId, { runStatus: true })

      // Prepare global variables
      const globalVariables = {
        ...actionTemplate.globalVariables,
        ...globalVariablesOverride,
        actionTemplateId: actionTemplateId,
        actionTemplateName: actionTemplate.name,
        executionMode: 'standalone',
        executionSessionId: sessionId,
        actionTemplateStartTime: new Date().toISOString()
      }

      // Start async execution (non-blocking)
      this.executeFlowAsync(actionTemplateId, flowData, globalVariables, sessionId)

      return {
        success: true,
        executionSessionId: sessionId,
        message: 'ActionTemplate execution started'
      }
    } catch (error: any) {
      // If error before execution started, cleanup
      if (sessionId) {
        await this.completeExecutionSession(sessionId, false, error.message)
      }
      await ActionTemplate.findByIdAndUpdate(actionTemplateId, { runStatus: false })

      return {
        success: false,
        message: error.message || 'Failed to start ActionTemplate'
      }
    }
  }

  /**
   * Stop standalone ActionTemplate execution
   */
  async stopActionTemplate(actionTemplateId: string): Promise<{ success: boolean; message: string }> {
    try {
      const actionTemplate = await ActionTemplate.findById(actionTemplateId)

      if (!actionTemplate) {
        return { success: false, message: 'ActionTemplate not found' }
      }

      if (!actionTemplate.runStatus) {
        return { success: false, message: 'ActionTemplate is not running' }
      }

      // Stop FlowExecutor
      this.flowExecutor.stop()

      // Reset runStatus
      await ActionTemplate.findByIdAndUpdate(actionTemplateId, { runStatus: false })

      // Find and complete ExecutionSession
      const session = await ExecutionSession.findOne({
        programId: `standalone-AT-${actionTemplateId}`,
        programStatus: 'running'
      })

      if (session) {
        await this.completeExecutionSession(session._id.toString(), false, 'Stopped by user')
      }

      return { success: true, message: 'ActionTemplate stopped' }
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to stop ActionTemplate' }
    }
  }

  /**
   * Resume paused ActionTemplate execution
   */
  resumeExecution(): boolean {
    return this.flowExecutor.resume()
  }

  /**
   * Load ActionTemplate flow from disk
   */
  private async loadActionTemplateFlow(
    actionTemplateId: string
  ): Promise<{ actionTemplate: any; flowData: any }> {
    // Load ActionTemplate
    const actionTemplate = await ActionTemplate.findById(actionTemplateId).lean()
    if (!actionTemplate) {
      throw new Error('ActionTemplate not found')
    }

    if (!actionTemplate.flowFile) {
      throw new Error('ActionTemplate has no flowFile')
    }

    // Find FlowTemplate by jsonFileName
    const flowTemplate = await FlowTemplate.findOne({
      jsonFileName: actionTemplate.flowFile
    }).lean()

    if (!flowTemplate) {
      throw new Error('FlowTemplate not found')
    }

    // Construct full file path
    const fullFilePath = `${process.cwd()}/../${flowTemplate.filePath}${flowTemplate.jsonFileName}`

    // Read flow JSON from disk
    const fileContent = await fs.readFile(fullFilePath, 'utf-8')
    const flowData = JSON.parse(fileContent)

    return { actionTemplate, flowData }
  }

  /**
   * Create standalone ExecutionSession
   */
  private async createStandaloneExecutionSession(
    actionTemplateName: string,
    actionTemplateId: string
  ): Promise<string> {
    const session = new ExecutionSession({
      programId: `standalone-AT-${actionTemplateId}`,
      programName: `Standalone: ${actionTemplateName}`,
      programStartTime: new Date(),
      programStatus: 'running',
      cycles: [
        {
          cycleId: 'standalone-cycle',
          cycleName: 'Standalone Execution',
          cycleStartTime: new Date(),
          cycleStatus: 'running',
          flows: []
        }
      ]
    })

    await session.save()
    return session._id.toString()
  }

  /**
   * Execute flow asynchronously (non-blocking)
   */
  private async executeFlowAsync(
    actionTemplateId: string,
    flowData: any,
    globalVariables: Record<string, any>,
    sessionId: string
  ): Promise<void> {
    const programId = `standalone-AT-${actionTemplateId}`
    const cycleKey = `${programId}:standalone-cycle`

    try {
      console.log(`🚀 [ActionTemplateExecutionService] Starting flow execution for AT: ${actionTemplateId}`)

      // Register in SchedulerService.runningCycles for pause/resume support
      const { SchedulerService } = await import('./SchedulerService')
      const schedulerService = SchedulerService.getInstance()
      const runningCycles = (schedulerService as any).runningCycles as Map<string, any>

      runningCycles.set(cycleKey, {
        cycleId: 'standalone-cycle',
        programId: programId,
        startTime: new Date(),
        maxEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h max
      })
      console.log(`📝 [ActionTemplateExecutionService] Registered execution in runningCycles: ${cycleKey}`)

      // Reset cancellation token
      this.cancellationToken.reset()

      // Execute flow
      const result = await this.flowExecutor.executeFlow(flowData, globalVariables)

      console.log(`✅ [ActionTemplateExecutionService] Flow execution completed: ${result}`)

      // Complete ExecutionSession
      await this.completeExecutionSession(sessionId, result)
    } catch (error: any) {
      console.error(`❌ [ActionTemplateExecutionService] Flow execution failed:`, error)

      // Fail ExecutionSession
      await this.completeExecutionSession(sessionId, false, error.message)
    } finally {
      // Deregister from runningCycles
      const { SchedulerService } = await import('./SchedulerService')
      const schedulerService = SchedulerService.getInstance()
      const runningCycles = (schedulerService as any).runningCycles as Map<string, any>
      runningCycles.delete(cycleKey)
      console.log(`🗑️ [ActionTemplateExecutionService] Deregistered execution from runningCycles: ${cycleKey}`)

      // ALWAYS reset runStatus
      await ActionTemplate.findByIdAndUpdate(actionTemplateId, { runStatus: false })
      console.log(`🔄 [ActionTemplateExecutionService] runStatus reset for AT: ${actionTemplateId}`)

      // Broadcast completion event via WebSocket
      await this.broadcastCompletionEvent(actionTemplateId, sessionId)
    }
  }

  private async broadcastCompletionEvent(actionTemplateId: string, sessionId: string): Promise<void> {
    try {
      const { WebSocketManager } = require('../modules/flowExecutor/core/WebSocketManager')
      const wsManager = WebSocketManager.getInstance()

      // Fetch ExecutionSession to determine success status
      const session = await ExecutionSession.findById(sessionId)
      const success = session?.programStatus === 'completed'

      wsManager.broadcast({
        type: 'action_template_completed',
        timestamp: new Date().toISOString(),
        data: {
          actionTemplateId,
          executionSessionId: sessionId,
          success
        }
      })

      console.log(`📡 [ActionTemplateExecutionService] Broadcasted completion event for AT: ${actionTemplateId}, success: ${success}`)
    } catch (error) {
      console.error('Failed to broadcast completion event:', error)
    }
  }

  /**
   * Complete ExecutionSession
   */
  private async completeExecutionSession(
    sessionId: string,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    try {
      const session = await ExecutionSession.findById(sessionId)
      if (!session) return

      session.programStatus = success ? 'completed' : 'failed'
      session.programEndTime = new Date()

      if (session.cycles.length > 0) {
        session.cycles[0].cycleStatus = success ? 'completed' : 'failed'
        session.cycles[0].cycleEndTime = new Date()
      }

      await session.save()
    } catch (error) {
      console.error('Failed to complete ExecutionSession:', error)
    }
  }
}
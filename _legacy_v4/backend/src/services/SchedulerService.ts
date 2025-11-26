import * as cron from 'node-cron'
import { ActiveProgram, IActiveProgram, IActiveCycle } from '../models/ActiveProgram'
import { ActionTemplate } from '../models/ActionTemplate'
import { FlowTemplate } from '../models/FlowTemplate'
import { MonitoringFlow, IMonitoringFlow } from '../models/MonitoringFlow'
import { HealthConfig } from '../models/HealthConfig'
import { FlowExecutor } from '../modules/flowExecutor'
import { CancellationToken } from '../modules/flowExecutor/core/CancellationToken'
import { WebSocket } from 'ws'
import { UnifiedLoggingService } from './UnifiedLoggingService'
import { HardwareHealthChecker } from './HardwareHealthChecker'
import { LogTags } from '../utils/LogTags'

interface ICycleExecution {
  cycleId: string
  programId: string
  startTime: Date
  maxEndTime: Date
}

export class SchedulerService {
  private static instance: SchedulerService
  private cronJob: cron.ScheduledTask | null = null
  private dailyCleanupCronJob: cron.ScheduledTask | null = null
  private runningCycles: Map<string, ICycleExecution> = new Map()
  private monitoringExecutions: Map<string, Date> = new Map()
  private runningMonitoringFlows: Map<string, Date> = new Map()
  private isRunning = false
  private flowExecutor: FlowExecutor
  private wsClient: WebSocket | null = null
  private logger = UnifiedLoggingService.createModuleLogger('SchedulerService.ts')
  private lastMonitoringCount = 0
  private cancellationToken: CancellationToken
  private hardwareHealthChecker: HardwareHealthChecker
  private lastHealthCheck?: Date
  private healthConfig: any = null // Cached health configuration

  private constructor() {
    // 🚩 NEW: Създай споделен CancellationToken
    this.cancellationToken = new CancellationToken()
    
    // Initialize FlowExecutor in mock mode for safety with shared token
    this.flowExecutor = new FlowExecutor({
      mockMode: true,
      cancellationToken: this.cancellationToken
    })
    
    // Initialize HardwareHealthChecker
    this.hardwareHealthChecker = HardwareHealthChecker.getInstance()
    
    // Load health configuration
    this.loadHealthConfiguration()
    
    this.initWebSocket()
  }

  private initWebSocket(): void {
    try {
      this.wsClient = new WebSocket('ws://localhost:5000/ws/flow')
      this.wsClient.on('open', () => {
        this.logger.info(LogTags.system.startup.completed, {
          message: 'WebSocket connection established',
          status: 'connected',
          url: 'ws://localhost:5000/ws/flow'
        }, {
          source: { file: 'SchedulerService.ts', method: 'initWebSocket' },
          business: { category: 'system', operation: 'websocket_connection' }
        })
      })
      this.wsClient.on('error', (error) => {
        this.logger.error(LogTags.system.startup.failed, {
          message: 'WebSocket connection error',
          error: error.message,
          stack: error.stack
        }, {
          source: { file: 'SchedulerService.ts', method: 'initWebSocket' },
          business: { category: 'system', operation: 'websocket_connection' }
        })
      })
      this.wsClient.on('close', () => {
        this.logger.warn(LogTags.system.health.warning, {
          message: 'WebSocket connection closed',
          status: 'disconnected'
        }, {
          source: { file: 'SchedulerService.ts', method: 'initWebSocket' },
          business: { category: 'system', operation: 'websocket_connection' }
        })
      })
    } catch (error) {
      this.logger.error(LogTags.system.startup.failed, {
        message: 'Failed to initialize WebSocket connection',
        error: error instanceof Error ? error.message : String(error)
      }, {
        source: { file: 'SchedulerService.ts', method: 'initWebSocket' },
        business: { category: 'system', operation: 'websocket_connection' }
      })
    }
  }

  static getInstance(): SchedulerService {
    if (!SchedulerService.instance) {
      SchedulerService.instance = new SchedulerService()
    }
    return SchedulerService.instance
  }

  /**
   * Start the scheduler - runs every minute
   */
  start(): void {
    // За мониторинг на scheduler lifecycle - стартиране на основния cron job за минутни тикове
    if (this.isRunning) {
      this.logger.warn(LogTags.system.health.warning, {
        message: 'Scheduler already running',
        status: 'already_running'
      }, {
        source: { file: 'SchedulerService.ts', method: 'start' },
        business: { category: 'system', operation: 'scheduler_lifecycle' }
      })
      return
    }

    // this.logger.info(LogTags.system.startup.started, {
    //   message: 'Starting scheduler service',
    //   status: 'starting'
    // }, {
    //   source: { file: 'SchedulerService.ts', method: 'start' },
    //   business: { category: 'system', operation: 'scheduler_lifecycle' }
    // })
    
    // 🔍 NEW: Run mandatory full health check at startup FIRST
    // This must run first as other operations depend on hardware status
    this.runStartupHealthCheck()
    
    // 🧹 NEW: Cleanup interrupted execution sessions from server restart
    this.cleanupInterruptedExecutionSessions()
    
    // 🔄 NEW: Check for pending monitoring queue on startup
    this.checkPendingMonitoringOnStartup()
    
    // Run every minute: "0 * * * * *" (every minute at second 0)
    this.cronJob = cron.schedule('0 * * * * *', async () => {
      try {
        await this.processActivePrograms()
        await this.checkHardwareHealthIfNeeded()
      } catch (error) {
        //this.logger.error('scheduler-tick-error', { error: error instanceof Error ? error.message : String(error) })
      }
    }, {
      timezone: 'Europe/Sofia'
    })

    // Daily cleanup at midnight: "0 0 * * *" (every day at 00:00)
    this.dailyCleanupCronJob = cron.schedule('0 0 * * *', async () => {
      try {
        await this.performDailyCleanup()
      } catch (error) {
        this.logger.error(LogTags.system.health.critical, {
          message: 'Daily cleanup operation failed',
          action: 'daily_cleanup_error',
          error: error instanceof Error ? error.message : String(error)
        }, {
          source: { file: 'SchedulerService.ts', method: 'start' },
          business: { category: 'system', operation: 'daily_cleanup' }
        })
      }
    }, {
      timezone: 'Europe/Sofia'
    })

    this.isRunning = true
    // this.logger.info(LogTags.system.startup.completed, {
    //   message: 'Scheduler service started successfully',
    //   status: 'running',
    //   interval: 'every_minute',
    //   dailyCleanup: 'midnight',
    //   timezone: 'Europe/Sofia'
    // }, {
    //   source: { file: 'SchedulerService.ts', method: 'start' },
    //   business: { category: 'system', operation: 'scheduler_lifecycle' }
    // })
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    // За мониторинг на scheduler lifecycle - спиране на cron job и затваряне на WebSocket връзки
    if (this.cronJob) {
      this.cronJob.destroy()
      this.cronJob = null
    }

    if (this.dailyCleanupCronJob) {
      this.dailyCleanupCronJob.destroy()
      this.dailyCleanupCronJob = null
    }
    if (this.wsClient) {
      this.wsClient.close()
      this.wsClient = null
    }
    this.isRunning = false
    this.runningCycles.clear()
    this.monitoringExecutions.clear()
    this.runningMonitoringFlows.clear()
    this.logger.info(LogTags.system.startup.completed, {
      message: 'Scheduler service stopped',
      status: 'stopped'
    }, {
      source: { file: 'SchedulerService.ts', method: 'stop' },
      business: { category: 'system', operation: 'scheduler_lifecycle' }
    })
  }

  /**
   * 🔍 Check for active execution sessions via ExecutionSession API
   */
  private async checkActiveExecution(): Promise<any> {
    // За мониторинг на execution coordination - проверка за активни ExecutionSession записи чрез API
    try {
      const response = await fetch('http://localhost:5000/api/v1/execution-sessions/current')
      
      if (!response.ok) {
        return null
      }
      
      const data = await response.json() as any
      
      if (data.success && data.data) {
        // this.logger.debug(LogTags.flow.execute.started, {
        //   message: "Waiting for active execution to complete",
        //   info: "Изчакване 1 мин.",
        //   executionId: data.data.executionId,
        //   flowType: data.data.flowType,
        //   status: data.data.status
        // }, {
        //   source: { file: 'SchedulerService.ts', method: 'checkActiveExecution' },
        //   business: { category: 'flow', operation: 'execution_monitoring' },
        //   sessionId: data.data.executionId
        // })
        return data.data
      }
      
      return null
    } catch (error) {
      // No active execution found or API error
      return null
    }
  }

  /**
   * Main processing logic - called every minute
   */
  private async processActivePrograms(): Promise<void> {
    // За мониторинг на program cycle processing - главния метод за обработка на всички активни програми всяка минута
    const now = new Date()
    const currentTime = this.formatTime(now)
    
    //this.logger.debug('scheduler-tick', { timestamp: now.toISOString() })

    try {
      // 🚫 LEGACY: Old execution conflict logic - COMMENTED OUT
      // This logic caused monitoring flows to be interrupted every minute
      // New ExecutionSession API handles conflicts properly via database constraints
      // Keep commented for potential rollback if needed
      /*
      const activeExecution = await this.checkActiveExecution()
      
      if (activeExecution) {
        // If there's an active execution, handle based on priority rules
        if (activeExecution.flowType === 'monitoring') {
          this.logger.info('monitoring-interruption', { 
            executionId: activeExecution.executionId,
            action: 'interrupting_for_cycle'
          })
          
          // 1. Stop the actual FlowExecutor execution
          try {
            // Stop the real flow execution
            const stopResponse = await fetch('http://localhost:5000/api/v1/flow/stop', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                emergency: false
              })
            })
            
            if (stopResponse.ok) {
              this.logger.info('flow-executor-stopped', { reason: 'cycle_priority' })
            }
            
            // Mark execution session as failed
            const failResponse = await fetch(`http://localhost:5000/api/v1/execution-sessions/${activeExecution.executionId}/fail`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                error: 'Interrupted by higher priority cycle execution'
              })
            })
            
            if (failResponse.ok) {
              this.logger.info('monitoring-session-failed', { executionId: activeExecution.executionId })
            }
          } catch (error) {
            this.logger.error('failed-to-interrupt-monitoring', { 
              executionId: activeExecution.executionId,
              error: error instanceof Error ? error.message : String(error)
            })
          }
          
          // 2. Add monitoring flow back to queue if not already present
          if (activeExecution.sourceId && !this.runningMonitoringFlows.has(activeExecution.sourceId)) {
            this.runningMonitoringFlows.set(activeExecution.sourceId, new Date())
            this.logger.debug('monitoring-queued-for-later', { 
              sourceId: activeExecution.sourceId,
              reason: 'interrupted_by_cycle'
            })
          }
          
          // Continue with cycle processing - cycle has priority
        } else if (activeExecution.flowType === 'cycle') {
          this.logger.debug('cycle-execution-active', { executionId: activeExecution.executionId })
          // Skip processing if cycle is running - cycle has priority
          return
        }
      }
      */
      // Get all running active programs (regular programs)
      const activePrograms = await ActiveProgram.find({ 
        status: 'running',
        'activeCycles.isActive': true 
      }).populate('programId', 'name maxExecutionTime isMonitoring')

      for (const program of activePrograms) {
        await this.processProgramCycles(program, now, currentTime)
      }

      // Process monitoring programs separately (LEGACY - will be phased out)
      await this.processMonitoringPrograms(now)

      // 📊 NEW: Process MonitoringFlow records directly
      await this.processMonitoringFlows(now)

      // 🛡️ NEW: Backup safety check - process queue if no active flows/cycles
      if (this.runningMonitoringFlows.size === 0 && this.runningCycles.size === 0) {
        console.log(`🛡️ [SchedulerService] Backup safety check - no active flows, processing queue`)
        await this.processMonitoringQueue()
      }

      // Check for cycles that need to be stopped (timeout)
      await this.checkCycleTimeouts(now)

    } catch (error) {
      this.logger.error(LogTags.flow.execute.failed, {
        message: 'Scheduler processing error',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }, {
        source: { file: 'SchedulerService.ts', method: 'processActivePrograms' },
        business: { category: 'flow', operation: 'scheduler_processing' }
      })
    }
  }

  /**
   * 📊 NEW: Process MonitoringFlow records directly
   */
  private async processMonitoringFlows(now: Date): Promise<void> {
    // За мониторинг на monitoring flow execution - обработка на MonitoringFlow записи за автоматично планирано изпълнение
    try {
      // Get all active monitoring flows that are due for execution
      const monitoringFlows = await MonitoringFlow.find({
        isActive: true,
        $or: [
          { nextExecution: { $lte: now } },
          { nextExecution: { $exists: false } }
        ]
      }).populate('flowTemplateId', 'name description jsonFileName filePath')

      //this.logger.analytics('monitoring-flows-found', { count: monitoringFlows.length, timestamp: now.toISOString() })

      for (const monitoringFlow of monitoringFlows) {
        await this.processMonitoringFlow(monitoringFlow, now)
      }

    } catch (error) {
      this.logger.error(LogTags.flow.execute.failed, {
        message: 'Monitoring flows processing error',
        error: error instanceof Error ? error.message : String(error)
      }, {
        source: { file: 'SchedulerService.ts', method: 'processMonitoringFlows' },
        business: { category: 'flow', operation: 'monitoring_flow_processing' }
      })
    }
  }

  /**
   * Process a single MonitoringFlow
   */
  private async processMonitoringFlow(monitoringFlow: IMonitoringFlow, now: Date): Promise<void> {
    // За мониторинг на monitoring flow processing - обработка на отделен MonitoringFlow с queue coordination
    console.log(`📊 MonitoringFlow scheduled: ${monitoringFlow.name} (interval: ${monitoringFlow.monitoringInterval}min)`)
    console.log(`🔍 [DEBUG] processMonitoringFlow called at ${now.toISOString()} for ${monitoringFlow.name}`)

    // 🎯 SIMPLIFIED LOGIC: Check if ANY execution is currently running in database
    const { ExecutionSession } = await import('../models/ExecutionSession')
    const activeExecution = await ExecutionSession.findOne({
      programStatus: { $in: ['running', 'paused'] }
    })

    if (activeExecution) {
      console.log(`🔄 [SchedulerService] Active execution found (Program: ${activeExecution.programName}) - queuing monitoring flow`)
      const { MonitoringQueue } = await import('../models/MonitoringQueue')
      await this.addMonitoringFlowToQueue(monitoringFlow, 'execution_active')
      return
    }

    // 🔄 NEW QUEUE LOGIC: Check if there are pending flows in queue
    const { MonitoringQueue } = await import('../models/MonitoringQueue')
    const pendingInQueue = await MonitoringQueue.find({
      status: 'pending'
    }).sort({ addedAt: 1 }) // FIFO order

    if (pendingInQueue.length > 0) {
      console.log(`📋 Found ${pendingInQueue.length} pending flows in queue - adding current flow to queue`)
      await this.addMonitoringFlowToQueue(monitoringFlow, 'scheduled_conflict')
    } else {
      console.log(`📊 No active execution and no pending flows - executing current flow directly`)
      await this.executeMonitoringFlowDirectly(monitoringFlow, now)
    }
  }

  /**
   * Execute a MonitoringFlow directly from FlowTemplate
   */
  private async executeMonitoringFlow(monitoringFlow: IMonitoringFlow, startTime: Date): Promise<void> {
    // За мониторинг на monitoring flow execution - директно изпълнение на monitoring flow от FlowTemplate с ExecutionSession tracking
    // 🚀 NEW: Create ExecutionSession for monitoring flow
    let executionSessionId: string | null = null
    
    try {
      const flowTemplate = monitoringFlow.flowTemplateId as any

      if (!flowTemplate?.jsonFileName) {
        throw new Error(`No jsonFileName found for monitoring flow: ${monitoringFlow.name}`)
      }

      // Load flow JSON directly
      const fs = await import('fs').then(m => m.promises)
      const fullFilePath = `${process.cwd()}/../${flowTemplate.filePath}${flowTemplate.jsonFileName}`
      const fileContent = await fs.readFile(fullFilePath, 'utf-8')
      const flowData = JSON.parse(fileContent)

      console.log(`📊 Executing monitoring flow: ${flowData.blocks?.length || 0} blocks`)

      // Set global variables for monitoring execution
      const globalVariables = {
        monitoringFlowId: monitoringFlow._id.toString(),
        flowTemplateId: flowTemplate._id.toString(),
        isMonitoring: true,
        monitoringInterval: monitoringFlow.monitoringInterval,
        flowId: flowData.id || flowTemplate._id.toString()
      }

      console.log(`🌐 Monitoring flow variables:`, globalVariables)
      try {
        const createResponse = await fetch('http://localhost:5000/api/v1/execution-sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            flowType: 'monitoring',
            sourceId: monitoringFlow._id.toString(),
            flowId: globalVariables.flowId,
            flowName: monitoringFlow.name,
            globalVariables,
            totalBlocks: flowData.blocks?.length || 0
          })
        })
        
        if (createResponse.ok) {
          const createData = await createResponse.json() as any
          if (createData.success) {
            executionSessionId = createData.data.executionId
            console.log(`🗃️ Created ExecutionSession: ${executionSessionId}`)
            
            // Mark as started
            await fetch(`http://localhost:5000/api/v1/execution-sessions/${executionSessionId}/start`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            })
          }
        }
      } catch (sessionError) {
        console.warn(`⚠️ Failed to create ExecutionSession for monitoring flow:`, sessionError)
      }

      // 🚀 NEW: Add ExecutionSession ID to globalVariables for block tracking
      if (executionSessionId) {
        (globalVariables as any).executionSessionId = executionSessionId
        console.log(`🗃️ Added ExecutionSession ID to globalVariables: ${executionSessionId}`)
      }

      // Execute flow directly
      const executionResult = await this.flowExecutor.executeFlow(flowData, globalVariables)
      console.log(`📊 Monitoring flow result: ${executionResult}`)
      
      // 🚀 NEW: Complete ExecutionSession
      if (executionSessionId) {
        try {
          const endpoint = executionResult 
            ? `http://localhost:5000/api/v1/execution-sessions/${executionSessionId}/complete`
            : `http://localhost:5000/api/v1/execution-sessions/${executionSessionId}/fail`
          
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: executionResult ? '{}' : JSON.stringify({
              error: 'Monitoring flow execution failed'
            })
          })
          
          if (response.ok) {
            console.log(`✅ ExecutionSession completed: ${executionSessionId}`)
          }
        } catch (completeError) {
          console.warn(`⚠️ Failed to complete ExecutionSession:`, completeError)
        }
      }

    } catch (error) {
      // 🚀 NEW: Fail ExecutionSession on error
      if (executionSessionId) {
        try {
          await fetch(`http://localhost:5000/api/v1/execution-sessions/${executionSessionId}/fail`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              error: error instanceof Error ? error.message : 'Unknown monitoring flow error'
            })
          })
          console.log(`❌ ExecutionSession failed: ${executionSessionId}`)
        } catch (failError) {
          console.warn(`⚠️ Failed to mark ExecutionSession as failed:`, failError)
        }
      }
      
      // 🔄 NEW: Check if error is due to system not idle - add to queue and process
      if (error instanceof Error && error.message.includes('system not in idle state')) {
        console.log(`🔄 [SchedulerService] System busy - adding ${monitoringFlow.name} to monitoring queue`)
        
        try {
          await this.addMonitoringFlowToQueue(monitoringFlow, 'system_busy')
          await this.processMonitoringQueue()
          return // Don't throw error if successfully queued and processed
        } catch (queueError) {
          console.error(`❌ [SchedulerService] Failed to handle system busy via queue:`, queueError)
        }
      }
      
      //console.error(`❌ Error executing monitoring flow:`, error)
      console.error(`❌ Error executing monitoring flow:`)
      throw error
    }
  }


  /**
   * Process monitoring programs with interval-based execution (LEGACY)
   */
  private async processMonitoringPrograms(now: Date): Promise<void> {
    // За мониторинг на legacy monitoring programs - обработка на стари Program записи с monitoring flag (LEGACY система)
    try {
      // Import Program model to access monitoring programs
      const { Program } = await import('../models/Program')
      
      // Get all active monitoring programs
      const monitoringPrograms = await Program.find({
        isActive: true,
        isMonitoring: true,
        monitoringInterval: { $gt: 0 }
      }).lean()

        if (monitoringPrograms.length > 0 && this.lastMonitoringCount !==
        monitoringPrograms.length) {
          // this.logger.analytics(LogTags.flow.execute.started, {
          //   message: 'Monitoring programs found for processing',
          //   count: monitoringPrograms.length
          // }, {
          //   source: { file: 'SchedulerService.ts', method: 'processMonitoringPrograms' },
          //   business: { category: 'flow', operation: 'monitoring_program_processing' }
          // })
          this.lastMonitoringCount = monitoringPrograms.length
        }
      for (const program of monitoringPrograms) {
        await this.processMonitoringProgram(program, now)
      }

    } catch (error) {
      console.error('❌ Error processing monitoring programs:', error)
    }
  }

  /**
   * Process a single monitoring program
   */
  private async processMonitoringProgram(program: any, now: Date): Promise<void> {
    const monitoringKey = `monitoring_${program._id}`
    
    // Check last execution from our tracking
    const lastExecution = this.getLastMonitoringExecution(monitoringKey)
    const intervalMs = program.monitoringInterval * 60 * 1000 // Convert minutes to milliseconds
    
    // Check if enough time has passed since last execution
    if (lastExecution && (now.getTime() - lastExecution.getTime()) < intervalMs) {
      // Not time yet for next execution
      return
    }

    console.log(`📊 Starting monitoring program: ${program.name} (interval: ${program.monitoringInterval}min)`)

    try {
      // Track monitoring execution start
      this.setLastMonitoringExecution(monitoringKey, now)

      // Execute monitoring flows
      await this.executeMonitoringProgram(program, now)

      console.log(`✅ Monitoring program completed: ${program.name}`)

    } catch (error) {
      console.error(`❌ Monitoring program failed: ${program.name}`, error)
    }
  }

  /**
   * Execute monitoring program flows
   */
  private async executeMonitoringProgram(program: any, startTime: Date): Promise<void> {
    try {
      // Load FlowTemplate if program has associated flow
      if (!program.cycles?.[0]?.actions?.[0]?.actionTemplateId) {
        console.warn(`⚠️ Monitoring program ${program.name} has no actions configured`)
        return
      }

      // Get first action's ActionTemplate (monitoring programs typically have single flow)
      const { ActionTemplate } = await import('../models/ActionTemplate')
      const actionTemplate = await ActionTemplate.findById(
        program.cycles[0].actions[0].actionTemplateId
      ).lean()

      if (!actionTemplate?.flowFile) {
        console.warn(`⚠️ Monitoring program ${program.name} has no flowFile`)
        return
      }

      // Load FlowTemplate
      const { FlowTemplate } = await import('../models/FlowTemplate')
      const flowTemplate = await FlowTemplate.findOne({ 
        jsonFileName: actionTemplate.flowFile 
      }).lean()

      if (!flowTemplate) {
        console.error(`❌ FlowTemplate not found for monitoring program: ${program.name}`)
        return
      }

      // Load flow JSON
      const fs = await import('fs').then(m => m.promises)
      const fullFilePath = `${process.cwd()}/../${flowTemplate.filePath}${flowTemplate.jsonFileName}`
      const fileContent = await fs.readFile(fullFilePath, 'utf-8')
      const flowData = JSON.parse(fileContent)

      console.log(`📊 Executing monitoring flow: ${flowData.blocks?.length || 0} blocks`)

      // Set global variables for monitoring execution
      const globalVariables = {
        programId: program._id.toString(),
        cycleId: 'monitoring',
        isMonitoring: true,
        monitoringInterval: program.monitoringInterval,
        ...program.cycles[0].actions[0].overrideParameters
      }

      console.log(`🌐 Monitoring global variables:`, globalVariables)

      // Execute flow
      const executionResult = await this.flowExecutor.executeFlow(flowData, globalVariables)
      console.log(`📊 Monitoring flow result: ${executionResult}`)

    } catch (error) {
      console.error(`❌ Error executing monitoring program:`, error)
      throw error
    }
  }

  /**
   * Process cycles for a single program
   */
  private async processProgramCycles(
    program: IActiveProgram, 
    now: Date, 
    currentTime: string
  ): Promise<void> {
    // За мониторинг на program cycle management - обработка на цикли за конкретна програма според scheduling времена
    const maxExecutionTime = program.maxExecutionTime || 60 // Default 60 minutes
    let programUpdated = false

    for (const cycle of program.activeCycles) {
      if (!cycle.isActive) continue

      const cycleKey = `${program._id}_${cycle.cycleId}`
      const isCurrentlyRunning = this.runningCycles.has(cycleKey)

      // Check if cycle should start (and no other cycle is running)
      if (!isCurrentlyRunning && !this.hasActiveCycle(program._id.toString()) && this.shouldStartCycle(cycle, currentTime, program)) {
        await this.startCycle(program, cycle, now, maxExecutionTime)
        programUpdated = true
      } else if (this.shouldStartCycle(cycle, currentTime, program) && this.hasActiveCycle(program._id.toString())) {
        console.log(`⏸️ Cycle ${cycle.cycleId} should start but another cycle is active - skipping`)
      }
    }

    // Save program if any cycles were updated
    if (programUpdated) {
      await program.save()
      console.log(`📊 Program "${program.name}" updated`)
    }
  }

  /**
   * Check if a cycle should start now
   */
  private shouldStartCycle(cycle: IActiveCycle, currentTime: string, program: IActiveProgram): boolean {
    // Check if current time matches cycle start time
    if (cycle.startTime !== currentTime) {
      return false
    }

    // Check if cycle is currently skipped/paused
    const { ActiveProgramService } = require('./ActiveProgramService')
    if (ActiveProgramService.isCycleSkipped(program, cycle.cycleId)) {
      console.log(`⏸️  Cycle ${cycle.cycleId} is paused/skipped - not executing`)
      return false
    }

    return true
  }

  /**
   * Start a cycle execution
   */
  private async startCycle(
    program: IActiveProgram,
    cycle: IActiveCycle,
    startTime: Date,
    maxExecutionMinutes: number
  ): Promise<void> {
    // За мониторинг на cycle startup - стартиране на програмен цикъл с timeout tracking и execution coordination
    const cycleKey = `${program._id}_${cycle.cycleId}`
    const maxEndTime = new Date(startTime.getTime() + maxExecutionMinutes * 60 * 1000)

    console.log(`▶️  Starting cycle ${cycle.cycleId} for program "${program.name}" at ${startTime.toISOString()}`)
    
    // 🚀 LIFECYCLE NOTIFICATION: Cycle Start
    try {
      const { notificationService } = await import('./NotificationService')
      await notificationService.sendLifecycleNotification('cycle_start', {
        programName: program.name,
        cycleId: cycle.cycleId,
        startTime,
        expectedEndTime: maxEndTime
      })
      console.log(`🔔 [SchedulerService] Cycle start notification sent for ${cycle.cycleId}`)
    } catch (notificationError) {
      console.warn(`⚠️ [SchedulerService] Failed to send cycle start notification:`, notificationError)
      // Continue cycle execution even if notification fails
    }

    // 🚩 NEW: Рестартирай cancellation token за новия цикъл
    this.cancellationToken.reset()
    console.log(`🔄 [SchedulerService] Reset cancellation token for new cycle`)

    // 🕐 NEW: Wait up to 2min for active monitoring flows to complete before starting cycle
    const activeExecution = await this.checkActiveExecution()
    if (activeExecution?.flowType === 'monitoring') {
      console.log(`⏳ [SchedulerService] Active monitoring flow detected - waiting up to 2min for completion`)
      await this.waitForMonitoringCompletion(activeExecution, 0.5 * 60 * 1000) // 2min timeout
    }

    // 🚨 NEW: Pause all monitoring flows before starting program cycle
    try {
      const systemStateManager = this.flowExecutor.getSystemStateManager()
      const pausedFlowIds = await systemStateManager.pauseAllMonitoringFlows(program._id.toString())
      
      if (pausedFlowIds.length > 0) {
        console.log(`⏸️ [SchedulerService] Paused ${pausedFlowIds.length} monitoring flows for program cycle`)
      }
    } catch (error) {
      console.warn(`⚠️ [SchedulerService] Failed to pause monitoring flows:`, error)
      // Continue execution - don't fail cycle start due to monitoring pause failure
    }

    // Track running cycle
    this.runningCycles.set(cycleKey, {
      cycleId: cycle.cycleId,
      programId: program._id.toString(),
      startTime,
      maxEndTime
    })

    // Update cycle in database - START
    cycle.lastExecuted = startTime
    cycle.executionCount += 1
    cycle.isCurrentlyExecuting = true
    
    program.totalExecutions += 1

    // Save immediately to make cycle visible as executing
    await program.save()
    console.log(`💾 Cycle ${cycle.cycleId} marked as executing and saved to database`)

    // Track cycle start in dashboard
    await this.trackCycleExecutionStatus(cycle.cycleId, 'running', startTime, null, null)

    console.log(`🔄 Cycle ${cycle.cycleId} execution #${cycle.executionCount}`)

    // Execute FlowExecutor integration (non-blocking)
    this.executeFlowForCycle(program, cycle, cycleKey)
      .then(() => {
        console.log(`🎉 Cycle ${cycle.cycleId} completed successfully`)
      })
      .catch((error) => {
        console.error(`❌ Cycle ${cycle.cycleId} failed:`, error)
        // Clean up on error
        this.runningCycles.delete(cycleKey)
      })
  }

  /**
   * Check for cycles that have exceeded their maximum execution time
   */
  private async checkCycleTimeouts(now: Date): Promise<void> {
    // За мониторинг на cycle timeout management - проверка за цикли които са превишили максималното време за изпълнение
    const expiredCycles: string[] = []

    for (const [cycleKey, execution] of this.runningCycles) {
      if (now >= execution.maxEndTime) {
        // Log timeout warning first (no stop for now)
        const [programId, cycleId] = cycleKey.split('_')
        const runTime = Math.floor((now.getTime() - execution.startTime.getTime()) / (1000 * 60))
        const maxTime = Math.floor((execution.maxEndTime.getTime() - execution.startTime.getTime()) / (1000 * 60))
        
        console.warn(`⚠️ Cycle ${cycleId} exceeded maxExecutionTime: ${maxTime}min (running for ${runTime}min)`)
        
        // TODO: Later change to: expiredCycles.push(cycleKey)
        // For now, just log the timeout without stopping
      }
    }

    // Temporarily disabled automatic stopping
    // for (const cycleKey of expiredCycles) {
    //   await this.stopCycle(cycleKey, 'timeout')
    // }
  }

  /**
   * Stop a running cycle
   */
  private async stopCycle(cycleKey: string, reason: 'timeout' | 'manual'): Promise<void> {
    // За мониторинг на cycle termination - принудително спиране на цикъл поради timeout или мануална команда
    const execution = this.runningCycles.get(cycleKey)
    if (!execution) return

    const [programId, cycleId] = cycleKey.split('_')
    
    console.log(`⏹️  Stopping cycle ${cycleId} - reason: ${reason}`)

    // Remove from running cycles
    this.runningCycles.delete(cycleKey)

    // Update cycle status in database when stopped due to timeout
    if (reason === 'timeout') {
      try {
        const activeProgram = await ActiveProgram.findById(programId)
        if (activeProgram) {
          const cycle = activeProgram.activeCycles.find(c => c.cycleId === cycleId)
          if (cycle) {
            // Mark cycle as no longer executing
            cycle.isCurrentlyExecuting = false
            // Mark cycle as completed/inactive after timeout
            cycle.isActive = false
            
            await activeProgram.save()
            console.log(`✅ Cycle ${cycleId} marked as completed due to timeout`)
          }
        }
      } catch (error) {
        console.error(`❌ Error updating cycle ${cycleId} status:`, error)
      }
      
      console.log(`⚠️  Cycle ${cycleId} stopped due to timeout after max execution time`)
    }

    // TODO: Here you would stop actual hardware actions
    // For now, we just log the stop event
  }

  /**
   * Check if a program has any active cycles running
   */
  private hasActiveCycle(programId: string): boolean {
    for (const [cycleKey] of this.runningCycles) {
      if (cycleKey.startsWith(`${programId}_`)) {
        return true
      }
    }
    return false
  }

  /**
   * Get scheduler status
   */
  getStatus(): {
    isRunning: boolean
    runningCycles: number
    runningCycleDetails: ICycleExecution[]
    monitoringPrograms: number
    monitoringDetails: Array<{key: string, lastExecution: Date}>
    runningMonitoringFlows: number
    monitoringFlowDetails: Array<{key: string, startTime: Date}>
  } {
    return {
      isRunning: this.isRunning,
      runningCycles: this.runningCycles.size,
      runningCycleDetails: Array.from(this.runningCycles.values()),
      monitoringPrograms: this.monitoringExecutions.size,
      monitoringDetails: Array.from(this.monitoringExecutions.entries()).map(([key, time]) => ({
        key,
        lastExecution: time
      })),
      runningMonitoringFlows: this.runningMonitoringFlows.size,
      monitoringFlowDetails: Array.from(this.runningMonitoringFlows.entries()).map(([key, time]) => ({
        key,
        startTime: time
      }))
    }
  }

  /**
   * Format time as HH:MM
   */
  private formatTime(date: Date): string {
    return date.toTimeString().substring(0, 5) // "HH:MM"
  }

  /**
   * Get or create ExecutionSession for a program using new hierarchical schema
   */
  private async getOrCreateExecutionSession(program: IActiveProgram): Promise<string | null> {
    try {
      // First, check if there's an active ExecutionSession for this program
      const { ExecutionSession } = await import('../models/ExecutionSession')
      let session = await ExecutionSession.findOne({
        programId: program._id.toString(),
        programStatus: 'running'
      })

      if (!session) {
        // Create new ExecutionSession for the program
        session = new ExecutionSession({
          programId: program._id.toString(),
          programName: program.name,
          programStartTime: new Date(),
          programStatus: 'running',
          cycles: []
        })
        await session.save()
        console.log(`📝 [SchedulerService] Created new ExecutionSession for program: ${program.name}`)
      }

      return session._id.toString()
    } catch (error) {
      console.error(`❌ [SchedulerService] Error getting/creating ExecutionSession:`, error)
      return null
    }
  }

  /**
   * Add cycle to ExecutionSession using new hierarchical schema
   */
  private async addCycleToExecutionSession(sessionId: string, cycle: IActiveCycle): Promise<void> {
    try {
      const { ExecutionSession } = await import('../models/ExecutionSession')

      const session = await ExecutionSession.findById(sessionId)
      if (!session) {
        console.error(`❌ [SchedulerService] ExecutionSession not found: ${sessionId}`)
        return
      }

      // Check if this cycle already exists
      const existingCycle = session.cycles.find(c => c.cycleId === cycle.cycleId)
      if (existingCycle) {
        console.log(`📝 [SchedulerService] Cycle ${cycle.cycleId} already exists in ExecutionSession`)
        return
      }

      // Add new cycle to the session
      session.cycles.push({
        cycleId: cycle.cycleId,
        cycleName: cycle.cycleId, // For now, use cycleId as name
        cycleStartTime: new Date(),
        cycleStatus: 'running',
        flows: []
      })

      await session.save()
      console.log(`📝 [SchedulerService] Added cycle ${cycle.cycleId} to ExecutionSession`)
    } catch (error) {
      console.error(`❌ [SchedulerService] Error adding cycle to ExecutionSession:`, error)
    }
  }

  /**
   * Complete cycle in ExecutionSession using new hierarchical schema
   */
  private async completeCycleInExecutionSession(sessionId: string, cycleId: string, status: 'completed' | 'failed'): Promise<void> {
    try {
      const { ExecutionSession } = await import('../models/ExecutionSession')

      const session = await ExecutionSession.findById(sessionId)
      if (!session) {
        console.error(`❌ [SchedulerService] ExecutionSession not found: ${sessionId}`)
        return
      }

      // Find and update the cycle
      const cycle = session.cycles.find(c => c.cycleId === cycleId)
      if (cycle) {
        const endTime = new Date()
        cycle.cycleEndTime = endTime
        cycle.cycleStatus = status

        // Calculate duration
        const duration = cycle.cycleStartTime ? endTime.getTime() - cycle.cycleStartTime.getTime() : null

        // Track cycle completion in dashboard
        await this.trackCycleExecutionStatus(cycleId, status, cycle.cycleStartTime, endTime, duration)

        // Check if this is the completion of all cycles for the program
        await this.checkAndUpdateProgramCompletion(session)

        await session.save()
        console.log(`✅ [SchedulerService] Marked cycle ${cycleId} as ${status} in ExecutionSession`)
      } else {
        console.error(`❌ [SchedulerService] Cycle ${cycleId} not found in ExecutionSession`)
      }
    } catch (error) {
      console.error(`❌ [SchedulerService] Error completing cycle in ExecutionSession:`, error)
    }
  }

  /**
   * Check if all cycles are completed and update program and flow status accordingly
   */
  private async checkAndUpdateProgramCompletion(session: any): Promise<void> {
    try {
      // Check if all cycles are completed or failed
      const allCyclesCompleted = session.cycles.length > 0 &&
        session.cycles.every((cycle: any) => cycle.cycleStatus === 'completed' || cycle.cycleStatus === 'failed')

      if (allCyclesCompleted) {
        // Mark program as completed
        session.programEndTime = new Date()
        session.programStatus = 'completed'

        console.log(`🎉 [SchedulerService] All cycles completed - marking program ${session.programName} as completed`)

        // Also update the ActiveProgram status to completed
        const activeProgram = await ActiveProgram.findOne({
          programId: session.programId,
          status: 'running'
        })

        if (activeProgram) {
          activeProgram.status = 'completed'
          await activeProgram.save()
          console.log(`✅ [SchedulerService] Updated ActiveProgram ${session.programName} status to completed`)
        }

        // Update all flows in completed cycles to completed status
        session.cycles.forEach((cycle: any) => {
          cycle.flows.forEach((flow: any) => {
            if (flow.flowStatus === 'running') {
              flow.flowStatus = 'completed'
              flow.flowEndTime = new Date()
            }
          })
        })

        console.log(`📊 [SchedulerService] Updated all flow statuses to completed for program ${session.programName}`)
      }
    } catch (error) {
      console.error(`❌ [SchedulerService] Error checking program completion:`, error)
    }
  }

  /**
   * Execute flow for a cycle using FlowExecutor
   */
  private async executeFlowForCycle(
    program: IActiveProgram,
    cycle: IActiveCycle,
    cycleKey: string
  ): Promise<void> {
    // За мониторинг на FlowExecutor integration - изпълнение на ActionTemplates чрез FlowExecutor за програмни цикли
    let sessionId: string | null = null

    try {
      console.log(`🎯 Starting FlowExecutor for cycle ${cycle.cycleId}`)

      // 🚀 NEW: Get or create ExecutionSession for program and add cycle
      sessionId = await this.getOrCreateExecutionSession(program)
      if (sessionId) {
        await this.addCycleToExecutionSession(sessionId, cycle)
      }

      // Clean up any interrupted executions from previous runs before starting
      const { ActiveExecutionService } = await import('./ActiveExecutionService')
      await ActiveExecutionService.cleanupInterruptedCycle(program._id.toString(), cycle.cycleId, program.name)

      // Get cycle index from cycleId (e.g. "cycle-0" -> 0)
      const cycleIndex = parseInt(cycle.cycleId.split('-')[1] || '0')
      console.log(`🔍 Cycle index: ${cycleIndex}`)

      // Load Program with populated ActionTemplates
      const { Program } = await import('../models/Program')
      const programData = await Program.findById(program.programId)
        .populate('cycles.actions.actionTemplateId')
        .lean()

      if (!programData?.cycles?.[cycleIndex]?.actions?.length) {
        console.warn(`⚠️ No actions found for cycle ${cycle.cycleId}`)

        // 🚀 NEW: Mark cycle as completed even if no actions
        if (sessionId) {
          await this.completeCycleInExecutionSession(sessionId, cycle.cycleId, 'completed')
        }
        return
      }

      const targetCycle = programData.cycles[cycleIndex]
      console.log(`📝 Found ${targetCycle.actions.length} actions in cycle`)

      // Execute all ActionTemplates in sequence
      for (let i = 0; i < targetCycle.actions.length; i++) {
        const action = targetCycle.actions[i]
        const actionTemplate = action.actionTemplateId as any
        
        console.log(`🎯 Executing ActionTemplate ${i + 1}/${targetCycle.actions.length}`)
        
        if (!actionTemplate?.flowFile) {
          console.log(`📝 ActionTemplate ${i + 1} has no flowFile - skipping`)
          continue
        }

        console.log(`📁 Found flowFile: ${actionTemplate.flowFile}`)

        // Find FlowTemplate by JSON filename
        const flowTemplate = await FlowTemplate.findOne({ jsonFileName: actionTemplate.flowFile }).lean()
        if (!flowTemplate) {
          console.error(`❌ FlowTemplate not found for flowFile: ${actionTemplate.flowFile}`)
          continue
        }

        console.log(`📄 FlowTemplate: ${flowTemplate.name} v${flowTemplate.version}`)

        // Load flow JSON
        const fs = await import('fs').then(m => m.promises)
        const fullFilePath = `${process.cwd()}/../${flowTemplate.filePath}${flowTemplate.jsonFileName}`
        
        const fileContent = await fs.readFile(fullFilePath, 'utf-8')
        const flowData = JSON.parse(fileContent)
        console.log(`📊 Flow loaded: ${flowData.blocks?.length || 0} blocks`)

        // Execute flow
        console.log(`🚀 Executing flow ${i + 1}/${targetCycle.actions.length}...`)

        // Start execution logging
        const { WebSocketManager } = await import('../modules/flowExecutor/core/WebSocketManager')
        const wsManager = WebSocketManager.getInstance()
        wsManager.startExecutionLogging(
          program._id.toString(),
          program.name,
          cycleIndex,
          cycle.cycleId,
          i,
          flowData.id
        )

        // 🚀 NEW: Broadcast ActionTemplate started event
        console.log(`🎯 [SchedulerService] Broadcasting action_template_started for: ${actionTemplate.name} (${i + 1}/${targetCycle.actions.length})`)
        wsManager.broadcast({
          type: 'action_template_started',
          timestamp: new Date().toISOString(),
          data: {
            programId: program._id.toString(),
            programName: program.name,
            cycleId: cycle.cycleId,
            actionTemplateId: actionTemplate._id.toString(),
            actionTemplateName: actionTemplate.name,
            actionIndex: i + 1,
            totalActions: targetCycle.actions.length
          }
        })

        // 🗃️ DB TRACKING: ActionTemplate started
        try {
          await fetch('http://localhost:5000/api/v1/dashboard/sections/program/actiontemplate-status', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              actionTemplateId: actionTemplate._id.toString(),
              actionTemplateName: actionTemplate.name,
              cycleId: cycle.cycleId,
              status: 'running',
              startTime: new Date().toISOString()
            })
          })

          // Trigger dashboard refresh after DB update
          wsManager.broadcast({
            type: 'dashboard_refresh',
            timestamp: new Date().toISOString(),
            data: { sectionId: 'program' }
          })
        } catch (dbError) {
          console.warn(`⚠️ [SchedulerService] Failed to track ActionTemplate start in DB:`, dbError)
        }
        
        // Get global variables from action overrideParameters (always use override)
        const actionStartTime = new Date()
        const globalVariables = {
          ...action.overrideParameters,
          programId: program._id.toString(),
          cycleId: cycle.cycleId,
          actionTemplateId: actionTemplate._id.toString(),
          actionTemplateName: actionTemplate.name,
          actionIndex: i,
          actionTemplateStartTime: actionStartTime.toISOString(),
          // 🚀 NEW: Pass ExecutionSession ID to FlowExecutor for block tracking
          executionSessionId: sessionId
        }
        console.log(`🌐 Global variables (from override):`, globalVariables)
        
        // 🆕 PRE-EXECUTION: Real-time refresh на критичните контролери
        console.log(`🔄 [SchedulerService] Pre-execution critical controller refresh for ActionTemplate ${i + 1}`)
        try {
          await this.hardwareHealthChecker.refreshCriticalControllersStatus(flowData)
          console.log(`✅ [SchedulerService] Critical controller status refreshed`)
        } catch (refreshError) {
          console.warn(`⚠️ [SchedulerService] Failed to refresh critical controller status:`, refreshError)
          // Продължаваме със validation дори при грешка в refresh
        }
        
        // 🛡️ ФАЗА 2: Hardware validation with critical device priority logic
        try {
          const executionResult = await this.flowExecutor.executeFlow(flowData, globalVariables)
          console.log(`✅ ActionTemplate ${i + 1} completed: ${executionResult}`)

          // 🚀 NEW: Broadcast ActionTemplate completed event
          const completedTime = new Date()
          wsManager.broadcast({
            type: 'status_change',
            timestamp: completedTime.toISOString(),
            data: {
              event: 'actionTemplateCompleted',
              programId: program._id.toString(),
              programName: program.name,
              cycleId: cycle.cycleId,
              actionTemplateId: actionTemplate._id.toString(),
              actionTemplateName: actionTemplate.name,
              actionIndex: i + 1,
              totalActions: targetCycle.actions.length,
              status: 'completed',
              result: executionResult
            }
          })

          // 🗃️ DB TRACKING: ActionTemplate completed
          try {
            // Calculate duration from start time
            const duration = Math.round((completedTime.getTime() - actionStartTime.getTime()) / 1000) // duration in seconds

            await fetch('http://localhost:5000/api/v1/dashboard/sections/program/actiontemplate-status', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                actionTemplateId: actionTemplate._id.toString(),
                actionTemplateName: actionTemplate.name,
                cycleId: cycle.cycleId,
                status: 'completed',
                endTime: completedTime.toISOString(),
                duration: duration
              })
            })

            // Trigger dashboard refresh after DB update
            wsManager.broadcast({
              type: 'dashboard_refresh',
              timestamp: new Date().toISOString(),
              data: { sectionId: 'program' }
            })
          } catch (dbError) {
            console.warn(`⚠️ [SchedulerService] Failed to track ActionTemplate completion in DB:`, dbError)
          }
        } catch (flowError: any) {
          // Check if this is a hardware validation failure
          if (flowError.code === 'HARDWARE_VALIDATION_FAILED') {
            console.error(`🚨 [SchedulerService] CRITICAL HARDWARE FAILURE - Breaking cycle ${cycle.cycleId}`)
            console.error(`💥 Critical failures: ${flowError.details?.criticalFailures?.join(', ') || 'Unknown'}`)
            
            // 🚨 MARK EXECUTION SESSION AS FAILED AND BREAK CYCLE
            try {
              // Send notification about critical failure
              const { NotificationService } = await import('./NotificationService')
              const notificationService = NotificationService.getInstance()
              
              // 🚀 LIFECYCLE NOTIFICATION: Cycle Failure (before existing error notification)
              try {
                await notificationService.sendLifecycleNotification('cycle_failure', {
                  programName: program.name,
                  cycleId: cycle.cycleId,
                  startTime: cycle.lastExecuted || new Date(),
                  failureTime: new Date(),
                  errorMessage: flowError.message,
                  duration: cycle.lastExecuted 
                    ? `${Math.round((new Date().getTime() - cycle.lastExecuted.getTime()) / (1000 * 60))} мин`
                    : 'неизвестно'
                })
                console.log(`🔔 [SchedulerService] Cycle failure notification sent for ${cycle.cycleId}`)
              } catch (lifecycleNotificationError) {
                console.warn(`⚠️ [SchedulerService] Failed to send cycle failure notification:`, lifecycleNotificationError)
              }
              const results = await notificationService.sendCustomErrorNotification(
                'flow_validation',
                'HARDWARE_VALIDATION',
                `Cycle "${cycle.cycleId}" failed due to critical device failures: ${flowError.details?.criticalFailures?.join(', ') || 'Unknown'}`,
                {
                  programId: program._id.toString(),
                  cycleId: cycle.cycleId,
                  failures: flowError.details?.criticalFailures || [],
                  offlineDevices: flowError.details?.offlineDevices || []
                },
                ['email', 'telegram']
              )
              console.log(`📱 [SchedulerService] Critical failure notification sent: ${results.filter(r => r.success).length}/${results.length} successful`)
              
              // Mark cycle as failed in ExecutionSession
              if (sessionId) {
                await this.completeCycleInExecutionSession(sessionId, cycle.cycleId, 'failed')
              }

            } catch (notificationError) {
              console.error(`❌ [SchedulerService] Failed to send notification after hardware failure:`, notificationError)
            }

            // 🗃️ DB TRACKING: ActionTemplate failed due to hardware validation
            try {
              await fetch('http://localhost:5000/api/v1/dashboard/sections/program/actiontemplate-status', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  actionTemplateId: actionTemplate._id.toString(),
                  actionTemplateName: actionTemplate.name,
                  cycleId: cycle.cycleId,
                  status: 'failed',
                  errorMessage: `Hardware validation failed: ${flowError.details?.criticalFailures?.join(', ') || flowError.message}`
                })
              })

              // Trigger dashboard refresh after DB update
              wsManager.broadcast({
                type: 'dashboard_refresh',
                timestamp: new Date().toISOString(),
                data: { sectionId: 'program' }
              })
            } catch (dbError) {
              console.warn(`⚠️ [SchedulerService] Failed to track ActionTemplate failure in DB:`, dbError)
            }
            
            // Break from the cycle execution - do not continue with remaining ActionTemplates
            console.log(`🔄 [SchedulerService] Breaking from cycle execution - program remains running for next cycle`)
            
            // 🧹 CLEANUP: Mark cycle as no longer executing and remove from tracking
            cycle.isCurrentlyExecuting = false
            await program.save()
            this.runningCycles.delete(cycleKey)
            console.log(`🧹 [SchedulerService] Cleaned up failed cycle ${cycle.cycleId}`)
            
            return // Exit method completely to avoid marking cycle as completed
          } else {
            // 🗃️ DB TRACKING: ActionTemplate failed due to general error
            try {
              await fetch('http://localhost:5000/api/v1/dashboard/sections/program/actiontemplate-status', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  actionTemplateId: actionTemplate._id.toString(),
                  actionTemplateName: actionTemplate.name,
                  cycleId: cycle.cycleId,
                  status: 'failed',
                  errorMessage: flowError instanceof Error ? flowError.message : String(flowError)
                })
              })

              // Trigger dashboard refresh after DB update
              wsManager.broadcast({
                type: 'dashboard_refresh',
                timestamp: new Date().toISOString(),
                data: { sectionId: 'program' }
              })
            } catch (dbError) {
              console.warn(`⚠️ [SchedulerService] Failed to track ActionTemplate failure in DB:`, dbError)
            }

            // For non-validation errors, just re-throw
            throw flowError
          }
        }
        
        // End execution logging
        wsManager.endExecutionLogging()
        
        // Wait for flow to complete properly before next execution
        if (i < targetCycle.actions.length - 1) {
          console.log(`⏳ Waiting for ActionTemplate ${i + 1} to fully complete before next execution...`)
          await this.waitForFlowCompletion()
        }
      }
      
      console.log(`🎉 All ${targetCycle.actions.length} ActionTemplates completed for cycle ${cycle.cycleId}`)
      
      // 🚀 LIFECYCLE NOTIFICATION: Cycle Success
      try {
        const completedTime = new Date()
        const duration = cycle.lastExecuted 
          ? Math.round((completedTime.getTime() - cycle.lastExecuted.getTime()) / (1000 * 60)) // minutes
          : 0
        
        const { notificationService } = await import('./NotificationService')
        await notificationService.sendLifecycleNotification('cycle_success', {
          programName: program.name,
          cycleId: cycle.cycleId,
          startTime: cycle.lastExecuted,
          completedTime,
          duration: `${duration} мин`
        })
        console.log(`🔔 [SchedulerService] Cycle success notification sent for ${cycle.cycleId}`)
      } catch (notificationError) {
        console.warn(`⚠️ [SchedulerService] Failed to send cycle success notification:`, notificationError)
        // Continue cleanup even if notification fails
      }
      // 🚀 NEW: Mark cycle as completed in ExecutionSession
      if (sessionId) {
        await this.completeCycleInExecutionSession(sessionId, cycle.cycleId, 'completed')
      }

      // Clean up execution records from database
      try {
        await ActiveExecutionService.cleanupCycle(program._id.toString(), cycle.cycleId, program.name)
        console.log(`🗑️ Cleaned up execution records for cycle ${cycle.cycleId}`)
      } catch (error) {
        console.warn('Failed to cleanup execution records:', error)
      }

      // Mark cycle as completed and save to database
      cycle.isCurrentlyExecuting = false
      await program.save()
      console.log(`💾 Cycle ${cycle.cycleId} marked as completed and saved to database`)

      // 🚀 NEW: Broadcast cycle completion event
      const { WebSocketManager } = await import('../modules/flowExecutor/core/WebSocketManager')
      const wsManager = WebSocketManager.getInstance()
      wsManager.broadcast({
        type: 'cycle_completed',
        timestamp: new Date().toISOString(),
        data: {
          programId: program._id.toString(),
          programName: program.name,
          cycleId: cycle.cycleId,
          success: true
        }
      })
      console.log(`📡 [SchedulerService] Broadcasted cycle_completed for: ${cycle.cycleId}`)

      // Remove from running cycles tracking
      this.runningCycles.delete(cycleKey)

      // 🚩 NEW: Process monitoring queue after cycle completion
      try {
        console.log(`🔄 [SchedulerService] Cycle completed - checking monitoring queue`)
        await this.processMonitoringQueue()
      } catch (queueError) {
        console.error(`❌ [SchedulerService] Error processing monitoring queue after cycle completion:`, queueError)
      }

      // 🔄 NEW: Resume monitoring flows after program cycle completion
      try {
        const systemStateManager = this.flowExecutor.getSystemStateManager()
        const resumedCount = await systemStateManager.resumeMonitoringFlows()
        
        if (resumedCount > 0) {
          console.log(`▶️ [SchedulerService] Resume triggered for ${resumedCount} pending monitoring flows`)
        }
      } catch (error) {
        console.warn(`⚠️ [SchedulerService] Failed to resume monitoring flows:`, error)
        // Don't fail cycle completion due to monitoring resume failure
      }

    } catch (error) {
      console.error(`❌ Error in executeFlowForCycle:`, error)
      
      // 🚀 NEW: Mark cycle as failed in ExecutionSession
      if (sessionId) {
        await this.completeCycleInExecutionSession(sessionId, cycle.cycleId, 'failed')
      }
      
      // Clean up on error
      cycle.isCurrentlyExecuting = false
      await program.save()
      this.runningCycles.delete(cycleKey)

      // 🚩 NEW: Process monitoring queue after cycle error
      try {
        console.log(`🔄 [SchedulerService] Cycle failed - checking monitoring queue`)
        await this.processMonitoringQueue()
      } catch (queueError) {
        console.error(`❌ [SchedulerService] Error processing monitoring queue after cycle error:`, queueError)
      }

      // 🔄 NEW: Resume monitoring flows even after cycle error
      try {
        const systemStateManager = this.flowExecutor.getSystemStateManager()
        const resumedCount = await systemStateManager.resumeMonitoringFlows()
        
        if (resumedCount > 0) {
          console.log(`▶️ [SchedulerService] Resume triggered after error for ${resumedCount} pending monitoring flows`)
        }
      } catch (resumeError) {
        console.warn(`⚠️ [SchedulerService] Failed to resume monitoring flows after error:`, resumeError)
      }

      throw error // Re-throw to maintain error handling
    }
  }

  /**
   * Pause active executions for a specific program
   */
  async pauseActiveExecutions(programId: string): Promise<boolean> {
    // За мониторинг на execution control - паузиране на активни executions за конкретна програма
    console.log(`⏸️ [SchedulerService] Pausing active executions for program: ${programId}`)
    
    let pausedCount = 0
    
    // Find and pause running cycles for this program
    for (const [cycleKey, execution] of this.runningCycles) {
      if (execution.programId === programId) {
        try {
          // Pause FlowExecutor directly
          if (this.flowExecutor.pause()) {
            console.log(`⏸️ [SchedulerService] Paused execution for cycle: ${execution.cycleId}`)
            pausedCount++
          }
        } catch (error) {
          console.error(`❌ [SchedulerService] Failed to pause cycle ${execution.cycleId}:`, error)
        }
      }
    }
    
    console.log(`✅ [SchedulerService] Paused ${pausedCount} active executions`)
    return pausedCount > 0
  }

  /**
   * Resume active executions for a specific program
   */
  async resumeActiveExecutions(programId: string): Promise<boolean> {
    // За мониторинг на execution control - възобновяване на паузирани executions за конкретна програма
    console.log(`▶️ [SchedulerService] Resuming active executions for program: ${programId}`)
    
    let resumedCount = 0
    
    // Find and resume paused cycles for this program  
    for (const [cycleKey, execution] of this.runningCycles) {
      if (execution.programId === programId) {
        try {
          // Resume FlowExecutor directly
          if (this.flowExecutor.resume()) {
            console.log(`▶️ [SchedulerService] Resumed execution for cycle: ${execution.cycleId}`)
            resumedCount++
          }
        } catch (error) {
          console.error(`❌ [SchedulerService] Failed to resume cycle ${execution.cycleId}:`, error)
        }
      }
    }
    
    console.log(`✅ [SchedulerService] Resumed ${resumedCount} active executions`)
    return resumedCount > 0
  }

  /**
   * Stop active executions for a specific program
   */
  async stopActiveExecutions(programId: string): Promise<boolean> {
    // За мониторинг на execution control - спиране на всички активни executions за конкретна програма
    console.log(`🛑 [SchedulerService] Stopping active executions for program: ${programId}`)
    
    let stoppedCount = 0
    const cyclesToRemove: string[] = []
    
    // Find and stop running cycles for this program
    for (const [cycleKey, execution] of this.runningCycles) {
      if (execution.programId === programId) {
        try {
          // Stop FlowExecutor directly
          if (this.flowExecutor.stop()) {
            console.log(`🛑 [SchedulerService] Stopped execution for cycle: ${execution.cycleId}`)
            cyclesToRemove.push(cycleKey)
            stoppedCount++
          }
        } catch (error) {
          console.error(`❌ [SchedulerService] Failed to stop cycle ${execution.cycleId}:`, error)
        }
      }
    }
    
    // Clean up stopped cycles from tracking
    cyclesToRemove.forEach(key => this.runningCycles.delete(key))
    
    console.log(`✅ [SchedulerService] Stopped ${stoppedCount} active executions`)
    return stoppedCount > 0
  }

  /**
   * Wait for flow completion via WebSocket signals
   */
  private waitForFlowCompletion(): Promise<void> {
    // За мониторинг на WebSocket communication - изчакване на flow completion чрез WebSocket сигнали
    return new Promise((resolve) => {
      if (!this.wsClient) {
        console.warn('⚠️ No WebSocket connection, using timeout fallback')
        setTimeout(resolve, 3000)
        return
      }

      let flowCompletedReceived = false
      let systemIdleReceived = false

      const messageHandler = (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString())
          
          // Look for system.end block execution
          if (message.type === 'block_executed' && 
              message.data?.blockType === 'system.end' && 
              message.data?.result?.success) {
            console.log('🏁 Received system.end block completion')
            flowCompletedReceived = true
          }
          
          // Look for system status change to idle
          if (message.type === 'status_change' && 
              message.data?.status === 'idle') {
            console.log('💤 System returned to idle state')
            systemIdleReceived = true
          }
          
          // Flow completed successfully message
          if (message.type === 'flow_status' && 
              message.data?.status === 'completed') {
            console.log('✅ Flow completed successfully')
            flowCompletedReceived = true
          }

          // Resolve only when we have both signals
          if (flowCompletedReceived && systemIdleReceived) {
            this.wsClient?.off('message', messageHandler)
            console.log('🎯 ActionTemplate fully completed, ready for next')
            resolve()
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error)
        }
      }

      this.wsClient.on('message', messageHandler)
      
      // Timeout fallback after 60 seconds
      setTimeout(() => {
        this.wsClient?.off('message', messageHandler)
        console.warn('⚠️ WebSocket completion timeout, proceeding anyway')
        resolve()
      }, 60000)
    })
  }

  /**
   * 🔄 NEW: Check for pending monitoring queue on server startup
   */
  private async checkPendingMonitoringOnStartup(): Promise<void> {
    // За мониторинг на startup operations - проверка за pending monitoring flows в опашката при стартиране на системата
    try {
      console.log('🚀 [SchedulerService] Checking for pending monitoring flows on startup...')
      
      // Get SystemStateManager from FlowExecutor
      const systemStateManager = this.flowExecutor.getSystemStateManager()
      
      // Get pending monitoring flows from queue
      const pendingFlows = await systemStateManager.getPendingMonitoringFlows()
      
      if (pendingFlows.length === 0) {
        console.log('✅ [SchedulerService] No pending monitoring flows found on startup')
        return
      }

      console.log(`🔄 [SchedulerService] Found ${pendingFlows.length} pending monitoring flows from previous session`)
      
      // Process them immediately on startup (don't wait for scheduler tick)
      await this.processMonitoringQueue()
      
      console.log('✅ [SchedulerService] Startup monitoring queue processing completed')
      
    } catch (error) {
      console.error('❌ [SchedulerService] Failed to process pending monitoring queue on startup:', error)
      // Don't fail scheduler start due to monitoring queue issues
    }
  }

  /**
   * Manual trigger for testing - force process cycles now
   */
  async triggerManualCheck(): Promise<void> {
    // За мониторинг на manual triggers - мануално задействане на scheduler проверка чрез API извикване
    // this.logger.info(LogTags.flow.execute.started, {
    //   message: 'Manual scheduler check triggered',
    //   triggered_by: 'api_call',
    //   timestamp: new Date().toISOString()
    // }, {
    //   source: { file: 'SchedulerService.ts', method: 'triggerManualCheck' },
    //   business: { category: 'flow', operation: 'manual_scheduler_trigger' }
    // })
    await this.processActivePrograms()
  }

  /**
   * Get last execution time for monitoring program
   */
  private getLastMonitoringExecution(monitoringKey: string): Date | null {
    return this.monitoringExecutions.get(monitoringKey) || null
  }

  /**
   * Set last execution time for monitoring program
   */
  private setLastMonitoringExecution(monitoringKey: string, time: Date): void {
    this.monitoringExecutions.set(monitoringKey, time)
  }

  /**
   * Get monitoring programs status
   */
  getMonitoringStatus(): {
    activeMonitoringPrograms: number
    lastExecutions: Array<{key: string, lastExecution: Date}>
  } {
    return {
      activeMonitoringPrograms: this.monitoringExecutions.size,
      lastExecutions: Array.from(this.monitoringExecutions.entries()).map(([key, time]) => ({
        key,
        lastExecution: time
      }))
    }
  }

  // ================================
  // NEW QUEUE-BASED HELPER METHODS
  // ================================

  /**
   * Add monitoring flow to queue with enhanced deduplication check
   */
  private async addMonitoringFlowToQueue(monitoringFlow: IMonitoringFlow, pausedBy: string): Promise<void> {
    // За мониторинг на queue management - добавяне на monitoring flow в опашката при конфликти с enhanced deduplication
    const { MonitoringQueue } = await import('../models/MonitoringQueue')
    
    // 🚀 IMPROVED: Check if already in queue with comprehensive status check
    const existingQueueItem = await MonitoringQueue.findOne({
      flowId: monitoringFlow._id,
      status: { $in: ['pending', 'executing'] }
    })
    
    if (!existingQueueItem) {
      // 🧹 CLEANUP: Remove old completed/failed entries for this flow (older than 1 hour)
      const oneHourAgo = new Date()
      oneHourAgo.setHours(oneHourAgo.getHours() - 1)
      
      const cleanupResult = await MonitoringQueue.deleteMany({
        flowId: monitoringFlow._id,
        status: { $in: ['completed', 'failed'] },
        addedAt: { $lt: oneHourAgo }
      })
      
      if (cleanupResult.deletedCount > 0) {
        console.log(`🧹 [SchedulerService] Cleaned up ${cleanupResult.deletedCount} old queue entries for ${monitoringFlow.name}`)
      }
      
      // Add to queue
      const queueItem = new MonitoringQueue({
        flowId: monitoringFlow._id,
        flowName: monitoringFlow.name || 'Unknown Flow',
        flowDescription: monitoringFlow.description,
        pausedBy,
        status: 'pending',
        priority: 0,
        addedAt: new Date()
      })
      
      try {
        await queueItem.save()
        console.log(`📋 [SchedulerService] Added ${monitoringFlow.name} to monitoring queue (pausedBy: ${pausedBy})`)
        console.log(`🔍 [QUEUE DEBUG] Successfully saved to DB with ID: ${queueItem._id}`)
      } catch (saveError) {
        console.error(`❌ [QUEUE ERROR] Failed to save to monitoringqueues:`, saveError)
        throw saveError
      }
    } else {
      console.log(`⏭️ [SchedulerService] ${monitoringFlow.name} already in monitoring queue (status: ${existingQueueItem.status}) - skipping duplicate`)
      
      // 🔄 UPDATE: Update pausedBy if different (for better tracking)
      if (existingQueueItem.pausedBy !== pausedBy) {
        existingQueueItem.pausedBy = pausedBy
        await existingQueueItem.save()
        console.log(`🔄 [SchedulerService] Updated pausedBy for ${monitoringFlow.name}: ${pausedBy}`)
      }
    }
  }

  /**
   * Execute monitoring flow directly (original logic)
   */
  private async executeMonitoringFlowDirectly(monitoringFlow: IMonitoringFlow, startTime: Date): Promise<void> {
    // За мониторинг на direct monitoring execution - директно изпълнение на monitoring flow без queue система
    const flowKey = `monitoring_flow_${monitoringFlow._id}`
    
    // 🐛 DEBUG: Add detailed logging for race condition investigation
    console.log(`🔍 [DEBUG] executeMonitoringFlowDirectly called for ${monitoringFlow.name}`)
    console.log(`🔍 [DEBUG] Flow key: ${flowKey}`)
    console.log(`🔍 [DEBUG] Current runningMonitoringFlows size: ${this.runningMonitoringFlows.size}`)
    console.log(`🔍 [DEBUG] runningMonitoringFlows keys:`, Array.from(this.runningMonitoringFlows.keys()))
    
    // Check if this flow is already running
    if (this.runningMonitoringFlows.has(flowKey)) {
      const runningStart = this.runningMonitoringFlows.get(flowKey)
      const timeSinceStart = startTime.getTime() - (runningStart?.getTime() || 0)
      console.log(`⏸️ MonitoringFlow ${monitoringFlow.name} is already running - skipping scheduler tick`)
      console.log(`🔍 [DEBUG] Flow has been running for ${Math.round(timeSinceStart / 1000)}s, letting it continue`)
      return
    }

    console.log(`📊 Starting monitoring flow: ${monitoringFlow.name} (interval: ${monitoringFlow.monitoringInterval}min)`)

    try {
      // Mark as running
      console.log(`🔍 [DEBUG] Marking ${flowKey} as running at ${startTime.toISOString()}`)
      this.runningMonitoringFlows.set(flowKey, startTime)
      console.log(`🔍 [DEBUG] runningMonitoringFlows size after set: ${this.runningMonitoringFlows.size}`)

      // Execute the flow
      await this.executeMonitoringFlow(monitoringFlow, startTime)

      // Update execution statistics
      monitoringFlow.updateAfterExecution(true)
      await monitoringFlow.save()

      console.log(`✅ Monitoring flow completed: ${monitoringFlow.name}`)
      console.log(`🔍 [DEBUG] Flow ${flowKey} completed successfully`)

    } catch (error) {
      console.log(`🔍 [DEBUG] Flow ${flowKey} threw error:`, error instanceof Error ? error.message : error)
      // 🔄 NEW: Check if error is due to system not idle - add to queue and process
      if (error instanceof Error && error.message.includes('system not in idle state')) {
        console.log(`🔄 [SchedulerService] System busy in direct execution - adding ${monitoringFlow.name} to queue`)
        
        try {
          await this.addMonitoringFlowToQueue(monitoringFlow, 'system_busy_direct')
          
          // Process the queue immediately 
          await this.processMonitoringQueue()
          
          return // Don't throw error if successfully queued and processed
        } catch (queueError) {
          console.error(`❌ [SchedulerService] Failed to handle system busy via queue:`, queueError)
        }
      }
      
      console.error(`❌ Error in monitoring flow ${monitoringFlow.name}:`, error)
      monitoringFlow.updateAfterExecution(false, error instanceof Error ? error.message : 'Unknown error')
      await monitoringFlow.save()
      throw error // Re-throw if not handled by queue
    } finally {
      // Always clean up
      console.log(`🔍 [DEBUG] Finally block: cleaning up ${flowKey}`)
      console.log(`🔍 [DEBUG] runningMonitoringFlows size before delete: ${this.runningMonitoringFlows.size}`)
      const wasDeleted = this.runningMonitoringFlows.delete(flowKey)
      console.log(`🔍 [DEBUG] Flow ${flowKey} delete result: ${wasDeleted}`)
      console.log(`🔍 [DEBUG] runningMonitoringFlows size after delete: ${this.runningMonitoringFlows.size}`)
      console.log(`🔍 [DEBUG] Remaining keys:`, Array.from(this.runningMonitoringFlows.keys()))
      
      // 🚩 NEW: Process monitoring queue after monitoring flow completion
      try {
        console.log(`🔄 [SchedulerService] Monitoring flow completed - checking queue`)
        await this.processMonitoringQueue()
      } catch (queueError) {
        console.error(`❌ [SchedulerService] Error processing monitoring queue after flow completion:`, queueError)
      }
    }
  }

  /**
   * Process monitoring queue until empty (continuous processing)
   */
  private async processMonitoringQueue(): Promise<void> {
    // За мониторинг на queue processing - continuous обработка на monitoring queue до изчерпване (FIFO ред)
    console.log(`🔄 [SchedulerService] Starting continuous monitoring queue processing`)
    
    const { MonitoringQueue } = await import('../models/MonitoringQueue')
    const { MonitoringFlow } = await import('../models/MonitoringFlow')
    
    let processedCount = 0
    
    while (true) {
      // Get next pending flow from queue
      const nextQueueItem = await MonitoringQueue.findOne({
        status: 'pending'
      }).populate({
        path: 'flowId',
        populate: { path: 'flowTemplateId' }  // 🚩 DEEP populate за jsonFileName
      }).sort({ addedAt: 1 }) // FIFO order
      
      if (!nextQueueItem) {
        console.log(`✅ [SchedulerService] Monitoring queue empty - processed ${processedCount} flows`)
        break
      }
      
      const monitoringFlow = nextQueueItem.flowId as any
      if (!monitoringFlow) {
        console.log(`⚠️ [SchedulerService] Queue item has invalid flowId - removing`)
        await MonitoringQueue.findByIdAndDelete(nextQueueItem._id)
        continue
      }
      
      console.log(`▶️ [SchedulerService] Processing queued flow: ${monitoringFlow.name}`)
      
      // Mark as executing
      nextQueueItem.status = 'executing'
      await nextQueueItem.save()
      
      try {
        // Execute the monitoring flow directly
        await this.executeMonitoringFlowDirectly(monitoringFlow, new Date())
        
        // Mark as completed and remove from queue
        await MonitoringQueue.findByIdAndDelete(nextQueueItem._id)
        console.log(`✅ [SchedulerService] Completed queued flow: ${monitoringFlow.name}`)
        
        processedCount++
        
      } catch (error) {
        //console.error(`❌ [SchedulerService] Failed to execute queued flow ${monitoringFlow.name}:`, error)
        console.error(`❌ [SchedulerService] Failed to execute queued flow ${monitoringFlow.name}:`)
        
        // Mark as failed
        nextQueueItem.status = 'failed'
        nextQueueItem.lastError = error instanceof Error ? error.message : 'Unknown error'
        await nextQueueItem.save()
        
        // Continue with next flow (don't break the queue processing)
        processedCount++
      }
    }
  }

  /**
   * 🕐 NEW: Wait for active monitoring flow to complete with timeout
   * @param activeExecution - The active execution session to wait for
   * @param timeoutMs - Maximum time to wait in milliseconds (default: 2min)
   * Изакване на цикъла заопределено време ако има активна програма 
   */
  private async waitForMonitoringCompletion(activeExecution: any, timeoutMs: number = 30000): Promise<void> {
    // За мониторинг на execution coordination - изчакване на monitoring flow completion с timeout за cycle priority
    console.log(`⏳ [SchedulerService] Waiting for monitoring flow ${activeExecution.flowName} to complete (timeout: ${timeoutMs/1000}s)`)
    
    const startWaitTime = Date.now()
    const pollInterval = 2000 // Check every 2 seconds
    
    while (Date.now() - startWaitTime < timeoutMs) {
      // Check if execution is still active
      const currentExecution = await this.checkActiveExecution()
      this.logger.info(LogTags.flow.execute.started, {
        message: 'Flow interruption countdown',
        remainingTime: `${Math.round((Date.now() - startWaitTime)/1000)} seconds`,
        context: 'Оставащо време до прекъсване на потока'
      }, {
        source: { file: 'SchedulerService.ts', method: 'waitForFlowCompletion' },
        business: { category: 'flow', operation: 'execution_monitoring' },
        sessionId: activeExecution?.executionId
      })
      
      if (!currentExecution || currentExecution.executionId !== activeExecution.executionId) {
        console.log(`✅ [SchedulerService] Monitoring flow completed naturally in ${Math.round((Date.now() - startWaitTime)/1000)}s`)
        return
      }
      
      

      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, pollInterval))
    }
    
    // Timeout reached - force stop the monitoring flow
    console.warn(`⚠️ [SchedulerService] Monitoring flow timeout (${timeoutMs/1000}s) - forcing stop`)
    
    try {
      // 🚩 NEW: Използвай CancellationToken за естествено спиране
      console.log(`🚩 [SchedulerService] Activating cancellation token for monitoring flow`)
      this.cancellationToken.cancel(`Cycle priority timeout after ${timeoutMs/1000}s`)
      
      // Изчакай до 5 секунди за естественото приключване
      const gracefulStopStart = Date.now()
      const gracefulStopTimeout = 5000 // 5 секунди
      
      while (Date.now() - gracefulStopStart < gracefulStopTimeout) {
        const currentExecution = await this.checkActiveExecution()
        if (!currentExecution || currentExecution.executionId !== activeExecution.executionId) {
          console.log(`✅ [SchedulerService] Monitoring flow stopped gracefully via cancellation token`)
          break
        }
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      console.log(`🛑 [SchedulerService] Cancellation token activated for monitoring flow`)
      
      // Mark execution session as failed
      await fetch(`http://localhost:5000/api/v1/execution-sessions/${activeExecution.executionId}/fail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: `Interrupted by cycle execution after ${timeoutMs/1000}s timeout`
        })
      })
      
      // Add to monitoring queue for later execution
      if (activeExecution.sourceId) {
        const { MonitoringFlow } = await import('../models/MonitoringFlow')
        const monitoringFlow = await MonitoringFlow.findById(activeExecution.sourceId)
        
        if (monitoringFlow) {
          await this.addMonitoringFlowToQueue(monitoringFlow, 'timeout_interrupt')
          console.log(`📋 [SchedulerService] Added interrupted monitoring flow to queue: ${monitoringFlow.name}`)
        }
      }
      
    } catch (error) {
      console.error(`❌ [SchedulerService] Failed to stop monitoring flow:`, error)
    }
  }

  /**
   * 🧹 NEW: Cleanup interrupted execution sessions from server restart
   * Called during SchedulerService.start() to clean up any ExecutionSession records
   * that were left in 'starting' or 'running' state from previous server instance
   */
  private async cleanupInterruptedExecutionSessions(): Promise<void> {
    // За мониторинг на cleanup operations - изчистване на interrupted ExecutionSession записи от предишна server сесия
    try {
      console.log('🧹 [SchedulerService] Cleaning up interrupted execution sessions from server restart...')
      
      // Find all ExecutionSession records that are in 'starting' or 'running' state
      const response = await fetch('http://localhost:5000/api/v1/execution-sessions')
      
      if (!response.ok) {
        console.warn('⚠️ [SchedulerService] ExecutionSession API not available for cleanup - continuing anyway')
        return
      }
      
      const data = await response.json() as any
      if (!data.success || !data.data?.sessions) {
        console.log('✅ [SchedulerService] No execution sessions found')
        return
      }
      
      // Filter only sessions that are in interrupted states
      const interruptedSessions = data.data.sessions.filter((session: any) => 
        session.status === 'starting' || session.status === 'running'
      )
      
      if (interruptedSessions.length === 0) {
        console.log('✅ [SchedulerService] No interrupted execution sessions found')
        return
      }
      
      console.log(`🧹 [SchedulerService] Found ${interruptedSessions.length} interrupted execution sessions`)
      
      // Mark each interrupted session as failed with restart reason
      let cleanedCount = 0
      
      for (const session of interruptedSessions) {
        try {
          const failResponse = await fetch(`http://localhost:5000/api/v1/execution-sessions/${session.executionId}/fail`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              error: 'Execution interrupted by server restart'
            })
          })
          
          if (failResponse.ok) {
            console.log(`🧹 [SchedulerService] Cleaned up interrupted session: ${session.executionId} (${session.flowType}: ${session.flowName})`)
            cleanedCount++
          } else {
            console.warn(`⚠️ [SchedulerService] Failed to clean up session ${session.executionId}`)
          }
        } catch (error) {
          console.error(`❌ [SchedulerService] Error cleaning up session ${session.executionId}:`, error)
        }
      }
      
      console.log(`✅ [SchedulerService] Cleanup completed: ${cleanedCount}/${interruptedSessions.length} sessions cleaned`)
      
    } catch (error) {
      console.error('❌ [SchedulerService] Failed to cleanup interrupted execution sessions:', error)
      // Don't fail scheduler start due to cleanup issues - continue anyway
    }
  }

  /**
   * HARDWARE HEALTH MONITORING METHODS
   */

  /**
   * Periodic hardware health check (called every minute from cron)
   */
  private async checkHardwareHealthIfNeeded(): Promise<void> {
    // За мониторинг на hardware health checks - периодична проверка на hardware health според конфигурирани параметри
    try {
      // Ensure health config is loaded
      if (!this.healthConfig) {
        await this.loadHealthConfiguration()
      }
      
      // Skip if health monitoring is disabled
      if (!this.healthConfig?.enabled) {
        return
      }
      
      const now = new Date()
      const healthCheckInterval = this.healthConfig.checkIntervalMinutes * 60 * 1000
      
      // Check if it's time for health check
      if (this.lastHealthCheck && (now.getTime() - this.lastHealthCheck.getTime()) < healthCheckInterval) {
        return // Not time yet
      }

      // Skip if already checking or if system is under heavy load
      if (this.hardwareHealthChecker.isHealthCheckInProgress()) {
        this.logger.warn(LogTags.system.health.warning, {
          message: 'Health check already in progress, skipping',
          status: 'in_progress'
        }, {
          source: { file: 'SchedulerService.ts', method: 'checkHardwareHealthIfNeeded' },
          business: { category: 'system', operation: 'health_check' }
        })
        return
      }

      // Skip if too many active cycles (system is busy) and skipDuringExecution is enabled
      if (this.healthConfig.skipDuringExecution && this.runningCycles.size > 5) {
        this.logger.warn(LogTags.system.health.warning, {
          message: 'System busy, skipping health check',
          activeCycles: this.runningCycles.size,
          reason: 'system_overload'
        }, {
          source: { file: 'SchedulerService.ts', method: 'checkHardwareHealthIfNeeded' },
          business: { category: 'system', operation: 'health_check' }
        })
        return
      }

      // this.logger.info(LogTags.system.health.check, {
      //   message: 'Starting periodic hardware health check',
      //   type: 'periodic'
      // }, {
      //   source: { file: 'SchedulerService.ts', method: 'checkHardwareHealthIfNeeded' },
      //   business: { category: 'system', operation: 'health_check' }
      // })
      
      // Perform health check with config parameters
      const healthReport = await this.hardwareHealthChecker.checkAllHardware({ 
        quickCheck: true,
        checkControllers: this.healthConfig.checkControllers,
        checkSensors: this.healthConfig.checkSensors
      })

      this.lastHealthCheck = now

      // Log summary
      this.logger.info(LogTags.system.health.check, {
        message: 'Health check completed',
        onlineControllers: healthReport.onlineControllers,
        totalControllers: healthReport.totalControllers,
        criticalIssues: healthReport.criticalIssues.length,
        summary: `${healthReport.onlineControllers}/${healthReport.totalControllers} controllers online, ${healthReport.criticalIssues.length} critical issues`
      }, {
        source: { file: 'SchedulerService.ts', method: 'checkHardwareHealthIfNeeded' },
        business: { category: 'system', operation: 'health_check' }
      })

      // Handle critical issues
      if (healthReport.criticalIssues.length > 0) {
        this.logger.error(LogTags.system.health.critical, {
          message: 'Critical hardware issues detected',
          criticalIssues: healthReport.criticalIssues,
          issueCount: healthReport.criticalIssues.length,
          issueList: healthReport.criticalIssues.join(', ')
        }, {
          source: { file: 'SchedulerService.ts', method: 'checkHardwareHealthIfNeeded' },
          business: { category: 'system', operation: 'health_check' }
        })
        
        // TODO: Send notifications for critical issues
        // await this.notifyHardwareIssues(healthReport.criticalIssues)
      }

      // Broadcast health status via WebSocket
      if (this.wsClient && this.wsClient.readyState === WebSocket.OPEN) {
        this.wsClient.send(JSON.stringify({
          type: 'hardware_health_update',
          data: {
            timestamp: healthReport.timestamp,
            controllersOnline: healthReport.onlineControllers,
            totalControllers: healthReport.totalControllers,
            criticalIssuesCount: healthReport.criticalIssues.length,
            hasIssues: healthReport.criticalIssues.length > 0 || healthReport.warnings.length > 0
          }
        }))
      }

    } catch (error) {
      this.logger.error(LogTags.system.health.critical, {
        message: 'Periodic hardware health check failed',
        error: error instanceof Error ? error.message : String(error),
        checkType: 'periodic'
      }, {
        source: { file: 'SchedulerService.ts', method: 'checkHardwareHealthIfNeeded' },
        business: { category: 'system', operation: 'health_check' }
      })
    }
  }

  /**
   * Manual hardware health check (API endpoint)
   */
  async runManualHealthCheck(fullCheck: boolean = false): Promise<any> {
    // За мониторинг на manual health checks - мануални hardware health операции инициирани чрез API
    try {
      // this.logger.info(LogTags.system.health.check, {
      //   message: 'Running manual health check',
      //   checkType: fullCheck ? 'full' : 'quick',
      //   triggeredBy: 'manual'
      // }, {
      //   source: { file: 'SchedulerService.ts', method: 'runManualHealthCheck' },
      //   business: { category: 'system', operation: 'health_check' }
      // })

      const healthReport = await this.hardwareHealthChecker.checkAllHardware({
        quickCheck: !fullCheck,
        forceCheck: true,
        checkControllers: this.healthConfig.checkControllers,
        checkSensors: this.healthConfig.checkSensors
      })

      // Process offline serial controllers - recreate adapters and retry
      console.log(`\n🔍 [MANUAL HEALTH CHECK] Processing ${healthReport.controllers?.length || 0} controllers`)

      if (healthReport.controllers && healthReport.controllers.length > 0) {
        const { PhysicalController } = await import('../models/PhysicalController')
        const { ConnectionManagerService } = await import('./ConnectionManagerService')
        const connectionManager = ConnectionManagerService.getInstance()

        for (const controllerStatus of healthReport.controllers) {
          console.log(`\n📊 [MANUAL HEALTH CHECK] Controller: ${controllerStatus.name} - Status: ${controllerStatus.status}`)

          if (controllerStatus.status === 'offline' || controllerStatus.status === 'error') {
            console.log(`⚠️  [MANUAL HEALTH CHECK] Controller is ${controllerStatus.status}, checking if serial...`)

            // Get controller from database
            const controller = await PhysicalController.findById(controllerStatus.controllerId)

            if (controller && controller.communicationType === 'raw_serial') {
              console.log(`🔌 [MANUAL HEALTH CHECK] Serial controller detected: ${controller.name}`)
              console.log(`   Initiating adapter recreation...`)

              this.logger.info(LogTags.system.health.check, {
                message: 'Serial controller offline, attempting adapter recreation',
                controllerId: controller._id.toString(),
                controllerName: controller.name
              }, {
                source: { file: 'SchedulerService.ts', method: 'runManualHealthCheck' },
                business: { category: 'controller', operation: 'adapter_recreation' }
              })

              // Recreate adapter
              const newAdapter = await connectionManager.recreateAdapter(controller._id.toString())

              if (newAdapter) {
                console.log(`📡 [MANUAL HEALTH CHECK] Adapter recreated, testing PING...`)

                // Test new connection with PING
                try {
                  const pingResult = await newAdapter.ping()

                  if (pingResult) {
                    console.log(`✅ [MANUAL HEALTH CHECK] PING SUCCESS - Updating status to ONLINE`)

                    // Update controller status to online
                    await PhysicalController.findByIdAndUpdate(controller._id, {
                      status: 'online',
                      healthStatus: 'healthy',
                      lastHealthCheck: new Date(),
                      lastHeartbeat: new Date()
                    })

                    // Update health report
                    controllerStatus.status = 'online'
                    healthReport.onlineControllers++

                    this.logger.info(LogTags.controller.connect.success, {
                      message: 'Serial controller reconnected successfully',
                      controllerId: controller._id.toString(),
                      controllerName: controller.name
                    }, {
                      source: { file: 'SchedulerService.ts', method: 'runManualHealthCheck' },
                      business: { category: 'controller', operation: 'reconnection_success' }
                    })
                  } else {
                    console.log(`❌ [MANUAL HEALTH CHECK] PING FAILED - Controller remains OFFLINE`)
                  }
                } catch (pingError) {
                  console.log(`❌ [MANUAL HEALTH CHECK] PING EXCEPTION: ${pingError}`)

                  this.logger.warn(LogTags.controller.health.offline, {
                    message: 'PING failed after adapter recreation',
                    controllerId: controller._id.toString(),
                    error: pingError
                  }, {
                    source: { file: 'SchedulerService.ts', method: 'runManualHealthCheck' },
                    business: { category: 'controller', operation: 'ping_failed' }
                  })
                }
              } else {
                console.log(`❌ [MANUAL HEALTH CHECK] Adapter recreation FAILED`)
              }
            } else {
              console.log(`ℹ️  [MANUAL HEALTH CHECK] Not a serial controller, skipping recreation`)
            }
          }
        }
      }

      console.log(`\n✅ [MANUAL HEALTH CHECK] Complete - ${healthReport.onlineControllers}/${healthReport.totalControllers} controllers online\n`)

      this.lastHealthCheck = new Date()

      return {
        success: true,
        data: healthReport,
        message: `Health check completed: ${healthReport.onlineControllers}/${healthReport.totalControllers} controllers online`
      }

    } catch (error) {
      this.logger.error(LogTags.system.health.critical, {
        message: 'Manual health check failed',
        error: error instanceof Error ? error.message : String(error),
        checkType: 'manual'
      }, {
        source: { file: 'SchedulerService.ts', method: 'runManualHealthCheck' },
        business: { category: 'system', operation: 'health_check' }
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: 'Health check failed'
      }
    }
  }

  /**
   * Configure hardware health check settings (saves to database)
   */
  async configureHealthCheck(updates: {
    enabled?: boolean,
    checkIntervalMinutes?: number,
    failureThreshold?: number,
    timeoutMs?: number,
    quickPingTimeout?: number,
    maxConcurrentChecks?: number,
    [key: string]: any
  }, updatedBy: string = 'api'): Promise<any> {
    // За мониторинг на health configuration - динамично конфигуриране на hardware health monitoring параметри
    try {
      // Update database configuration
      const updatedConfig = await HealthConfig.updateSingleton(updates, updatedBy)
      
      // Reload cached configuration
      this.healthConfig = updatedConfig.toApiResponse()
      
      // Configure HardwareHealthChecker with new settings
      this.hardwareHealthChecker.configure(updatedConfig.toSchedulerConfig())
      
      // this.logger.info(LogTags.system.startup.completed, {
      //   message: 'Health configuration updated',
      //   updatedBy: updatedBy,
      //   configId: updatedConfig._id
      // }, {
      //   source: { file: 'SchedulerService.ts', method: 'updateHealthConfiguration' },
      //   business: { category: 'system', operation: 'health_configuration' }
      // })
      
      return {
        success: true,
        data: this.healthConfig,
        message: 'Health configuration updated successfully'
      }
      
    } catch (error) {
      this.logger.error(LogTags.system.startup.failed, {
        message: 'Failed to update health configuration',
        error: error instanceof Error ? error.message : String(error)
      }, {
        source: { file: 'SchedulerService.ts', method: 'updateHealthConfiguration' },
        business: { category: 'system', operation: 'health_configuration' }
      })
      throw error
    }
  }

  /**
   * Get health check status and last results
   */
  async getHealthCheckStatus(): Promise<any> {
    // Ensure config is loaded
    if (!this.healthConfig) {
      await this.loadHealthConfiguration()
    }
    
    return {
      lastCheck: this.lastHealthCheck,
      interval: this.healthConfig?.checkIntervalMinutes * 60 * 1000 || 300000,
      isInProgress: this.hardwareHealthChecker.isHealthCheckInProgress(),
      configuration: this.healthConfig
    }
  }
  
  /**
   * Load health configuration from database
   */
  private async runStartupHealthCheck(): Promise<void> {
    // За мониторинг на startup operations - задължителна пълна health проверка при старт на системата
    try {
      // this.logger.info(LogTags.system.startup.started, {
      //   message: 'Starting mandatory full health check at system startup',
      //   checkType: 'startup_mandatory'
      // }, {
      //   source: { file: 'SchedulerService.ts', method: 'runStartupHealthCheck' },
      //   business: { category: 'system', operation: 'startup_health_check' }
      // })
      
      // Wait a bit for system initialization to complete
      setTimeout(async () => {
        try {
          // Force full health check regardless of configuration
          const healthReport = await this.hardwareHealthChecker.checkAllHardware({ 
            quickCheck: false,        // Deep check, not quick
            checkControllers: true,   // Always check controllers at startup
            checkSensors: true       // Always check sensors at startup
          })

          // Log comprehensive startup health summary
          // this.logger.info(LogTags.system.startup.completed, {
          //   message: 'Startup health check completed',
          //   summary: 'STARTUP HEALTH SUMMARY',
          //   onlineControllers: healthReport.onlineControllers,
          //   totalControllers: healthReport.totalControllers,
          //   onlineDevices: healthReport.onlineDevices,
          //   totalDevices: healthReport.totalDevices,
          //   criticalIssues: healthReport.criticalIssues.length,
          //   warnings: healthReport.warnings.length,
          //   fullSummary: `${healthReport.onlineControllers}/${healthReport.totalControllers} controllers online, ${healthReport.onlineDevices}/${healthReport.totalDevices} devices online, ${healthReport.criticalIssues.length} critical issues, ${healthReport.warnings.length} warnings`
          // }, {
          //   source: { file: 'SchedulerService.ts', method: 'runStartupHealthCheck' },
          //   business: { category: 'system', operation: 'startup_health_check' }
          // })

          // Set initial health check timestamp
          this.lastHealthCheck = new Date()

        } catch (error) {
          this.logger.error(LogTags.system.startup.failed, {
            message: 'Failed to complete startup health check',
            error: error instanceof Error ? error.message : String(error),
            checkType: 'startup_mandatory'
          }, {
            source: { file: 'SchedulerService.ts', method: 'runStartupHealthCheck' },
            business: { category: 'system', operation: 'startup_health_check' }
          })
        }
      }, 3000) // Wait 3 seconds for hardware initialization

    } catch (error) {
      this.logger.error(LogTags.system.startup.failed, {
        message: 'Failed to schedule startup health check',
        error: error instanceof Error ? error.message : String(error),
        checkType: 'startup_mandatory'
      }, {
        source: { file: 'SchedulerService.ts', method: 'runStartupHealthCheck' },
        business: { category: 'system', operation: 'startup_health_check' }
      })
      // Don't fail scheduler start due to health check issues
    }
  }

  private async loadHealthConfiguration(): Promise<void> {
    // За мониторинг на health config loading - зареждане на health configuration от база данни при startup
    try {
      const config = await HealthConfig.getSingleton()
      this.healthConfig = config.toApiResponse()
      
      // Configure HardwareHealthChecker with loaded settings
      this.hardwareHealthChecker.configure(config.toSchedulerConfig())
      
      // this.logger.info(LogTags.system.startup.completed, {
      //   message: 'Health configuration loaded from database',
      //   configId: config._id
      // }, {
      //   source: { file: 'SchedulerService.ts', method: 'loadHealthConfiguration' },
      //   business: { category: 'system', operation: 'health_configuration' }
      // })
      
    } catch (error) {
      this.logger.error(LogTags.system.startup.failed, {
        message: 'Failed to load health configuration',
        error: error instanceof Error ? error.message : String(error)
      }, {
        source: { file: 'SchedulerService.ts', method: 'loadHealthConfiguration' },
        business: { category: 'system', operation: 'health_configuration' }
      })
      
      // Fallback to default configuration
      this.healthConfig = {
        enabled: true,
        checkControllers: true,
        checkSensors: false,
        checkIntervalMinutes: 5,
        failureThreshold: 3,
        timeoutMs: 5000,
        quickPingTimeout: 500,
        maxConcurrentChecks: 3,
        skipDuringExecution: true
      }
    }
  }

  /**
   * Track cycle execution status in dashboard
   */
  private async trackCycleExecutionStatus(
    cycleId: string,
    status: 'pending' | 'running' | 'completed' | 'failed',
    startTime?: Date,
    endTime?: Date,
    duration?: number | null
  ): Promise<void> {
    try {
      const requestData = {
        cycleId,
        status,
        startTime: startTime?.toISOString(),
        endTime: endTime?.toISOString(),
        duration
      }

      await fetch('http://localhost:5000/api/v1/dashboard/sections/program/cycle-execution-status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })

      console.log(`📊 [SchedulerService] Tracked cycle ${cycleId} status: ${status}`)

      // Broadcast dashboard refresh to update frontend
      const { WebSocketManager } = await import('../modules/flowExecutor/core/WebSocketManager')
      const wsManager = WebSocketManager.getInstance()
      if (wsManager) {
        wsManager.broadcastDashboardRefresh(`cycle_${status}`, {
          cycleId,
          status,
          duration
        })
        console.log(`📡 [SchedulerService] Broadcast dashboard refresh for cycle ${cycleId}`)
      }
    } catch (error) {
      console.warn(`⚠️ [SchedulerService] Failed to track cycle ${cycleId} status:`, error)
      // Don't throw - cycle tracking shouldn't break execution
    }
  }

  /**
   * Perform daily cleanup at midnight - reset tracking data for new day
   */
  private async performDailyCleanup(): Promise<void> {
    try {
      console.log('🧹 [SchedulerService] Starting daily cleanup at midnight...')

      const today = new Date().toISOString().split('T')[0]

      // Import DashboardSection model
      const { DashboardSection } = await import('../models/DashboardSection')

      // Find program section
      const programSection = await DashboardSection.findOne({ sectionId: 'program' })

      if (programSection) {
        // Reset daily tracking data for new day
        if (programSection.sectionSettings.dailyTracking) {
          programSection.sectionSettings.dailyTracking = {
            date: today,
            completedCycles: [],
            cycleExecutions: [],
            actionTemplateExecutions: []
          }

          await programSection.save()

          console.log(`✅ [SchedulerService] Daily cleanup completed - reset tracking data for ${today}`)

          // Broadcast dashboard refresh to update frontend with clean state
          const { WebSocketManager } = await import('../modules/flowExecutor/core/WebSocketManager')
          const wsManager = WebSocketManager.getInstance()
          if (wsManager) {
            wsManager.broadcastDashboardRefresh('daily_cleanup', {
              date: today,
              message: 'Daily tracking data reset for new day'
            })
            console.log('📡 [SchedulerService] Broadcast daily cleanup refresh')
          }
        } else {
          console.log('ℹ️ [SchedulerService] No daily tracking data found to cleanup')
        }
      } else {
        console.log('ℹ️ [SchedulerService] No program section found for daily cleanup')
      }
    } catch (error) {
      console.error('🔴 [SchedulerService] Daily cleanup failed:', error)
      // Don't throw - daily cleanup shouldn't break scheduler operation
    }
  }
}

// Export singleton instance
export const schedulerService = SchedulerService.getInstance()
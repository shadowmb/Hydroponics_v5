import mongoose from 'mongoose'
import { ActiveProgram, IActiveProgram, ISkippedCycle } from '../models/ActiveProgram'
import { Program } from '../models/Program'

export class ActiveProgramService {
  
  /**
   * Get current active program
   */
  static async getCurrentActive(): Promise<IActiveProgram | null> {
    return ActiveProgram.findOne()
      .populate('programId', 'name description')
      .populate('controllerId', 'name')
      .populate('activeCycles.taskId', 'name actionTemplateId')
  }

  /**
   * Load a program as active
   */
  static async loadProgram(programId: string, controllerId: string): Promise<IActiveProgram> {
    // Check if there's already an active program
    const existingActive = await ActiveProgram.findOne()
    if (existingActive && existingActive.status !== 'stopped' && existingActive.status !== 'completed') {
      throw new Error('Another program is already active. Stop it first.')
    }

    // Remove any existing active program
    await ActiveProgram.deleteMany({})

    // Get the program details
    const program = await Program.findById(programId).populate('cycles.actions.actionTemplateId')
    if (!program) {
      throw new Error('Program not found')
    }

    // Create active cycles from program (one active cycle per program cycle)
    const activeCycles = program.cycles.map((cycle, cycleIndex) => ({
      cycleId: `cycle-${cycleIndex}`,
      taskId: new mongoose.Types.ObjectId(), // Generate new ObjectId for task
      startTime: cycle.startTime,
      // TODO: REMOVE - interval not needed for daily cycles (only startTime matters)
      //interval: cycle.interval || 60, // Default 60 minutes if not specified
      duration: cycle.duration,
      nextExecution: new Date(Date.now() + 60000), // Start in 1 minute
      executionCount: 0,
      isActive: true
    }))


    // Create new active program
    const activeProgram = new ActiveProgram({
      programId: programId,
      controllerId: controllerId,
      name: program.name,
      status: 'loaded',
      startedAt: new Date(),
      maxExecutionTime: program.maxExecutionTime || 60,
      activeCycles,
      skippedCycles: [],
      totalExecutions: 0
    })

    await activeProgram.save()
    
    const result = await ActiveProgram.findById(activeProgram._id)
      .populate('programId', 'name description')
      .populate('controllerId', 'name')
    
    if (!result) {
      throw new Error('Failed to retrieve created active program')
    }
    
    return result
  }

  /**
   * Schedule program with delayed start
   */
  static async scheduleProgram(delayDays: number): Promise<IActiveProgram> {
    const activeProgram = await ActiveProgram.findOne()
    if (!activeProgram) {
      throw new Error('No active program found')
    }

    if (delayDays < 0 || delayDays > 365) {
      throw new Error('Delay days must be between 0 and 365')
    }

    activeProgram.status = 'scheduled'
    activeProgram.delayDays = delayDays
    activeProgram.scheduledStartDate = new Date(Date.now() + delayDays * 24 * 60 * 60 * 1000)

    await activeProgram.save()
    return activeProgram
  }

  /**
   * Start active program
   */
  static async startProgram(): Promise<IActiveProgram> {
    const activeProgram = await ActiveProgram.findOne()
    if (!activeProgram) {
      throw new Error('No active program found')
    }

    if (activeProgram.status === 'running') {
      throw new Error('Program is already running')
    }

    activeProgram.status = 'running'
    activeProgram.startedAt = new Date()
    
    // Reset paused/stopped dates
    activeProgram.pausedAt = undefined
    activeProgram.stoppedAt = undefined

    await activeProgram.save()
    return activeProgram
  }

  /**
   * Pause active program
   */
  static async pauseProgram(): Promise<IActiveProgram> {
    const activeProgram = await ActiveProgram.findOne()
    if (!activeProgram) {
      throw new Error('No active program found')
    }

    if (activeProgram.status !== 'running') {
      throw new Error('Program is not running')
    }

    activeProgram.status = 'paused'
    activeProgram.pausedAt = new Date()

    await activeProgram.save()
    return activeProgram
  }

  /**
   * Stop active program
   */
  static async stopProgram(): Promise<IActiveProgram> {
    const activeProgram = await ActiveProgram.findOne()
    if (!activeProgram) {
      throw new Error('No active program found')
    }

    activeProgram.status = 'loaded'
    activeProgram.stoppedAt = new Date()
    
    // Reset paused date when stopping
    activeProgram.pausedAt = undefined

    await activeProgram.save()
    return activeProgram
  }

  /**
   * Remove active program
   */
  static async removeActiveProgram(): Promise<void> {
    const activeProgram = await ActiveProgram.findOne()
    if (!activeProgram) {
      throw new Error('No active program found')
    }

    if (activeProgram.status === 'running') {
      throw new Error('Cannot remove running program. Stop it first.')
    }

    await ActiveProgram.deleteMany({})
  }


  /**
   * Skip cycle for specified period
   */
  static async skipCycle(cycleId: string, skipDays: number, reason?: string): Promise<IActiveProgram> {
    const activeProgram = await ActiveProgram.findOne()
    if (!activeProgram) {
      throw new Error('No active program found')
    }

    if (skipDays < 0 || skipDays > 365) {
      throw new Error('Skip days must be between 0 and 365')
    }

    const skipUntil = new Date(Date.now() + skipDays * 24 * 60 * 60 * 1000)
    
    // Remove existing skip for this cycle
    activeProgram.skippedCycles = activeProgram.skippedCycles.filter(
      skip => skip.cycleId !== cycleId
    )

    // Add new skip
    activeProgram.skippedCycles.push({
      cycleId,
      skipUntil,
      reason
    })

    await activeProgram.save()
    return activeProgram
  }

  /**
   * Remove cycle skip
   */
  static async removeSkipCycle(cycleId: string): Promise<IActiveProgram> {
    const activeProgram = await ActiveProgram.findOne()
    if (!activeProgram) {
      throw new Error('No active program found')
    }

    activeProgram.skippedCycles = activeProgram.skippedCycles.filter(
      skip => skip.cycleId !== cycleId
    )

    await activeProgram.save()
    return activeProgram
  }

  /**
   * Check if cycle is currently skipped
   */
  static isCycleSkipped(activeProgram: IActiveProgram, cycleId: string): boolean {
    const skip = activeProgram.skippedCycles.find(skip => skip.cycleId === cycleId)
    if (!skip) return false
    
    return new Date() < skip.skipUntil
  }

  /**
   * Get active program status info
   */
  static async getStatusInfo(): Promise<{
    hasActive: boolean
    status?: string
    timeRemaining?: number
    nextExecution?: Date
  }> {
    const activeProgram = await ActiveProgram.findOne()
    
    if (!activeProgram) {
      return { hasActive: false }
    }

    let timeRemaining: number | undefined
    if (activeProgram.status === 'scheduled' && activeProgram.scheduledStartDate) {
      timeRemaining = Math.max(0, activeProgram.scheduledStartDate.getTime() - Date.now())
    }

    const nextExecution = activeProgram.activeCycles
      .filter(cycle => cycle.isActive)
      .map(cycle => cycle.nextExecution)
      .sort((a, b) => a.getTime() - b.getTime())[0]

    return {
      hasActive: true,
      status: activeProgram.status,
      timeRemaining,
      nextExecution
    }
  }

  /**
   * Clean up expired skipped cycles
   */
  static async cleanupExpiredSkips(): Promise<void> {
    const activeProgram = await ActiveProgram.findOne()
    if (!activeProgram) return

    const now = new Date()
    const originalCount = activeProgram.skippedCycles.length

    activeProgram.skippedCycles = activeProgram.skippedCycles.filter(
      skip => skip.skipUntil > now
    )

    if (activeProgram.skippedCycles.length !== originalCount) {
      await activeProgram.save()
    }
  }

  /**
   * Update cycle start time with automatic pause logic
   */
  static async updateCycleStartTime(cycleId: string, newStartTime: string): Promise<IActiveProgram> {
    const activeProgram = await ActiveProgram.findOne()
    if (!activeProgram) {
      throw new Error('No active program found')
    }

    // Validate time format (00:00 to 23:59)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(newStartTime)) {
      throw new Error('Invalid time format. Use HH:MM format (00:00 to 23:59)')
    }

    // Find the cycle
    const cycle = activeProgram.activeCycles.find(c => c.cycleId === cycleId)
    if (!cycle) {
      throw new Error(`Cycle ${cycleId} not found`)
    }

    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    
    // Parse times for comparison
    const [newHours, newMinutes] = newStartTime.split(':').map(Number)
    const [currentHours, currentMinutes] = currentTime.split(':').map(Number)
    
    const newTimeInMinutes = newHours * 60 + newMinutes
    const currentTimeInMinutes = currentHours * 60 + currentMinutes
    
    // Check if cycle was executed today
    const wasExecutedToday = cycle.lastExecuted && 
      new Date(cycle.lastExecuted).toDateString() === now.toDateString()
    
    console.log(`🔍 [DEBUG] Промяна стартиращо време на "цикъл" ${cycleId}...`)
    //console.log(`  - lastExecuted: ${cycle.lastExecuted}`)
    //console.log(`  - lastExecuted date: ${cycle.lastExecuted ? new Date(cycle.lastExecuted).toDateString() : 'null'}`)
    //console.log(`  - current date: ${now.toDateString()}`)
    //console.log(`  - wasExecutedToday: ${wasExecutedToday}`)
    //console.log(`  - currentTime: ${currentTime} (${currentTimeInMinutes} min)`)
    //console.log(`  - newTime: ${newStartTime} (${newTimeInMinutes} min)`)
    //console.log(`  - newTimeAfterCurrent: ${newTimeInMinutes > currentTimeInMinutes}`)
    
    // Auto-pause logic: if cycle executed today AND new time is after current time
    if (wasExecutedToday && newTimeInMinutes > currentTimeInMinutes) {
      console.log(`🔄 Cycle ${cycleId} executed today, new time ${newStartTime} is after current time ${currentTime} - auto-pausing for today`)
      
      // Calculate skip until end of today
      const endOfDay = new Date(now)
      endOfDay.setHours(23, 59, 59, 999)
      
      // Remove any existing skip for this cycle
      activeProgram.skippedCycles = activeProgram.skippedCycles.filter(
        skip => skip.cycleId !== cycleId
      )
      
      // Add auto-pause skip
      activeProgram.skippedCycles.push({
        cycleId,
        skipUntil: endOfDay,
        reason: `Auto-paused: time changed to ${newStartTime} after execution`
      })
    }

    // Update the start time
    cycle.startTime = newStartTime
    
    await activeProgram.save()
    return activeProgram
  }
}
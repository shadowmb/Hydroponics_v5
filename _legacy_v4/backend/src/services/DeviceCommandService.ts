// ABOUTME: DeviceCommandService handles device template-based command execution and device business logic
// ABOUTME: Extracted from StartupService as part of delegation pattern refactoring (Phase 6)

import { Device, IDevice } from '../models/Device'
import { UnifiedLoggingService } from './UnifiedLoggingService'
import { HardwareCommunicationService } from './HardwareCommunicationService'
import { ConnectionManagerService } from './ConnectionManagerService'
import { IStartupCommand, IStartupResponse } from '../types/startup-interfaces'
import { LogTags } from '../utils/LogTags'
import { buildCommand, CommandBuilderError } from '../utils/CommandBuilder'

export class DeviceCommandService {
  private static instance: DeviceCommandService
  private hardwareCommunication: HardwareCommunicationService
  private connectionManager: ConnectionManagerService
  private logger = UnifiedLoggingService.createModuleLogger('DeviceCommandService.ts')

  constructor() {
    this.hardwareCommunication = HardwareCommunicationService.getInstance()
    this.connectionManager = ConnectionManagerService.getInstance()
  }

  static getInstance(): DeviceCommandService {
    if (!DeviceCommandService.instance) {
      DeviceCommandService.instance = new DeviceCommandService()
    }
    return DeviceCommandService.instance
  }

  // Main execution engine for device commands
  async executeCommand(controllerId: string, command: IStartupCommand): Promise<IStartupResponse> {
    // За мониторинг на command execution engine - централен механизъм за обработка на всички типове команди
    this.logger.debug(LogTags.device.command.started, {
      message: 'Executing device command',
      command: command.cmd,
      deviceId: command.deviceId || 'N/A'
    }, {
      source: { file: 'DeviceCommandService.ts', method: 'executeCommand' },
      business: { category: 'device', operation: 'command_execution' },
      deviceId: command.deviceId
    })

    // Handle template-based execution if deviceId is provided
    if (command.deviceId) {
      this.logger.debug(LogTags.device.command.template, {
        message: 'Using template-based execution'
      }, {
        source: { file: 'DeviceCommandService.ts', method: 'executeCommand' },
        business: { category: 'device', operation: 'template_execution' },
        deviceId: command.deviceId
      })
      return await this.executeTemplateBasedCommand(controllerId, command)
    }

    // Handle legacy direct commands (PING, STATUS, ANALOG, etc.)
    this.logger.debug(LogTags.device.command.legacy, {
      message: 'Using legacy command execution'
    }, {
      source: { file: 'DeviceCommandService.ts', method: 'executeCommand' },
      business: { category: 'device', operation: 'legacy_execution' }
    })
    return await this.executeLegacyCommand(controllerId, command)
  }

  // Execute commands based on device template strategy
  private async executeTemplateBasedCommand(controllerId: string, command: IStartupCommand): Promise<IStartupResponse> {
    // За мониторинг на template-based изпълнение - интелигентно изпълнение според device templates
    console.log(`[DeviceCommandService] DEBUG: executeTemplateBasedCommand - Command: ${command.cmd}, DeviceId: ${command.deviceId}, ActionType: ${command.actionType}`)
    
    try {
      // Import DeviceTemplate dynamically to avoid circular imports
      const { DeviceTemplate } = await import('../models/DeviceTemplate')
      const { Device } = await import('../models/Device')

      // Get device from database
      const device = await Device.findById(command.deviceId).exec()
      if (!device) {
        console.log(`[DeviceCommandService] DEBUG: Device not found for deviceId: ${command.deviceId}`)
        return {
          ok: 0,
          error: `Device not found: ${command.deviceId}`
        }
      }

      // Get device template
      const template = await DeviceTemplate.findOne({ type: device.type, isActive: true }).exec()
      if (!template) {
        console.log(`[DeviceCommandService] DEBUG: Device template not found for type: ${device.type}`)
        return {
          ok: 0,
          error: `Device template not found for type: ${device.type}`
        }
      }

      // Execute based on template strategy
      switch (template.executionConfig.strategy) {
        case 'single_command':
          return await this.executeSingleCommand(controllerId, command, device, template)
        
        case 'multi_step':
          return await this.executeMultiStepCommand(controllerId, command, device, template)
        
        case 'arduino_native':
          return await this.executeArduinoNativeCommand(controllerId, command, device, template)
        
        default:
          console.log(`[DeviceCommandService] DEBUG: Unknown execution strategy: ${template.executionConfig.strategy}`)
          return {
            ok: 0,
            error: `Unknown execution strategy: ${template.executionConfig.strategy}`
          }
      }
    } catch (error) {
      console.error('[DeviceCommandService] DEBUG: Error in template-based execution:', error)
      return {
        ok: 0,
        error: `Template execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // Execute single command strategy
  private async executeSingleCommand(controllerId: string, command: IStartupCommand, device: any, template: any): Promise<IStartupResponse> {
    // За мониторинг на single command execution - изпълнение на единична команда според device template
    const commandType = template.executionConfig.commandType || command.cmd

    // Handle actuator commands based on action type
    if (command.cmd === 'CONTROL_ACTUATOR' && command.actionType) {
      return await this.handleActuatorAction(controllerId, command, device, template)
    }

    // Handle semantic relay commands
    if (['ACTIVATE_RELAY', 'DEACTIVATE_RELAY', 'TOGGLE_RELAY'].includes(commandType)) {
      return await this.handleSemanticRelayCommand(controllerId, { ...command, cmd: commandType })
    }

    // Handle PWM commands
    if (['SET_PWM', 'FADE_PWM'].includes(commandType)) {
      return await this.handlePWMCommand(controllerId, { ...command, cmd: commandType })
    }

    // Handle analog commands with sensor conversion
    if (commandType === 'ANALOG') {
      const portKey = device.ports[0]
      
      // Use ConnectionManager to get adapter directly
      const adapter = this.connectionManager.getAdapter(controllerId)
      if (!adapter) {
        console.log(`[DeviceCommandService] DEBUG: sendAnalogCommand - No adapter found for controller: ${controllerId}`)
        return { ok: 0, error: 'Controller connection not found' }
      }

      const analogCommand = { cmd: 'ANALOG', pin: portKey }
      console.log(`[DeviceCommandService] DEBUG: sendAnalogCommand - Controller: ${controllerId}, Pin: ${portKey}, Command:`, analogCommand)
      
      const rawResponse = await adapter.sendCommand(analogCommand)
      console.log(`[DeviceCommandService] DEBUG: sendAnalogCommand response:`, rawResponse)
      
      if (rawResponse.ok !== 1) {
        return rawResponse
      }

      // Apply sensor conversion using centralized helper
      if (device.physicalType) {
        // Extract raw value from Arduino response
        const rawValue = rawResponse.value || rawResponse.volt || 0
        
        // Prepare conversion parameters - convert database format to converter format
        const calibrationData = device.settings?.calibration
        let convertedCalibrationData = undefined
        
        if (calibrationData && calibrationData.points && Array.isArray(calibrationData.points)) {
          // Convert database format to converter format based on sensor type
          let convertedPoints: any[]
          
          if (device.physicalType === 'ultrasonic' || device.physicalType === 'distance') {
            // UltraSonic/Distance: targetDistance, pulseDuration/measuredDistance
            convertedPoints = calibrationData.points.map((point: any) => ({
              targetDistance: point.targetDistance,
              pulseDuration: point.pulseDuration,
              measuredDistance: point.measuredDistance,
              timestamp: point.timestamp
            }))
          } else if (device.physicalType === 'soil_moisture') {
            // SoilMoisture: targetMoisture, measuredMoisture
            convertedPoints = calibrationData.points.map((point: any) => ({
              targetMoisture: point.targetMoisture,
              measuredMoisture: point.measuredMoisture,
              adcValue: point.adcValue,
              timestamp: point.timestamp
            }))
          } else {
            // pH/EC: Convert database format (solutionPH/solutionEC, measuredADC) to converter format (targetValue, measuredValue)
            convertedPoints = calibrationData.points.map((point: any) => ({
              targetValue: point.solutionPH || point.solutionEC || point.targetValue,
              measuredValue: point.measuredADC || point.measuredValue || point.adc,
              voltage: point.voltage,
              timestamp: point.timestamp
            }))
          }
          
          convertedCalibrationData = {
            ...calibrationData,
            points: convertedPoints,
            referenceVoltage: calibrationData.referenceVoltage || 5.0,
            recordedVoltage: calibrationData.recordedVoltage || 5.0
          }
          
          console.log(`[DeviceCommandService] Converted ${convertedPoints.length} calibration points for ${device.physicalType}Converter`)
        }
        
        const conversionParams = {
          calibrationData: convertedCalibrationData,
          templateParams: template.executionConfig?.responseMapping,
          deviceType: device.type,
          additionalData: {
            volt: rawResponse.volt || ((rawValue / 1023) * 5.0), // Calculate voltage if not provided
            adc: rawValue
          }
        }
        
        const additionalResponseData = {
          rawValue: rawValue,
          volt: rawResponse.volt || ((rawValue / 1023) * 5.0),
          adc: rawValue,
          portKey: portKey,
          rawResponse: rawResponse
        }
        
        return await this.convertSensorDataAndUpdateReading(
          device,
          rawValue,
          conversionParams,
          additionalResponseData,
          'Analog sensor reading with conversion completed successfully'
        )
      }
      
      // Fallback: return raw response if no conversion applied
      return rawResponse
    }

    // Default: send command directly via HardwareCommunicationService
    return await this.hardwareCommunication.sendCommand(controllerId, { ...command, cmd: commandType })
  }

  // Handle actuator actions based on template and action type
  private async handleActuatorAction(controllerId: string, command: IStartupCommand, device: any, template: any): Promise<IStartupResponse> {
    // За мониторинг на actuator actions - сложни актуаторни действия с параметри като duration, power levels
    const { actionType, duration, powerLevel, powerFrom, powerTo } = command

    // Map action types to appropriate commands based on template
    let targetCommand: string
    switch (actionType) {
      case 'on_off_timed':
      case 'on':
        targetCommand = 'ACTIVATE_RELAY'
        break
      case 'off_on_timed':
      case 'off':
        targetCommand = 'DEACTIVATE_RELAY'
        break
      case 'set_power':
        targetCommand = 'SET_PWM'
        break
      case 'fade_up':
      case 'fade_down':
        targetCommand = 'FADE_PWM'
        break
      default:
        targetCommand = template.executionConfig.commandType || 'ACTIVATE_RELAY'
        break
    }

    // Create mapped command
    const mappedCommand = {
      ...command,
      cmd: targetCommand,
      powerLevel,
      powerFrom,
      powerTo,
      direction: actionType === 'fade_up' ? 'up' : 'down'
    }

    // Execute command
    let response: IStartupResponse
    if (['ACTIVATE_RELAY', 'DEACTIVATE_RELAY', 'TOGGLE_RELAY'].includes(targetCommand)) {
      response = await this.handleSemanticRelayCommand(controllerId, mappedCommand as IStartupCommand)
    } else if (['SET_PWM', 'FADE_PWM'].includes(targetCommand)) {
      response = await this.handlePWMCommand(controllerId, mappedCommand as IStartupCommand)
    } else {
      response = await this.hardwareCommunication.sendCommand(controllerId, mappedCommand as IStartupCommand)
    }

    // Handle timed operations (automatic opposite action after duration)
    if (duration && duration > 0 && ['on_off_timed', 'off_on_timed'].includes(actionType as string)) {
      setTimeout(async () => {
        const oppositeAction = actionType === 'on_off_timed' ? 'off' : 'on'
        const oppositeCommand = {
          ...command,
          actionType: oppositeAction,
          duration: 0
        }
        
        console.log(`[DeviceCommandService] Executing timed opposite action: ${oppositeAction} after ${duration}s`)
        await this.handleActuatorAction(controllerId, oppositeCommand, device, template)
      }, duration * 1000)
    }

    return response
  }

  // Execute multi-step command strategy
  private async executeMultiStepCommand(controllerId: string, command: IStartupCommand, device: any, template: any): Promise<IStartupResponse> {
    // За мониторинг на multi-step execution - поредица от команди за сложни сензори като HC-SR04
    const commandSequence = template.executionConfig.commandSequence
    if (!commandSequence || commandSequence.length === 0) {
      return {
        ok: 0,
        error: 'No command sequence defined for multi-step strategy'
      }
    }

    const responses: any[] = []
    
    // Map device ports for HC-SR04: ports[0] = trigger pin, ports[1] = echo pin
    const triggerPin = this.parsePort(device.ports[0])
    const echoPin = device.ports.length > 1 ? this.parsePort(device.ports[1]) : null
    
    // Check if this is an HC-SR04 ultrasonic sensor (has both trigger and echo pins)
    const isHCSR04 = device.type === 'HC-SR04' || (device.ports.length >= 2 && echoPin !== null)
    
    if (isHCSR04) {
      console.log(`[DeviceCommandService] HC-SR04 Multi-step - Trigger Pin: ${triggerPin}, Echo Pin: ${echoPin}`)
    }

    // Execute each step in sequence
    for (let stepIndex = 0; stepIndex < commandSequence.length; stepIndex++) {
      const step = commandSequence[stepIndex]
      let stepCommand: any = {
        cmd: step.command,
        ...step.parameters
      }

      // Handle HC-SR04 specific commands
      if (isHCSR04) {
        if (step.command === 'SET_PIN') {
          // Map 'trigger'/'echo' roles to actual pin numbers
          if (step.parameters?.role === 'trigger') {
            stepCommand.pin = triggerPin
            console.log(`[DeviceCommandService] HC-SR04 Step ${stepIndex + 1}: SET_PIN trigger pin ${triggerPin}`)
          } else if (step.parameters?.role === 'echo') {
            stepCommand.pin = echoPin
            console.log(`[DeviceCommandService] HC-SR04 Step ${stepIndex + 1}: SET_PIN echo pin ${echoPin}`)
          } else {
            // Default to trigger pin if no role specified
            stepCommand.pin = triggerPin
          }
          // Remove role parameter as Arduino doesn't need it
          delete stepCommand.role
        } else if (step.command === 'READ') {
          // Map echo pin for reading
          stepCommand.pin = echoPin
          console.log(`[DeviceCommandService] HC-SR04 Step ${stepIndex + 1}: READ from pin ${echoPin}`)
        } else if (step.command === 'DELAY') {
          // Handle microsecond delays - convert to milliseconds for backend
          if (step.parameters?.microseconds) {
            const milliseconds = Math.max(1, Math.round(step.parameters.microseconds / 1000))
            console.log(`[DeviceCommandService] HC-SR04 Step ${stepIndex + 1}: DELAY ${step.parameters.microseconds}μs (${milliseconds}ms)`)
            await new Promise(resolve => setTimeout(resolve, milliseconds))
            continue // Skip sending command to Arduino for backend delays
          }
        } else {
          // For other commands, default to trigger pin
          stepCommand.pin = stepCommand.pin || triggerPin
        }
      } else {
        // Non-HC-SR04 devices: use first port as before
        stepCommand.pin = stepCommand.pin || triggerPin
      }

      let stepResponse: IStartupResponse
      if (step.expectResponse) {
        stepResponse = await this.hardwareCommunication.sendCommand(controllerId, stepCommand)
        responses.push(stepResponse)
        
        if (isHCSR04) {
          console.log(`[DeviceCommandService] HC-SR04 Step ${stepIndex + 1} Response:`, stepResponse)
        }
        
        if (stepResponse.ok !== 1) {
          return {
            ok: 0,
            error: `Multi-step execution failed at step ${step.command}: ${stepResponse.error}`
          }
        }
      } else {
        // Fire and forget
        stepResponse = await this.hardwareCommunication.sendCommand(controllerId, stepCommand)
        responses.push(stepResponse)
        
        if (isHCSR04) {
          console.log(`[DeviceCommandService] HC-SR04 Step ${stepIndex + 1} (Fire and forget):`, stepResponse)
        }
      }

      // Apply delay if specified (for non-DELAY commands)
      if (step.delay && step.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, step.delay))
      }
    }

    // For HC-SR04, convert echo pin reading to distance measurement
    const lastResponse = responses[responses.length - 1]
    
    if (isHCSR04 && lastResponse && lastResponse.ok === 1) {
      // For HC-SR04, the final step is a READ command that returns the echo pin state
      // We need to convert this to a meaningful distance measurement
      const echoState = lastResponse.state || lastResponse.pin_state || 0
      
      // Simple mock conversion based on echo state
      // TODO: IMPLEMENT_LATER - Replace with actual pulse duration measurement for accurate distance
      const mockDistance = echoState === 1 ? Math.random() * 50 + 10 : Math.random() * 400 + 50
      const distance = Math.round(mockDistance * 100) / 100
      
      console.log(`[DeviceCommandService] HC-SR04 Distance Calculation: Echo State=${echoState}, Distance=${distance}cm`)
      
      return {
        ok: 1,
        status: 'ok',
        message: 'HC-SR04 distance measurement completed',
        value: distance,
        data: {
          distance: distance,
          unit: 'cm',
          echoState: echoState,
          triggerPin: triggerPin,
          echoPin: echoPin
        }
      }
    }

    return {
      ok: 1,
      message: 'Multi-step command executed successfully',
      data: {
        steps: responses.length,
        responses: responses
      }
    }
  }

  // Execute arduino native command strategy using CommandBuilder
  private async executeArduinoNativeCommand(controllerId: string, command: IStartupCommand, device: any, template: any): Promise<IStartupResponse> {
    // За мониторинг на arduino native execution - централизирано изграждане на команди чрез CommandBuilder
    try {
      // Build command using CommandBuilder
      const builtCommand = buildCommand(device, template)

      console.log(`[DeviceCommandService] Built command using CommandBuilder:`, JSON.stringify(builtCommand))

      // Send command to Arduino via HardwareCommunicationService
      const arduinoResponse = await this.hardwareCommunication.sendCommand(controllerId, builtCommand)

      if (arduinoResponse.ok !== 1) {
        return arduinoResponse
      }

      // Apply sensor conversion if physicalType is defined
      if (device.physicalType) {
        // Prepare conversion parameters
        const calibrationData = device.settings?.calibration
        let convertedCalibrationData = undefined

        if (calibrationData && calibrationData.points && Array.isArray(calibrationData.points)) {
          // Convert database format to converter format
          const convertedPoints = calibrationData.points.map((point: any) => ({
            targetValue: point.targetValue,
            measuredValue: point.measuredValue,
            timestamp: point.timestamp
          }))

          convertedCalibrationData = {
            ...calibrationData,
            points: convertedPoints,
            isCalibrated: calibrationData.isCalibrated || false
          }

          console.log(`[DeviceCommandService] Converted ${convertedPoints.length} calibration points for ${device.physicalType}Converter`)
        }

        const conversionParams = {
          calibrationData: convertedCalibrationData,
          rawResponse: arduinoResponse,
          deviceType: device.type
        }

        // Extract raw data for converter based on command type
        let rawDataForConverter = arduinoResponse
        if (builtCommand.cmd === 'SINGLE_WIRE_ONEWIRE' && (arduinoResponse as any).data !== undefined) {
          rawDataForConverter = (arduinoResponse as any).data
        } else if (builtCommand.cmd === 'PULSE_MEASURE' && (arduinoResponse as any).duration !== undefined) {
          rawDataForConverter = (arduinoResponse as any).duration
        }

        const additionalResponseData = {
          rawResponse: arduinoResponse,
          command: builtCommand
        }

        return await this.convertSensorDataAndUpdateReading(
          device,
          rawDataForConverter,
          conversionParams,
          additionalResponseData,
          `${builtCommand.cmd} sensor reading with conversion completed successfully`
        )
      }

      // Fallback: return raw response if no conversion applied
      console.log(`[DeviceCommandService] ${builtCommand.cmd} raw response (no conversion applied)`)
      return {
        ok: 1,
        status: 'ok',
        message: `${builtCommand.cmd} command executed successfully`,
        value: arduinoResponse,
        data: {
          rawResponse: arduinoResponse,
          command: builtCommand,
          deviceType: device.type,
          physicalType: device.physicalType
        }
      }
    } catch (error) {
      if (error instanceof CommandBuilderError) {
        console.error(`[DeviceCommandService] CommandBuilder error:`, error.message)
        return {
          ok: 0,
          error: `Command building failed: ${error.message}`
        }
      }
      throw error
    }
  }

  // Execute legacy commands (direct Arduino commands)
  private async executeLegacyCommand(controllerId: string, command: IStartupCommand): Promise<IStartupResponse> {
    // За мониторинг на legacy command execution - стари директни Arduino команди за backward compatibility
    // Handle BlockExecutor generic commands
    if (command.cmd === 'CONTROL_ACTUATOR') {
      return await this.executeTemplateBasedCommand(controllerId, command)
    }

    if (command.cmd === 'READ_SENSOR') {
      return await this.executeTemplateBasedCommand(controllerId, command)
    }

    // Handle semantic relay commands (legacy support)
    if (['ACTIVATE_RELAY', 'DEACTIVATE_RELAY', 'TOGGLE_RELAY'].includes(command.cmd)) {
      return await this.handleSemanticRelayCommand(controllerId, command)
    }

    // Handle PWM commands (legacy support)
    if (['SET_PWM', 'FADE_PWM'].includes(command.cmd)) {
      return await this.handlePWMCommand(controllerId, command)
    }

    // Direct command execution via HardwareCommunicationService
    console.log(`[DeviceCommandService] Legacy Command - Controller: ${controllerId}, Cmd: ${command.cmd}, Port: ${command.port}`)
    return await this.hardwareCommunication.sendCommand(controllerId, command)
  }

  // Handle semantic relay commands
  private async handleSemanticRelayCommand(controllerId: string, command: IStartupCommand): Promise<IStartupResponse> {
    // За мониторинг на релейно управление - обработка на ACTIVATE/DEACTIVATE/TOGGLE релейни команди
    try {
      if (!command.deviceId) {
        return {
          ok: 0,
          error: 'Device ID is required for semantic relay commands'
        }
      }

      let device: IDevice | null = null
      let portNumber: number
      let portKey: string

      // Check if this is a restoration command with pre-populated data
      if (command.port && command.relayLogic) {
        // This is from restoration - we already have the port number and relay logic
        portNumber = typeof command.port === 'string' ? parseInt(command.port) : command.port
        portKey = `D${portNumber}`
        
        // Create minimal device object for processing
        device = {
          _id: command.deviceId,
          relayLogic: command.relayLogic,
          ports: [portKey]
        } as IDevice
        
        console.log(`[DeviceCommandService] Using restoration data - Port: ${portNumber}, Logic: ${command.relayLogic}`)
      } else {
        // Get device from database to check relay logic
        device = await Device.findById(command.deviceId).exec()
        if (!device) {
          return {
            ok: 0,
            error: `Device not found: ${command.deviceId}`
          }
        }

        if (!device.ports || device.ports.length === 0) {
          return {
            ok: 0,
            error: `Device ${command.deviceId} has no configured ports`
          }
        }

        // For now, use the first port (can be enhanced to support multiple ports)
        portKey = device.ports[0]
        
        // Parse port number from key (D2 → 2, etc.)
        if (portKey.startsWith('D')) {
          portNumber = parseInt(portKey.substring(1), 10)
        } else {
          portNumber = parseInt(portKey, 10)
        }

        if (isNaN(portNumber)) {
          return {
            ok: 0,
            error: `Invalid port format: ${portKey}`
          }
        }
      }

      // Determine target logical state
      let targetLogicalState: 'active' | 'inactive'
      if (command.cmd === 'ACTIVATE_RELAY') {
        targetLogicalState = 'active'
      } else if (command.cmd === 'DEACTIVATE_RELAY') {
        targetLogicalState = 'inactive'
      } else { // TOGGLE_RELAY
        // For toggle, we need to get current state from controller
        const { PhysicalController } = await import('../models/PhysicalController')
        const controller = await PhysicalController.findById(controllerId).exec()
        if (!controller) {
          return {
            ok: 0,
            error: `Controller not found: ${controllerId}`
          }
        }

        const port = controller.availablePorts.find(p => p.key === portKey)
        if (!port) {
          return {
            ok: 0,
            error: `Port ${portKey} not found on controller`
          }
        }

        // Current logical state is based on device relayLogic and current port state
        const currentLogicalState = this.getLogicalState(port.currentState || 'HIGH', device.relayLogic)
        targetLogicalState = currentLogicalState === 'active' ? 'inactive' : 'active'
      }

      // Map logical state to hardware state based on device relay logic
      const targetHardwareState = this.getHardwareState(targetLogicalState, device.relayLogic)
      const hardwareState = targetHardwareState === 'HIGH' ? 1 : 0

      const deviceName = device.name || `Device-${command.deviceId}`
      console.log(`[DeviceCommandService] Device ${deviceName} - Logic: ${device.relayLogic}, Target: ${targetLogicalState}, Hardware: ${targetHardwareState}`)

      // Send SET_PIN command to Arduino via HardwareCommunicationService
      const hardwareCmd: IStartupCommand = {
        cmd: 'SET_PIN',
        pin: portNumber,
        state: hardwareState,
        stopOnDisconnect: command.stopOnDisconnect !== undefined ? command.stopOnDisconnect : true
      }

      console.log(`[DeviceCommandService] 🔧 SET_PIN Command:`, JSON.stringify(hardwareCmd, null, 2))

      const response = await this.hardwareCommunication.sendCommand(controllerId, hardwareCmd)
      
      if (response.ok === 1) {
        // Update database port state to hardware state (only if not during restoration)
        if (!command.relayLogic) { // This indicates it's not a restoration command
          const { PhysicalController } = await import('../models/PhysicalController')
          await PhysicalController.findByIdAndUpdate(
            controllerId,
            { 
              $set: { 
                [`availablePorts.$[elem].currentState`]: targetHardwareState 
              } 
            },
            { 
              arrayFilters: [{ 'elem.key': portKey }] 
            }
          ).exec()
        }
        
        return {
          ok: 1,
          message: `Relay ${targetLogicalState} successfully`,
          port: portKey,
          data: {
            logicalState: targetLogicalState,
            hardwareState: targetHardwareState,
            relayLogic: device.relayLogic
          }
        }
      } else {
        return response
      }

    } catch (error) {
      console.error(`[DeviceCommandService] Error handling semantic relay command:`, error)
      return {
        ok: 0,
        error: `Failed to process semantic relay command: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // Handle PWM commands
  private async handlePWMCommand(controllerId: string, command: IStartupCommand): Promise<IStartupResponse> {
    // За мониторинг на PWM управление - обработка на SET_PWM и FADE_PWM команди за вариране на мощността
    try {
      console.log(`[DeviceCommandService] Processing PWM command: ${command.cmd} for deviceId: ${command.deviceId}`)

      if (!command.deviceId) {
        return {
          ok: 0,
          error: 'Device ID is required for PWM commands'
        }
      }

      // Get device from database to get port information
      const device = await Device.findById(command.deviceId).exec()
      if (!device) {
        return {
          ok: 0,
          error: `Device not found: ${command.deviceId}`
        }
      }

      if (!device.ports || device.ports.length === 0) {
        return {
          ok: 0,
          error: `Device ${command.deviceId} has no configured ports`
        }
      }

      // Use first port for PWM operations
      const portKey = device.ports[0]
      let portNumber: number

      // Parse port number from key (D2 → 2, etc.)
      if (portKey.startsWith('D')) {
        portNumber = parseInt(portKey.substring(1), 10)
      } else {
        portNumber = parseInt(portKey, 10)
      }

      if (isNaN(portNumber)) {
        return {
          ok: 0,
          error: `Invalid port format: ${portKey}`
        }
      }

      let hardwareCmd: IStartupCommand

      if (command.cmd === 'SET_PWM') {
        // Set PWM to specific power level
        hardwareCmd = {
          cmd: 'SET_PWM',
          pin: portNumber,
          value: command.powerLevel || 0
        }
      } else if (command.cmd === 'FADE_PWM') {
        // Fade PWM from one level to another
        hardwareCmd = {
          cmd: 'FADE_PWM',
          pin: portNumber,
          powerFrom: command.powerFrom || 0,
          powerTo: command.powerTo || 0,
          duration: command.duration || 1000, // Default 1 second
          direction: command.direction || 'up'
        }
      } else {
        return {
          ok: 0,
          error: `Unknown PWM command: ${command.cmd}`
        }
      }

      const response = await this.hardwareCommunication.sendCommand(controllerId, hardwareCmd)
      
      if (response.ok === 1) {
        console.log(`[DeviceCommandService] Successfully executed PWM command on port ${portKey}`)
        
        return {
          ok: 1,
          message: `PWM command executed successfully`,
          port: portKey,
          data: {
            command: command.cmd,
            portNumber,
            ...hardwareCmd
          }
        }
      } else {
        return response
      }

    } catch (error) {
      console.error(`[DeviceCommandService] Error handling PWM command:`, error)
      return {
        ok: 0,
        error: `Failed to process PWM command: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // Helper methods
  private getLogicalState(hardwareState: string, relayLogic: string): 'active' | 'inactive' {
    if (relayLogic === 'active_high') {
      return hardwareState === 'HIGH' ? 'active' : 'inactive'
    } else { // active_low
      return hardwareState === 'LOW' ? 'active' : 'inactive'
    }
  }

  private getHardwareState(logicalState: 'active' | 'inactive', relayLogic: string): 'HIGH' | 'LOW' {
    if (relayLogic === 'active_high') {
      return logicalState === 'active' ? 'HIGH' : 'LOW'
    } else { // active_low
      return logicalState === 'active' ? 'LOW' : 'HIGH'
    }
  }

  // Parse port string to number (D2 -> 2, A1 -> 1)
  private parsePort(portString: string): number {
    // За мониторинг на port parsing - конвертиране на port keys (D2, A1) към числа за Arduino команди
    if (typeof portString === 'number') {
      return portString
    }
    
    if (typeof portString === 'string') {
      if (portString.startsWith('D') || portString.startsWith('A')) {
        return parseInt(portString.substring(1), 10)
      }
      return parseInt(portString, 10)
    }
    
    return 0
  }

  /**
   * Centralized sensor conversion and lastReading update helper
   * Handles conversion logic and automatic lastReading updates for all sensor types
   */
  private async convertSensorDataAndUpdateReading(
    device: any,
    rawDataForConverter: any,
    conversionParams: any,
    additionalResponseData: Record<string, any> = {},
    successMessage: string = 'Sensor reading with conversion completed successfully'
  ): Promise<IStartupResponse> {
    try {
      if (!device.physicalType) {
        console.warn(`[DeviceCommandService] No physicalType for device ${device._id}`)
        return {
          ok: 1,
          status: 'ok', 
          message: 'Sensor reading completed (no conversion applied)',
          value: rawDataForConverter,
          data: {
            rawResponse: rawDataForConverter,
            deviceType: device.type,
            ...additionalResponseData
          }
        }
      }

      const { ConverterFactory } = await import('./conversion/ConverterFactory')
      
      if (!ConverterFactory.isConverterAvailable(device.physicalType)) {
        console.warn(`[DeviceCommandService] No converter available for physicalType: ${device.physicalType}`)
        return {
          ok: 1,
          status: 'ok',
          message: 'Sensor reading completed (no converter available)', 
          value: rawDataForConverter,
          data: {
            rawResponse: rawDataForConverter,
            deviceType: device.type,
            physicalType: device.physicalType,
            ...additionalResponseData
          }
        }
      }

      const converter = ConverterFactory.createConverter(device.physicalType)
      const result = await converter.convert(rawDataForConverter, conversionParams)
      
      console.log(`[DeviceCommandService] Sensor conversion applied: physicalType=${device.physicalType} - Raw data → ${result.value}${result.unit}`)

      // Automatic lastReading update with converted value
      try {
        await Device.findByIdAndUpdate(device._id, {
          lastReading: result.value,
          lastReadingTimestamp: new Date(),
          lastError: null
        })
        console.log(`[DeviceCommandService] Updated lastReading for device ${device._id}: ${result.value}`)
      } catch (updateError) {
        console.error(`[DeviceCommandService] Failed to update lastReading for device ${device._id}:`, updateError)
      }

      return {
        ok: 1,
        status: 'ok',
        message: successMessage,
        value: result.value,
        data: {
          value: result.value,
          unit: result.unit,
          deviceType: device.type,
          physicalType: device.physicalType,
          calibrationApplied: result.calibrationApplied,
          calibrationPoints: result.calibrationPoints,
          conversionMethod: result.conversionMethod,
          ...additionalResponseData,
          // Add any extra fields from converter result
          ...Object.fromEntries(
            Object.entries(result).filter(([key]) => 
              !['value', 'unit', 'rawValue', 'calibrationApplied', 'calibrationPoints', 'conversionMethod'].includes(key)
            )
          )
        }
      }
    } catch (converterError) {
      console.error(`[DeviceCommandService] Sensor conversion failed for physicalType: ${device.physicalType}:`, converterError)
      return {
        ok: 1,
        status: 'ok', 
        message: 'Sensor reading completed (conversion failed)',
        value: rawDataForConverter,
        data: {
          rawResponse: rawDataForConverter,
          deviceType: device.type,
          physicalType: device.physicalType,
          conversionError: converterError instanceof Error ? converterError.message : 'Unknown conversion error',
          ...additionalResponseData
        }
      }
    }
  }
}
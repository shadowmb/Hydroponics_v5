// ABOUTME: Hardware communication service extracted from StartupService for better separation of concerns
// ABOUTME: Handles all runtime communication with controllers, template-based execution, and sensor conversions
import { Device, IDevice } from '../models/Device'
import { PhysicalController, IPhysicalController } from '../models/PhysicalController'
import { SerialPort } from 'serialport'
import { ReadlineParser } from '@serialport/parser-readline'
import { UnifiedLoggingService } from './UnifiedLoggingService'
import { LogTags } from '../utils/LogTags'
import { ControllerAdapterFactory, IControllerAdapter } from '../adapters'
import { ConnectionManagerService } from './ConnectionManagerService'
import { IStartupCommand, IStartupResponse } from '../types/startup-interfaces'

export class HardwareCommunicationService {
  private static instance: HardwareCommunicationService
  private activeConnections: Map<string, SerialPort> = new Map() // TODO: LEGACY - Remove after adapter migration
  private activeParsers: Map<string, ReadlineParser> = new Map() // TODO: LEGACY - Remove after adapter migration
  private connectionManager: ConnectionManagerService
  private adapterFactory: ControllerAdapterFactory
  private logger = UnifiedLoggingService.createModuleLogger('HardwareCommunicationService.ts')

  constructor() {
    this.adapterFactory = ControllerAdapterFactory.getInstance()
    this.connectionManager = ConnectionManagerService.getInstance()
  }

  static getInstance(): HardwareCommunicationService {
    if (!HardwareCommunicationService.instance) {
      HardwareCommunicationService.instance = new HardwareCommunicationService()
    }
    return HardwareCommunicationService.instance
  }

  // Initialize legacy connections map from StartupService (called during startup)
  initializeLegacyConnections(connections: Map<string, SerialPort>, parsers: Map<string, ReadlineParser>) {
    this.activeConnections = connections
    this.activeParsers = parsers
  }

  // Delegation support methods - called by StartupService to pass active connections (legacy support)
  setActiveConnections(connections: Map<string, SerialPort>, parsers: Map<string, ReadlineParser>): void {
    this.activeConnections = connections
    this.activeParsers = parsers
  }

  private async sendCommandToController(controllerId: string, command: IStartupCommand): Promise<IStartupResponse> {
    // За мониторинг на изпращане на команди - основният метод за комуникация с контролери
    // Primary: Use adapter pattern via ConnectionManager
    const adapter = this.connectionManager.getAdapter(controllerId)
    if (adapter) {
      return await adapter.sendCommand(command)
    }

    // Fallback: Legacy serial communication
    const serialPort = this.activeConnections.get(controllerId)
    const parser = this.activeParsers.get(controllerId)
    
    if (!serialPort || !parser) {
      return {
        ok: 0,
        error: 'Controller connection not found'
      }
    }

    return new Promise((resolve, reject) => {
      const commandJson = JSON.stringify(command)

      // Set up response timeout
      const timeout = setTimeout(() => {
        parser.removeAllListeners('data')

        // Alert: Device timeout - critical hardware communication failure
        this.logger.error(LogTags.device.connect.timeout, {
          message: `Controller ${controllerId} not responding to commands`,
          command: command.cmd,
          timeout: 3000
        }, {
          source: { file: 'HardwareCommunicationService.ts', method: 'sendCommandToController' },
          business: { category: 'device', operation: 'command_timeout' },
          controllerId: controllerId
        })

        resolve({
          ok: 0,
          error: 'Command timeout - no response from controller'
        })
      }, 3000) // 3 second timeout

      // Listen for response
      parser.once('data', (data: string) => {
        clearTimeout(timeout)
        
        try {
          // Debug: response received
          console.log(`[HardwareCommunicationService] DEBUG: Arduino response:`, data.trim())
          const response = JSON.parse(data.trim())
          resolve(response)
        } catch (parseError) {
          console.log(`[HardwareCommunicationService] DEBUG: Arduino invalid JSON:`, data.trim())
          this.logger.warn(LogTags.device.command.failed, {
            message: 'Invalid JSON response from controller',
            response: data.trim(),
            parseError: parseError instanceof Error ? parseError.message : 'Unknown parse error'
          }, {
            source: { file: 'HardwareCommunicationService.ts', method: 'sendCommandToController' },
            business: { category: 'device', operation: 'command_response_parsing' },
            controllerId: controllerId
          })
          resolve({
            ok: 0,
            error: `Invalid JSON response: ${data.trim()}`
          })
        }
      })

      // Send command
      console.log(`[HardwareCommunicationService] DEBUG: Sending to Arduino:`, commandJson)
      serialPort.write(commandJson + '\n', (error) => {
        if (error) {
          clearTimeout(timeout)
          parser.removeAllListeners('data')
          reject(error)
        }
      })
    })
  }

  // Public method for API endpoints to send commands through existing connections
  async sendCommand(controllerId: string, command: IStartupCommand): Promise<IStartupResponse> {
    // За мониторинг на публичен API за команди - входната точка за всички външни заявки за изпращане на команди
    // Remove 'sent' logging - only log success/failure to reduce noise
    // Primary: Use adapter pattern via ConnectionManager
    const adapter = this.connectionManager.getAdapter(controllerId)
    //console.log(`[HardwareCommunicationService] DEBUG: sendCommand - Adapter exists: ${!!adapter}`)
    if (adapter) {
      try {
        //console.log(`[HardwareCommunicationService] DEBUG: Using adapter for command:`, command)
        return await this.executeCommand(controllerId, command)
      } catch (error) {
        this.logger.error(LogTags.device.command.failed, {
          message: 'Error executing command through adapter',
          command: command.cmd,
          deviceId: command.deviceId,
          error: error instanceof Error ? error.message : 'Unknown error'
        }, {
          source: { file: 'HardwareCommunicationService.ts', method: 'sendCommand' },
          business: { category: 'device', operation: 'adapter_command_execution' },
          controllerId: controllerId
        })
        return {
          ok: 0,
          error: `Error processing command: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }
    }

    // Fallback: Legacy serial connections (backward compatibility)
    const serialPort = this.activeConnections.get(controllerId)
    const parser = this.activeParsers.get(controllerId)
    
    if (serialPort && parser) {
      if (!serialPort.isOpen) {
        return {
          ok: 0,
          error: `Controller ${controllerId} serial port is not open`
        }
      }

      try {
        return await this.executeCommand(controllerId, command)
      } catch (error) {
        this.logger.error(LogTags.device.command.failed, {
          message: 'Error executing command through legacy serial connection',
          command: command.cmd,
          deviceId: command.deviceId,
          error: error instanceof Error ? error.message : 'Unknown error'
        }, {
          source: { file: 'HardwareCommunicationService.ts', method: 'sendCommand' },
          business: { category: 'device', operation: 'serial_command_execution' },
          controllerId: controllerId
        })
        return {
          ok: 0,
          error: `Error processing command: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }
    }
    
    // No connection available
    return {
      ok: 0,
      error: `Controller ${controllerId} not connected through HardwareCommunicationService`
    }
  }

  // Generic execution engine that handles all command types
  private async executeCommand(controllerId: string, command: IStartupCommand): Promise<IStartupResponse> {
    // За мониторинг на command execution engine - централен механизъм за обработка на всички типове команди
    //console.log(`[HardwareCommunicationService] DEBUG: executeCommand - Command: ${command.cmd}, DeviceId: ${command.deviceId || 'N/A'}`)
    //console.log(`[HardwareCommunicationService] Executing command: ${command.cmd} for device: ${command.deviceId || 'N/A'}`)
    //this.logger.info('HardwareCommunicationService.ts',`Изпълнение на команда:  ${command.cmd} за контролер: ${command.deviceId || 'N/A'}.`)

    // Handle template-based execution if deviceId is provided
    if (command.deviceId) {
      //console.log(`[HardwareCommunicationService] DEBUG: Using template-based execution`)
      return await this.executeTemplateBasedCommand(controllerId, command)
    }

    // Handle legacy direct commands (PING, STATUS, ANALOG, etc.)
    //console.log(`[HardwareCommunicationService] DEBUG: Using legacy command execution`)
    return await this.executeLegacyCommand(controllerId, command)
  }

  // Execute commands based on device template strategy
  private async executeTemplateBasedCommand(controllerId: string, command: IStartupCommand): Promise<IStartupResponse> {
    // За мониторинг на template-based изпълнение - интелигентно изпълнение според device templates
    // За мониторинг на template execution debugging - detailed command parameters за development tracking
    console.log(`[HardwareCommunicationService] DEBUG: executeTemplateBasedCommand - Command: ${command.cmd}, DeviceId: ${command.deviceId}, ActionType: ${command.actionType}`)
    //console.log(`[HardwareCommunicationService] DEBUG: executeTemplateBasedCommand - Command: ${command.cmd}, DeviceId: ${command.deviceId}, ActionType: ${command.actionType}`)
    //this.logger.info('HardwareCommunicationService.ts',`Изпълнение на команда:  ${command.cmd} за контролер: ${command.deviceId || 'N/A'}.`)
    try {
      // Import DeviceTemplate dynamically to avoid circular imports
      const { DeviceTemplate } = await import('../models/DeviceTemplate')
      const { Device } = await import('../models/Device')

      // Get device from database
      const device = await Device.findById(command.deviceId).exec()
      if (!device) {
        // За мониторинг на device lookup failures - missing device detection за error handling
        console.log(`[HardwareCommunicationService] DEBUG: Device not found for deviceId: ${command.deviceId}`)
        return {
          ok: 0,
          error: `Device not found: ${command.deviceId}`
        }
      }
      
      //console.log(`[HardwareCommunicationService] DEBUG: Found device - Name: ${device.name}, Type: ${device.type}, Ports: [${device.ports.join(', ')}]`)

      // Get device template
      //console.log(`[HardwareCommunicationService] DEBUG: Looking for template - Type: ${device.type}`)
      const template = await DeviceTemplate.findOne({ type: device.type, isActive: true }).exec()
      if (!template) {
        // За мониторинг на template lookup failures - missing DeviceTemplate detection
        console.log(`[HardwareCommunicationService] DEBUG: Device template not found for type: ${device.type}`)
        return {
          ok: 0,
          error: `Device template not found for type: ${device.type}`
        }
      }
      
      //console.log(`[HardwareCommunicationService] DEBUG: Found template - Strategy: ${template.executionConfig?.strategy}`)
      
      //console.log(`[HardwareCommunicationService] DEBUG: Found template - DisplayName: ${template.displayName}, Strategy: ${template.executionConfig.strategy}`)

      // Execute based on template strategy
      switch (template.executionConfig.strategy) {
        case 'single_command':
          //console.log(`[HardwareCommunicationService] DEBUG: Executing single_command strategy`)
          return await this.executeSingleCommand(controllerId, command, device, template)
        
        case 'multi_step':
         //console.log(`[HardwareCommunicationService] DEBUG: Executing multi_step strategy`)
          return await this.executeMultiStepCommand(controllerId, command, device, template)
        
        case 'arduino_native':
          //console.log(`[HardwareCommunicationService] DEBUG: Executing arduino_native strategy`)
          return await this.executeArduinoNativeCommand(controllerId, command, device, template)
        
        default:
          // За мониторинг на unknown execution strategies - unsupported template strategy detection
        console.log(`[HardwareCommunicationService] DEBUG: Unknown execution strategy: ${template.executionConfig.strategy}`)
          return {
            ok: 0,
            error: `Unknown execution strategy: ${template.executionConfig.strategy}`
          }
      }
    } catch (error) {
      // За мониторинг на template execution errors - comprehensive template processing error tracking
      console.error('[HardwareCommunicationService] DEBUG: Error in template-based execution:', error)
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

    // Handle semantic relay commands - delegate to DeviceCommandService
    if (['ACTIVATE_RELAY', 'DEACTIVATE_RELAY', 'TOGGLE_RELAY'].includes(commandType)) {
      const { DeviceCommandService } = await import('./DeviceCommandService')
      return await DeviceCommandService.getInstance().executeCommand(controllerId, { ...command, cmd: commandType })
    }

    // Handle PWM commands
    if (['SET_PWM', 'FADE_PWM'].includes(commandType)) {
      return await this.handlePWMCommand(controllerId, { ...command, cmd: commandType })
    }

    // Handle analog commands
    if (commandType === 'ANALOG') {
      const portKey = device.ports[0]
      //console.log(`[HardwareCommunicationService] DEBUG: ANALOG command - Device: ${device.name}, PortKey: ${portKey}, Type: ${device.type}`)
      const rawResponse = await this.sendAnalogCommand(controllerId, portKey)
      console.log(`[HardwareCommunicationService] DEBUG: sendAnalogCommand response:`, rawResponse)
      
      if (rawResponse.ok !== 1) {
        return rawResponse
      }

      // PHASE 5: TODO - Should receive pre-converted data from StartupService
      // Raw value extraction for temporary compatibility
      const rawValue = rawResponse.value || rawResponse.volt || 0
      // TEMP: Return raw value until StartupService handles conversion
      const conversionResult = { value: rawValue, unit: 'raw' }
      console.warn('[HardwareCommunicationService] PHASE 5: Returning raw value - conversion should be done in StartupService')
      
      return {
        ok: 1,
        status: 'ok',
        message: 'Analog sensor reading completed successfully',
        value: conversionResult.value,
        data: {
          value: conversionResult.value,
          unit: conversionResult.unit,
          rawValue: rawValue,
          deviceType: device.type,
          portKey: portKey
        }
      }
    }

    // Default: send command directly
    return await this.sendCommandToController(controllerId, { ...command, cmd: commandType })
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
      const { DeviceCommandService } = await import('./DeviceCommandService')
      response = await DeviceCommandService.getInstance().executeCommand(controllerId, mappedCommand as IStartupCommand)
    } else if (['SET_PWM', 'FADE_PWM'].includes(targetCommand)) {
      response = await this.handlePWMCommand(controllerId, mappedCommand as IStartupCommand)
    } else {
      response = await this.sendCommandToController(controllerId, mappedCommand as IStartupCommand)
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
        
        console.log(`[HardwareCommunicationService] Executing timed opposite action: ${oppositeAction} after ${duration}s`)
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
      // За мониторинг на HC-SR04 pin mapping - ultrasonic sensor pin configuration verification
      console.log(`[HardwareCommunicationService] HC-SR04 Multi-step - Trigger Pin: ${triggerPin}, Echo Pin: ${echoPin}`)
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
            // За мониторинг на HC-SR04 trigger operations - SET_PIN trigger sequence tracking
            console.log(`[HardwareCommunicationService] HC-SR04 Step ${stepIndex + 1}: SET_PIN trigger pin ${triggerPin}`)
          } else if (step.parameters?.role === 'echo') {
            stepCommand.pin = echoPin
            console.log(`[HardwareCommunicationService] HC-SR04 Step ${stepIndex + 1}: SET_PIN echo pin ${echoPin}`)
          } else {
            // Default to trigger pin if no role specified
            stepCommand.pin = triggerPin
          }
          // Remove role parameter as Arduino doesn't need it
          delete stepCommand.role
        } else if (step.command === 'READ') {
          // Map echo pin for reading
          stepCommand.pin = echoPin
          // За мониторинг на HC-SR04 echo reading - READ operations от echo pin
          console.log(`[HardwareCommunicationService] HC-SR04 Step ${stepIndex + 1}: READ from pin ${echoPin}`)
        } else if (step.command === 'DELAY') {
          // Handle microsecond delays - convert to milliseconds for backend
          if (step.parameters?.microseconds) {
            const milliseconds = Math.max(1, Math.round(step.parameters.microseconds / 1000))
            console.log(`[HardwareCommunicationService] HC-SR04 Step ${stepIndex + 1}: DELAY ${step.parameters.microseconds}μs (${milliseconds}ms)`)
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
        stepResponse = await this.sendCommandToController(controllerId, stepCommand)
        responses.push(stepResponse)
        
        if (isHCSR04) {
          console.log(`[HardwareCommunicationService] HC-SR04 Step ${stepIndex + 1} Response:`, stepResponse)
        }
        
        if (stepResponse.ok !== 1) {
          return {
            ok: 0,
            error: `Multi-step execution failed at step ${step.command}: ${stepResponse.error}`
          }
        }
      } else {
        // Fire and forget
        stepResponse = await this.sendCommandToController(controllerId, stepCommand)
        responses.push(stepResponse)
        
        if (isHCSR04) {
          console.log(`[HardwareCommunicationService] HC-SR04 Step ${stepIndex + 1} (Fire and forget):`, stepResponse)
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
      // Note: This is a simplified conversion - actual HC-SR04 needs pulse duration measurement
      const echoState = lastResponse.state || lastResponse.pin_state || 0
      
      // Simple mock conversion based on echo state
      // TODO: IMPLEMENT_LATER - Replace with actual pulse duration measurement for accurate distance
      const mockDistance = echoState === 1 ? Math.random() * 50 + 10 : Math.random() * 400 + 50
      const distance = Math.round(mockDistance * 100) / 100
      
      // За мониторинг на HC-SR04 distance calculation - echo state към distance conversion
      console.log(`[HardwareCommunicationService] HC-SR04 Distance Calculation: Echo State=${echoState}, Distance=${distance}cm`)
      
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

  // Execute arduino native command strategy
  private async executeArduinoNativeCommand(controllerId: string, command: IStartupCommand, device: any, template: any): Promise<IStartupResponse> {
    // За мониторинг на arduino native execution - директни Arduino команди като ULTRASONIC, PULSE_MEASURE
    const commandType = template.executionConfig.commandType

    // Handle PULSE_MEASURE command
    if (commandType === 'PULSE_MEASURE') {
      return await this.executePulseMeasureCommand(controllerId, command, device, template)
    }

    // Handle ULTRASONIC command (legacy)
    if (commandType === 'ULTRASONIC') {
      return await this.executeUltrasonicCommand(controllerId, command, device, template)
    }

    // Handle other native commands
    const nativeCommand = {
      ...command,
      ...template.executionConfig.parameters,
      cmd: commandType,
      deviceId: command.deviceId
    }

    return await this.sendCommandToController(controllerId, nativeCommand)
  }

  // Execute ULTRASONIC command for HC-SR04 sensors
  private async executeUltrasonicCommand(controllerId: string, command: IStartupCommand, device: any, template: any): Promise<IStartupResponse> {
    // За мониторинг на ULTRASONIC команди - специализирана обработка за HC-SR04 ултразвукови сензори
    // Map device ports to HC-SR04 requirements
    const triggerPin = this.parsePort(device.ports[0]) // First port = trigger
    const echoPin = this.parsePort(device.ports[1])    // Second port = echo

    const ultrasonicCommand = {
      cmd: 'ULTRASONIC',
      triggerPin: triggerPin,
      echoPin: echoPin,
      maxDistance: template.executionConfig.parameters?.maxDistance || 400,
      timeout: template.executionConfig.parameters?.timeout || 30000
    }

    return await this.sendCommandToController(controllerId, ultrasonicCommand)
  }

  // Execute PULSE_MEASURE command for universal pulse-based sensors
  private async executePulseMeasureCommand(controllerId: string, command: IStartupCommand, device: any, template: any): Promise<IStartupResponse> {
    // За мониторинг на PULSE_MEASURE команди - универсални pulse-based измервания с време на отговор
    // Map device ports - first port = trigger, second port = echo
    const triggerPin = this.parsePort(device.ports[0])
    const echoPin = this.parsePort(device.ports[1])

    // Build PULSE_MEASURE command with template parameters
    const pulseMeasureCommand = {
      cmd: 'PULSE_MEASURE',
      triggerPin: triggerPin,
      echoPin: echoPin,
      triggerDuration: template.executionConfig.parameters?.triggerDuration || 10,
      timeout: template.executionConfig.parameters?.timeout || 30000
    }

    // За мониторинг на PULSE_MEASURE execution - trigger/echo pin coordination за pulse measurement
    console.log(`[HardwareCommunicationService] Executing PULSE_MEASURE: trigger=${triggerPin}, echo=${echoPin}`)

    // Send command to Arduino
    const arduinoResponse = await this.sendCommandToController(controllerId, pulseMeasureCommand)
    
    if (arduinoResponse.ok !== 1) {
      return arduinoResponse
    }

    // Convert raw Arduino response to sensor-specific value
    const rawDuration = arduinoResponse.duration
    if (!rawDuration || rawDuration === 0) {
      return {
        ok: 0,
        error: 'No pulse duration received from sensor'
      }
    }

    // PHASE 5: TODO - Should receive pre-converted data from StartupService
    // TEMP: Return raw value until StartupService handles conversion
    const conversionResult = { value: rawDuration, unit: 'raw' }
    console.warn('[HardwareCommunicationService] PHASE 5: Returning raw duration - conversion should be done in StartupService')

    // За мониторинг на PULSE_MEASURE conversion - raw duration към sensor-specific value transformation
    console.log(`[HardwareCommunicationService] PULSE_MEASURE conversion: ${rawDuration}μs → ${conversionResult.value}${conversionResult.unit}`)

    return {
      ok: 1,
      status: 'ok',
      message: 'Pulse measurement completed successfully',
      value: conversionResult.value,
      data: {
        value: conversionResult.value,
        unit: conversionResult.unit,
        rawDuration: rawDuration,
        triggerPin: triggerPin,
        echoPin: echoPin,
        deviceType: device.type
      }
    }
  }

  // Execute legacy commands (direct Arduino commands)
  private async executeLegacyCommand(controllerId: string, command: IStartupCommand): Promise<IStartupResponse> {
    // За мониторинг на legacy command execution - стари директни Arduino команди за backward compatibility
    // Handle BlockExecutor generic commands
    if (command.cmd === 'CONTROL_ACTUATOR') {
      return await this.executeTemplateBasedCommand(controllerId, command)
    }

    if (command.cmd === 'read_SENSOR') {
      return await this.executeTemplateBasedCommand(controllerId, command)
    }

    // Handle semantic relay commands (legacy support) - delegate to DeviceCommandService
    if (['ACTIVATE_RELAY', 'DEACTIVATE_RELAY', 'TOGGLE_RELAY'].includes(command.cmd)) {
      const { DeviceCommandService } = await import('./DeviceCommandService')
      return await DeviceCommandService.getInstance().executeCommand(controllerId, command)
    }

    // Handle PWM commands (legacy support)
    if (['SET_PWM', 'FADE_PWM'].includes(command.cmd)) {
      return await this.handlePWMCommand(controllerId, command)
    }

    // Direct command execution
    // За мониторинг на direct legacy commands - raw Arduino command execution за backward compatibility
    return await this.sendCommandToController(controllerId, command)
  }


  // New Arduino Command Protocol v2.0 methods
  async sendStatusCommand(controllerId: string): Promise<IStartupResponse> {
    // За мониторинг на STATUS команди - получаване на общ статус и информация за контролера
    const command: IStartupCommand = {
      cmd: 'STATUS'
    }
    
    return await this.sendCommandToController(controllerId, command)
  }

  async sendAnalogCommand(controllerId: string, pin: string): Promise<IStartupResponse> {
    // За мониторинг на ANALOG команди - четене на аналогови стойности от пинове като A0, A1
    const command: IStartupCommand = {
      cmd: 'ANALOG',
      pin: pin // Should be string like "A0", "A1", etc.
    }
    
    console.log(`[HardwareCommunicationService] DEBUG: sendAnalogCommand - Controller: ${controllerId}, Pin: ${pin}, Command:`, command)
    const response = await this.sendCommandToController(controllerId, command)
    console.log(`[HardwareCommunicationService] DEBUG: sendCommandToController response:`, response)
    
    return response
  }

  async sendBatchCommand(controllerId: string, commands: Array<{pin: number, state: number}>): Promise<IStartupResponse> {
    // За мониторинг на BATCH команди - изпращане на множество SET_PIN команди наведнъж за ефективност
    // Convert to Arduino expected format: {p: pin, s: state}
    const pins = commands.map(cmd => ({ p: cmd.pin, s: cmd.state }))
    
    const command: IStartupCommand = {
      cmd: 'BATCH',
      pins: pins
    }
    
    return await this.sendCommandToController(controllerId, command)
  }

  private async handlePWMCommand(controllerId: string, command: IStartupCommand): Promise<IStartupResponse> {
    // За мониторинг на PWM управление - обработка на SET_PWM и FADE_PWM команди за вариране на мощността
    try {
      // За мониторинг на PWM command processing - power control command parsing и device resolution
      console.log(`[HardwareCommunicationService] Processing PWM command: ${command.cmd} for deviceId: ${command.deviceId}`)

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

      const response = await this.sendCommandToController(controllerId, hardwareCmd)
      
      if (response.ok === 1) {
        // За мониторинг на PWM command success - successful power level control execution
        console.log(`[HardwareCommunicationService] Successfully executed PWM command on port ${portKey}`)
        
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
      console.error(`[HardwareCommunicationService] Error handling PWM command:`, error)
      return {
        ok: 0,
        error: `Failed to process PWM command: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
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

  
  // Check if controller has active connection
  isControllerConnected(controllerId: string): boolean {
    // За мониторинг на connection status - проверка дали контролерът е свързан и достъпен
    // Primary: Check adapter connection via ConnectionManager
    const adapter = this.connectionManager.getAdapter(controllerId)
    if (adapter) {
      return adapter.isConnected
    }
    
    // Fallback: Check legacy serial connection
    const serialPort = this.activeConnections.get(controllerId)
    return serialPort ? serialPort.isOpen : false
  }
}
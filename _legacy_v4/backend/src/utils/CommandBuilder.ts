// ABOUTME: Centralized command builder for constructing Arduino controller commands
// ABOUTME: Maps device ports to command parameters using DeviceTemplate and generator-config.json

import { IDevice } from '../models/Device'
import { IDeviceTemplate, IPortRequirement } from '../models/DeviceTemplate'
import generatorConfig from '../../../Arduino/generator-config.json'

/**
 * Command parameter from generator-config.json
 */
interface ICommandParameter {
  name: string
  type: string
  required: boolean
  description?: string
  default?: any
  min?: number
  max?: number
  validation?: string
}

/**
 * Command definition from generator-config.json
 */
interface ICommandDefinition {
  name: string
  displayName: string
  description: string
  parameters: ICommandParameter[]
}

/**
 * Complete startup command ready for HardwareCommunicationService
 */
export interface IStartupCommand {
  cmd: string
  [key: string]: any // Dynamic parameters based on command type
}

/**
 * CommandBuilder error for validation failures
 */
export class CommandBuilderError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CommandBuilderError'
  }
}

/**
 * Builds complete Arduino commands from device configuration and templates
 *
 * @param device - Device instance with ports and configuration
 * @param template - DeviceTemplate with execution config and port requirements
 * @returns Complete IStartupCommand ready to send to controller
 * @throws CommandBuilderError if validation fails
 */
export function buildCommand(
  device: IDevice,
  template: IDeviceTemplate
): IStartupCommand {
  // Step 1: Get required command from template
  const requiredCommand = template.requiredCommand || template.executionConfig.commandType

  if (!requiredCommand) {
    throw new CommandBuilderError(
      `No requiredCommand or commandType found in template for device ${device.name}`
    )
  }

  // Step 2: Find command definition in generator-config.json
  const commandDef = generatorConfig.commands.find(
    (cmd: any) => cmd.name === requiredCommand
  ) as ICommandDefinition | undefined

  if (!commandDef) {
    throw new CommandBuilderError(
      `Command "${requiredCommand}" not found in generator-config.json`
    )
  }

  // Step 3: Initialize command object
  const command: IStartupCommand = {
    cmd: requiredCommand
  }

  // Step 4: Map device ports to command parameters using portRequirements.role
  mapPortsToParameters(device, template, commandDef, command)

  // Step 5: Apply default values from generator-config.json
  applyDefaultParameters(commandDef, command)

  // Step 6: Merge with executionConfig.parameters (template overrides)
  if (template.executionConfig.parameters) {
    Object.assign(command, template.executionConfig.parameters)
  }

  // Step 7: Validate required parameters
  validateRequiredParameters(commandDef, command, device.name)

  return command
}

/**
 * Maps device ports to command parameters based on portRequirements.role
 */
function mapPortsToParameters(
  device: IDevice,
  template: IDeviceTemplate,
  commandDef: ICommandDefinition,
  command: IStartupCommand
): void {
  // Verify device has required ports
  if (!device.ports || device.ports.length === 0) {
    throw new CommandBuilderError(
      `Device ${device.name} has no ports configured`
    )
  }

  // Map each port requirement to command parameter
  template.portRequirements.forEach((portReq: IPortRequirement, index: number) => {
    if (!portReq.required) return

    if (index >= device.ports.length) {
      throw new CommandBuilderError(
        `Device ${device.name} missing required port at index ${index} (role: ${portReq.role})`
      )
    }

    const portValue = device.ports[index]

    // Find matching parameter in command definition by role mapping
    const paramName = mapRoleToParameterName(portReq.role, commandDef)

    if (!paramName) {
      // No explicit mapping found, skip this port
      return
    }

    // Apply port parsing based on parameter type
    const param = commandDef.parameters.find(p => p.name === paramName)
    if (param) {
      command[paramName] = parsePortValue(portValue, param, commandDef.name)
    }
  })
}

/**
 * Maps portRequirement.role to command parameter name
 *
 * Role mapping logic:
 * - 'data' → 'dataPin' or 'pin' (depending on command)
 * - 'trigger' → 'triggerPin'
 * - 'echo' → 'echoPin'
 * - 'control' → 'pin'
 * - 'rx' → 'rxPin' (for UART/Modbus communication)
 * - 'tx' → 'txPin' (for UART/Modbus communication)
 * - 'power' → ignored (power supply, not a command parameter)
 */
function mapRoleToParameterName(
  role: string,
  commandDef: ICommandDefinition
): string | null {
  const roleLower = role.toLowerCase()

  // Direct role-to-parameter mappings
  const roleMap: Record<string, string> = {
    'trigger': 'triggerPin',
    'echo': 'echoPin',
    'control': 'pin',
    'rx': 'rxPin',
    'tx': 'txPin'
  }

  if (roleMap[roleLower]) {
    return roleMap[roleLower]
  }

  // Special handling for 'data' role
  if (roleLower === 'data') {
    // Check if command has 'dataPin' parameter
    if (commandDef.parameters.some(p => p.name === 'dataPin')) {
      return 'dataPin'
    }
    // Fall back to 'pin' for simple commands
    if (commandDef.parameters.some(p => p.name === 'pin')) {
      return 'pin'
    }
  }

  // Ignore 'power' role - it's for physical wiring, not command parameters
  if (roleLower === 'power') {
    return null
  }

  return null
}

/**
 * Parses port value based on command parameter type
 *
 * Edge cases:
 * - ANALOG commands: Keep "A0" format as string, don't parse to number
 * - Digital pins: Convert "D2" → 2
 * - Already numeric: Pass through
 */
function parsePortValue(
  portValue: string,
  param: ICommandParameter,
  commandName: string
): string | number {
  // EDGE CASE: ANALOG commands must preserve "A0" string format
  if (commandName === 'ANALOG' && param.type === 'string') {
    return portValue
  }

  // For numeric parameters, apply parsePort logic
  if (param.type === 'number') {
    return parsePort(portValue)
  }

  // For string parameters (non-ANALOG), keep as-is
  return portValue
}

/**
 * Converts port string to number (D2 → 2, A1 → 1)
 * Matches DeviceCommandService.parsePort() logic
 */
function parsePort(portString: string): number {
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
 * Applies default parameter values from command definition
 */
function applyDefaultParameters(
  commandDef: ICommandDefinition,
  command: IStartupCommand
): void {
  commandDef.parameters.forEach(param => {
    // Only apply default if parameter not already set
    if (param.default !== undefined && command[param.name] === undefined) {
      command[param.name] = param.default
    }
  })
}

/**
 * Validates that all required parameters are present
 */
function validateRequiredParameters(
  commandDef: ICommandDefinition,
  command: IStartupCommand,
  deviceName: string
): void {
  const missingParams: string[] = []

  commandDef.parameters.forEach(param => {
    if (param.required && command[param.name] === undefined) {
      missingParams.push(param.name)
    }
  })

  if (missingParams.length > 0) {
    throw new CommandBuilderError(
      `Device ${deviceName}: Missing required parameters for command ${commandDef.name}: ${missingParams.join(', ')}`
    )
  }
}

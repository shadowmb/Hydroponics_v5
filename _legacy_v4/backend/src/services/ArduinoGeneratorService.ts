// ABOUTME: ArduinoGeneratorService generates Arduino .ino firmware files from templates and command modules
// ABOUTME: Combines base template with command-specific code sections for device-specific firmware generation

import { promises as fs } from 'fs'
import * as path from 'path'
import { Command } from '../models/Command'

interface CommandModule {
  includes: string
  globals: string
  dispatcher: string
  functions: string
}

interface ControllerConfig {
  id: string
  displayName: string
  communicationTypes: string[]
  chipset: string
  isActive: boolean
  incompatibleCommands: string[]
}

interface GeneratorConfig {
  controllers: ControllerConfig[]
  deviceTemplates: any[]
  commands: any[]
}

export class ArduinoGeneratorService {
  private static instance: ArduinoGeneratorService
  private readonly baseTemplatesPath: string
  private readonly commandTemplatesPath: string
  private readonly generatedOutputPath: string
  private readonly configPath: string
  private config: GeneratorConfig | null = null

  constructor() {
    const projectRoot = path.resolve(__dirname, '../../..')
    this.baseTemplatesPath = path.join(projectRoot, 'Arduino', 'templates', 'base')
    this.commandTemplatesPath = path.join(projectRoot, 'Arduino', 'templates', 'commands')
    this.generatedOutputPath = path.join(projectRoot, 'Arduino', 'generated')
    this.configPath = path.join(projectRoot, 'Arduino', 'generator-config.json')
  }

  static getInstance(): ArduinoGeneratorService {
    if (!ArduinoGeneratorService.instance) {
      ArduinoGeneratorService.instance = new ArduinoGeneratorService()
    }
    return ArduinoGeneratorService.instance
  }

  /**
   * Load generator configuration from JSON file
   */
  async loadConfig(): Promise<GeneratorConfig> {
    if (this.config) {
      return this.config
    }

    try {
      const configContent = await fs.readFile(this.configPath, 'utf-8')
      this.config = JSON.parse(configContent)
      return this.config!
    } catch (error) {
      throw new Error(`Failed to load generator config: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get controller configuration by ID
   */
  async getControllerConfig(controllerId: string): Promise<ControllerConfig> {
    const config = await this.loadConfig()
    const controller = config.controllers.find(c => c.id === controllerId)

    if (!controller) {
      throw new Error(`Controller configuration not found: ${controllerId}`)
    }

    return controller
  }

  /**
   * Get all active controllers
   */
  async getActiveControllers(): Promise<ControllerConfig[]> {
    const config = await this.loadConfig()
    return config.controllers.filter(c => c.isActive)
  }

  /**
   * Generate firmware for a controller type with manual commands
   */
  async generateFirmware(
    controllerId: string,
    communicationType: string,
    manualCommandNames: string[]
  ): Promise<string> {
    // Get controller config
    const controllerConfig = await this.getControllerConfig(controllerId)

    // Validate communication type is supported
    if (!controllerConfig.communicationTypes.includes(communicationType)) {
      throw new Error(`Communication type '${communicationType}' not supported for controller '${controllerId}'. Available: ${controllerConfig.communicationTypes.join(', ')}`)
    }

    // Validate commands are compatible with controller
    const incompatibleCommands = manualCommandNames.filter(cmd =>
      controllerConfig.incompatibleCommands.includes(cmd.toUpperCase())
    )
    if (incompatibleCommands.length > 0) {
      throw new Error(`Commands not compatible with ${controllerConfig.displayName}: ${incompatibleCommands.join(', ')}`)
    }

    // Construct template name: {controllerId}_{communicationType}_base
    const templateName = `${controllerId}_${communicationType}_base`
    const baseTemplate = await this.loadTemplate(templateName)

    // Validate all commands exist
    await this.validateCommands(manualCommandNames)

    // Load all command modules
    const commandModules: CommandModule[] = []
    for (const commandName of manualCommandNames) {
      const module = await this.loadCommandModule(commandName, communicationType)
      commandModules.push(module)
    }

    // Combine code sections
    const generatedCode = this.combineCode(baseTemplate, commandModules, manualCommandNames)

    // Generate output filename using controller id from config
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
    const outputFileName = `${controllerConfig.id}_${timestamp}.ino`
    const outputPath = path.join(this.generatedOutputPath, outputFileName)

    // Ensure output directory exists
    await fs.mkdir(this.generatedOutputPath, { recursive: true })

    // Write generated firmware
    await fs.writeFile(outputPath, generatedCode, 'utf-8')

    console.log(`[ArduinoGeneratorService] Generated firmware: ${outputPath}`)
    return outputPath
  }

  /**
   * Load base template for specified controller
   */
  async loadTemplate(controller: string): Promise<string> {
    const templateFileName = `${controller}.ino`
    const templatePath = path.join(this.baseTemplatesPath, templateFileName)

    try {
      const template = await fs.readFile(templatePath, 'utf-8')
      return template
    } catch (error) {
      throw new Error(`Failed to load template for controller '${controller}': ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Load command module and parse into sections
   */
  async loadCommandModule(commandName: string, communicationType: string): Promise<CommandModule> {
    // Validate command exists in database
    const command = await Command.findOne({ name: commandName.toUpperCase(), isActive: true }).exec()
    if (!command) {
      throw new Error(`Command not found or inactive: ${commandName}`)
    }

    // Read command file
    const commandFileName = `${commandName.toLowerCase()}.ino`
    const commandPath = path.join(this.commandTemplatesPath, communicationType, commandFileName)

    try {
      // Try communication-specific template first
      const content = await fs.readFile(commandPath, 'utf-8')
      return this.parseCommandModule(content)
    } catch (error) {
      // Fallback to serial template if wifi template doesn't exist
      if (communicationType === 'wifi') {
        const fallbackPath = path.join(this.commandTemplatesPath, 'serial', commandFileName)
        try {
          const content = await fs.readFile(fallbackPath, 'utf-8')
          return this.parseCommandModule(content)
        } catch (fallbackError) {
          throw new Error(`Failed to load command module '${commandName}' for ${communicationType} or serial: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`)
        }
      }
      throw new Error(`Failed to load command module '${commandName}' for ${communicationType}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Parse command module content into sections
   */
  private parseCommandModule(content: string): CommandModule {
    const sections: CommandModule = {
      includes: '',
      globals: '',
      dispatcher: '',
      functions: ''
    }

    const lines = content.split('\n')
    let currentSection: keyof CommandModule | null = null

    for (const line of lines) {
      // Detect section markers
      if (line.includes('=== INCLUDES ===')) {
        currentSection = 'includes'
        continue
      } else if (line.includes('=== GLOBALS ===')) {
        currentSection = 'globals'
        continue
      } else if (line.includes('=== DISPATCHER ===')) {
        currentSection = 'dispatcher'
        continue
      } else if (line.includes('=== FUNCTIONS ===')) {
        currentSection = 'functions'
        continue
      }

      // Skip comment lines and empty lines at section starts
      if (line.trim().startsWith('/*') || line.trim().startsWith('*') || line.trim().startsWith('//')) {
        continue
      }

      // Add line to current section
      if (currentSection) {
        sections[currentSection] += line + '\n'
      }
    }

    return sections
  }

  /**
   * Combine base template with command modules
   */
  private combineCode(baseTemplate: string, commandModules: CommandModule[], commandNames: string[]): string {
    let result = baseTemplate

    // Combine all sections from command modules
    const combinedIncludes = commandModules.map(m => m.includes).join('\n')
    const combinedGlobals = commandModules.map(m => m.globals).join('\n')
    const combinedDispatcher = commandModules.map(m => m.dispatcher).join('\n')
    const combinedFunctions = commandModules.map(m => m.functions).join('\n')

    // Build capabilities array
    const capabilitiesArray = this.buildCapabilitiesArray(commandNames)

    // Replace placeholders
    result = result.replace('// GENERATOR_INCLUDES_PLACEHOLDER', combinedIncludes.trim())
    result = result.replace('// GENERATOR_GLOBALS_PLACEHOLDER', combinedGlobals.trim())
    result = result.replace('// GENERATOR_DISPATCHER_PLACEHOLDER', combinedDispatcher.trim())
    result = result.replace('// GENERATOR_FUNCTIONS_PLACEHOLDER', combinedFunctions.trim())
    result = result.replace('// GENERATOR_CAPABILITIES_ARRAY_PLACEHOLDER', capabilitiesArray)

    return result
  }

  /**
   * Build capabilities array declaration
   */
  private buildCapabilitiesArray(commandNames: string[]): string {
    const capabilities = commandNames.map(name => `  "${name.toUpperCase()}"`).join(',\n')

    return `const char* CAPABILITIES[] = {
${capabilities}
};
const int CAPABILITIES_COUNT = sizeof(CAPABILITIES) / sizeof(CAPABILITIES[0]);`
  }

  /**
   * Validate that all commands exist and are active
   */
  private async validateCommands(commandNames: string[]): Promise<void> {
    const upperCaseNames = commandNames.map(name => name.toUpperCase())

    const commands = await Command.find({
      name: { $in: upperCaseNames },
      isActive: true
    }).exec()

    if (commands.length !== commandNames.length) {
      const foundNames = commands.map(c => c.name)
      const missingNames = upperCaseNames.filter(name => !foundNames.includes(name))
      throw new Error(`Commands not found or inactive: ${missingNames.join(', ')}`)
    }
  }

}

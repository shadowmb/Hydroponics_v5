import fs from 'fs';
import path from 'path';

interface Controller {
    id: string;
    displayName: string;
    chipset: string;
    communicationTypes: string[];
    capabilities: {
        analogPins: number;
        digitalPins: number;
        uartCount: number;
        hasHardwareUART: boolean;
        hasRS485: boolean;
        flashMemory: number;
        sram: number;
    };
    commandCompatibility: {
        compatible: string[];
        notRecommended: string[];
        incompatible: string[];
    };
    baseTemplates: {
        serial: string | null;
        wifi: string | null;
    };
    isActive: boolean;
}

interface Command {
    name: string;
    displayName: string;
    description: string;
    category: string;
    commandFormat: string;
    syntax: string;
    example: string;
    response: {
        success: string;
        error: string;
    };
    parameters: Array<{
        name: string;
        type: string;
        required: boolean;
        description: string;
        validation?: string;
        example: string;
    }>;
    memoryFootprint: {
        flash: number;
        sram: number;
    };
    requiredLibraries: string[];
    sensorFamily: string;
    primitives: string[];
    templateFile: {
        serial: string;
        wifi: string;
    };
    isActive: boolean;
}

interface GenerateRequest {
    controllerId: string;
    communicationType: 'serial' | 'wifi';
    commands: string[];
}

export class FirmwareGeneratorService {
    private controllers: Controller[] = [];
    private commands: Command[] = [];
    private configPath: string;
    private templatesPath: string;

    constructor() {
        this.configPath = path.join(__dirname, '../../../firmware/config');
        this.templatesPath = path.join(__dirname, '../../../firmware/templates');
        this.loadConfigurations();
    }

    private loadConfigurations() {
        try {
            // Load controllers
            const controllersPath = path.join(this.configPath, 'controllers.json');
            const controllersData = fs.readFileSync(controllersPath, 'utf-8');
            const controllersJson = JSON.parse(controllersData);
            this.controllers = controllersJson.controllers;

            // Load commands
            const commandsPath = path.join(this.configPath, 'commands.json');
            const commandsData = fs.readFileSync(commandsPath, 'utf-8');
            const commandsJson = JSON.parse(commandsData);
            this.commands = commandsJson.commands;

            console.log(`Loaded ${this.controllers.length} controllers and ${this.commands.length} commands`);
        } catch (error) {
            console.error('Failed to load firmware generator configurations:', error);
            throw error;
        }
    }

    getControllers() {
        return {
            success: true,
            data: this.controllers.filter(c => c.isActive)
        };
    }

    getCommands() {
        return {
            success: true,
            data: this.commands.filter(c => c.isActive)
        };
    }

    validate(request: GenerateRequest) {
        const { controllerId, communicationType, commands } = request;

        // Find controller
        const controller = this.controllers.find(c => c.id === controllerId);
        if (!controller) {
            return {
                success: false,
                error: 'Controller not found'
            };
        }

        // Check if communication type is supported
        if (!controller.communicationTypes.includes(communicationType)) {
            return {
                success: false,
                error: `Communication type '${communicationType}' not supported by this controller`
            };
        }

        // Check if base template exists
        const baseTemplate = controller.baseTemplates[communicationType];
        if (!baseTemplate) {
            return {
                success: false,
                error: `Base template not available for ${communicationType} communication`
            };
        }

        const baseTemplatePath = path.join(this.templatesPath, 'base', baseTemplate);
        if (!fs.existsSync(baseTemplatePath)) {
            return {
                success: false,
                error: `Base template file not found: ${baseTemplate}`
            };
        }

        // Validate commands
        const errors: string[] = [];
        const warnings: string[] = [];

        for (const cmdName of commands) {
            const command = this.commands.find(c => c.name === cmdName);
            if (!command) {
                errors.push(`Command '${cmdName}' not found`);
                continue;
            }

            // Check compatibility
            if (controller.commandCompatibility.incompatible.includes(cmdName)) {
                errors.push(`Command '${cmdName}' is incompatible with ${controller.displayName}`);
            } else if (controller.commandCompatibility.notRecommended.includes(cmdName)) {
                warnings.push(`Command '${cmdName}' is not recommended for ${controller.displayName}`);
            }

            // Check if command template exists
            const templateFile = command.templateFile[communicationType];
            const templatePath = path.join(this.templatesPath, 'commands', templateFile);
            if (!fs.existsSync(templatePath)) {
                errors.push(`Command template file not found: ${templateFile}`);
            }
        }

        if (errors.length > 0) {
            return {
                success: false,
                errors,
                warnings
            };
        }

        return {
            success: true,
            warnings
        };
    }

    generate(request: GenerateRequest) {
        const { controllerId, communicationType, commands } = request;

        // Validate first
        const validation = this.validate(request);
        if (!validation.success) {
            return validation;
        }

        try {
            // Find controller
            const controller = this.controllers.find(c => c.id === controllerId);
            if (!controller) {
                return { success: false, error: 'Controller not found' };
            }

            // Load base template
            const baseTemplate = controller.baseTemplates[communicationType];
            const baseTemplatePath = path.join(this.templatesPath, 'base', baseTemplate!);
            let firmware = fs.readFileSync(baseTemplatePath, 'utf-8');

            // Build capabilities array
            const capabilitiesArray = commands.map(cmd => `"${cmd}"`).join(', ');
            const capabilitiesCode = `const char* CAPABILITIES[] = {${capabilitiesArray}};\nconst int CAPABILITIES_COUNT = ${commands.length};`;

            // Collect includes, globals, dispatcher, and functions from command templates
            let includes = '';
            let globals = '';
            let dispatcher = '';
            let functions = '';

            for (const cmdName of commands) {
                const command = this.commands.find(c => c.name === cmdName);
                if (!command) continue;

                const templateFile = command.templateFile[communicationType];
                const templatePath = path.join(this.templatesPath, 'commands', templateFile);
                const templateContent = fs.readFileSync(templatePath, 'utf-8');

                // Extract sections from template (handle both \r\n and \n line endings)
                const includesMatch = templateContent.match(/\/\/ === INCLUDES ===\r?\n([\s\S]*?)\/\/ === GLOBALS ===/);
                const globalsMatch = templateContent.match(/\/\/ === GLOBALS ===\r?\n([\s\S]*?)\/\/ === DISPATCHER ===/);
                const dispatcherMatch = templateContent.match(/\/\/ === DISPATCHER ===\r?\n([\s\S]*?)\/\/ === FUNCTIONS ===/);
                const functionsMatch = templateContent.match(/\/\/ === FUNCTIONS ===\r?\n([\s\S]*?)$/);

                if (includesMatch) {
                    includes += includesMatch[1];
                }
                if (globalsMatch) {
                    globals += globalsMatch[1];
                }
                if (dispatcherMatch) {
                    dispatcher += dispatcherMatch[1];
                }
                if (functionsMatch) {
                    functions += functionsMatch[1];
                }
            }

            // Replace placeholders
            firmware = firmware.replace('// GENERATOR_INCLUDES_PLACEHOLDER', includes.trim());
            firmware = firmware.replace('// GENERATOR_GLOBALS_PLACEHOLDER', globals.trim());
            firmware = firmware.replace('// GENERATOR_CAPABILITIES_ARRAY_PLACEHOLDER', capabilitiesCode);
            firmware = firmware.replace('// GENERATOR_DISPATCHER_PLACEHOLDER', dispatcher.trim());
            firmware = firmware.replace('// GENERATOR_FUNCTIONS_PLACEHOLDER', functions.trim());

            // Calculate memory usage
            const memoryUsage = this.calculateMemoryUsage(commands);

            const filename = `${controllerId}_${communicationType}_v5.ino`;

            return {
                success: true,
                data: {
                    filename,
                    content: firmware,
                    memoryUsage,
                    warnings: validation.warnings || []
                }
            };
        } catch (error: any) {
            console.error('Firmware generation error:', error);
            return {
                success: false,
                error: 'Failed to generate firmware',
                details: error.message
            };
        }
    }

    private calculateMemoryUsage(commandNames: string[]) {
        const baseOverhead = { flash: 3000, sram: 800 };
        let totalFlash = baseOverhead.flash;
        let totalSram = baseOverhead.sram;

        for (const cmdName of commandNames) {
            const command = this.commands.find(c => c.name === cmdName);
            if (command) {
                totalFlash += command.memoryFootprint.flash;
                totalSram += command.memoryFootprint.sram;
            }
        }

        return {
            flash: totalFlash,
            sram: totalSram
        };
    }
}

import fs from 'fs';
import path from 'path';
import { logger } from '../core/LoggerService';

// === INTERFACES ===
export interface BoardDefinition {
    id: string;
    name: string;
    architecture: string;
    pins: Record<string, any>;
    interfaces: Record<string, any>;
}

export interface CodeBlock {
    includes?: string | string[] | Record<string, string | string[]>;
    globals?: string | string[] | Record<string, string | string[]>;
    setup?: string | string[] | Record<string, string | string[]>;
    loop?: string | string[] | Record<string, string | string[]>;
    functions?: string | string[] | Record<string, string | string[]>;
    dispatcher?: string | string[] | Record<string, string | string[]>;
}

export interface TransportDefinition {
    id: string;
    type: string;
    compatible_architectures: string[];
    parameters?: { name: string; type: string; default?: any; label?: string }[];
    code: CodeBlock;
}

export interface PluginDefinition {
    id: string;
    name: string;
    compatible_architectures: string[];
    parameters?: { name: string; type: string; default?: any; label?: string }[];
    code: CodeBlock;
}

export interface CommandDefinition {
    id: string;
    name: string;
    description: string;
    code: CodeBlock;
}

export interface BuildConfiguration {
    boardId: string;
    transportId: string;
    pluginIds: string[];
    commandIds: string[];
    settings?: Record<string, any>; // For replacing {{ssid}}, {{password}}, etc.
}

export class FirmwareBuilder {
    private definitionsPath: string;
    private templatesPath: string;

    constructor() {
        this.definitionsPath = path.join(__dirname, '../../../firmware/definitions');
        this.templatesPath = path.join(__dirname, '../../../firmware/templates');
    }

    public build(config: BuildConfiguration, boardTemplate: any): string {
        logger.info({ commandIds: config.commandIds }, '🏗️ [FirmwareBuilder] Building with commands');

        // 1. Load Definitions
        // Board is now passed directly, not loaded from file
        const board = this.mapTemplateToBoardDefinition(boardTemplate);

        const transport = this.loadJSON<TransportDefinition>('transports', config.transportId);
        const plugins = config.pluginIds.map(id => this.loadJSON<PluginDefinition>('plugins', id));

        // Always include system commands (add them LAST so processCommand can see other functions)
        const systemCommandIds = ['system_commands'];
        const commandIdsToLoad = [...new Set([...config.commandIds, ...systemCommandIds])];

        // Load commands, filtering out any that don't exist (to prevent build failure if ID is bad)
        const commands: CommandDefinition[] = [];
        commandIdsToLoad.forEach(id => {
            try {
                commands.push(this.loadJSON<CommandDefinition>('commands', id));
            } catch (err) {
                logger.warn({ id, err }, '⚠️ [FirmwareBuilder] Failed to load command definition, skipping');
            }
        });

        // 1.1 Merge Default Settings
        const settings = { ...config.settings };

        // Transport defaults
        if (transport.parameters) {
            transport.parameters.forEach(p => {
                if (settings[p.name] === undefined && p.default !== undefined) {
                    settings[p.name] = p.default;
                }
            });
        }

        // Plugin defaults
        plugins.forEach(plugin => {
            if (plugin.parameters) {
                plugin.parameters.forEach(p => {
                    if (settings[p.name] === undefined && p.default !== undefined) {
                        settings[p.name] = p.default;
                    }
                });
            }
        });

        // 2. Resolve Architecture
        const arch = board.architecture;

        // 3. Initialize Code Sections
        let includes = new Set<string>();
        let globals = new Set<string>();
        let setup = new Set<string>();
        let loop = new Set<string>();
        let functions = new Set<string>();
        let dispatchers = new Set<string>();

        // 3.1 Generate Capabilities Array
        // Filter out system commands from capabilities list
        const capabilityCommands = config.commandIds.filter(id => !['system_commands'].includes(id));
        const capabilitiesCode = `const char* CAPABILITIES[] = { ${capabilityCommands.map(id => `"${id.toUpperCase()}"`).join(', ')} };\nconst int CAPABILITIES_COUNT = ${capabilityCommands.length};`;
        globals.add(capabilitiesCode);

        // 4. Process Transport
        this.processCodeBlock(transport.code, arch, settings, { includes, globals, setup, loop, functions, dispatchers });

        // 5. Process Plugins
        plugins.forEach(plugin => {
            this.processCodeBlock(plugin.code, arch, settings, { includes, globals, setup, loop, functions, dispatchers });
        });

        // 6. Process Commands
        commands.forEach(command => {
            this.processCodeBlock(command.code, arch, settings, { includes, globals, setup, loop, functions, dispatchers });
        });

        // 6. Load Skeleton
        let skeleton = fs.readFileSync(path.join(this.templatesPath, 'base/skeleton.ino'), 'utf-8');

        // 7. Replace Placeholders
        skeleton = skeleton.replace('{{BOARD_NAME}}', board.name);
        skeleton = skeleton.replace('{{TRANSPORT_NAME}}', transport.id);
        skeleton = skeleton.replace('{{DATE}}', new Date().toISOString());

        skeleton = skeleton.replace('{{INCLUDES}}', Array.from(includes).join('\n'));
        skeleton = skeleton.replace('{{GLOBALS}}', Array.from(globals).join('\n'));
        skeleton = skeleton.replace('{{SETUP_CODE}}', Array.from(setup).join('\n  '));
        skeleton = skeleton.replace('{{LOOP_CODE}}', Array.from(loop).join('\n  '));

        // Special handling for functions to inject dispatchers
        let functionsCode = Array.from(functions).join('\n');
        const dispatchersCode = Array.from(dispatchers).join('\n  ');
        functionsCode = functionsCode.replace('{{COMMAND_DISPATCHERS}}', dispatchersCode);

        skeleton = skeleton.replace('{{FUNCTIONS_CODE}}', functionsCode);

        return skeleton;
    }

    private mapTemplateToBoardDefinition(template: any): BoardDefinition {
        if (!template.firmware_config) {
            throw new Error(`Controller template ${template.key} is missing firmware_config`);
        }

        return {
            id: template.key,
            name: template.label,
            architecture: template.firmware_config.requirements.core.split(':')[1] || 'avr', // rough extraction or use define
            pins: template.firmware_config.pins,
            interfaces: template.firmware_config.interfaces
        };
    }

    private loadJSON<T>(type: string, id: string): T {
        const filePath = path.join(this.definitionsPath, type, `${id}.json`);
        if (!fs.existsSync(filePath)) throw new Error(`Definition not found: ${type}/${id}`);
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }

    private processCodeBlock(
        block: CodeBlock,
        arch: string,
        settings: Record<string, any> | undefined,
        output: { includes: Set<string>, globals: Set<string>, setup: Set<string>, loop: Set<string>, functions: Set<string>, dispatchers: Set<string> }
    ) {
        if (block.includes) this.addCode(output.includes, block.includes, arch, settings);
        if (block.globals) this.addCode(output.globals, block.globals, arch, settings);
        if (block.setup) this.addCode(output.setup, block.setup, arch, settings);
        if (block.loop) this.addCode(output.loop, block.loop, arch, settings);
        if (block.functions) this.addCode(output.functions, block.functions, arch, settings);
        if (block.dispatcher) this.addCode(output.dispatchers, block.dispatcher, arch, settings);
    }

    private addCode(
        target: Set<string>,
        source: string | string[] | Record<string, string | string[]> | undefined,
        arch: string,
        settings?: Record<string, any>
    ) {
        if (!source) return;

        let content: string | string[] = '';

        // Resolve Architecture
        if (typeof source === 'object' && !Array.isArray(source)) {
            // It's a map of architectures
            // Try exact match, then 'default', then fail gracefully
            const map = source as Record<string, string | string[]>;
            if (map[arch]) content = map[arch];
            else if (map['*']) content = map['*'];
            else return; // Architecture not supported by this block
        } else {
            content = source as string | string[];
        }

        // Normalize to array
        const lines = Array.isArray(content) ? content : [content];

        // Process Settings (Variables) and @file directives
        lines.forEach(line => {
            if (!line) return;

            let processedLine = line;

            // Handle @file directive
            if (processedLine.startsWith('@file:')) {
                const relativePath = processedLine.substring(6).trim();
                const fullPath = path.join(this.definitionsPath, relativePath);

                if (fs.existsSync(fullPath)) {
                    processedLine = fs.readFileSync(fullPath, 'utf-8');
                } else {
                    console.warn(`Warning: Referenced file not found: ${relativePath}`);
                    processedLine = `// ERROR: File not found ${relativePath}`;
                }
            }

            if (settings) {
                for (const [key, value] of Object.entries(settings)) {
                    // Use a safer replacement for large content
                    processedLine = processedLine.split(`{{${key}}}`).join(String(value));
                }
            }
            target.add(processedLine);
        });
    }
}

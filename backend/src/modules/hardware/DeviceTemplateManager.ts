import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { logger } from '../../core/LoggerService';
import { IDeviceDriver, HardwarePacket } from './interfaces';

// 1. Zod Schema for Device Template
const CommandSchema = z.object({
    hardwareCmd: z.string(),
    params: z.record(z.any()).optional(),
    valuePath: z.string().optional(),
    sourceUnit: z.string().optional(), // Added for Unit Normalization
    outputs: z.array(z.object({
        key: z.string(),
        label: z.string(),
        unit: z.string().optional()
    })).optional(),
});

const PinSchema = z.object({
    name: z.string(),
    type: z.enum(['DIGITAL_IN', 'DIGITAL_OUT', 'ANALOG_IN', 'PWM_OUT']),
});

const RequirementsSchema = z.object({
    interface: z.enum(['digital', 'analog', 'i2c', 'uart', 'onewire', 'pwm']).optional(),
    voltage: z.union([z.string(), z.array(z.number())]).optional(),
    pin_count: z.object({
        digital: z.number().optional(),
        analog: z.number().optional(),
        uart: z.number().optional(),
        i2c: z.number().optional(),
        pwm: z.number().optional()
    }).optional()
});

const VariantSchema = z.object({
    id: z.string(),
    label: z.string(),
    description: z.string().optional(),
    requirements: RequirementsSchema.optional(),
    capabilities: z.array(z.string()).optional(),
    commands: z.record(CommandSchema).optional(),
    pins: z.array(PinSchema).optional(),
    uiConfig: z.object({
        icon: z.string().optional(),
        units: z.array(z.string()).optional(),
        capabilities: z.record(z.object({
            label: z.string(),
            icon: z.string().optional(),
            tooltip: z.string().optional()
        })).optional()
    }).optional()
});

const DeviceTemplateSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    category: z.enum(['CONTROLLER', 'SENSOR', 'ACTUATOR']),
    supportedStrategies: z.array(z.string()).optional(),
    conversionStrategy: z.string().optional(),
    capabilities: z.array(z.string()),
    commands: z.record(CommandSchema),
    pins: z.array(PinSchema),
    requirements: RequirementsSchema.optional(),
    settingsSchema: z.object({
        compensation: z.object({
            temperature: z.object({
                enabled: z.boolean(),
                source: z.enum(['default', 'external', 'internal']),
                default: z.number().optional(),
                externalDeviceId: z.string().optional()
            }).optional()
        }).optional(),
        voltage: z.object({
            reference: z.number().optional()
        }).optional()
    }).optional(),
    variants: z.array(VariantSchema).optional(),
    initialState: z.record(z.any()).optional(),
    hardwareLimits: z.object({
        min: z.number().optional(),
        max: z.number().optional(),
        unit: z.string().optional(),
        resolution: z.number().optional()
    }).optional(),
    sampling: z.object({
        count: z.number().min(1).max(10).optional(),
        delayMs: z.number().min(0).max(500).optional()
    }).optional(),
    uiConfig: z.object({
        category: z.string().optional(),
        icon: z.string().optional(),
        tags: z.array(z.string()).optional(),
        units: z.array(z.string()).optional(),
        recommendedPins: z.array(z.string()).optional(),
        capabilities: z.record(z.object({
            label: z.string(),
            icon: z.string().optional(),
            tooltip: z.string().optional()
        })).optional()
    }).optional(),
});

type DeviceTemplate = z.infer<typeof DeviceTemplateSchema>;

/**
 * DeviceTemplateManager
 * Responsible for loading, validating, and providing Device Drivers.
 */
export class DeviceTemplateManager {
    private static instance: DeviceTemplateManager;
    private templates = new Map<string, DeviceTemplate>();
    private templatesDir = path.join(process.cwd(), 'config', 'devices');

    private constructor() { }

    public static getInstance(): DeviceTemplateManager {
        if (!DeviceTemplateManager.instance) {
            DeviceTemplateManager.instance = new DeviceTemplateManager();
        }
        return DeviceTemplateManager.instance;
    }

    /**
     * Load all templates from the config directory recursively.
     */
    public async loadTemplates(): Promise<void> {
        try {
            // Ensure directory exists
            await fs.mkdir(this.templatesDir, { recursive: true });

            logger.info({ dir: this.templatesDir }, '📂 Loading Device Templates...');

            await this.scanDirectory(this.templatesDir);

            logger.info({ count: this.templates.size, ids: Array.from(this.templates.keys()) }, '📂 Device Templates Loaded');
        } catch (error) {
            logger.error({ error }, '❌ Failed to load device templates');
            throw error;
        }
    }

    private async scanDirectory(dir: string): Promise<void> {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                await this.scanDirectory(fullPath);
            } else if (entry.isFile() && entry.name.endsWith('.json')) {
                await this.loadTemplateFile(fullPath);
            }
        }
    }

    private async loadTemplateFile(filePath: string): Promise<void> {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const raw = JSON.parse(content);

            // Infer Category from Path
            const relativePath = path.relative(this.templatesDir, filePath);
            const pathParts = relativePath.split(path.sep);

            // Expected structure: <category>/<type>/<file.json>
            // e.g. water/sensors/ph.json -> category: water
            let inferredCategory = 'other';
            if (pathParts.length >= 2) {
                inferredCategory = pathParts[0]; // 'water', 'air', etc.
            }

            // Inject inferred category if not present
            if (!raw.uiConfig) raw.uiConfig = {};

            let finalCategory = raw.uiConfig.category || inferredCategory;

            // Normalize to Title Case (e.g. 'water' -> 'Water')
            if (finalCategory) {
                finalCategory = finalCategory.toLowerCase();
                finalCategory = finalCategory.charAt(0).toUpperCase() + finalCategory.slice(1);
            }

            raw.uiConfig.category = finalCategory;

            // Validate with Zod
            const template = DeviceTemplateSchema.parse(raw);

            this.templates.set(template.id, template);
            logger.debug({ id: template.id, category: inferredCategory }, 'Loaded Template');

            // Sync to DB (Source of Truth for API/Frontend)
            try {
                // Dynamic import to avoid circular dependencies if any, though models should be fine
                const { DeviceTemplate: DeviceTemplateModel } = await import('../../models/DeviceTemplate');

                // Map Zod object to Mongoose Document structure
                // Note: _id in Mongoose is the id from JSON
                const dbDoc = {
                    ...template,
                    _id: template.id
                };

                await DeviceTemplateModel.updateOne(
                    { _id: template.id },
                    { $set: dbDoc },
                    { upsert: true }
                );
                logger.debug({ id: template.id }, 'Synced Template to DB');
            } catch (dbError) {
                logger.warn({ id: template.id, error: dbError }, '⚠️ Failed to sync template to DB');
            }

        } catch (error: any) {
            logger.warn({ file: path.basename(filePath), error: error.issues || error.message }, '⚠️ Invalid Device Template');
            // We do NOT throw here, just skip the bad file (Resilience)
        }
    }

    public getTemplate(id: string): DeviceTemplate | undefined {
        return this.templates.get(id);
    }

    /**
     * Get a driver implementation for a specific template.
     * Currently, the Template IS the Driver (Data-Driven).
     */
    public getDriver(templateId: string): IDeviceDriver {
        const template = this.getTemplate(templateId);
        if (!template) {
            throw new Error(`Device Template not found: ${templateId}`);
        }

        return {
            id: template.id,
            name: template.name,
            capabilities: template.capabilities,
            commands: template.commands,
            initialState: template.initialState,

            createPacket: (cmdName, params, context: any) => {
                const cmdDef = template.commands[cmdName];
                if (!cmdDef) {
                    throw new Error(`Command '${cmdName}' not defined in template '${template.id}'`);
                }

                // Merge static params from template with dynamic params
                // Dynamic params take precedence (allowing overrides of defaults/definitions)
                const finalParams = { ...cmdDef.params, ...params };

                // Inject Pin if available in context
                if (context.pin !== undefined) {
                    finalParams.pin = context.pin;
                }
                // Inject Pins Map if available in context
                if (context.pins !== undefined) {
                    finalParams.pins = context.pins;
                }

                return {
                    cmd: cmdDef.hardwareCmd,
                    ...finalParams
                };
            },

            validateParams: (cmdName, params) => {
                // TODO: Add Zod schema for params in the template definition itself for stricter validation
                return !!template.commands[cmdName];
            }
        };
    }

    /**
     * Get all unique units defined across all device templates.
     */
    public getAllUnits(): string[] {
        const units = new Set<string>();
        this.templates.forEach(template => {
            if (template.uiConfig?.units) {
                template.uiConfig.units.forEach(u => units.add(u));
            }
        });
        return Array.from(units).sort();
    }
}

export const templates = DeviceTemplateManager.getInstance();

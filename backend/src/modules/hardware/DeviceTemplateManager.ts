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

const DeviceTemplateSchema = z.object({
    id: z.string(),
    name: z.string(),
    category: z.enum(['CONTROLLER', 'SENSOR', 'ACTUATOR']),
    conversionStrategy: z.string().optional(),
    capabilities: z.array(z.string()),
    commands: z.record(CommandSchema),
    pins: z.array(PinSchema),
    initialState: z.record(z.any()).optional(),
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
     * Load all templates from the config directory.
     */
    public async loadTemplates(): Promise<void> {
        try {
            // Ensure directory exists
            await fs.mkdir(this.templatesDir, { recursive: true });

            const files = await fs.readdir(this.templatesDir);
            const jsonFiles = files.filter(f => f.endsWith('.json'));

            logger.info({ dir: this.templatesDir, files: jsonFiles }, '📂 Loading Device Templates from...');

            for (const file of jsonFiles) {
                await this.loadTemplateFile(path.join(this.templatesDir, file));
            }

            logger.info({ count: this.templates.size, ids: Array.from(this.templates.keys()) }, '📂 Device Templates Loaded');
        } catch (error) {
            logger.error({ error }, '❌ Failed to load device templates');
            throw error;
        }
    }

    private async loadTemplateFile(filePath: string): Promise<void> {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const raw = JSON.parse(content);

            // Validate with Zod
            const template = DeviceTemplateSchema.parse(raw);

            this.templates.set(template.id, template);
            logger.debug({ id: template.id }, 'Loaded Template');

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
                // Template params take precedence (e.g. inverting logic)
                const finalParams = { ...params, ...cmdDef.params };

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
}

export const templates = DeviceTemplateManager.getInstance();

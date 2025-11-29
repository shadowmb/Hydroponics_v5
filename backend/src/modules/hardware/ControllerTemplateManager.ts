import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { logger } from '../../core/LoggerService';

// Zod Schema for Controller Template
const PortTemplateSchema = z.object({
    id: z.string(),
    label: z.string(),
    type: z.enum(['digital', 'analog']),
    reserved: z.boolean().optional().default(false),
    pwm: z.boolean().optional().default(false),
    pin: z.number(),
    interface: z.enum(['uart', 'i2c', 'spi']).optional()
});

const ControllerTemplateSchema = z.object({
    key: z.string(),
    label: z.string(),
    description: z.string().optional(),
    architecture: z.string().optional(),
    communication_by: z.array(z.string()),
    communication_type: z.array(z.string()),
    memory: z.object({
        flash: z.number(),
        sram: z.number(),
        eeprom: z.number().optional()
    }).optional(),
    pin_counts: z.object({
        digital: z.number(),
        analog: z.number(),
        pwm: z.number().optional().default(0),
        i2c: z.number().optional().default(0),
        spi: z.number().optional().default(0),
        uart: z.number().optional().default(0)
    }).optional(),
    electrical_specs: z.object({
        logic_voltage: z.string(),
        input_voltage: z.string(),
        max_current_per_pin: z.string(),
        analog_resolution: z.string(),
        adc_range: z.string()
    }).optional(),
    firmware_config: z.object({
        voltage: z.number(),
        clock_speed_hz: z.number(),
        requirements: z.object({
            core: z.string(),
            libraries: z.array(z.object({
                name: z.string(),
                version: z.string(),
                required_for: z.array(z.string())
            }))
        }),
        defines: z.array(z.string()),
        interfaces: z.object({
            serial: z.object({
                hardware: z.array(z.string()),
                usb: z.string()
            }),
            i2c: z.array(z.string()).optional(),
            spi: z.array(z.string()).optional(),
            wifi: z.object({
                type: z.enum(['native', 'none']),
                chipset: z.string().nullable().optional()
            }).optional()
        }),
        pins: z.object({
            mappings: z.record(z.union([z.string(), z.number()]))
        })
    }).optional(),
    constraints: z.array(z.string()).optional(),
    ports: z.array(PortTemplateSchema)
});

type ControllerTemplate = z.infer<typeof ControllerTemplateSchema>;

/**
 * ControllerTemplateManager
 * Responsible for loading and validating Controller Templates from JSON files.
 */
export class ControllerTemplateManager {
    private static instance: ControllerTemplateManager;
    private templates = new Map<string, ControllerTemplate>();
    private templatesDir = path.join(process.cwd(), 'config', 'controllers');

    private constructor() { }

    public static getInstance(): ControllerTemplateManager {
        if (!ControllerTemplateManager.instance) {
            ControllerTemplateManager.instance = new ControllerTemplateManager();
        }
        return ControllerTemplateManager.instance;
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

            logger.info({ dir: this.templatesDir, files: jsonFiles }, '🌱 Loading Controller Templates from...');

            for (const file of jsonFiles) {
                await this.loadTemplateFile(path.join(this.templatesDir, file));
            }

            logger.info({ count: this.templates.size, keys: Array.from(this.templates.keys()) }, '🌱 Controller Templates Loaded');
        } catch (error) {
            logger.error({ error }, '❌ Failed to load controller templates');
            throw error;
        }
    }

    private async loadTemplateFile(filePath: string): Promise<void> {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const raw = JSON.parse(content);

            // Validate with Zod
            const template = ControllerTemplateSchema.parse(raw);

            this.templates.set(template.key, template);
            logger.debug({ key: template.key }, 'Loaded Controller Template');

            // Sync to DB (Source of Truth for API/Frontend)
            try {
                const { ControllerTemplate: ControllerTemplateModel } = await import('../../models/ControllerTemplate');

                // Map Zod object to Mongoose Document structure
                // Note: _id in Mongoose is the key from JSON
                const dbDoc = {
                    ...template,
                    _id: template.key
                };

                await ControllerTemplateModel.updateOne(
                    { _id: template.key },
                    { $set: dbDoc },
                    { upsert: true }
                );
                logger.debug({ key: template.key }, 'Synced Controller Template to DB');
            } catch (dbError) {
                logger.warn({ key: template.key, error: dbError }, '⚠️ Failed to sync controller template to DB');
            }

        } catch (error: any) {
            logger.warn({ file: path.basename(filePath), error: error.issues || error.message }, '⚠️ Invalid Controller Template');
            // We do NOT throw here, just skip the bad file (Resilience)
        }
    }

    public getTemplate(key: string): ControllerTemplate | undefined {
        return this.templates.get(key);
    }
}

export const controllerTemplates = ControllerTemplateManager.getInstance();

import { FastifyRequest, FastifyReply } from 'fastify';
import path from 'path';
import fs from 'fs';
import { FirmwareBuilder } from '../../services/FirmwareBuilder';

export class FirmwareBuilderController {
    private builder: FirmwareBuilder;
    private definitionsPath: string;

    constructor() {
        this.builder = new FirmwareBuilder();
        this.definitionsPath = path.join(__dirname, '../../../../firmware/definitions');
    }

    // Helper to read all JSONs from a directory
    private readDefinitions(type: string) {
        const dirPath = path.join(this.definitionsPath, type);
        if (!fs.existsSync(dirPath)) return [];

        return fs.readdirSync(dirPath)
            .filter(file => file.endsWith('.json'))
            .map(file => {
                try {
                    return JSON.parse(fs.readFileSync(path.join(dirPath, file), 'utf-8'));
                } catch (e) {
                    console.error(`Failed to parse ${type}/${file}`, e);
                    return null;
                }
            })
            .filter(item => item !== null);
    }

    public getBoards = async (req: FastifyRequest, reply: FastifyReply) => {
        // Use ControllerTemplateManager to get boards
        const { controllerTemplates } = await import('../../modules/hardware/ControllerTemplateManager');

        // We need to map the internal template structure to what the frontend expects for the builder
        // Ideally, the frontend should just use the full template, but for now we map it to keep compatibility
        // or just return the full template if the frontend is updated (which we did earlier)

        // Actually, let's return the full templates as "boards" since we updated the frontend type
        const templates = Array.from((controllerTemplates as any).templates.values());

        const boards = templates.map((t: any) => ({
            id: t.key,
            name: t.label,
            description: t.description,
            architecture: t.architecture,
            voltage: t.firmware_config?.voltage || 5,
            clock_speed_hz: t.firmware_config?.clock_speed_hz || 16000000,
            memory: {
                flash_bytes: t.memory?.flash,
                sram_bytes: t.memory?.sram,
                eeprom_bytes: t.memory?.eeprom
            },
            interfaces: t.firmware_config?.interfaces || {},
            pins: {
                digital_count: t.pin_counts?.digital || 0,
                analog_input_count: t.pin_counts?.analog || 0,
                pwm_pins: t.ports?.filter((p: any) => p.pwm).map((p: any) => p.pin) || [],
                uart_pins: t.ports?.filter((p: any) => p.interface === 'uart').map((p: any) => p.pin) || [],
                i2c_pins: t.ports?.filter((p: any) => p.interface === 'i2c').map((p: any) => p.pin) || [],
                spi_pins: t.ports?.filter((p: any) => p.interface === 'spi').map((p: any) => p.pin) || []
            },
            electrical_specs: t.electrical_specs,
            constraints: t.constraints
        }));

        return reply.send({ success: true, data: boards });
    }

    public getTransports = async (req: FastifyRequest, reply: FastifyReply) => {
        const transports = this.readDefinitions('transports');
        return reply.send({ success: true, data: transports });
    }

    public getPlugins = async (req: FastifyRequest, reply: FastifyReply) => {
        const plugins = this.readDefinitions('plugins');
        return reply.send({ success: true, data: plugins });
    }

    public getCommands = async (req: FastifyRequest, reply: FastifyReply) => {
        // For now, only return the new JSON-based commands
        const commands = this.readDefinitions('commands');
        return reply.send({ success: true, data: commands });
    }

    public buildFirmware = async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const config = req.body as any; // Typed in Service

            // Fetch the board template from Manager
            const { controllerTemplates } = await import('../../modules/hardware/ControllerTemplateManager');
            const boardTemplate = controllerTemplates.getTemplate(config.boardId);

            if (!boardTemplate) {
                throw new Error(`Board template not found: ${config.boardId}`);
            }

            const firmwareCode = this.builder.build(config, boardTemplate);

            return reply.send({
                success: true,
                data: {
                    filename: `firmware_${config.boardId}_${Date.now()}.ino`,
                    content: firmwareCode
                }
            });
        } catch (error: any) {
            return reply.status(500).send({ success: false, error: error.message });
        }
    }
}

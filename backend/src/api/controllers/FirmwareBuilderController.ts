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
        const boards = this.readDefinitions('boards');
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
            const firmwareCode = this.builder.build(config);

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

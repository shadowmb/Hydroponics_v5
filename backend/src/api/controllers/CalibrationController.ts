import { FastifyRequest, FastifyReply } from 'fastify';
import path from 'path';
import fs from 'fs/promises';

export class CalibrationController {
    static async getStrategies(req: FastifyRequest, reply: FastifyReply) {
        try {
            const configPath = path.join(process.cwd(), 'config', 'calibration_strategies.json');
            const fileContent = await fs.readFile(configPath, 'utf-8');
            const strategies = JSON.parse(fileContent);

            reply.send({
                success: true,
                data: strategies
            });
        } catch (error) {
            req.log.error({ err: error }, 'Failed to load calibration strategies');
            reply.status(500).send({
                success: false,
                error: 'Failed to load calibration strategies',
                details: (error as Error).message
            });
        }
    }
}

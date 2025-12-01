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


    static async saveCalibration(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = req.params as { id: string };
            const { strategyId, data } = req.body as { strategyId: string, data: any };

            if (!strategyId || !data) {
                return reply.status(400).send({
                    success: false,
                    error: 'Missing strategyId or data'
                });
            }

            const { CalibrationService } = await import('../../modules/calibration/CalibrationService');
            const device = await CalibrationService.getInstance().saveCalibration(id, strategyId, data);

            reply.send({
                success: true,
                data: device
            });
        } catch (error) {
            req.log.error({ err: error, deviceId: (req.params as any).id }, 'Failed to save calibration');
            reply.status(500).send({
                success: false,
                error: 'Failed to save calibration',
                details: (error as Error).message
            });
        }
    }
    static async deleteCalibration(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { id, strategyId } = req.params as { id: string, strategyId: string };

            if (!strategyId) {
                return reply.status(400).send({
                    success: false,
                    error: 'Missing strategyId'
                });
            }

            const { CalibrationService } = await import('../../modules/calibration/CalibrationService');
            const device = await CalibrationService.getInstance().deleteCalibration(id, strategyId);

            reply.send({
                success: true,
                data: device
            });
        } catch (error) {
            req.log.error({ err: error, deviceId: (req.params as any).id }, 'Failed to delete calibration');
            reply.status(500).send({
                success: false,
                error: 'Failed to delete calibration',
                details: (error as Error).message
            });
        }
    }
}

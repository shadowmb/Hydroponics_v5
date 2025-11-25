import { FastifyRequest, FastifyReply } from 'fastify';
import { FirmwareGeneratorService } from '../../services/FirmwareGeneratorService';

const generatorService = new FirmwareGeneratorService();

export class FirmwareGeneratorController {

    static async getControllers(request: FastifyRequest, reply: FastifyReply) {
        try {
            const result = generatorService.getControllers();
            return reply.send(result);
        } catch (error: any) {
            return reply.status(500).send({
                success: false,
                error: 'Failed to load controllers',
                details: error.message
            });
        }
    }

    static async getCommands(request: FastifyRequest, reply: FastifyReply) {
        try {
            const result = generatorService.getCommands();
            return reply.send(result);
        } catch (error: any) {
            return reply.status(500).send({
                success: false,
                error: 'Failed to load commands',
                details: error.message
            });
        }
    }

    static async validate(request: FastifyRequest, reply: FastifyReply) {
        try {
            const body = request.body as any;
            const result = generatorService.validate(body);
            return reply.send(result);
        } catch (error: any) {
            return reply.status(500).send({
                success: false,
                error: 'Validation failed',
                details: error.message
            });
        }
    }

    static async generate(request: FastifyRequest, reply: FastifyReply) {
        try {
            const body = request.body as any;
            const result = generatorService.generate(body);

            if (!result.success) {
                return reply.status(400).send(result);
            }

            return reply.send(result);
        } catch (error: any) {
            return reply.status(500).send({
                success: false,
                error: 'Generation failed',
                details: error.message
            });
        }
    }
}

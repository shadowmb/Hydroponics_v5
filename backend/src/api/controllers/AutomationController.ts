import { FastifyRequest, FastifyReply } from 'fastify';
import { automation } from '../../modules/automation/AutomationEngine';
import { AutomationStartSchema } from '../schemas/requests';
import { logger } from '../../core/LoggerService';

export class AutomationController {

    static async load(req: FastifyRequest, reply: FastifyReply) {
        const body = AutomationStartSchema.parse(req.body);

        try {
            const sessionId = await automation.loadProgram(body.programId, body.overrides);
            return reply.send({ success: true, message: 'Program loaded', sessionId });
        } catch (error: any) {
            logger.error({ error }, 'Failed to load program');
            throw { statusCode: 400, message: error.message || 'Failed to load program' };
        }
    }

    static async start(req: FastifyRequest, reply: FastifyReply) {
        try {
            await automation.startProgram();
            return reply.send({ success: true, message: 'Program started' });
        } catch (error: any) {
            logger.error({ error }, 'Failed to start program');
            throw { statusCode: 400, message: error.message || 'Failed to start program' };
        }
    }

    static async stop(req: FastifyRequest, reply: FastifyReply) {
        automation.stopProgram();
        return reply.send({ success: true, message: 'Program stopped' });
    }

    static async unload(req: FastifyRequest, reply: FastifyReply) {
        await automation.unloadProgram();
        return reply.send({ success: true, message: 'Program unloaded' });
    }

    static async pause(req: FastifyRequest, reply: FastifyReply) {
        automation.pauseProgram();
        return reply.send({ success: true, message: 'Program paused' });
    }

    static async resume(req: FastifyRequest, reply: FastifyReply) {
        automation.resumeProgram();
        return reply.send({ success: true, message: 'Program resumed' });
    }

    static async getStatus(req: FastifyRequest, reply: FastifyReply) {
        const snapshot = automation.getSnapshot();
        return reply.send({
            state: snapshot.value,
            context: snapshot.context.execContext,
            currentBlock: snapshot.context.currentBlockId,
            sessionId: (snapshot as any).sessionId
        });
    }
}

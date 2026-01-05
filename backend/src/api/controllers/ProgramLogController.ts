import { FastifyRequest, FastifyReply } from 'fastify';
import { programDailyLogRepository } from '../../modules/persistence/repositories/ProgramDailyLogRepository';

export class ProgramLogController {

    /**
     * Get logs for a specific program.
     * Query: ?date=YYYY-MM-DD (optional, defaults to all/sorted)
     */
    async getLogs(req: FastifyRequest<{ Params: { programId: string }, Querystring: { date?: string } }>, reply: FastifyReply) {
        try {
            const { programId } = req.params;
            const { date } = req.query;

            const logs = await programDailyLogRepository.getLogs(programId, date);
            return reply.send({ success: true, data: logs });
        } catch (error: any) {
            req.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to fetch logs' });
        }
    }

    /**
     * Clear logs (Visual or Permanent)
     */
    async clearLogs(req: FastifyRequest<{ Params: { programId: string }, Body: { date: string, type: 'visual' | 'permanent' } }>, reply: FastifyReply) {
        try {
            const { programId } = req.params;
            const { date, type } = req.body;

            await programDailyLogRepository.clearLog(programId, date, type);
            return reply.send({ success: true });
        } catch (error: any) {
            req.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to clear logs' });
        }
    }
}

export const programLogController = new ProgramLogController();

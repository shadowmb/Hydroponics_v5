import { FastifyRequest, FastifyReply } from 'fastify';
import { ActiveProgramModel } from '../../modules/persistence/schemas/ActiveProgram.schema';
import { CycleSessionModel } from '../../modules/persistence/schemas/CycleSession.schema';
import { ExecutionSessionModel } from '../../modules/persistence/schemas/ExecutionSession.schema';
import { automation } from '../../modules/automation/AutomationEngine';
import { logger } from '../../core/LoggerService';

export class SystemController {

    /**
     * Check for system state inconsistencies (Zombie processes).
     */
    static async checkState(request: FastifyRequest, reply: FastifyReply) {
        try {
            // 1. Get DB State
            const runningPrograms = await ActiveProgramModel.find({ status: { $in: ['running', 'paused'] } });
            const runningCycleSessions = await CycleSessionModel.find({ status: { $in: ['running', 'paused'] } });
            const runningFlowSessions = await ExecutionSessionModel.find({ status: { $in: ['running', 'paused'] }, deletedAt: null });

            // 2. Get Memory State
            const engineStatus = automation.getStatus(); // { status: 'idle' | 'running' | 'paused', ... }
            const isEngineRunning = engineStatus.status === 'running' || engineStatus.status === 'paused';

            const mismatches = [];

            // 3. Compare Program State
            for (const program of runningPrograms) {
                mismatches.push({
                    id: program._id,
                    type: 'PROGRAM',
                    name: program.name,
                    status: program.status,
                    engineStatus: engineStatus.status,
                    isZombie: !isEngineRunning
                });
            }

            // 4. Compare Cycle Sessions (Scheduler)
            for (const session of runningCycleSessions) {
                mismatches.push({
                    id: session._id,
                    type: 'CYCLE_SESSION',
                    name: (session.context as any)?.cycleName || 'Unknown Session',
                    status: session.status,
                    engineStatus: engineStatus.status,
                    isZombie: !isEngineRunning
                });
            }

            // 5. Compare Flow Sessions (Automation)
            for (const session of runningFlowSessions) {
                // Check if this specific session is the one running in the engine
                const isThisSessionRunning = isEngineRunning && engineStatus.sessionId === session.id;

                mismatches.push({
                    id: session._id,
                    type: 'FLOW_SESSION',
                    name: `Flow Session (${session._id})`, // We could fetch Flow Name but generic is fine for now
                    status: session.status,
                    engineStatus: engineStatus.status,
                    isZombie: !isThisSessionRunning
                });
            }

            return reply.send({
                success: true,
                data: {
                    engineStatus: engineStatus.status,
                    mismatches,
                    isHealthy: mismatches.length === 0 || (isEngineRunning && mismatches.every(m => !m.isZombie))
                }
            });

        } catch (error: any) {
            logger.error({ error }, 'Failed to check system state');
            return reply.status(500).send({ success: false, error: error.message });
        }
    }

    /**
     * Fix a specific system state mismatch.
     */
    static async fixState(request: FastifyRequest<{ Body: { id: string, type: 'PROGRAM' | 'CYCLE_SESSION' | 'FLOW_SESSION' } }>, reply: FastifyReply) {
        try {
            const { id, type } = request.body;

            if (type === 'PROGRAM') {
                const program = await ActiveProgramModel.findById(id);
                if (program) {
                    program.status = 'stopped';
                    program.endTime = new Date();
                    await program.save();
                    logger.info({ id }, '🛠️ System Recovery: Force Stopped Program');
                }
            } else if (type === 'CYCLE_SESSION') {
                const session = await CycleSessionModel.findById(id);
                if (session) {
                    session.status = 'stopped';
                    session.endTime = new Date();
                    await session.save();
                    logger.info({ id }, '🛠️ System Recovery: Force Stopped Cycle Session');
                }
            } else if (type === 'FLOW_SESSION') {
                const session = await ExecutionSessionModel.findById(id);
                if (session) {
                    session.status = 'stopped';
                    session.endTime = new Date();
                    await session.save();
                    logger.info({ id }, '🛠️ System Recovery: Force Stopped Flow Session');
                }
            }

            return reply.send({ success: true });

        } catch (error: any) {
            logger.error({ error }, 'Failed to fix system state');
            return reply.status(500).send({ success: false, error: error.message });
        }
    }
}

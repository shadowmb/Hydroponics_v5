import { ActiveProgramModel, IActiveProgram } from '../persistence/schemas/ActiveProgram.schema';

export interface ResumeContext {
    type: 'active_flow' | 'active_with_expired' | 'expired' | 'clean';
    programId: string;
    programName: string;
    pausedAt?: Date;
    pauseTimeout?: number;
    pauseFlowName?: string;
    pauseBlockLabel?: string;
    pauseWindowId?: string;
    pauseWindowName?: string;
    activeWindows: Array<{ id: string; name: string }>;
    expiredWindows: Array<{ id: string; name: string; startTime: string; endTime: string }>;
}

export class ResumeContextService {
    async getResumeContext(): Promise<ResumeContext | null> {
        const active = await ActiveProgramModel.findOne({ status: 'paused' });

        if (!active) {
            return null;
        }

        let pauseFlowName: string | undefined;
        let hasActiveFlow = false;

        if (active.pauseFlowSessionId) {
            const { ExecutionSessionModel } = await import('../persistence/schemas/ExecutionSession.schema');
            const session = await ExecutionSessionModel.findById(active.pauseFlowSessionId);

            // ✅ Validation: Check if session still exists and is paused
            if (session && session.status === 'paused') {
                hasActiveFlow = true;
                pauseFlowName = session.programName || active.pauseFlowName;
            } else {
                // ❌ Invalid session - auto cleanup
                active.pauseFlowSessionId = undefined;
                active.pauseFlowName = undefined;
                active.pauseBlockId = undefined;
                active.pauseBlockLabel = undefined;
                await active.save();
            }
        }

        // Determine expired windows
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const expiredWindows = (active.windows || [])
            .filter((w: any) => {
                if (!w.endTime) return false;
                return currentTime > w.endTime;
            })
            .map((w: any) => ({
                id: w.id,
                name: w.name,
                startTime: w.startTime,
                endTime: w.endTime
            }));

        // Determine active windows (within time range)
        const activeWindows = (active.windows || [])
            .filter((w: any) => {
                if (!w.startTime || !w.endTime) return false;
                return currentTime >= w.startTime && currentTime <= w.endTime;
            })
            .map((w: any) => ({
                id: w.id,
                name: w.name
            }));

        // Find pause window name
        let pauseWindowName: string | undefined;
        if (active.pauseWindowId) {
            const pauseWindow = (active.windows || []).find((w: any) => w.id === active.pauseWindowId);
            pauseWindowName = pauseWindow?.name || active.pauseWindowName;
        }

        // Determine context type
        let type: ResumeContext['type'];
        const hasExpired = expiredWindows.length > 0;

        if (hasActiveFlow && hasExpired) {
            type = 'active_with_expired';
        } else if (hasActiveFlow) {
            type = 'active_flow';
        } else if (hasExpired) {
            type = 'expired';
        } else {
            type = 'clean';
        }

        return {
            type,
            programId: active.sourceProgramId,
            programName: active.name,
            pausedAt: active.pausedAt,
            pauseTimeout: active.pauseTimeout,
            pauseFlowName,
            pauseBlockLabel: active.pauseBlockLabel,
            pauseWindowId: active.pauseWindowId,
            pauseWindowName,
            activeWindows,
            expiredWindows
        };
    }
}

export const resumeContextService = new ResumeContextService();

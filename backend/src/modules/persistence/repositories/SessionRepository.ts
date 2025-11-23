import { ExecutionSessionModel, IExecutionSession } from '../schemas/ExecutionSession.schema';

export class SessionRepository {
    async create(data: Partial<IExecutionSession>): Promise<IExecutionSession> {
        return ExecutionSessionModel.create(data);
    }

    async update(id: string, data: Partial<IExecutionSession>): Promise<IExecutionSession | null> {
        return ExecutionSessionModel.findByIdAndUpdate(id, data, { new: true }).exec();
    }

    async findByProgramId(programId: string, limit: number = 10): Promise<IExecutionSession[]> {
        return ExecutionSessionModel.find({ programId })
            .sort({ startTime: -1 })
            .limit(limit)
            .exec();
    }

    async findById(id: string): Promise<IExecutionSession | null> {
        return ExecutionSessionModel.findById(id).exec();
    }
    async addLog(id: string, log: any): Promise<IExecutionSession | null> {
        return ExecutionSessionModel.findByIdAndUpdate(id, { $push: { logs: log } }, { new: true }).exec();
    }
}

export const sessionRepository = new SessionRepository();

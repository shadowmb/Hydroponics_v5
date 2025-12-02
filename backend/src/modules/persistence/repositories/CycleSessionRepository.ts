import { BaseRepository } from './BaseRepository';
import { CycleSessionModel, ICycleSession } from '../schemas/CycleSession.schema';

export class CycleSessionRepository extends BaseRepository<ICycleSession> {
    constructor() {
        super(CycleSessionModel);
    }

    async findById(id: string): Promise<ICycleSession | null> {
        return this.model.findById(id).exec();
    }

    async update(id: string, data: any): Promise<ICycleSession | null> {
        return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
    }

    async findActiveSession(): Promise<ICycleSession | null> {
        return this.model.findOne({ status: { $in: ['running', 'paused'] } }).sort({ createdAt: -1 });
    }

    async addLog(sessionId: string, log: any): Promise<void> {
        await this.model.findByIdAndUpdate(sessionId, { $push: { logs: log } });
    }
}

export const cycleSessionRepository = new CycleSessionRepository();

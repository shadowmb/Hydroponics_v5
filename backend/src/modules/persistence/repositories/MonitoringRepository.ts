import { BaseRepository } from './BaseRepository';
import { MonitoringModel, IMonitoring } from '../schemas/Monitoring.schema';

export class MonitoringRepository extends BaseRepository<IMonitoring> {
    constructor() {
        super(MonitoringModel);
    }

    async findActive(): Promise<IMonitoring[]> {
        return this.model.find({ isActive: true }).exec();
    }
}

export const monitoringRepository = new MonitoringRepository();

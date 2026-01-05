import { BaseRepository } from './BaseRepository';
import { ProgramModel, IProgram } from '../schemas/Program.schema';

export class ProgramRepository extends BaseRepository<IProgram> {
    constructor() {
        super(ProgramModel);
    }

    async create(data: Partial<IProgram>): Promise<IProgram> {
        if (data.isActive) {
            await this.model.updateMany({}, { isActive: false });
        }
        return super.create(data);
    }

    async update(id: string, data: Partial<IProgram>): Promise<IProgram | null> {
        if (data.isActive) {
            await this.model.updateMany({ id: { $ne: id } }, { isActive: false });
        }
        return super.update(id, data);
    }

    async findActive(): Promise<IProgram | null> {
        return this.model.findOne({ isActive: true }).exec();
    }

    async findProgramsByFlowId(flowId: string): Promise<IProgram[]> {
        return this.model.find({
            $or: [
                { "schedule.steps.flowId": flowId },
                { "windows.triggers.flowId": flowId },      // Deprecated field
                { "windows.triggers.flowIds": flowId },     // New array field
                { "windows.fallbackFlowId": flowId },       // Deprecated
                { "windows.fallbackFlowIds": flowId }       // New
            ]
        }, { name: 1, isActive: 1, id: 1 }).exec(); // Select only needed fields
    }

    async syncActiveStatus(activeProgramId: string | null): Promise<void> {
        // 1. Reset all to inactive
        await this.model.updateMany({}, { isActive: false });

        // 2. If valid ID, set to active
        if (activeProgramId) {
            await this.model.updateOne({ id: activeProgramId }, { isActive: true });
        }
    }
}


export const programRepository = new ProgramRepository();

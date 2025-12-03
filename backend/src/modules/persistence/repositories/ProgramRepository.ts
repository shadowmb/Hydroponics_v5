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
}

export const programRepository = new ProgramRepository();

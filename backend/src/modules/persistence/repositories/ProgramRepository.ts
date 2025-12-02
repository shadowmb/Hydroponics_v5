import { BaseRepository } from './BaseRepository';
import { ProgramModel, IProgram } from '../schemas/Program.schema';

export class ProgramRepository extends BaseRepository<IProgram> {
    constructor() {
        super(ProgramModel);
    }

    async findActive(): Promise<IProgram | null> {
        return this.model.findOne({ isActive: true }).exec();
    }
}

export const programRepository = new ProgramRepository();

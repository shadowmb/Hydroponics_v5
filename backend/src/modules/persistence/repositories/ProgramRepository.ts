import { ProgramModel, IProgram } from '../schemas/Program.schema';

export class ProgramRepository {
    async findAll(): Promise<IProgram[]> {
        return ProgramModel.find().exec();
    }

    async findById(id: string): Promise<IProgram | null> {
        return ProgramModel.findOne({ id }).exec();
    }

    async create(data: Partial<IProgram>): Promise<IProgram> {
        return ProgramModel.create(data);
    }

    async update(id: string, data: Partial<IProgram>): Promise<IProgram | null> {
        return ProgramModel.findOneAndUpdate({ id }, data, { new: true }).exec();
    }

    async delete(id: string): Promise<IProgram | null> {
        const program = await ProgramModel.findOne({ id });
        if (program) {
            return program.softDelete();
        }
        return null;
    }
}

export const programRepository = new ProgramRepository();

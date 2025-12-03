import { FlowModel, IFlow } from '../schemas/Flow.schema';

export class FlowRepository {
    async findAll(): Promise<IFlow[]> {
        return FlowModel.find().exec();
    }

    async findById(id: string): Promise<IFlow | null> {
        return FlowModel.findOne({ id }).exec();
    }

    async create(data: Partial<IFlow>): Promise<IFlow> {
        return FlowModel.create(data);
    }

    async update(id: string, data: Partial<IFlow>): Promise<IFlow | null> {
        return FlowModel.findOneAndUpdate({ id }, data, { new: true }).exec();
    }

    async delete(id: string): Promise<IFlow | null> {
        const flow = await FlowModel.findOne({ id });
        if (flow) {
            return flow.softDelete();
        }
        return null;
    }
}

export const flowRepository = new FlowRepository();

import { Model, Document, FilterQuery, UpdateQuery } from 'mongoose';

export class BaseRepository<T extends Document> {
    protected model: Model<T>;

    constructor(model: Model<T>) {
        this.model = model;
    }

    async findAll(filter: FilterQuery<T> = {}): Promise<T[]> {
        return this.model.find(filter).exec();
    }

    async findById(id: string): Promise<T | null> {
        // Assume 'id' is the custom ID field, not _id
        return this.model.findOne({ id } as FilterQuery<T>).exec();
    }

    async findBy_Id(_id: string): Promise<T | null> {
        return this.model.findById(_id).exec();
    }

    async create(data: Partial<T> | any): Promise<T> {
        return this.model.create(data);
    }

    async update(id: string, data: UpdateQuery<T>): Promise<T | null> {
        return this.model.findOneAndUpdate({ id } as FilterQuery<T>, data, { new: true }).exec();
    }

    async delete(id: string): Promise<T | null> {
        const doc = await this.model.findOne({ id } as FilterQuery<T>);
        if (doc && (doc as any).softDelete) {
            return (doc as any).softDelete();
        }
        return this.model.findOneAndDelete({ id } as FilterQuery<T>).exec();
    }
}

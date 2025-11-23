import { ActionTemplateModel, IActionTemplate } from '../schemas/ActionTemplate.schema';

export class ActionTemplateRepository {
    async findAll(): Promise<IActionTemplate[]> {
        return ActionTemplateModel.find().exec();
    }

    async findById(id: string): Promise<IActionTemplate | null> {
        return ActionTemplateModel.findOne({ id }).exec();
    }

    async create(data: Partial<IActionTemplate>): Promise<IActionTemplate> {
        return ActionTemplateModel.create(data);
    }

    async update(id: string, data: Partial<IActionTemplate>): Promise<IActionTemplate | null> {
        return ActionTemplateModel.findOneAndUpdate({ id }, data, { new: true }).exec();
    }

    async delete(id: string): Promise<IActionTemplate | null> {
        const template = await ActionTemplateModel.findOne({ id });
        if (template) {
            return template.softDelete();
        }
        return null;
    }
}

export const actionTemplateRepository = new ActionTemplateRepository();

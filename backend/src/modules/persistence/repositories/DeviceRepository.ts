import { DeviceModel, IDevice } from '../../../models/Device';

export class DeviceRepository {
    async findAll(): Promise<IDevice[]> {
        return DeviceModel.find().exec();
    }

    async findById(id: string): Promise<IDevice | null> {
        return DeviceModel.findById(id).exec();
    }

    async create(data: Partial<IDevice>): Promise<IDevice> {
        return DeviceModel.create(data);
    }

    async update(id: string, data: Partial<IDevice>): Promise<IDevice | null> {
        return DeviceModel.findByIdAndUpdate(id, data, { new: true }).exec();
    }

    async delete(id: string): Promise<IDevice | null> {
        const device = await DeviceModel.findById(id);
        if (device) {
            return device.softDelete();
        }
        return null;
    }
}

export const deviceRepository = new DeviceRepository();

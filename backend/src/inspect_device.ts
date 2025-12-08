
import mongoose, { Schema } from 'mongoose';
const MONGO_URI = 'mongodb://127.0.0.1:27017/hydroponics_v5';

const DeviceSchema = new Schema({}, { strict: false });
const DeviceModel = mongoose.model('Device', DeviceSchema);

async function checkDevice() {
    try {
        await mongoose.connect(MONGO_URI);
        const id = '693695d9585420702157d812';

        console.log(`Checking Device ID: ${id}`);
        // @ts-ignore
        const device = await DeviceModel.findById(id);
        if (!device) {
            console.log('Device NOT FOUND by ID');
        } else {
            console.log('--- Device Dump ---');
            console.log(JSON.stringify(device, null, 2));
            console.log('-------------------');
            const d = device as any; // Cast to any
            console.log('Name:', d.name);
            console.log('Driver ID:', d.config?.driverId || d.driverId);
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

checkDevice();

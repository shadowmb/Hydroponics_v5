import mongoose from 'mongoose';
import { config } from './core/ConfigService';
import { DeviceModel } from './models/Device';

async function run() {
    try {
        await mongoose.connect(config.MONGO_URI);
        console.log('Connected to DB');

        const newDevice = {
            name: `Debug Device ${Date.now()}`,
            type: 'SENSOR',
            config: {
                driverId: 'some_driver_id',
                pollInterval: 5000
            },
            hardware: {
                parentId: 'some_controller_id',
                port: 'A0',
                pin: 0
            },
            metadata: {
                description: 'Debug Device'
            }
        };

        console.log('Creating Device:', newDevice);
        const device = new DeviceModel(newDevice);
        await device.save();
        console.log('✅ Device Created:', device._id);

        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

run();

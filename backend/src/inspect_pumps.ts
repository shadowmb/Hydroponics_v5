
import mongoose from 'mongoose';
import { DeviceModel } from './models/Device';
import { hardware } from './modules/hardware/HardwareService';

async function run() {
    try {
        await mongoose.connect('mongodb://localhost:27017/hydroponics_v5');
        console.log('Connected to DB');

        const pumps = await DeviceModel.find({});
        console.log("All Devices:");
        pumps.forEach(d => console.log(`- ${d.name} (${d._id}) [${d.config?.driverId}]`));

        console.log(`Found ${pumps.length} pumps`);

        for (const pump of pumps) {
            console.log('------------------------------------------------');
            console.log(`Name: ${pump.name}`);
            console.log(`ID: ${pump._id}`);
            console.log(`Driver: ${pump.config.driverId}`);
            console.log('Calibrations:', JSON.stringify(pump.config.calibrations, null, 2));

            if (pump.config.calibrations?.volumetric_flow?.data?.flowRate) {
                const rate = pump.config.calibrations.volumetric_flow.data.flowRate;
                const durationFor10ml = (10 / rate) * 1000;
                console.log(`Flow Rate: ${rate} (unit/sec?)`);
                console.log(`Calculated Duration for 10ml: ${durationFor10ml} ms`);
            } else {
                console.log('MISSING FLOW RATE CALIBRATION');
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();

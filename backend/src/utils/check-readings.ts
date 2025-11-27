import mongoose from 'mongoose';
import { config } from '../core/ConfigService';
import { Reading } from '../models/Reading';

async function checkReadings() {
    try {
        await mongoose.connect(config.MONGO_URI);
        console.log('Connected to DB');

        const count = await Reading.countDocuments();
        console.log(`Total Readings: ${count}`);

        const readings = await Reading.find().sort({ timestamp: -1 }).limit(5);
        console.log('Last 5 Readings:');
        console.log(JSON.stringify(readings, null, 2));

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkReadings();

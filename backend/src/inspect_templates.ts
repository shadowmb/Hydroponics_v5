
import mongoose, { Schema } from 'mongoose';
const MONGO_URI = 'mongodb://127.0.0.1:27017/hydroponics_v5';

// Define _id as String to bypass ObjectId casting
const TemplateSchema = new Schema({
    _id: String
}, { strict: false });
const DeviceTemplate = mongoose.model('DeviceTemplate', TemplateSchema);

async function checkTemplates() {
    try {
        await mongoose.connect(MONGO_URI);

        console.log('--- Checking hc_sr04 ---');
        // @ts-ignore
        const t1 = await DeviceTemplate.findById('hc_sr04');
        console.log(t1 ? JSON.stringify(t1, null, 2) : 'NOT FOUND');

        console.log('\n--- Checking dht22 ---');
        // @ts-ignore
        const t2 = await DeviceTemplate.findById('dht22');
        console.log(t2 ? JSON.stringify(t2, null, 2) : 'NOT FOUND');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

checkTemplates();

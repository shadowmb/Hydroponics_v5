
import mongoose, { Schema } from 'mongoose';
// Hardcoded for simplicity in this script
const MONGO_URI = 'mongodb://127.0.0.1:27017/hydroponics_v5';

const DeviceTemplateSchema = new Schema({
    _id: String,
    supportedStrategies: [String]
}, { strict: false });

const DeviceTemplate = mongoose.model('DeviceTemplate', DeviceTemplateSchema);

async function checkTemplates() {
    try {
        console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
        await mongoose.connect(MONGO_URI);
        console.log('Connected.');

        const targets = ['hc_sr04', 'pump_generic'];

        for (const id of targets) {
            const doc = await DeviceTemplate.findById(id);
            console.log(`\n--- Template: ${id} ---`);
            if (!doc) {
                console.log('NOT FOUND in DB');
            } else {
                console.log('supportedStrategies:', doc.supportedStrategies);
            }
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

checkTemplates();

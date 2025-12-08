
const mongoose = require('mongoose');
// Mocking config since we are outside backend structure or need simple connection
// Assuming default local mongo if not strictly defined, but let's try to load config if possible.
// Actually, safer to just use the hardcoded URI for the user's environment if known, or try to load module.
// Let's assume standard localhost/hydroponics_v5.
const MONGO_URI = 'mongodb://127.0.0.1:27017/hydroponics_v5';

const DeviceTemplateSchema = new mongoose.Schema({
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

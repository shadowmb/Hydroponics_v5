const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Mock a simple template schema to read the ports
const PortSchema = new mongoose.Schema({
    id: String,
    label: String,
    type: String,
    pin: Number
}, { _id: false });

const ControllerTemplateSchema = new mongoose.Schema({
    _id: String,
    key: String,
    label: String,
    ports: [PortSchema]
}, { collection: 'controllertemplates' });

const ControllerTemplate = mongoose.model('ControllerTemplate', ControllerTemplateSchema);

async function debug() {
    // Try to find MONGO_URI from .env manually
    const dotEnvPath = path.join(__dirname, '.env');
    let mongoUri = 'mongodb://localhost:27017/hydroponics'; // Default

    if (fs.existsSync(dotEnvPath)) {
        const content = fs.readFileSync(dotEnvPath, 'utf-8');
        const match = content.match(/MONGO_URI=(.*)/);
        if (match) mongoUri = match[1].trim();
    }

    console.log(`Connecting to: ${mongoUri}`);

    try {
        await mongoose.connect(mongoUri);
        const template = await ControllerTemplate.findById('lilygo_t_relay_4');

        if (!template) {
            console.log('❌ Template lilygo_t_relay_4 not found in DB');
        } else {
            console.log(`✅ Template: ${template.label}`);
            console.log(`📡 Ports Count: ${template.ports.length}`);
            template.ports.forEach((p) => {
                console.log(`   - [${p.id}] ${p.label} (GPIO ${p.pin})`);
            });
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('🔥 Debug Error:', err);
        process.exit(1);
    }
}

debug();


const mongoose = require('mongoose');
require('dotenv').config();

async function checkTemplates() {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hydroponics';
        console.log(`Connecting to MongoDB at ${uri}...`);
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const deviceTemplates = await mongoose.connection.db.collection('devicetemplates').countDocuments();
        console.log(`Device Templates count: ${deviceTemplates}`);

        const controllerTemplates = await mongoose.connection.db.collection('controllertemplates').countDocuments();
        console.log(`Controller Templates count: ${controllerTemplates}`);

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkTemplates();

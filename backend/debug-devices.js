// Native fetch is available in Node 18+
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function debugDevices() {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hydroponics';
        console.log(`Connecting to MongoDB at: ${uri}`);

        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const Device = mongoose.connection.collection('devices');

        // 1. List ACTIVE devices (raw)
        const activeDevices = await Device.find({ deletedAt: null }).toArray();
        console.log('\n--- ACTIVE DEVICES IN DB ---');
        activeDevices.forEach(d => {
            console.log(`ID: ${d._id}, Name: "${d.name}", Type: ${d.type}`);
            console.log(`   Hardware:`, JSON.stringify(d.hardware));
        });

        console.log(`\nActive Devices Count: ${activeDevices.length}`);

        if (activeDevices.length > 0) {
            console.log('\n--- ATTEMPTING TO DELETE FIRST ACTIVE DEVICE VIA API ---');
            const targetId = activeDevices[0]._id.toString();
            console.log(`Target ID: ${targetId}`);

            const response = await fetch(`http://localhost:3000/api/hardware/devices/${targetId}`, {
                method: 'DELETE'
            });

            const result = await response.json();
            console.log('API Response:', JSON.stringify(result, null, 2));
        } else {
            console.log('\nNo active devices to test deletion on.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

debugDevices();

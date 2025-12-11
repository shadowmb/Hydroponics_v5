
const mongoose = require('mongoose');
const path = require('path');

// Mock specific parts to avoid full backend boot
const { DeviceTemplateManager } = require('./src/modules/hardware/DeviceTemplateManager');
const { DeviceModel } = require('./src/models/Device');

async function debug() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect('mongodb://127.0.0.1:27017/hydroponics_v5');
        console.log('✅ Connected.');

        // 1. Identify the Device
        console.log('\n🔍 Searching for HC-SR04 device...');
        const devices = await DeviceModel.find({});
        // Lenient search for both string and ObjectId, using 'any' to bypass TS errors
        const device = devices.find((d: any) =>
            (d.config?.driverId && String(d.config.driverId) === 'hc_sr04') ||
            d.name.includes('HC-SR04')
        );

        if (!device) {
            console.error('❌ Device with driverId "hc_sr04" NOT FOUND in DB');
            console.log('   Available devices:', devices.map((d: any) => `${d.name} (${d.config?.driverId}) type: ${typeof d.config?.driverId}`));
            return;
        }

        console.log(`✅ Found Device: ${device.name} (_id: ${device._id})`);
        console.log('   Device Config:', JSON.stringify(device.config, null, 2));
        // @ts-ignore
        console.log('   Type of driverId:', typeof device.config.driverId);

        // 2. Inspect Template Manager
        console.log('\n📂 Loading Templates...');
        const manager = DeviceTemplateManager.getInstance();
        // Point to correct config path relative to script execution (assuming running from backend root)
        manager['templatesDir'] = path.join(process.cwd(), 'config', 'devices');
        await manager.loadTemplates();

        console.log(`   Templates loaded: ${manager['templates'].size}`);
        console.log('   Template Keys:', Array.from(manager['templates'].keys()));

        // @ts-ignore
        const driverIdStr = String(device.config.driverId);
        console.log(`\n🔍 Looking up driver with ID: "${driverIdStr}"`);

        const template = manager.getTemplate(driverIdStr);
        if (!template) {
            console.error('❌ Template NOT FOUND in manager');
            // List close matches
            const keys = Array.from(manager['templates'].keys());
            // @ts-ignore
            const similar = keys.filter((k: any) => String(k).includes('hc') || String(k).includes('sr04'));
            console.log('   Did you mean:', similar);
        } else {
            console.log('✅ Template FOUND');
            console.log('   uiConfig:', JSON.stringify(template.uiConfig, null, 2));
            console.log('   Units in uiConfig:', template.uiConfig?.units);
        }

    } catch (err) {
        console.error('💥 Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

debug();

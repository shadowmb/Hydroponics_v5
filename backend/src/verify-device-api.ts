// import { fetch } from 'undici';

const API_URL = 'http://127.0.0.1:3000/api/hardware';

async function run() {
    try {
        console.log('--- Verifying Device API ---');

        // 1. Get Templates
        console.log('\n1. Fetching Device Templates...');
        const tplRes = await fetch(`${API_URL}/device-templates`);
        const tplData = await tplRes.json() as any;
        if (!tplData.success) throw new Error(tplData.error);
        console.log(`✅ Found ${tplData.data.length} templates.`);

        const phTemplate = tplData.data.find((t: any) => t.physicalType === 'ph');
        if (!phTemplate) throw new Error('pH Template not found');
        console.log(`   Using Template: ${phTemplate.name} (${phTemplate._id})`);

        // 2. Get Controller (we need one to attach device)
        console.log('\n2. Fetching Controllers...');
        const ctrlRes = await fetch(`${API_URL}/controllers`);
        const ctrlData = await ctrlRes.json() as any;
        if (!ctrlData.success) throw new Error(ctrlData.error);
        const controller = ctrlData.data[0];
        if (!controller) {
            console.warn('⚠️ No controllers found. Skipping creation test.');
            return;
        }
        console.log(`   Using Controller: ${controller.name} (${controller._id})`);

        // 3. Create Device
        console.log('\n3. Creating Device...');
        const newDevice = {
            name: `Test pH Sensor ${Date.now()}`,
            type: 'SENSOR',
            config: {
                driverId: phTemplate._id,
                pollInterval: 5000
            },
            hardware: {
                parentId: controller._id,
                port: 'A0', // Assuming A0 is available
                pin: 0
            },
            metadata: {
                description: 'Automated Test Device'
            }
        };

        const createRes = await fetch(`${API_URL}/devices`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newDevice)
        });
        const createData = await createRes.json() as any;
        if (!createData.success) {
            console.error('Create Failed:', createData);
            // If port occupied, try A1
            if (createData.error.includes('occupied')) {
                console.log('   Port A0 occupied, trying A1...');
                newDevice.hardware.port = 'A1';
                const retryRes = await fetch(`${API_URL}/devices`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newDevice)
                });
                const retryData = await retryRes.json() as any;
                if (!retryData.success) throw new Error(retryData.error);
                console.log(`✅ Device Created: ${retryData.data.name} (${retryData.data._id})`);
            } else {
                throw new Error(createData.error);
            }
        } else {
            console.log(`✅ Device Created: ${createData.data.name} (${createData.data._id})`);
        }

        // 4. Get Devices
        console.log('\n4. Fetching Devices...');
        const listRes = await fetch(`${API_URL}/devices`);
        const listData = await listRes.json() as any;
        if (!listData.success) throw new Error(listData.error);
        console.log(`✅ Found ${listData.data.length} devices.`);

        // 5. Test Device
        // We need the ID of the created device
        // If we retried, we don't have the ID easily unless we refactor. 
        // Let's just pick the last one.
        const createdDevice = listData.data.find((d: any) => d.name.startsWith('Test pH Sensor'));
        if (createdDevice) {
            console.log(`\n5. Testing Device: ${createdDevice.name}...`);
            const testRes = await fetch(`${API_URL}/devices/${createdDevice._id}/test`, {
                method: 'POST'
            });
            const testData = await testRes.json() as any;
            if (!testData.success) throw new Error(testData.error);
            console.log(`✅ Test Result: Raw=${testData.data.raw}, Value=${testData.data.value} ${testData.data.unit}`);

            // 6. Delete Device
            console.log(`\n6. Deleting Device: ${createdDevice._id}...`);
            const delRes = await fetch(`${API_URL}/devices/${createdDevice._id}`, {
                method: 'DELETE'
            });
            const delData = await delRes.json() as any;
            if (!delData.success) throw new Error(delData.error);
            console.log('✅ Device Deleted.');
        }

        console.log('\n🎉 Verification Complete!');

    } catch (error) {
        console.error('❌ Verification Failed:', error);
        process.exit(1);
    }
}

run();

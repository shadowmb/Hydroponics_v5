
// const fetch = require('node-fetch'); // Native fetch in Node 18+

const API_URL = 'http://127.0.0.1:3000/api';

async function verifySafeDelete() {
    try {
        const timestamp = Date.now();
        console.log('1. Creating a temporary controller...');
        const controllerRes = await fetch(`${API_URL}/hardware/controllers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: `SafeDeleteTest Controller ${timestamp}`,
                type: 'Arduino_Mega',
                connection: { type: 'serial', serialPort: 'COM99' }
            })
        });
        const controllerBody = await controllerRes.json();
        if (!controllerBody.success || !controllerBody.data?._id) {
            console.error('Failed to create controller:', controllerBody);
            throw new Error('Failed to create controller');
        }
        const controllerId = controllerBody.data._id;
        console.log('   Controller created:', controllerId);

        console.log('2. Creating a device attached to this controller...');
        const deviceRes = await fetch(`${API_URL}/hardware/devices`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: `SafeDeleteTest Device ${timestamp}`,
                type: 'SENSOR',
                hardware: {
                    parentId: controllerId,
                    port: 'A0'
                },
                config: {
                    driverId: 'dfrobot_ph_pro'
                }
            })
        });
        const deviceBody = await deviceRes.json();
        if (!deviceBody.success || !deviceBody.data?._id) {
            console.error('Failed to create device:', deviceBody);
            throw new Error('Failed to create device');
        }
        const deviceId = deviceBody.data._id;
        console.log('   Device created:', deviceId);

        console.log('3. Deleting the controller...');
        const deleteRes = await fetch(`${API_URL}/hardware/controllers/${controllerId}`, {
            method: 'DELETE'
        });
        if (!deleteRes.ok) {
            const deleteBody = await deleteRes.json();
            console.error('Failed to delete controller:', deleteBody);
            throw new Error('Failed to delete controller');
        }
        console.log('   Controller deleted.');

        console.log('4. Verifying device status...');
        const checkDeviceRes = await fetch(`${API_URL}/hardware/devices`);
        const devicesBody = await checkDeviceRes.json();
        const devices = devicesBody.data;
        const updatedDevice = devices.find(d => d._id === deviceId);

        if (!updatedDevice) {
            console.error('FAILED: Device was deleted!');
        } else if (updatedDevice.hardware.parentId === null && updatedDevice.hardware.port === null) {
            console.log('SUCCESS: Device was detached (parentId is null).');
        } else {
            console.error('FAILED: Device was NOT detached correctly.', updatedDevice.hardware);
        }

        // Cleanup
        if (updatedDevice) {
            console.log('5. Cleaning up test device...');
            await fetch(`${API_URL}/hardware/devices/${deviceId}`, { method: 'DELETE' });
        }

    } catch (error) {
        console.error('Error during verification:', error);
    }
}

verifySafeDelete();

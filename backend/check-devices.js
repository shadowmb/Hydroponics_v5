// Native fetch is available in Node 18+

async function checkDevices() {
    try {
        const response = await fetch('http://localhost:3000/api/hardware/devices');
        const devices = await response.json();
        console.log('Devices:', JSON.stringify(devices, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

checkDevices();

// const fetch = require('node-fetch');

async function run() {
    try {
        const payload = {
            name: "API Test Device",
            type: "SENSOR",
            config: {
                driverId: "dfrobot_ph_pro"
            },
            hardware: {
                parentId: "69235e936655fa9cdd86dc62",
                port: "GPIO35"
            },
            isEnabled: true
        };

        const response = await fetch('http://localhost:3000/api/hardware/devices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const json = await response.json();
        console.log('Response:', JSON.stringify(json, null, 2));
    } catch (error) {
        console.error(error);
    }
}

run();

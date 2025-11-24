// const fetch = require('node-fetch');

async function run() {
    try {
        const payload = {
            name: "Test Controller",
            type: "ESP32",
            connection: {
                type: "serial",
                serialPort: "COM3",
                baudRate: 115200
            }
        };

        const response = await fetch('http://localhost:3000/api/hardware/controllers', {
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

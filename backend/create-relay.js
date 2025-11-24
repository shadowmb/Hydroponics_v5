// Native fetch is available in Node 18+

async function createRelay() {
    try {
        // 1. Get a controller ID first
        const controllersResponse = await fetch('http://localhost:3000/api/hardware/controllers');
        const controllers = await controllersResponse.json();

        console.log('Controllers response:', JSON.stringify(controllers, null, 2));

        const controllersData = controllers.data;

        if (!controllersData || controllersData.length === 0) {
            console.error('No controllers found. Please create a controller first.');
            return;
        }

        const controllerId = controllersData[0]._id;
        console.log(`Using Controller ID: ${controllerId}`);

        // 2. Create a 1-channel relay
        const payload = {
            name: "Test 1-Channel Relay",
            type: "1-channel",
            controllerId: controllerId,
            channels: [
                { channelIndex: 1, controllerPortId: "GPIO26" } // Assuming GPIO26 is available
            ]
        };

        console.log('Sending payload:', JSON.stringify(payload, null, 2));

        const response = await fetch('http://localhost:3000/api/hardware/relays', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));

    } catch (error) {
        console.error('Error:', error);
    }
}

createRelay();

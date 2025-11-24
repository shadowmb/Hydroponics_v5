// Native fetch is available in Node 18+

async function deleteRelay() {
    try {
        const relayId = "69239495d97cc8f6212dd0a9"; // ID from previous step
        console.log(`Attempting to delete Relay ID: ${relayId}`);

        const response = await fetch(`http://localhost:3000/api/hardware/relays/${relayId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));

    } catch (error) {
        console.error('Error:', error);
    }
}

deleteRelay();

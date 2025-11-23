async function verifyRelayApi() {
    const baseUrl = 'http://127.0.0.1:3000/api/hardware';

    console.log('Checking GET /relays...');
    try {
        const res = await fetch(`${baseUrl}/relays`);
        console.log(`Status: ${res.status}`);
        if (res.ok) {
            const data = await res.json();
            console.log('Data:', JSON.stringify(data, null, 2));
        } else {
            const text = await res.text();
            console.log('Error Body:', text);
        }
    } catch (err) {
        console.error('Error fetching relays:', err);
    }
}

verifyRelayApi();

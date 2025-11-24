// Native fetch is available in Node 18+

async function checkRelays() {
    try {
        const response = await fetch('http://localhost:3000/api/hardware/relays');
        const relays = await response.json();
        console.log('Relays:', JSON.stringify(relays, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

checkRelays();

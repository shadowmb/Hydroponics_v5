
async function startAndCheck() {
    try {
        console.log('Starting scheduler...');
        const startRes = await fetch('http://localhost:3000/api/automation/scheduler/start', { method: 'POST' });
        const startData = await startRes.json();
        console.log('Start Result:', startData);

        console.log('Checking status...');
        const statusRes = await fetch('http://localhost:3000/api/system/status');
        const statusData = await statusRes.json();
        console.log('System Status:', JSON.stringify(statusData, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
    }
}

startAndCheck();

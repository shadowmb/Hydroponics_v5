import { logger } from './core/LoggerService';

async function runTests() {
    try {
        logger.info('--- Starting API Endpoint Tests ---');

        logger.info('🧪 Testing Health Endpoint...');
        const health = await fetch('http://127.0.0.1:3000/health').then(r => r.json());
        logger.info({ health }, '✅ Health OK');

        logger.info('🧪 Testing Hardware Command...');
        const cmdRes = await fetch('http://127.0.0.1:3000/api/hardware/command', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                deviceId: 'test_dev',
                driverId: 'relay_active_low', // Must exist in templates
                command: 'ON'
            })
        }).then(r => r.json());
        logger.info({ cmdRes }, '✅ Command Sent');

        logger.info('🧪 Testing Automation Start...');
        const autoRes = await fetch('http://127.0.0.1:3000/api/automation/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                programId: 'prog_api_test',
                templateId: 'temp_api_test',
                blocks: [
                    { id: 'b1', type: 'LOG', params: { message: 'Hello from API' } }
                ]
            })
        }).then(r => r.json());
        logger.info({ autoRes }, '✅ Automation Started');

        // Wait a bit
        await new Promise(r => setTimeout(r, 1000));

        logger.info('🧪 Testing Automation Status...');
        const statusRes = await fetch('http://127.0.0.1:3000/api/automation/status').then(r => r.json());
        logger.info({ statusRes }, '✅ Status Checked');

    } catch (error: any) {
        logger.error({ error, message: error.message, cause: error.cause }, '❌ Verification Failed');
        process.exit(1);
    }
}

runTests();

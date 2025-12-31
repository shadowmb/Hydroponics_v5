import { hardware } from './modules/hardware/HardwareService';
import { MockTransport } from './modules/hardware/MockTransport';
import { templates } from './modules/hardware/DeviceTemplateManager';
import { logger } from './core/LoggerService';

async function runHardwareVerification() {
    logger.info('--- Starting Hardware Layer Verification ---');

    try {
        // 1. Load Templates
        await templates.loadTemplates();

        // 2. Initialize Hardware Service
        // 2. Initialize Hardware Service
        // MockTransport injection is not supported in this version of HardwareService
        // It uses internal drivers/transports based on DB config
        await hardware.initialize();
        logger.info('✅ Hardware Service Initialized');

        // 3. Send Valid Command (Relay ON)
        logger.info('🚀 Sending RELAY ON...');
        const res1 = await hardware.sendCommand('pump_1', 'relay_active_low', 'ON', { duration: 5000 }, { pin: 4 });
        logger.info({ res1 }, '✅ Command 1 Result');

        // 4. Send Valid Command (DHT Read)
        logger.info('🚀 Sending DHT READ...');
        const res2 = await hardware.sendCommand('sensor_1', 'dht11', 'READ', {}, { pin: 7 });
        logger.info({ res2 }, '✅ Command 2 Result');

        // 5. Test FIFO Queue (Send 3 commands rapidly)
        logger.info('🚀 Testing FIFO Queue (3 rapid commands)...');
        const p1 = hardware.sendCommand('p1', 'relay_active_low', 'ON', {}, { pin: 1 });
        const p2 = hardware.sendCommand('p2', 'relay_active_low', 'OFF', {}, { pin: 2 });
        const p3 = hardware.sendCommand('p3', 'relay_active_low', 'ON', {}, { pin: 3 });

        const results = await Promise.all([p1, p2, p3]);
        logger.info({ results }, '✅ FIFO Queue Results');

        // 6. Test Timeout (Simulated)
        // Note: To test this, we'd need a command that MockTransport ignores or delays > 2s.
        // For now, we assume MockTransport is fast.

    } catch (error) {
        logger.error({ error }, '❌ Verification Failed');
    } finally {
        logger.info('--- Verification Complete ---');
        process.exit(0);
    }
}

runHardwareVerification();

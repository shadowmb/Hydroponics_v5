import { events } from './core/EventBusService';
import { logger } from './core/LoggerService';

async function runBusVerification() {
    logger.info('--- Starting Event Bus Verification ---');

    // 1. Subscribe
    events.on('device:connected', (payload) => {
        logger.info({ payload }, '✅ Received device:connected');
    });

    events.on('automation:state_change', (payload) => {
        logger.info({ payload }, '✅ Received automation:state_change');
    });

    // 2. Emit
    logger.info('📢 Emitting events...');
    events.emit('device:connected', { deviceId: 'test-device' });

    // Mock context for state change
    events.emit('automation:state_change', {
        state: 'running',
        currentBlock: 'b1',
        context: {
            programId: 'test-prog',
            actionTemplateId: 'test-temp',
            variables: {},
            devices: {},
            stepCount: 0,
            startTime: Date.now(),
            errors: []
        }
    });
}

runBusVerification();

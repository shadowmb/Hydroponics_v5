import { io } from 'socket.io-client';
import { logger } from './core/LoggerService';

async function runSocketVerification() {
    logger.info('--- Starting Socket Verification ---');

    const socket = io('http://127.0.0.1:3000');

    socket.on('connect', () => {
        logger.info({ socketId: socket.id }, '✅ Connected to WebSocket');

        // Trigger an event via API to see if we receive it
        triggerEvent();
    });

    socket.on('automation:block_start', (data) => {
        logger.info({ data }, '✅ Received automation:block_start event via Socket');
        socket.disconnect();
        process.exit(0);
    });

    socket.on('connect_error', (err) => {
        logger.error({ err }, '❌ Connection Error');
        process.exit(1);
    });

    async function triggerEvent() {
        // We can trigger an event by sending a command or just waiting if the server emits something on startup.
        // But better to trigger it.
        // We'll use the API to trigger a command, which might not emit 'device:connected', 
        // but let's use a special fetch to a test endpoint or just assume the server emits something?
        // Actually, let's just emit an event internally in the server if we could.
        // Or we can rely on `verify-api.ts` logic: start a program, it emits `automation:block_start`.

        // Let's listen for `automation:state_change` instead?
        // Or just trigger a hardware command which might not emit much.

        // Let's use the API to start a program.
        try {
            const res = await fetch('http://127.0.0.1:3000/api/automation/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    programId: 'socket-test',
                    templateId: 'socket-temp',
                    blocks: [{ id: 'b1', type: 'LOG', params: { message: 'Socket Test' } }]
                })
            });
            const json = await res.json();
            logger.info({ status: res.status, body: json }, 'Triggered Automation Start');
        } catch (e) {
            logger.error({ error: e }, 'Failed to trigger automation');
        }
    }

    // Timeout
    setTimeout(() => {
        logger.error('❌ Timeout waiting for event');
        process.exit(1);
    }, 5000);
}

runSocketVerification();

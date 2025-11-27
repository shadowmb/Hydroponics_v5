console.log('Starting index.ts... [Reload Triggered]');
import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import { config } from './core/ConfigService';
import { logger } from './core/LoggerService';
import { db } from './core/DatabaseService';
import { apiRoutes } from './api/routes';
import { automation } from './modules/automation/AutomationEngine';
import { LogBlockExecutor, WaitBlockExecutor, ActuatorSetBlockExecutor } from './modules/automation/blocks';
import { socketService } from './core/SocketService';
import { seedControllerTemplates } from './utils/seedTemplates';
import { seedDeviceTemplates } from './utils/seedDeviceTemplates';
import { hardware } from './modules/hardware/HardwareService';
import { historyService } from './services/HistoryService';

const app = Fastify({
    logger: false // We use our own Pino instance
});

// 1. Global Error Handler
app.setErrorHandler((error, request, reply) => {
    logger.error({ err: error, reqId: request.id }, '🔥 API Error');

    const statusCode = error.statusCode || 500;
    const response = {
        error: {
            code: error.code || 'INTERNAL_ERROR',
            message: error.message || 'Internal Server Error',
            details: (error as any).details || undefined
        }
    };

    reply.status(statusCode).send(response);
});

async function bootstrap() {
    console.log('Bootstrap starting...');
    try {
        // 2. Middleware
        console.log('Registering CORS...');
        await app.register(cors, {
            origin: '*', // Allow all for dev
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
        });

        // 3. Connect to Database
        console.log('Connecting DB...');
        await db.connect();

        // 3.1 Seed Templates
        await seedControllerTemplates();
        await seedDeviceTemplates();

        // 4. Register Routes
        console.log('Registering Routes...');
        app.register(apiRoutes);

        automation.registerExecutor(new WaitBlockExecutor());
        automation.registerExecutor(new ActuatorSetBlockExecutor());

        app.get('/health', async () => ({ status: 'ok', uptime: process.uptime() }));

        // 5. Initialize Hardware Service
        console.log('Initializing Hardware Service...');
        await hardware.initialize();

        // 5.1 Initialize History Service
        console.log('Initializing History Service...');
        historyService.initialize();

        // 6. Start Server
        console.log('Starting Server...');
        await app.ready(); // Ensure server is ready
        socketService.initialize(app.server);

        await app.listen({ port: config.PORT, host: '0.0.0.0' });
        console.log(`🚀 Server running on port ${config.PORT}`);
        logger.info(`🚀 Server running on port ${config.PORT}`);

    } catch (error) {
        console.error('❌ Bootstrap Error:', error);
        logger.error({ err: error }, '❌ Bootstrap Error');
        process.exit(1);
    }
}

// Graceful Shutdown
const signals = ['SIGINT', 'SIGTERM'];
signals.forEach((signal) => {
    process.on(signal, async () => {
        logger.info(`🛑 Received ${signal}, shutting down...`);
        await app.close();
        await db.disconnect();
        process.exit(0);
    });
});

bootstrap();

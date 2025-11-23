import pino from 'pino';
import { config } from './ConfigService';

export const logger = pino({
    level: config.LOG_LEVEL,
    transport: config.NODE_ENV === 'development' ? {
        targets: [
            {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'SYS:standard',
                }
            },
            {
                target: 'pino/file',
                options: { destination: './backend.log' }
            }
        ]
    } : undefined,
    base: {
        env: config.NODE_ENV,
    },
});

import mongoose from 'mongoose';
import { config } from './ConfigService';
import { logger } from './LoggerService';

export class DatabaseService {
    private static instance: DatabaseService;

    private constructor() { }

    public static getInstance(): DatabaseService {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }

    public async connect(): Promise<void> {
        try {
            await mongoose.connect(config.MONGO_URI, {
                serverSelectionTimeoutMS: 5000,
                maxPoolSize: 10,
                socketTimeoutMS: 45000,
            });
            logger.info('✅ MongoDB Connected');
        } catch (error) {
            logger.error('❌ MongoDB Connection Error:', error);
            process.exit(1); // Fail fast if DB is missing
        }

        mongoose.connection.on('disconnected', () => {
            logger.warn('⚠️ MongoDB Disconnected');
        });

        // Graceful shutdown hook is handled in index.ts via disconnect()
    }

    public async disconnect(): Promise<void> {
        await mongoose.disconnect();
        logger.info('🛑 MongoDB Disconnected Gracefully');
    }
}

export const db = DatabaseService.getInstance();

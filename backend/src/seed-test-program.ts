import mongoose from 'mongoose';
import { flowRepository } from './modules/persistence/repositories/FlowRepository';
import { logger } from './core/LoggerService';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hydroponics_v5';

async function main() {
    try {
        await mongoose.connect(MONGO_URI);
        logger.info('Connected to MongoDB');

        // Cleanup
        await mongoose.connection.collection('flows').deleteMany({ id: 'api_test_flow' });

        // Create Flow
        await flowRepository.create({
            id: 'api_test_flow',
            name: 'API Test Flow',
            nodes: [
                { id: 'step1', type: 'LOG', params: { message: 'Starting API Test' }, next: 'step2' },
                { id: 'step2', type: 'WAIT', params: { duration: 10000 }, next: 'step3' }, // Wait 10s
                { id: 'step3', type: 'LOG', params: { message: 'Finished API Test' } }
            ],
            edges: [],
            isActive: true
        });

        logger.info('✅ API Test Flow Created: api_test_flow');

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
}

main();

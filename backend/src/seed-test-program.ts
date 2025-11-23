import mongoose from 'mongoose';
import { programRepository } from './modules/persistence/repositories/ProgramRepository';
import { logger } from './core/LoggerService';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hydroponics_v5';

async function main() {
    try {
        await mongoose.connect(MONGO_URI);
        logger.info('Connected to MongoDB');

        // Cleanup
        await mongoose.connection.collection('programs').deleteMany({ id: 'api_test_prog' });

        // Create Program
        await programRepository.create({
            id: 'api_test_prog',
            name: 'API Test Program',
            blocks: [
                { id: 'step1', type: 'LOG', params: { message: 'Starting API Test' }, next: 'step2' },
                { id: 'step2', type: 'WAIT', params: { duration: 10000 }, next: 'step3' }, // Wait 10s
                { id: 'step3', type: 'LOG', params: { message: 'Finished API Test' } }
            ],
            triggers: [],
            active: true
        });

        logger.info('✅ API Test Program Created: api_test_prog');

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
}

main();

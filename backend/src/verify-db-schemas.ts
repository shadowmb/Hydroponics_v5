import mongoose from 'mongoose';
import { deviceRepository } from './modules/persistence/repositories/DeviceRepository';
import { actionTemplateRepository } from './modules/persistence/repositories/ActionTemplateRepository';
import { programRepository } from './modules/persistence/repositories/ProgramRepository';
import { sessionRepository } from './modules/persistence/repositories/SessionRepository';
import { logger } from './core/LoggerService';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hydroponics_v5';

async function main() {
    try {
        logger.info('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        logger.info('✅ Connected.');

        // 1. Test Device Repository
        logger.info('🧪 Testing Device Repository...');
        const device = await deviceRepository.create({
            id: 'test_dev_1',
            name: 'Test Device',
            type: 'ACTUATOR',
            driverId: 'relay_active_low',
            pin: 10,
            config: { activeLow: true }
        });
        logger.info({ device }, 'Created Device');

        const fetchedDevice = await deviceRepository.findById('test_dev_1');
        if (!fetchedDevice) throw new Error('Device not found');
        logger.info('✅ Device Fetched');

        // 2. Test Action Template Repository
        logger.info('🧪 Testing Action Template Repository...');
        const template = await actionTemplateRepository.create({
            id: 'tpl_log_1',
            name: 'Log Action',
            type: 'LOG',
            defaultParams: { message: 'Hello' }
        });
        logger.info({ template }, 'Created Template');

        // 3. Test Program Repository
        logger.info('🧪 Testing Program Repository...');
        const program = await programRepository.create({
            id: 'prog_test_1',
            name: 'Test Program',
            blocks: [{ type: 'LOG', params: { message: 'Test' } }],
            triggers: [],
            active: true
        });
        logger.info({ program }, 'Created Program');

        // 4. Test Session Repository
        logger.info('🧪 Testing Session Repository...');
        const session = await sessionRepository.create({
            programId: 'prog_test_1',
            startTime: new Date(),
            status: 'running',
            logs: [],
            context: {}
        });
        logger.info({ session }, 'Created Session');

        // 5. Test Soft Delete
        logger.info('🧪 Testing Soft Delete...');
        await deviceRepository.delete('test_dev_1');
        const deletedDevice = await deviceRepository.findById('test_dev_1');
        if (deletedDevice) throw new Error('Device should be soft deleted (hidden from find)');

        // Verify it still exists in DB but has deletedAt
        const rawDevice = await mongoose.connection.collection('devices').findOne({ id: 'test_dev_1' });
        if (!rawDevice || !rawDevice.deletedAt) throw new Error('Device was not soft deleted correctly');
        logger.info('✅ Soft Delete Verified');

        logger.info('🎉 All Persistence Tests Passed!');

        // Cleanup (Optional, but good for repeated runs)
        await mongoose.connection.collection('devices').deleteMany({ id: 'test_dev_1' });
        await mongoose.connection.collection('actiontemplates').deleteMany({ id: 'tpl_log_1' });
        await mongoose.connection.collection('programs').deleteMany({ id: 'prog_test_1' });
        await mongoose.connection.collection('executionsessions').deleteMany({ programId: 'prog_test_1' });

    } catch (error) {
        logger.error({ error }, '❌ Test Failed');
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

main();

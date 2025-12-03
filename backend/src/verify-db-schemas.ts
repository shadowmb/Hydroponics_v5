import mongoose from 'mongoose';
import { deviceRepository } from './modules/persistence/repositories/DeviceRepository';
import { actionTemplateRepository } from './modules/persistence/repositories/ActionTemplateRepository';
import { flowRepository } from './modules/persistence/repositories/FlowRepository';
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
            config: { activeLow: true } as any
        } as any);
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

        // 3. Test Flow Repository
        logger.info('🧪 Testing Flow Repository...');
        const flow = await flowRepository.create({
            id: 'flow_test_1',
            name: 'Test Flow',
            nodes: [{ type: 'LOG', params: { message: 'Test' } }],
            edges: [],
            isActive: true
        });
        logger.info({ flow }, 'Created Flow');

        // 4. Test Session Repository
        logger.info('🧪 Testing Session Repository...');
        const session = await sessionRepository.create({
            programId: 'flow_test_1',
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
        await mongoose.connection.collection('flows').deleteMany({ id: 'flow_test_1' });
        await mongoose.connection.collection('executionsessions').deleteMany({ programId: 'flow_test_1' });

    } catch (error) {
        logger.error({ error }, '❌ Test Failed');
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

main();

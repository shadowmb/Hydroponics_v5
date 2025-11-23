import { db } from './core/DatabaseService';
import { DeviceModel } from './models/Device';
import { logger } from './core/LoggerService';

async function runVerification() {
    try {
        // 1. Connect
        await db.connect();
        logger.info('--- Starting Verification ---');

        // 2. Create Device
        const device = await DeviceModel.create({
            name: 'Test Pump ' + Date.now(),
            type: 'ACTUATOR',
            config: { driverId: 'relay_active_low' }
        });
        logger.info({ id: device._id }, '✅ Device Created');

        // 3. Soft Delete
        await device.softDelete();
        logger.info('✅ Device Soft Deleted');

        // 4. Verify Query (Should be null)
        const found = await DeviceModel.findById(device._id);
        if (!found) {
            logger.info('✅ Device NOT found in standard query (Correct)');
        } else {
            logger.error('❌ Device FOUND in standard query (FAIL)');
        }

        // 5. Verify withDeleted (Should be found)
        const foundDeleted = await DeviceModel.findOne({ _id: device._id }, null, { withDeleted: true });
        if (foundDeleted) {
            logger.info('✅ Device FOUND with { withDeleted: true } (Correct)');
        } else {
            logger.error('❌ Device NOT found with { withDeleted: true } (FAIL)');
        }

        // 6. Verify Hard Delete Block
        try {
            await DeviceModel.deleteOne({ _id: device._id });
            logger.error('❌ Hard Delete succeeded (FAIL - Should throw)');
        } catch (err: any) {
            if (err.message.includes('HARD_DELETE_FORBIDDEN')) {
                logger.info('✅ Hard Delete blocked (Correct)');
            } else {
                logger.error('❌ Unexpected error on Hard Delete:', err);
            }
        }

    } catch (error) {
        logger.error('❌ Verification Failed:', error);
    } finally {
        await db.disconnect();
    }
}

runVerification();

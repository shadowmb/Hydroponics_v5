
import mongoose from 'mongoose';
import resourceRoleManager from './src/services/ResourceRoleManager';

async function test() {
    try {
        await mongoose.connect('mongodb://localhost:27017/hydroponics_v5');
        console.log('Connected to MongoDB');

        const result = await resourceRoleManager.scanAndSyncRoles();
        console.log('Result:', result);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

test();

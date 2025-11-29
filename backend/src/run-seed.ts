import mongoose from 'mongoose';
// import { seedDeviceTemplates } from './utils/seedDeviceTemplates';
import { seedControllerTemplates } from './utils/seedTemplates';
import dotenv from 'dotenv';

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hydroponics');
        console.log('Connected to DB');

        try {
            if (mongoose.connection.db) {
                await (mongoose.connection.db as any).dropDatabase();
                console.log('Dropped Database');
            }
        } catch (e) {
            console.log('Failed to drop database', e);
        }

        console.log('Seeding Controller Templates...');
        await seedControllerTemplates();

        console.log('Seeding Device Templates...');
        // await seedDeviceTemplates(); // Removed

        const count = await mongoose.connection.collection('devicetemplates').countDocuments();
        console.log('Count in DB:', count);

        const sampleDevice = await mongoose.connection.collection('devicetemplates').findOne();
        console.log('Sample Device Template:', JSON.stringify(sampleDevice, null, 2));

        const sampleController = await mongoose.connection.collection('controllertemplates').findOne();
        console.log('Sample Controller Template:', JSON.stringify(sampleController, null, 2));

        console.log('Done');
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

run();

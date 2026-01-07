
import mongoose from 'mongoose';
import { ProgramDailyLogModel } from './src/modules/persistence/schemas/ProgramDailyLog.schema';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

async function debugLogs() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hydroponics');
        console.log('Connected to MongoDB');

        const latestLog = await ProgramDailyLogModel.findOne().sort({ date: -1 }).lean();

        if (!latestLog) {
            console.log('No logs found.');
            return;
        }

        console.log(`Checking Log: ${latestLog.programId} - ${latestLog.date}`);

        const events = latestLog.events || [];
        const actuatorEvents = events.filter((e: any) =>
            e.metadata?.blockType === 'ACTUATOR_SET' ||
            e.type === 'ACTION_EXECUTED' // Legacy or alternative type?
        );

        console.log(`Found ${actuatorEvents.length} actuator events.`);

        actuatorEvents.slice(0, 5).forEach((e: any) => {
            console.log('--- Event ---');
            console.log('Type:', e.type);
            console.log('Message:', e.message);
            console.log('Metadata:', JSON.stringify(e.metadata, null, 2));
            console.log('ResourceRole:', e.metadata?.logData?.resourceRole || 'MISSING');
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

debugLogs();

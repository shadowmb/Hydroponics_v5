/**
 * Debug Script: Check what data exists in DB
 */

import mongoose from 'mongoose';
import { ProgramDailyLogModel } from './src/modules/persistence/schemas/ProgramDailyLog.schema';
import ResourceRoleModel from './src/models/ResourceRole';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hydroponics';

async function main() {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected!\n');

    // Check ResourceRoles
    console.log('📋 ResourceRoles in DB:');
    const roles = await ResourceRoleModel.find({});
    if (roles.length === 0) {
        console.log('   ⚠️  No ResourceRoles found! Need to sync them first.');
    } else {
        roles.forEach(r => console.log(`   - ${r.key}: ${r.label} (${r.analyticsType})`));
    }

    // Check ProgramDailyLogs
    console.log('\n📅 ProgramDailyLogs in DB:');
    const logs = await ProgramDailyLogModel.find({}).sort({ date: -1 }).limit(5).lean();
    if (logs.length === 0) {
        console.log('   ⚠️  No ProgramDailyLogs found!');
    } else {
        for (const log of logs) {
            const eventCount = (log as any).events?.length || 0;
            console.log(`   - ${log.date} | ${log.programId} | ${eventCount} events`);
        }
    }

    await mongoose.disconnect();
}

main().catch(console.error);

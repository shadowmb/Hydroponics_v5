
import { automation } from './backend/src/modules/automation/AutomationEngine';
import { db } from './backend/src/core/DatabaseService';
import mongoose from 'mongoose';

async function diagnose() {
    await db.connect();

    console.log('--- AUTOMATION ENGINE STATUS ---');
    const snapshot = automation.getSnapshot();
    console.log('State:', snapshot.value);
    console.log('SessionId:', snapshot.sessionId);
    console.log('Current Block:', snapshot.context.currentBlockId);
    console.log('Variables:', JSON.stringify(snapshot.context.execContext?.variables || {}, null, 2));

    console.log('\n--- ACTIVE SESSIONS IN DB ---');
    const ExecutionSession = mongoose.model('ExecutionSession', new mongoose.Schema({ status: String, startTime: Date, deletedAt: Date }));
    const sessions = await ExecutionSession.find({ status: { $in: ['running', 'paused'] }, deletedAt: null });
    console.log('Running Sessions Count:', sessions.length);
    sessions.forEach(s => console.log(`- [${s._id}] Status: ${s.status}, Started: ${s.startTime}`));

    process.exit(0);
}

diagnose();

// Quick script to check if ProgramDailyLog data exists
const mongoose = require('mongoose');

async function checkLogs() {
    await mongoose.connect('mongodb://localhost:27017/hydroponics_v5');

    const result = await mongoose.connection.db.collection('programdailylogs').find({
        programId: 'prog_test_advansed'
    }).sort({ date: -1 }).limit(1).toArray();

    console.log('=== ProgramDailyLog Check ===');
    console.log('Found documents:', result.length);

    if (result.length > 0) {
        console.log('Latest document:');
        console.log('  Date:', result[0].date);
        console.log('  Events count:', result[0].events?.length || 0);
        console.log('  First 3 events:');
        (result[0].events || []).slice(0, 3).forEach((e, i) => {
            console.log(`    ${i + 1}. [${e.type}] ${e.message}`);
        });
    } else {
        console.log('NO DOCUMENTS FOUND!');

        // Check all docs
        const all = await mongoose.connection.db.collection('programdailylogs').find({}).limit(5).toArray();
        console.log('\nAll documents in collection:');
        all.forEach(doc => {
            console.log(`  - programId: ${doc.programId}, date: ${doc.date}, events: ${doc.events?.length}`);
        });
    }

    await mongoose.disconnect();
}

checkLogs().catch(console.error);

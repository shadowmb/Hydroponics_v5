// Quick script to check if ProgramDailyLog data exists and has new metadata
const mongoose = require('mongoose');

// Helper to get local date string YYYY-MM-DD
function getLocalDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function checkLogs() {
    await mongoose.connect('mongodb://localhost:27017/hydroponics_v5');

    // Check for TODAY's log (using local date)
    const todayStr = getLocalDateString();
    console.log(`Checking logs for date: ${todayStr}`);

    const result = await mongoose.connection.db.collection('programdailylogs').find({
        programId: 'prog_test_advansed',
        date: todayStr
    }).sort({ _id: -1 }).limit(1).toArray();

    console.log('=== ProgramDailyLog Check ===');
    console.log('Found documents:', result.length);

    if (result.length > 0) {
        console.log('Latest document date:', result[0].date);
        console.log('Events count:', result[0].events?.length || 0);

        // Find events with metadata
        const enrichedEvents = (result[0].events || []).filter(e => e.metadata?.windowId || e.metadata?.windowName);
        console.log(`Enriched events count (with windowId): ${enrichedEvents.length}`);

        if (enrichedEvents.length > 0) {
            console.log('First 5 enriched events:');
            enrichedEvents.slice(0, 5).forEach((e, i) => {
                console.log(`  ${i + 1}. [${e.type}] ${e.message}`);
                console.log(`     Metadata: window=${e.metadata.windowName}, flow=${e.metadata.flowName}, device=${e.metadata.blockLabel}`);
            });
        } else {
            console.log('⚠️ No events with windowId/windowName found yet. (Maybe program is not running?)');

            // Show last 3 events anyway
            const len = result[0].events?.length || 0;
            console.log('Last 3 events:');
            (result[0].events || []).slice(Math.max(0, len - 3)).forEach((e, i) => {
                console.log(`    [${e.type}] ${e.message}`);
            });
        }
    } else {
        console.log('NO DOCUMENTS FOUND FOR TODAY!');
        console.log('Checking all dates...');
        const all = await mongoose.connection.db.collection('programdailylogs').find({}).limit(5).toArray();
        all.forEach(doc => {
            console.log(`  - programId: ${doc.programId}, date: ${doc.date}, events: ${doc.events?.length}`);
        });
    }

    await mongoose.disconnect();
}

checkLogs().catch(console.error);

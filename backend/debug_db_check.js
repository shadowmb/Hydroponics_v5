const mongoose = require('mongoose');

async function checkDB(dbName) {
    console.log(`\n--- Checking ${dbName} ---`);
    const conn = mongoose.createConnection(`mongodb://127.0.0.1:27017/${dbName}`);
    await conn.asPromise();

    const cycles = await conn.db.collection('cycles').find({}).toArray();
    console.log(`Cycles Count: ${cycles.length}`);
    cycles.forEach(c => console.log(`ID: ${c.id}, Name: ${c.name}`));

    const programs = await conn.db.collection('programs').find({}).toArray();
    console.log(`Programs Count: ${programs.length}`);
    programs.forEach(p => {
        console.log(`Program: ${p.name}`);
        if (p.schedule) {
            p.schedule.forEach((s, i) => console.log(`  Item ${i}: cycleId=${s.cycleId}`));
        }
    });

    await conn.close();
}

async function run() {
    await checkDB('hydroponics-v5');
    await checkDB('hydroponics_v5');
}

run().catch(console.error);

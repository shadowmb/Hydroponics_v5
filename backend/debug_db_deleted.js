const mongoose = require('mongoose');

async function checkDB(dbName) {
    console.log(`\n--- Checking ${dbName} ---`);
    const conn = mongoose.createConnection(`mongodb://127.0.0.1:27017/${dbName}`);
    await conn.asPromise();

    const cycles = await conn.db.collection('cycles').find({}).toArray();
    console.log(`Cycles Count: ${cycles.length}`);
    cycles.forEach(c => console.log(`ID: ${c.id}, Name: ${c.name}, DeletedAt: ${c.deletedAt}`));

    await conn.close();
}

async function run() {
    await checkDB('hydroponics_v5');
}

run().catch(console.error);

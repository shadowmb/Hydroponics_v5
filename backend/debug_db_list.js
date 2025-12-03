const mongoose = require('mongoose');

async function run() {
    await mongoose.connect('mongodb://127.0.0.1:27017/hydroponics');

    const admin = mongoose.connection.db.admin();
    const dbs = await admin.listDatabases();
    console.log('Databases:', dbs.databases.map(d => d.name));

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections in current DB:', collections.map(c => c.name));

    // Try to find ANY document in 'cycles'
    const cycles = await mongoose.connection.db.collection('cycles').find({}).toArray();
    console.log('Raw Cycles Count:', cycles.length);
    if (cycles.length > 0) console.log('First Cycle:', cycles[0]);

    await mongoose.disconnect();
}

run().catch(console.error);

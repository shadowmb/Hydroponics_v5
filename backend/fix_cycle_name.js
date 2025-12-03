const mongoose = require('mongoose');

async function run() {
    const conn = mongoose.createConnection('mongodb://127.0.0.1:27017/hydroponics_v5');
    await conn.asPromise();

    const result = await conn.db.collection('cycles').updateOne(
        { id: 'cycle_1' },
        { $set: { name: 'Цикъл 1' } }
    );

    console.log('Update Result:', result);

    await conn.close();
}

run().catch(console.error);

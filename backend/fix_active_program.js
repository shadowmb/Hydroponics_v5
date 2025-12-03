const mongoose = require('mongoose');

async function run() {
    const conn = mongoose.createConnection('mongodb://127.0.0.1:27017/hydroponics_v5');
    await conn.asPromise();

    // Find active program
    const active = await conn.db.collection('activeprograms').findOne({});
    if (active) {
        let modified = false;
        const newSchedule = active.schedule.map(item => {
            if (item.cycleId === 'cycle_1') {
                item.cycleName = 'Цикъл 1';
                modified = true;
            }
            return item;
        });

        if (modified) {
            await conn.db.collection('activeprograms').updateOne(
                { _id: active._id },
                { $set: { schedule: newSchedule } }
            );
            console.log('Active Program Updated');
        } else {
            console.log('No changes needed in Active Program');
        }
    }

    await conn.close();
}

run().catch(console.error);

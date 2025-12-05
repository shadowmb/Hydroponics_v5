
const mongoose = require('mongoose');
const { config } = require('./backend/src/config'); // Adjust path if needed, assuming running from root
// Or just hardcode connection string if config is hard to load
const MONGO_URI = 'mongodb://127.0.0.1:27017/hydroponics_v5';

const ActiveProgramSchema = new mongoose.Schema({
    programId: String,
    status: String,
    startTime: Date,
    schedule: [{
        cycleId: String,
        time: String,
        status: String,
        overrides: mongoose.Schema.Types.Mixed
    }]
});

const ActiveProgram = mongoose.model('ActiveProgram', ActiveProgramSchema);

async function inspect() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        const active = await ActiveProgram.findOne({ status: 'running' });
        if (!active) {
            console.log('No running active program found.');
            const any = await ActiveProgram.findOne({});
            console.log('Found ANY program:', JSON.stringify(any, null, 2));
        } else {
            console.log('Active Program Schedule:');
            active.schedule.forEach(s => {
                console.log(`Cycle: ${s.cycleId}, Time: '${s.time}', Status: ${s.status}, Length: ${s.time.length}`);
            });
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

inspect();

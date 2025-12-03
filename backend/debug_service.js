const mongoose = require('mongoose');
const { activeProgramService } = require('./src/modules/scheduler/ActiveProgramService');

async function run() {
    const conn = mongoose.connect('mongodb://127.0.0.1:27017/hydroponics_v5');

    console.log('--- Testing getProgramVariables ---');
    try {
        const vars = await activeProgramService.getProgramVariables();
        console.log('Result:', JSON.stringify(vars, null, 2));
    } catch (e) {
        console.error('Error:', e);
    }

    await mongoose.disconnect();
}

run().catch(console.error);

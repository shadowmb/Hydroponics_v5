const mongoose = require('mongoose');

async function run() {
    const conn = mongoose.createConnection('mongodb://127.0.0.1:27017/hydroponics_v5');
    await conn.asPromise();

    console.log('--- Checking Flows for Global Variables ---');
    const flows = await conn.db.collection('flows').find({}).toArray();

    for (const flow of flows) {
        console.log(`Flow: ${flow.name} (${flow.id})`);
        if (flow.variables && flow.variables.length > 0) {
            flow.variables.forEach(v => {
                console.log(`  - Var: ${v.name}, Scope: ${v.scope}, Type: ${v.type}`);
            });
        } else {
            console.log('  No variables defined.');
        }
    }

    console.log('\n--- Checking Cycles ---');
    const cycles = await conn.db.collection('cycles').find({}).toArray();
    for (const cycle of cycles) {
        console.log(`Cycle: ${cycle.name} (${cycle.id})`);
        if (cycle.steps) {
            cycle.steps.forEach((step, i) => {
                console.log(`  Step ${i}: FlowID=${step.flowId}`);
            });
        }
    }

    await conn.close();
}

run().catch(console.error);

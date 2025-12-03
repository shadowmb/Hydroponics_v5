const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define minimal schemas to read data
const CycleSchema = new Schema({ id: String, name: String }, { strict: false });
const ProgramSchema = new Schema({ id: String, name: String, schedule: [{ cycleId: String }] }, { strict: false });

const Cycle = mongoose.model('Cycle', CycleSchema);
const Program = mongoose.model('Program', ProgramSchema);

async function run() {
    await mongoose.connect('mongodb://127.0.0.1:27017/hydroponics');

    console.log('--- CYCLES ---');
    const cycles = await Cycle.find({});
    cycles.forEach(c => console.log(`ID: ${c.id}, Name: ${c.name}`));

    console.log('\n--- PROGRAMS ---');
    const programs = await Program.find({});
    programs.forEach(p => {
        console.log(`Program: ${p.name} (${p.id})`);
        p.schedule.forEach((s, i) => console.log(`  Item ${i}: cycleId=${s.cycleId}`));
    });

    await mongoose.disconnect();
}

run().catch(console.error);

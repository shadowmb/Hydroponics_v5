/**
 * Fix flowName in existing ResourceDailySummary records
 */

const mongoose = require('mongoose');
require('dotenv').config();

const flowNameMap = {
    'rezervoar': 'Резервоар',
    'ec_sim': 'EC SIM',
    'ph_sim': 'pH Sim',
    'polivane': 'Поливане SIM'
};

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log('✅ Connected to MongoDB');

    const Model = mongoose.model('r', new mongoose.Schema({}, { strict: false }), 'resourcedailysummaries');

    for (const [flowId, flowName] of Object.entries(flowNameMap)) {
        const result = await Model.updateMany(
            { 'context.flowId': flowId },
            { $set: { 'context.flowName': flowName } }
        );
        console.log(`Updated ${result.modifiedCount} records for flowId: ${flowId} -> flowName: ${flowName}`);
    }

    console.log('\n🎉 Done!');
    process.exit(0);
});

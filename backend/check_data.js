/**
 * Check if data was inserted
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hydroponics_v5';

async function checkData() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB:', MONGO_URI);

        const ResourceDailySummary = mongoose.model('resource_daily_summaries', new mongoose.Schema({}, { strict: false }));

        const count = await ResourceDailySummary.countDocuments();
        console.log(`\n📊 Total records in collection: ${count}`);

        const byDate = await ResourceDailySummary.aggregate([
            { $group: { _id: "$date", count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        console.log('\n📅 Records by date:');
        byDate.forEach(d => console.log(`  ${d._id}: ${d.count} records`));

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkData();

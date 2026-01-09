const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const Model = mongoose.model('r', new mongoose.Schema({}, { strict: false }), 'resourcedailysummaries');
    const count09 = await Model.countDocuments({ date: '2026-01-09' });
    const countTotal = await Model.countDocuments();
    console.log(`Records for 2026-01-09: ${count09}`);
    console.log(`Total records: ${countTotal}`);

    const byDate = await Model.aggregate([
        { $group: { _id: "$date", count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
    ]);
    console.log('\n📅 All dates:');
    byDate.forEach(d => console.log(`  ${d._id}: ${d.count} records`));

    process.exit(0);
});

const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const Model = mongoose.model('r', new mongoose.Schema({}, { strict: false }), 'resource_daily_summaries');
    const count09 = await Model.countDocuments({ date: '2026-01-09' });
    console.log(`Records for 2026-01-09: ${count09}`);
    process.exit(0);
});

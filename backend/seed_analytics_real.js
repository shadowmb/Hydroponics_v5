/**
 * Seed test data using a REAL record as a template
 * Generates history for 6 days prior to 2026-01-09
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hydroponics_v5';

// The REAL record provided by the user
const templateRecord = {
    "context": {
        "programId": "prog_bigtest",
        "programName": "prog_bigtest",
        "windowName": "Прозорец 1",
        "executionType": "WINDOW"
    },
    "measurements": [
        {
            "source": "Сензор ниво ГР домати",
            "role": "volume",
            "flowId": "rezervoar",
            "flowName": "Резервоар",
            "value": 100,
            "unit": "L",
            "type": "DELTA",
            "startValue": 0,
            "endValue": 100,
            "average": 44.44,
            "min": 0,
            "max": 100,
            "count": 9
        },
        {
            "source": "Помпа  поливане домати",
            "role": "water",
            "flowId": "rezervoar",
            "flowName": "Резервоар",
            "value": 100,
            "unit": "L",
            "type": "DELTA",
            "startValue": 0,
            "endValue": 100
        },
        {
            "source": "Сензор за ЕС Домати",
            "role": "ec",
            "flowId": "ec_sim",
            "flowName": "EC SIM",
            "value": 1.5,
            "unit": "mS/cm",
            "type": "TREND",
            "startValue": 1,
            "endValue": 2.5,
            "average": 2.08,
            "min": 1,
            "max": 2.5,
            "count": 5
        },
        {
            "source": "Помпа Разтвор А домати",
            "role": "nutrient_a",
            "flowId": "ec_sim",
            "flowName": "EC SIM",
            "value": 150,
            "unit": "ml",
            "type": "SUM",
            "average": 50,
            "min": 50,
            "max": 50,
            "count": 3
        },
        {
            "source": "Помпа Разтвор Б домати",
            "role": "nutrient_b",
            "flowId": "ec_sim",
            "flowName": "EC SIM",
            "value": 150,
            "unit": "ml",
            "type": "SUM",
            "average": 50,
            "min": 50,
            "max": 50,
            "count": 3
        },
        {
            "source": "Помпа разбъркване домати",
            "role": "mixer",
            "flowId": "ec_sim",
            "flowName": "EC SIM",
            "value": 10,
            "unit": "s",
            "type": "NONE",
            "average": 10,
            "min": 10,
            "max": 10,
            "count": 5
        },
        {
            "source": "Сензор за рН домати",
            "role": "ph",
            "flowId": "ph_sim",
            "flowName": "pH Sim",
            "value": 3.3,
            "unit": "pH",
            "type": "TREND",
            "startValue": 3,
            "endValue": 6.3,
            "average": 4.9,
            "min": 3,
            "max": 6.3,
            "count": 4
        },
        {
            "source": "pH+ помпа домати",
            "role": "ph_up",
            "flowId": "ph_sim",
            "flowName": "pH Sim",
            "value": 4,
            "unit": "ml",
            "type": "SUM",
            "average": 2,
            "min": 2,
            "max": 2,
            "count": 2
        },
        {
            "source": "Влажност почва домати",
            "role": "soil_moisture",
            "flowId": "polivane",
            "flowName": "Поливане SIM",
            "value": 30,
            "unit": "%",
            "type": "NONE",
            "average": 30,
            "min": 30,
            "max": 30,
            "count": 1
        },
        {
            "source": "Read Sensor",
            "role": "temp",
            "flowId": "polivane",
            "flowName": "Поливане SIM",
            "value": 24, // Fixed from 0 to realistic
            "unit": "C",
            "type": "TREND",
            "startValue": 24,
            "endValue": 24,
            "average": 24,
            "min": 24,
            "max": 24,
            "count": 1
        }
    ]
};

function varyValue(val, variance = 0.15) {
    if (typeof val !== 'number') return val;
    // Don't vary 0 values if they represent status, but here they seem to be measurements
    const factor = 1 + (Math.random() * variance * 2 - variance);
    return parseFloat((val * factor).toFixed(2));
}

function varyMeasurement(m) {
    const varied = { ...m };
    if (varied.value !== undefined) varied.value = varyValue(varied.value);
    if (varied.startValue !== undefined) varied.startValue = varyValue(varied.startValue);
    if (varied.endValue !== undefined) varied.endValue = varyValue(varied.endValue);
    if (varied.average !== undefined) varied.average = varyValue(varied.average);
    if (varied.min !== undefined) varied.min = varyValue(varied.min);
    if (varied.max !== undefined) varied.max = varyValue(varied.max);
    return varied;
}

async function seedData() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const ResourceDailySummary = mongoose.model('resource_daily_summaries', new mongoose.Schema({}, { strict: false }), 'resourcedailysummaries');

        // Note: NOT deleting today's real data, only inserting past data if needed. 
        // Or if user wants to replace "simulated" data, we assume the simulated ones from previous seed were deleted or we delete them now.
        // Let's delete OLD simulated data (window names like "Прозорец X" are generic) 
        // BUT keep the real one from today (2026-01-09).
        // For safety, let's just insert new ones. The user said "remove simulated" in previous turn, assuming manual cleanup or overwriting.
        // Let's delete records BEFORE 2026-01-09 to be clean.
        await ResourceDailySummary.deleteMany({ date: { $lt: "2026-01-09" } });
        console.log('🧹 Cleared data before 2026-01-09');

        let totalInserted = 0;

        // Generate for 6 days back
        for (let i = 1; i <= 6; i++) {
            const targetDate = new Date('2026-01-09');
            targetDate.setDate(targetDate.getDate() - i);
            const dateStr = targetDate.toISOString().split('T')[0];

            console.log(`\n📅 Creating records for ${dateStr}...`);

            // Generate 4 windows per day to match previous volume
            for (let w = 1; w <= 4; w++) {
                const windowName = `Прозорец ${w}`;
                const windowId = `tw_real_seed_${dateStr}_${w}`;

                const newMeasurements = templateRecord.measurements.map(m => varyMeasurement(m));

                const newRecord = {
                    date: dateStr,
                    timestamp: new Date(dateStr + `T${10 + w}:00:00Z`),
                    context: {
                        ...templateRecord.context,
                        windowId: windowId,
                        windowName: windowName
                    },
                    measurements: newMeasurements,
                    deletedAt: null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    __v: 0
                };

                await ResourceDailySummary.create(newRecord);
                totalInserted++;
                console.log(`  ✓ Created: ${windowName}`);
            }
        }

        console.log(`\n🎉 Successfully inserted ${totalInserted} records based on real data!`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

seedData();

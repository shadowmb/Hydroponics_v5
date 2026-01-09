/**
 * Seed test data for WINDOW-BASED analytics
 * Creates 1 document per window containing measurements from all flows
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hydroponics_v5';

// Base measurements for a single window execution
const baseMeasurements = [
    // Flow: Rezervoar
    {
        source: "Сензор Ниво",
        role: "volume",
        flowId: "rezervoar",
        flowName: "Резервоар",
        value: 80, unit: "L", type: "DELTA", startValue: 20, endValue: 100, count: 4, average: 47.5, min: 20, max: 100
    },
    {
        source: "Сензор Ниво",
        role: "water",
        flowId: "rezervoar",
        flowName: "Резервоар",
        value: 80, unit: "L", type: "DELTA", startValue: 20, endValue: 100
    },

    // Flow: EC Sim
    {
        source: "EC Сензор",
        role: "ec",
        flowId: "ec_sim",
        flowName: "EC SIM",
        value: 0, unit: "mS/cm", type: "TREND", startValue: 2.7, endValue: 2.7, count: 1, average: 2.7, min: 2.7, max: 2.7
    },

    // Flow: pH Sim
    {
        source: "pH Сензор",
        role: "ph",
        flowId: "ph_sim",
        flowName: "pH SIM",
        value: 4.3, unit: "pH", type: "TREND", startValue: 2, endValue: 6.3, count: 3, average: 4.1, min: 2, max: 6.3
    },
    {
        source: "pH+ Помпа",
        role: "ph_up",
        flowId: "ph_sim",
        flowName: "pH SIM",
        value: 2, unit: "ml", type: "SUM", count: 2, average: 1, min: 1, max: 1
    },
    {
        source: "Миксер",
        role: "mixer",
        flowId: "ph_sim",
        flowName: "pH SIM",
        value: 10, unit: "s", type: "NONE", count: 2, average: 10, min: 10, max: 10
    },

    // Flow: Polivane
    {
        source: "Поливен Водомер",
        role: "volume",
        flowId: "polivane",
        flowName: "Поливане SIM",
        value: 0, unit: "L", type: "DELTA", startValue: 100, endValue: 100, count: 1, average: 100, min: 100, max: 100
    },
    {
        source: "EC Сензор (Изход)",
        role: "ec",
        flowId: "polivane",
        flowName: "Поливане SIM",
        value: 0, unit: "mS/cm", type: "TREND", startValue: 2.7, endValue: 2.7, count: 1, average: 2.7, min: 2.7, max: 2.7
    },
    {
        source: "pH Сензор (Изход)",
        role: "ph",
        flowId: "polivane",
        flowName: "Поливане SIM",
        value: 0, unit: "pH", type: "TREND", startValue: 6.3, endValue: 6.3, count: 1, average: 6.3, min: 6.3, max: 6.3
    },
    {
        source: "Влагомер 1",
        role: "soil_moisture",
        flowId: "polivane",
        flowName: "Поливане SIM",
        value: 30, unit: "%", type: "NONE", count: 1, average: 30, min: 30, max: 30
    },
    {
        source: "Влагомер 1 (Темп)",
        role: "temp",
        flowId: "polivane",
        flowName: "Поливане SIM",
        value: 0, unit: "C", type: "TREND", startValue: 24, endValue: 24, count: 1, average: 24, min: 24, max: 24
    }
];

function varyValue(val, variance = 0.15) {
    if (typeof val !== 'number') return val;
    const factor = 1 + (Math.random() * variance * 2 - variance); // ±15%
    return parseFloat((val * factor).toFixed(2));
}

function varyMeasurement(m) {
    const varied = { ...m };
    if (varied.value !== undefined && varied.type !== 'NONE') varied.value = varyValue(varied.value);
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

        // Note: 'resourcedailysummaries' collection (lowercase)
        const ResourceDailySummary = mongoose.model('resource_daily_summaries', new mongoose.Schema({}, { strict: false }), 'resourcedailysummaries');

        // Clear existing data
        await ResourceDailySummary.deleteMany({});
        console.log('🧹 Cleared existing data');

        let totalInserted = 0;

        // Create records for past 6 days
        for (let i = 0; i <= 6; i++) {
            const targetDate = new Date('2026-01-09');
            targetDate.setDate(targetDate.getDate() - i);
            const dateStr = targetDate.toISOString().split('T')[0];

            console.log(`\n📅 Creating window record for ${dateStr}...`);

            // Generate 4 windows per day
            for (let w = 1; w <= 4; w++) {
                const windowName = `Прозорец ${w}`;
                const windowId = `tw_seed_${dateStr}_${w}`;

                const newMeasurements = baseMeasurements.map(m => varyMeasurement(m));

                const newRecord = {
                    date: dateStr,
                    timestamp: new Date(dateStr + `T${10 + w}:00:00Z`),
                    context: {
                        programId: "prog_bigtest",
                        programName: "Big Test",
                        windowId: windowId,
                        windowName: windowName,
                        cycleId: "cycle_1",
                        cycleName: "Cycle 1",
                        executionType: "WINDOW"
                    },
                    measurements: newMeasurements,
                    deletedAt: null,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                await ResourceDailySummary.create(newRecord);
                totalInserted++;
                console.log(`  ✓ Created: ${windowName} (${newMeasurements.length} measurements)`);
            }
        }

        console.log(`\n🎉 Successfully inserted ${totalInserted} window records!`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

seedData();

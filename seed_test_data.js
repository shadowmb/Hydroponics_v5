/**
 * Seed test data for analytics - duplicates current data for past 6 days
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hydroponics_v5';

// Base records from 2026-01-09
const baseRecords = [
    {
        date: "2026-01-09",
        context: {
            programId: "prog_bigtest",
            programName: "prog_bigtest",
            windowId: "tw_1767861565496_ku2rqdpw9",
            windowName: "Прозорец 1",
            flowId: "rezervoar",
            flowName: "rezervoar",
            executionType: "WINDOW"
        },
        resources: {
            volume: { value: 80, unit: "L", type: "DELTA", startValue: 20, endValue: 100, count: 4, average: 47.5, min: 20, max: 100 },
            water: { value: 80, unit: "L", type: "DELTA", startValue: 20, endValue: 100 }
        }
    },
    {
        date: "2026-01-09",
        context: {
            programId: "prog_bigtest",
            programName: "prog_bigtest",
            windowId: "tw_1767861565496_ku2rqdpw9",
            windowName: "Прозорец 1",
            flowId: "ec_sim",
            flowName: "rezervoar",
            executionType: "WINDOW"
        },
        resources: {
            ec: { value: 0, unit: "mS/cm", type: "TREND", startValue: 2.7, endValue: 2.7, count: 1, average: 2.7, min: 2.7, max: 2.7 }
        }
    },
    {
        date: "2026-01-09",
        context: {
            programId: "prog_bigtest",
            programName: "prog_bigtest",
            windowId: "tw_1767861565496_ku2rqdpw9",
            windowName: "Прозорец 1",
            flowId: "ph_sim",
            flowName: "rezervoar",
            executionType: "WINDOW"
        },
        resources: {
            ph: { value: 4.3, unit: "pH", type: "TREND", startValue: 2, endValue: 6.3, count: 3, average: 4.1, min: 2, max: 6.3 },
            ph_up: { value: 2, unit: "ml", type: "SUM", count: 2, average: 1, min: 1, max: 1 },
            mixer: { value: 10, unit: "s", type: "NONE", count: 2, average: 10, min: 10, max: 10 }
        }
    },
    {
        date: "2026-01-09",
        context: {
            programId: "prog_bigtest",
            programName: "prog_bigtest",
            windowId: "tw_1767861565496_ku2rqdpw9",
            windowName: "Прозорец 1",
            flowId: "polivane",
            flowName: "rezervoar",
            executionType: "WINDOW"
        },
        resources: {
            volume: { value: 0, unit: "L", type: "DELTA", startValue: 100, endValue: 100, count: 1, average: 100, min: 100, max: 100 },
            ec: { value: 0, unit: "mS/cm", type: "TREND", startValue: 2.7, endValue: 2.7, count: 1, average: 2.7, min: 2.7, max: 2.7 },
            ph: { value: 0, unit: "pH", type: "TREND", startValue: 6.3, endValue: 6.3, count: 1, average: 6.3, min: 6.3, max: 6.3 },
            soil_moisture: { value: 30, unit: "%", type: "NONE", count: 1, average: 30, min: 30, max: 30 },
            temp: { value: 0, unit: "C", type: "TREND", startValue: 24, endValue: 24, count: 1, average: 24, min: 24, max: 24 },
            water: { value: 0, unit: "L", type: "DELTA", startValue: 100, endValue: 100 }
        }
    }
];

function varyValue(val, variance = 0.15) {
    if (typeof val !== 'number') return val;
    const factor = 1 + (Math.random() * variance * 2 - variance); // ±15%
    return parseFloat((val * factor).toFixed(2));
}

function varyResource(resource) {
    const varied = { ...resource };

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

        const ResourceDailySummary = mongoose.model('resource_daily_summaries', new mongoose.Schema({}, { strict: false }));

        let totalInserted = 0;

        // Create records for past 6 days
        for (let i = 1; i <= 6; i++) {
            const targetDate = new Date('2026-01-09');
            targetDate.setDate(targetDate.getDate() - i);
            const dateStr = targetDate.toISOString().split('T')[0];

            console.log(`\n📅 Creating records for ${dateStr}...`);

            for (const baseRecord of baseRecords) {
                const newRecord = {
                    date: dateStr,
                    timestamp: new Date(dateStr + 'T12:00:00Z'),
                    context: { ...baseRecord.context },
                    resources: {},
                    deletedAt: null,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                // Vary resource values
                for (const [key, resource] of Object.entries(baseRecord.resources)) {
                    newRecord.resources[key] = varyResource(resource);
                }

                await ResourceDailySummary.create(newRecord);
                totalInserted++;
                console.log(`  ✓ Created: ${newRecord.context.flowId}`);
            }
        }

        console.log(`\n🎉 Successfully inserted ${totalInserted} records!`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

seedData();

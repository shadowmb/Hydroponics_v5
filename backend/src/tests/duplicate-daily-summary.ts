/**
 * Script to duplicate ResourceDailySummary for testing
 * Run with: cd backend && npx ts-node src/tests/duplicate-daily-summary.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hydroponics_v5';

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        if (!db) {
            console.log('Database not connected!');
            process.exit(1);
        }

        const collection = db.collection('resourcedailysummaries');

        // Find the existing record
        const existingRecord: any = await collection.findOne({});

        if (!existingRecord) {
            console.log('No existing record found!');
            process.exit(1);
        }

        console.log('Found existing record for date:', existingRecord.date);
        console.log('Resources:', Object.keys(existingRecord.resources || {}));

        // Create 6 copies for past 6 days
        const copies: any[] = [];

        for (let i = 1; i <= 6; i++) {
            // Calculate past date
            const baseDate = new Date('2026-01-08');
            baseDate.setDate(baseDate.getDate() - i);

            // Format date as string like original: "2026-01-07"
            const dateStr = baseDate.toISOString().split('T')[0];

            // Deep clone the record
            const copy: any = JSON.parse(JSON.stringify(existingRecord));
            copy._id = new mongoose.Types.ObjectId();
            copy.date = dateStr; // Use string format like original

            // Update timestamp to match the date
            const timestamp = new Date(dateStr + 'T12:10:10.042Z');
            copy.timestamp = timestamp.toISOString();

            copy.createdAt = new Date();
            copy.updatedAt = new Date();

            // Slightly vary the values for realism (±10%)
            if (copy.resources) {
                for (const key of Object.keys(copy.resources)) {
                    const res = copy.resources[key];
                    if (res.value !== undefined) {
                        const variation = 0.9 + Math.random() * 0.2;
                        res.value = +(res.value * variation).toFixed(2);
                    }
                    if (res.min !== undefined) res.min = +(res.min * (0.9 + Math.random() * 0.2)).toFixed(2);
                    if (res.max !== undefined) res.max = +(res.max * (0.9 + Math.random() * 0.2)).toFixed(2);
                    if (res.average !== undefined) res.average = +(res.average * (0.9 + Math.random() * 0.2)).toFixed(2);
                }
            }

            copies.push(copy);
            console.log(`Prepared copy for: ${dateStr} (timestamp: ${copy.timestamp})`);
        }

        // Insert all copies
        const result = await collection.insertMany(copies);
        console.log(`\n✅ Inserted ${result.insertedCount} new records!`);
        console.log('Total records now:', await collection.countDocuments());

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

run();

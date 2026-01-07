/**
 * Script to seed test data from temp.md into the ProgramDailyLog collection
 * Run with: npx ts-node src/seed-analytics-test-data.ts
 */

import mongoose from 'mongoose';
import { ProgramDailyLogModel } from './modules/persistence/schemas/ProgramDailyLog.schema';
import * as fs from 'fs';
import * as path from 'path';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hydroponics_v5';

async function seedData() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected!');

        // Read the temp.md file from project root
        const tempPath = path.join(__dirname, '../../temp.md');
        let rawContent = fs.readFileSync(tempPath, 'utf-8');

        // Parse the Extended JSON format
        // Replace MongoDB Extended JSON syntax with standard JSON
        rawContent = rawContent
            .replace(/\{\s*"\$oid"\s*:\s*"([^"]+)"\s*\}/g, '"$1"')
            .replace(/\{\s*"\$date"\s*:\s*"([^"]+)"\s*\}/g, '"$1"');

        const data = JSON.parse(rawContent);

        // Convert string dates back to Date objects
        const convertDates = (obj: any): any => {
            if (typeof obj === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(obj)) {
                return new Date(obj);
            }
            if (Array.isArray(obj)) {
                return obj.map(convertDates);
            }
            if (obj && typeof obj === 'object') {
                const result: any = {};
                for (const key of Object.keys(obj)) {
                    result[key] = convertDates(obj[key]);
                }
                return result;
            }
            return obj;
        };

        const processedData = convertDates(data);

        // Check if document already exists
        const existing = await ProgramDailyLogModel.findOne({
            programId: processedData.programId,
            date: processedData.date
        });

        if (existing) {
            console.log(`Document for ${processedData.programId} on ${processedData.date} already exists.`);
            console.log(`Updating with ${processedData.events.length} events...`);

            existing.events = processedData.events;
            await existing.save();
            console.log('Updated successfully!');
        } else {
            console.log(`Creating new document for ${processedData.programId} on ${processedData.date}...`);
            console.log(`With ${processedData.events.length} events...`);

            const doc = new ProgramDailyLogModel({
                programId: processedData.programId,
                date: processedData.date,
                events: processedData.events,
                deletedAt: null
            });

            await doc.save();
            console.log('Created successfully!');
        }

        console.log('Done!');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

seedData();

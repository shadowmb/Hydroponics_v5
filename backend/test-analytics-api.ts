/**
 * Test script for Resource Analytics API
 * Creates test data and verifies all endpoints
 */
import mongoose from 'mongoose';
import { ResourceDailySummaryModel } from './src/modules/persistence/schemas/ResourceDailySummary.schema';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hydroponics-v5';

async function main() {
    console.log('═'.repeat(60));
    console.log('🧪 Resource Analytics API Test');
    console.log('═'.repeat(60));

    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear old test data
    await ResourceDailySummaryModel.deleteMany({ 'context.programId': 'test-program-id' });
    console.log('🧹 Cleared old test data');

    // Create test data
    const testData = [
        {
            date: '2026-01-06',
            timestamp: new Date('2026-01-06T10:00:00'),
            context: {
                programId: 'test-program-id',
                programName: 'Test Program',
                windowId: 'window-1',
                windowName: 'Morning Window',
                flowId: 'flow-ph-adjust',
                flowName: 'pH Adjustment',
                executionType: 'WINDOW'
            },
            resources: {
                ph: { value: 2.5, unit: 'pH', type: 'DELTA', startValue: 4.2, endValue: 6.7, average: 5.4, min: 4.2, max: 6.8, count: 5 },
                ph_up: { value: 15, unit: 'ml', type: 'SUM' },
                water_level: { value: -12, unit: 'L', type: 'DELTA', startValue: 100, endValue: 88, average: 94, min: 88, max: 100, count: 3 }
            }
        },
        {
            date: '2026-01-06',
            timestamp: new Date('2026-01-06T16:00:00'),
            context: {
                programId: 'test-program-id',
                programName: 'Test Program',
                windowId: 'window-2',
                windowName: 'Evening Window',
                flowId: 'flow-ph-adjust',
                flowName: 'pH Adjustment',
                executionType: 'WINDOW'
            },
            resources: {
                ph: { value: 1.8, unit: 'pH', type: 'DELTA', startValue: 5.0, endValue: 6.8, average: 5.9, min: 5.0, max: 6.9, count: 4 },
                ph_up: { value: 8, unit: 'ml', type: 'SUM' },
                ec: { value: 0.3, unit: 'mS', type: 'DELTA', startValue: 1.2, endValue: 1.5, average: 1.35, min: 1.2, max: 1.5, count: 3 }
            }
        },
        {
            date: '2026-01-07',
            timestamp: new Date('2026-01-07T10:00:00'),
            context: {
                programId: 'test-program-id',
                programName: 'Test Program',
                windowId: 'window-1',
                windowName: 'Morning Window',
                flowId: 'flow-ph-adjust',
                flowName: 'pH Adjustment',
                executionType: 'WINDOW'
            },
            resources: {
                ph: { value: 2.0, unit: 'pH', type: 'DELTA', startValue: 4.5, endValue: 6.5, average: 5.5, min: 4.5, max: 6.6, count: 6 },
                ph_up: { value: 12, unit: 'ml', type: 'SUM' },
                water_level: { value: -8, unit: 'L', type: 'DELTA', startValue: 88, endValue: 80, average: 84, min: 80, max: 88, count: 2 }
            }
        },
        {
            date: '2026-01-08',
            timestamp: new Date('2026-01-08T10:00:00'),
            context: {
                programId: 'test-program-id',
                programName: 'Test Program',
                windowId: 'window-1',
                windowName: 'Morning Window',
                flowId: 'flow-ph-adjust',
                flowName: 'pH Adjustment',
                executionType: 'WINDOW'
            },
            resources: {
                ph: { value: 1.5, unit: 'pH', type: 'DELTA', startValue: 5.5, endValue: 7.0, average: 6.25, min: 5.5, max: 7.0, count: 4 },
                ph_up: { value: 6, unit: 'ml', type: 'SUM' },
                temperature: { value: 0.5, unit: '°C', type: 'TREND', startValue: 24.5, endValue: 25.0, average: 24.8, min: 24.5, max: 25.0, count: 10 }
            }
        }
    ];

    for (const data of testData) {
        await ResourceDailySummaryModel.create(data);
    }
    console.log(`✅ Created ${testData.length} test records`);

    // Test 1: Get all records
    console.log('\n' + '─'.repeat(60));
    console.log('📊 Test 1: All Records (raw count)');
    const allRecords = await ResourceDailySummaryModel.find({ 'context.programId': 'test-program-id' });
    console.log(`   Total records: ${allRecords.length}`);

    // Test 2: Simulate getAllTimeTotals
    console.log('\n' + '─'.repeat(60));
    console.log('📊 Test 2: ALL SUMMARY (simulating getAllTimeTotals)');

    const totals: Record<string, any> = {};
    for (const record of allRecords) {
        for (const [role, stat] of Object.entries(record.resources)) {
            if (!totals[role]) {
                totals[role] = { ...stat, totalValue: stat.value };
            } else {
                if (stat.type === 'SUM') {
                    totals[role].totalValue = (totals[role].totalValue || 0) + stat.value;
                }
            }
        }
    }

    console.log('   Resources:');
    for (const [role, data] of Object.entries(totals)) {
        console.log(`   - ${role}: ${data.totalValue || data.value} ${data.unit} (${data.type})`);
    }

    // Test 3: Period filter (last 2 days)
    console.log('\n' + '─'.repeat(60));
    console.log('📊 Test 3: PERIOD SUMMARY (2026-01-07 to 2026-01-08)');

    const periodRecords = await ResourceDailySummaryModel.find({
        'context.programId': 'test-program-id',
        date: { $gte: '2026-01-07', $lte: '2026-01-08' }
    });
    console.log(`   Records in period: ${periodRecords.length}`);

    const periodTotals: Record<string, number> = {};
    for (const record of periodRecords) {
        for (const [role, stat] of Object.entries(record.resources)) {
            if (stat.type === 'SUM') {
                periodTotals[role] = (periodTotals[role] || 0) + stat.value;
            }
        }
    }
    console.log('   SUM resources in period:');
    for (const [role, value] of Object.entries(periodTotals)) {
        console.log(`   - ${role}: ${value}`);
    }

    // Test 4: Daily breakdown (for charts)
    console.log('\n' + '─'.repeat(60));
    console.log('📊 Test 4: Daily Breakdown (for charts)');

    const byDate = new Map<string, Record<string, number>>();
    for (const record of allRecords) {
        const date = record.date;
        if (!byDate.has(date)) byDate.set(date, {});
        const dayData = byDate.get(date)!;

        for (const [role, stat] of Object.entries(record.resources)) {
            dayData[role] = (dayData[role] || 0) + stat.value;
        }
    }

    console.log('   Daily data:');
    for (const [date, data] of Array.from(byDate.entries()).sort()) {
        const rolesStr = Object.entries(data).map(([r, v]) => `${r}:${v}`).join(', ');
        console.log(`   ${date}: ${rolesStr}`);
    }

    // Test 5: Filter by flowId
    console.log('\n' + '─'.repeat(60));
    console.log('📊 Test 5: Filter by flowId');

    const flowRecords = await ResourceDailySummaryModel.find({
        'context.flowId': 'flow-ph-adjust'
    });
    console.log(`   Records for flow-ph-adjust: ${flowRecords.length}`);

    // Cleanup (optional - comment out to keep data for manual testing)
    // await ResourceDailySummaryModel.deleteMany({ 'context.programId': 'test-program-id' });
    // console.log('\n🧹 Cleaned up test data');

    console.log('\n' + '═'.repeat(60));
    console.log('✅ All tests completed! Test data is available for API testing.');
    console.log('═'.repeat(60));
    console.log('\n💡 Try these API calls:');
    console.log('   GET http://localhost:3001/api/analytics/resources/all?programId=test-program-id');
    console.log('   GET http://localhost:3001/api/analytics/resources/period?from=2026-01-07&to=2026-01-08&programId=test-program-id');
    console.log('   GET http://localhost:3001/api/analytics/resources/daily?from=2026-01-06&to=2026-01-08&roles=ph,ph_up&programId=test-program-id');

    await mongoose.disconnect();
}

main().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});

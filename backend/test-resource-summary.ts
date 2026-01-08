/**
 * Test Script: Resource Daily Summary
 * 
 * This script demonstrates how aggregated resource data would be stored
 * in a new ResourceDailySummary collection for analytics purposes.
 * 
 * Usage: npx ts-node test-resource-summary.ts
 */

import mongoose from 'mongoose';
import { ProgramDailyLogModel } from './src/modules/persistence/schemas/ProgramDailyLog.schema';
import ResourceRoleModel from './src/models/ResourceRole';
import { config } from './src/core/ConfigService';

// MongoDB connection from project config
const MONGO_URI = config.MONGO_URI;

// Types
type AnalyticsType = 'SUM' | 'DELTA' | 'TREND' | 'NONE';

interface ResourceStat {
    value: number;
    unit: string;
    type: AnalyticsType;
    startValue?: number;
    endValue?: number;
}

interface ResourceDailySummary {
    date: string;
    timestamp: Date;
    context: {
        programId: string;
        programName: string;
        windowId: string;
        windowName: string;
        executionType: string;
    };
    resources: Record<string, ResourceStat>;
}

async function main() {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected!\n');

    // 1. Load ResourceRoles configuration
    console.log('📋 Loading ResourceRoles configuration...');
    const roles = await ResourceRoleModel.find({});
    const roleMap = new Map<string, { type: AnalyticsType; unit?: string; measuredBy?: string }>();
    roles.forEach(r => roleMap.set(r.key, {
        type: r.analyticsType as AnalyticsType,
        unit: r.unit,
        measuredBy: r.measuredBy
    }));
    console.log(`   Found ${roles.length} roles: ${roles.map(r => r.key).join(', ')}\n`);

    // 2. Load existing ProgramDailyLog data
    const targetDate = '2026-01-08';
    const targetProgram = 'prog_bigtest'; // Test the complex program
    console.log(`📅 Loading ProgramDailyLog for: ${targetProgram} on ${targetDate}...`);

    const logs = await ProgramDailyLogModel.find({ date: targetDate, programId: targetProgram }).lean();
    if (!logs || logs.length === 0) {
        console.log('❌ No logs found for this date. Try running a program first.');
        await mongoose.disconnect();
        return;
    }

    console.log(`   Found ${logs.length} log(s)\n`);

    // 3. Process each log
    for (const log of logs) {
        console.log('═'.repeat(60));
        console.log(`📊 Processing: ${log.programId}`);
        console.log('═'.repeat(60));

        const events = (log as any).events || [];
        console.log(`   Total events: ${events.length}`);

        // Group events by windowId
        const windowGroups = new Map<string, any[]>();
        for (const event of events) {
            const windowId = event.metadata?.windowId || 'unknown';
            if (!windowGroups.has(windowId)) windowGroups.set(windowId, []);
            windowGroups.get(windowId)!.push(event);
        }

        console.log(`   Windows found: ${windowGroups.size}\n`);

        // Process each window
        for (const [windowId, windowEvents] of windowGroups) {
            if (windowId === 'unknown') continue;

            const windowName = windowEvents[0]?.metadata?.windowName || windowId;
            console.log(`\n🪟 Window: ${windowName}`);
            console.log(`   Events in window: ${windowEvents.length}`);

            // Aggregate resources
            const resources = aggregateResources(windowEvents, roleMap);

            // Build the summary document
            const summary: ResourceDailySummary = {
                date: targetDate,
                timestamp: new Date(),
                context: {
                    programId: log.programId,
                    programName: log.programId, // Would be resolved from Program model
                    windowId: windowId,
                    windowName: windowName,
                    executionType: 'WINDOW'
                },
                resources: resources
            };

            // Display what would be saved
            console.log('\n   📝 Would save to ResourceDailySummary:');
            console.log('   ' + '-'.repeat(50));

            if (Object.keys(summary.resources).length === 0) {
                console.log('   ⚠️  No resources with values found');
            } else {
                for (const [role, stat] of Object.entries(summary.resources)) {
                    const label = roles.find(r => r.key === role)?.label || role;
                    let display = `   ${label} (${role}): ${stat.value.toFixed(2)} ${stat.unit}`;
                    if (stat.startValue !== undefined && stat.endValue !== undefined) {
                        display += ` [${stat.startValue.toFixed(1)} → ${stat.endValue.toFixed(1)}]`;
                    }
                    display += ` (${stat.type})`;
                    console.log(display);
                }
            }

            console.log('\n   📦 Full JSON structure:');
            console.log(JSON.stringify(summary, null, 2).split('\n').map(l => '   ' + l).join('\n'));
        }
    }

    console.log('\n' + '═'.repeat(60));
    console.log('✅ Test complete!');
    console.log('═'.repeat(60));

    await mongoose.disconnect();
}

/**
 * Aggregate resources from events using the same logic as AnalyticsService
 */
function aggregateResources(
    events: any[],
    roleMap: Map<string, { type: AnalyticsType; unit?: string; measuredBy?: string }>
): Record<string, ResourceStat> {
    const stats: Record<string, ResourceStat> = {};
    const sensorReadingsByRole: Record<string, number[]> = {};
    const actuatorMeasuredByRoles: Set<string> = new Set();

    for (const event of events) {
        const meta = event.metadata || {};
        const logData = meta.logData;
        const blockType = meta.blockType;

        if (!logData) continue;

        const role = logData.resourceRole;
        if (!role) continue;

        const roleConfig = roleMap.get(role);
        const rType = roleConfig?.type || 'NONE';
        const rUnit = logData.primaryUnit || roleConfig?.unit || '';

        // SENSOR_READ
        if (blockType === 'SENSOR_READ' && logData.primaryValue !== undefined) {
            // Track all sensor readings by role for measuredBy calculation
            if (!sensorReadingsByRole[role]) sensorReadingsByRole[role] = [];
            sensorReadingsByRole[role].push(logData.primaryValue);

            accumulateStat(stats, role, logData.primaryValue, rType, rUnit);
        }

        // ACTUATOR_SET
        if (blockType === 'ACTUATOR_SET') {
            let amount = 0;
            let unit = logData.unit || logData.primaryUnit || '';

            if (logData.calculatedVolumeMl !== undefined) {
                amount = Number(logData.calculatedVolumeMl);
                unit = 'ml';
            } else if (logData.primaryValue !== undefined) {
                amount = Number(logData.primaryValue);
            } else {
                amount = Number(logData.amount) || 0;
            }

            const measuredBy = roleConfig?.measuredBy;

            // If this role has measuredBy, track for delta calculation
            if (rType === 'NONE' && measuredBy) {
                actuatorMeasuredByRoles.add(role);
            } else if (amount > 0) {
                accumulateStat(stats, role, amount, rType, unit);
            }
        }
    }

    // Finalize measuredBy delta calculations
    for (const actuatorRole of actuatorMeasuredByRoles) {
        const measuredByRole = roleMap.get(actuatorRole)?.measuredBy;
        if (measuredByRole && sensorReadingsByRole[measuredByRole]?.length >= 1) {
            const readings = sensorReadingsByRole[measuredByRole];
            const startValue = readings[0];
            const endValue = readings[readings.length - 1];
            const delta = endValue - startValue;

            const linkedRoleConfig = roleMap.get(measuredByRole);
            const unit = linkedRoleConfig?.unit || stats[measuredByRole]?.unit || '';

            stats[actuatorRole] = {
                value: delta,
                unit: unit,
                type: 'DELTA',
                startValue: startValue,
                endValue: endValue
            };
        }
    }

    return stats;
}

/**
 * Accumulate statistics based on analytics type
 */
function accumulateStat(
    stats: Record<string, ResourceStat>,
    role: string,
    value: number,
    type: AnalyticsType,
    unit: string
) {
    if (!stats[role]) {
        stats[role] = { value: 0, unit, type };
    }

    if (type === 'SUM') {
        stats[role].value += value;
    } else if (type === 'DELTA' || type === 'TREND') {
        if (stats[role].startValue === undefined) {
            stats[role].startValue = value;
        }
        stats[role].endValue = value;
        stats[role].value = (stats[role].endValue ?? 0) - (stats[role].startValue ?? 0);
    }
    // NONE: we still record the last value for reference
    else {
        stats[role].value = value;
    }
}

// Run
main().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});

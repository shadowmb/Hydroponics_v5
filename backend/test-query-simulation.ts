/**
 * Test Script: Query Simulation
 * 
 * Simulates querying ResourceDailySummary data to answer analytical questions.
 * Uses the current actual data + simulated historical data.
 */

import mongoose from 'mongoose';
import { ProgramDailyLogModel } from './src/modules/persistence/schemas/ProgramDailyLog.schema';
import ResourceRoleModel from './src/models/ResourceRole';
import { config } from './src/core/ConfigService';

const MONGO_URI = config.MONGO_URI;

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
        windowId: string;
        windowName: string;
    };
    resources: Record<string, ResourceStat>;
}

async function main() {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected!\n');

    // Load roles
    const roles = await ResourceRoleModel.find({});
    const roleMap = new Map<string, { type: AnalyticsType; unit?: string; measuredBy?: string }>();
    roles.forEach(r => roleMap.set(r.key, {
        type: r.analyticsType as AnalyticsType,
        unit: r.unit,
        measuredBy: r.measuredBy
    }));

    // Get real data from today
    const realLog = await ProgramDailyLogModel.findOne({ programId: 'prog_bigtest' }).lean();
    const realSummary = realLog ? processLog(realLog, roleMap) : null;

    // Simulate 7 days of data (including today's real data)
    const simulatedData: ResourceDailySummary[] = [];

    // Day 1-6: Simulated historical data with variations
    for (let daysAgo = 6; daysAgo >= 1; daysAgo--) {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        const dateStr = date.toISOString().split('T')[0];

        // Random variations for simulation
        const waterDelta = 60 + Math.random() * 40; // 60-100L
        const phUpUsed = 4 + Math.random() * 4;     // 4-8ml
        const nutrientA = 150 + Math.random() * 100; // 150-250ml
        const nutrientB = 40 + Math.random() * 40;   // 40-80ml
        const tempStart = 20 + Math.random() * 4;    // 20-24°C
        const tempEnd = tempStart + (Math.random() - 0.5) * 2;

        simulatedData.push({
            date: dateStr,
            timestamp: date,
            context: {
                programId: 'prog_bigtest',
                windowId: 'simulated_window',
                windowName: 'Прозорец 1'
            },
            resources: {
                water: { value: waterDelta, unit: 'L', type: 'DELTA', startValue: 20, endValue: 20 + waterDelta },
                volume: { value: waterDelta, unit: 'L', type: 'DELTA', startValue: 20, endValue: 20 + waterDelta },
                ph_up: { value: phUpUsed, unit: 'ml', type: 'SUM' },
                nutrient_a: { value: nutrientA, unit: 'ml', type: 'SUM' },
                nutrient_b: { value: nutrientB, unit: 'ml', type: 'SUM' },
                ph: { value: 3 + Math.random(), unit: 'pH', type: 'TREND', startValue: 3 + Math.random(), endValue: 6 + Math.random() },
                ec: { value: 1.5 + Math.random(), unit: 'mS/cm', type: 'TREND', startValue: 1, endValue: 2.5 + Math.random() * 0.5 },
                temp: { value: tempEnd - tempStart, unit: 'C', type: 'TREND', startValue: tempStart, endValue: tempEnd }
            }
        });
    }

    // Day 7 (today): Use real data if available
    if (realSummary) {
        simulatedData.push(realSummary);
    }

    console.log('═'.repeat(70));
    console.log('📊 QUERY SIMULATION - Answering Analytical Questions');
    console.log('═'.repeat(70));
    console.log(`📅 Period: ${simulatedData[0]?.date} → ${simulatedData[simulatedData.length - 1]?.date}`);
    console.log(`📝 Total records: ${simulatedData.length}\n`);

    // ============================================
    // ВЪПРОС 1: Колко вода е изразходена за периода?
    // ============================================
    console.log('─'.repeat(70));
    console.log('❓ ВЪПРОС 1: Колко вода е изразходена за последните 7 дни?');
    console.log('─'.repeat(70));

    const totalWater = simulatedData.reduce((sum, day) => {
        return sum + (day.resources.water?.value || 0);
    }, 0);

    console.log(`   💧 Общо изразходена вода: ${totalWater.toFixed(1)} L`);
    console.log(`   📊 Средно на ден: ${(totalWater / simulatedData.length).toFixed(1)} L\n`);

    // По дни
    console.log('   По дни:');
    simulatedData.forEach(day => {
        const water = day.resources.water?.value || 0;
        const bar = '█'.repeat(Math.round(water / 5));
        console.log(`   ${day.date}: ${water.toFixed(1).padStart(6)} L ${bar}`);
    });

    // ============================================
    // ВЪПРОС 2: Колко разтвор A и B е използван?
    // ============================================
    console.log('\n' + '─'.repeat(70));
    console.log('❓ ВЪПРОС 2: Колко разтвор A и B е използван за периода?');
    console.log('─'.repeat(70));

    const totalNutrientA = simulatedData.reduce((sum, d) => sum + (d.resources.nutrient_a?.value || 0), 0);
    const totalNutrientB = simulatedData.reduce((sum, d) => sum + (d.resources.nutrient_b?.value || 0), 0);

    console.log(`   🧪 Разтвор A: ${totalNutrientA.toFixed(0)} ml`);
    console.log(`   🧪 Разтвор B: ${totalNutrientB.toFixed(0)} ml`);
    console.log(`   📦 Общо хранителни разтвори: ${(totalNutrientA + totalNutrientB).toFixed(0)} ml\n`);

    // ============================================
    // ВЪПРОС 3: Колко pH+ е добавено и как се е променило pH?
    // ============================================
    console.log('─'.repeat(70));
    console.log('❓ ВЪПРОС 3: Колко pH+ е добавено и как се е променило pH?');
    console.log('─'.repeat(70));

    const totalPhUp = simulatedData.reduce((sum, d) => sum + (d.resources.ph_up?.value || 0), 0);
    const avgPhChange = simulatedData.reduce((sum, d) => sum + (d.resources.ph?.value || 0), 0) / simulatedData.length;

    console.log(`   ⚗️  Общо добавен pH+: ${totalPhUp.toFixed(1)} ml`);
    console.log(`   📈 Средна промяна на pH: +${avgPhChange.toFixed(2)} pH единици`);
    console.log('\n   Детайли по дни:');
    simulatedData.forEach(day => {
        const phUp = day.resources.ph_up?.value || 0;
        const phStart = day.resources.ph?.startValue || 0;
        const phEnd = day.resources.ph?.endValue || 0;
        console.log(`   ${day.date}: pH+ ${phUp.toFixed(1).padStart(4)} ml → pH ${phStart.toFixed(1)} → ${phEnd.toFixed(1)}`);
    });

    // ============================================
    // ВЪПРОС 4: Каква е средната температура за периода?
    // ============================================
    console.log('\n' + '─'.repeat(70));
    console.log('❓ ВЪПРОС 4: Каква е средната температура за периода?');
    console.log('─'.repeat(70));

    const temps = simulatedData
        .filter(d => d.resources.temp?.endValue !== undefined)
        .map(d => d.resources.temp!.endValue!);

    const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);

    console.log(`   🌡️  Средна температура: ${avgTemp.toFixed(1)}°C`);
    console.log(`   📉 Минимална: ${minTemp.toFixed(1)}°C`);
    console.log(`   📈 Максимална: ${maxTemp.toFixed(1)}°C\n`);

    // ============================================
    // ВЪПРОС 5: Корелация - при каква EC се използва повече nutrient?
    // ============================================
    console.log('─'.repeat(70));
    console.log('❓ ВЪПРОС 5: Корелация между EC и добавени хранителни вещества');
    console.log('─'.repeat(70));

    console.log('\n   Дата         | EC (start→end) | Nutrient A+B | Разход/EC Point');
    console.log('   ' + '-'.repeat(60));

    simulatedData.forEach(day => {
        const ecStart = day.resources.ec?.startValue || 0;
        const ecEnd = day.resources.ec?.endValue || 0;
        const ecDelta = ecEnd - ecStart;
        const nutrients = (day.resources.nutrient_a?.value || 0) + (day.resources.nutrient_b?.value || 0);
        const ratio = ecDelta > 0 ? (nutrients / ecDelta).toFixed(0) : 'N/A';

        console.log(`   ${day.date} | ${ecStart.toFixed(1)} → ${ecEnd.toFixed(1)} | ${nutrients.toFixed(0).padStart(6)} ml | ${ratio} ml/EC`);
    });

    console.log('\n' + '═'.repeat(70));
    console.log('✅ Симулацията завърши успешно!');
    console.log('═'.repeat(70));
    console.log('\n📌 ЗАКЛЮЧЕНИЕ: Структурата позволява да отговорим на всички въпроси.');

    await mongoose.disconnect();
}

function processLog(log: any, roleMap: Map<string, { type: AnalyticsType; unit?: string; measuredBy?: string }>): ResourceDailySummary {
    const events = log.events || [];
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

        if (blockType === 'SENSOR_READ' && logData.primaryValue !== undefined) {
            if (!sensorReadingsByRole[role]) sensorReadingsByRole[role] = [];
            sensorReadingsByRole[role].push(logData.primaryValue);
            accumulateStat(stats, role, logData.primaryValue, rType, rUnit);
        }

        if (blockType === 'ACTUATOR_SET') {
            let amount = logData.calculatedVolumeMl ?? logData.primaryValue ?? logData.amount ?? 0;
            let unit = logData.calculatedVolumeMl !== undefined ? 'ml' : (logData.unit || logData.primaryUnit || '');

            const measuredBy = roleConfig?.measuredBy;
            if (rType === 'NONE' && measuredBy) {
                actuatorMeasuredByRoles.add(role);
            } else if (amount > 0) {
                accumulateStat(stats, role, Number(amount), rType, unit);
            }
        }
    }

    for (const actuatorRole of actuatorMeasuredByRoles) {
        const measuredByRole = roleMap.get(actuatorRole)?.measuredBy;
        if (measuredByRole && sensorReadingsByRole[measuredByRole]?.length >= 1) {
            const readings = sensorReadingsByRole[measuredByRole];
            stats[actuatorRole] = {
                value: readings[readings.length - 1] - readings[0],
                unit: roleMap.get(measuredByRole)?.unit || '',
                type: 'DELTA',
                startValue: readings[0],
                endValue: readings[readings.length - 1]
            };
        }
    }

    return {
        date: log.date,
        timestamp: new Date(log.createdAt),
        context: { programId: log.programId, windowId: 'real', windowName: 'Real Data' },
        resources: stats
    };
}

function accumulateStat(stats: Record<string, ResourceStat>, role: string, value: number, type: AnalyticsType, unit: string) {
    if (!stats[role]) stats[role] = { value: 0, unit, type };

    if (type === 'SUM') {
        stats[role].value += value;
    } else if (type === 'DELTA' || type === 'TREND') {
        if (stats[role].startValue === undefined) stats[role].startValue = value;
        stats[role].endValue = value;
        stats[role].value = (stats[role].endValue ?? 0) - (stats[role].startValue ?? 0);
    } else {
        stats[role].value = value;
    }
}

main().catch(console.error);

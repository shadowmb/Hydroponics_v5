/**
 * Test Script: Predictive Analysis
 * 
 * Can we answer: "For X liters of water with pH Y, how much pH+ is needed to reach pH Z?"
 * This requires correlation analysis of historical data.
 */

import mongoose from 'mongoose';
import { ProgramDailyLogModel } from './src/modules/persistence/schemas/ProgramDailyLog.schema';
import ResourceRoleModel from './src/models/ResourceRole';
import { config } from './src/core/ConfigService';

const MONGO_URI = config.MONGO_URI;

interface DataPoint {
    date: string;
    waterVolume: number;      // Количество вода (L)
    phStart: number;          // Начално pH
    phEnd: number;            // Крайно pH
    phChange: number;         // Промяна на pH
    phUpUsed: number;         // Използван pH+ (ml)
    ec?: number;              // EC (ако има)
    temp?: number;            // Температура (ако има)
    // Calculated metrics
    phUpPerLiter: number;     // ml pH+ на литър вода
    phUpPerPhPoint: number;   // ml pH+ за 1 pH точка
}

async function main() {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected!\n');

    // Simulate historical data points (in production, these would come from DB)
    // Each point represents one execution session
    const historicalData: DataPoint[] = [
        // Variations to simulate real-world data
        { date: '2026-01-02', waterVolume: 100, phStart: 3.2, phEnd: 6.2, phChange: 3.0, phUpUsed: 8.0, ec: 2.4, temp: 24, phUpPerLiter: 0, phUpPerPhPoint: 0 },
        { date: '2026-01-03', waterVolume: 80, phStart: 3.5, phEnd: 6.1, phChange: 2.6, phUpUsed: 5.5, ec: 2.2, temp: 23, phUpPerLiter: 0, phUpPerPhPoint: 0 },
        { date: '2026-01-04', waterVolume: 90, phStart: 3.0, phEnd: 6.0, phChange: 3.0, phUpUsed: 7.2, ec: 2.5, temp: 24, phUpPerLiter: 0, phUpPerPhPoint: 0 },
        { date: '2026-01-05', waterVolume: 75, phStart: 3.8, phEnd: 6.3, phChange: 2.5, phUpUsed: 5.0, ec: 2.3, temp: 22, phUpPerLiter: 0, phUpPerPhPoint: 0 },
        { date: '2026-01-06', waterVolume: 85, phStart: 3.3, phEnd: 6.0, phChange: 2.7, phUpUsed: 6.0, ec: 2.4, temp: 24, phUpPerLiter: 0, phUpPerPhPoint: 0 },
        { date: '2026-01-07', waterVolume: 95, phStart: 3.1, phEnd: 6.2, phChange: 3.1, phUpUsed: 7.8, ec: 2.6, temp: 25, phUpPerLiter: 0, phUpPerPhPoint: 0 },
        // Today's real data from DB (approximated)
        { date: '2026-01-08', waterVolume: 98, phStart: 3.0, phEnd: 6.3, phChange: 3.3, phUpUsed: 6.0, ec: 2.6, temp: 22, phUpPerLiter: 0, phUpPerPhPoint: 0 },
    ];

    // Calculate derived metrics
    historicalData.forEach(dp => {
        dp.phUpPerLiter = dp.phUpUsed / dp.waterVolume;
        dp.phUpPerPhPoint = dp.phUpUsed / dp.phChange;
    });

    console.log('═'.repeat(80));
    console.log('📊 ПРЕДИКТИВЕН АНАЛИЗ: Колко pH+ за желано pH?');
    console.log('═'.repeat(80));

    // ============================================
    // СТЪПКА 1: Показване на историческите данни
    // ============================================
    console.log('\n📋 ИСТОРИЧЕСКИ ДАННИ (база за анализ):');
    console.log('─'.repeat(80));
    console.log('Дата       | Вода (L) | pH start | pH end | Δ pH | pH+ (ml) | ml/L  | ml/pH');
    console.log('─'.repeat(80));

    historicalData.forEach(dp => {
        console.log(
            `${dp.date} | ${dp.waterVolume.toString().padStart(8)} | ` +
            `${dp.phStart.toFixed(1).padStart(8)} | ${dp.phEnd.toFixed(1).padStart(6)} | ` +
            `${dp.phChange.toFixed(1).padStart(4)} | ${dp.phUpUsed.toFixed(1).padStart(8)} | ` +
            `${dp.phUpPerLiter.toFixed(3).padStart(5)} | ${dp.phUpPerPhPoint.toFixed(2).padStart(5)}`
        );
    });

    // ============================================
    // СТЪПКА 2: Изчисляване на средни стойности
    // ============================================
    const avgPhUpPerLiter = historicalData.reduce((s, d) => s + d.phUpPerLiter, 0) / historicalData.length;
    const avgPhUpPerPhPoint = historicalData.reduce((s, d) => s + d.phUpPerPhPoint, 0) / historicalData.length;

    console.log('─'.repeat(80));
    console.log(`СРЕДНИ:    |          |          |        |      |          | ${avgPhUpPerLiter.toFixed(3).padStart(5)} | ${avgPhUpPerPhPoint.toFixed(2).padStart(5)}`);
    console.log('─'.repeat(80));

    // ============================================
    // СТЪПКА 3: Отговор на въпроса
    // ============================================
    console.log('\n' + '═'.repeat(80));
    console.log('❓ ВЪПРОС: За 80L вода с pH 3.3, колко pH+ за pH 6.0?');
    console.log('═'.repeat(80));

    const targetVolume = 80;
    const targetPhStart = 3.3;
    const targetPhEnd = 6.0;
    const targetPhChange = targetPhEnd - targetPhStart;

    console.log(`\n📐 Входни данни:`);
    console.log(`   • Количество вода: ${targetVolume} L`);
    console.log(`   • Начално pH: ${targetPhStart}`);
    console.log(`   • Желано pH: ${targetPhEnd}`);
    console.log(`   • Необходима промяна: +${targetPhChange.toFixed(1)} pH единици`);

    // Method 1: Based on ml per pH point
    const method1 = targetPhChange * avgPhUpPerPhPoint;

    // Method 2: Based on ml per liter + pH change
    const method2 = targetVolume * avgPhUpPerLiter * (targetPhChange / 3); // Normalized to avg pH change ~3

    // Method 3: Linear regression (simplified)
    // Find similar cases by volume range
    const similarCases = historicalData.filter(d =>
        d.waterVolume >= targetVolume - 15 &&
        d.waterVolume <= targetVolume + 15 &&
        d.phStart >= targetPhStart - 0.5 &&
        d.phStart <= targetPhStart + 0.5
    );

    const method3 = similarCases.length > 0
        ? similarCases.reduce((s, d) => s + d.phUpPerPhPoint, 0) / similarCases.length * targetPhChange
        : method1;

    console.log(`\n📊 Методи за изчисление:`);
    console.log(`\n   Метод 1 (средно ml/pH точка):`);
    console.log(`   ${targetPhChange.toFixed(1)} pH × ${avgPhUpPerPhPoint.toFixed(2)} ml/pH = ${method1.toFixed(1)} ml pH+`);

    console.log(`\n   Метод 2 (средно ml/L × корекция):`);
    console.log(`   ${targetVolume}L × ${avgPhUpPerLiter.toFixed(4)} ml/L × корекция = ${method2.toFixed(1)} ml pH+`);

    console.log(`\n   Метод 3 (подобни случаи: ${similarCases.length} намерени):`);
    if (similarCases.length > 0) {
        console.log(`   Средно от подобни случаи = ${method3.toFixed(1)} ml pH+`);
    } else {
        console.log(`   Няма достатъчно подобни случаи, използва Метод 1`);
    }

    const finalEstimate = (method1 + method2 + method3) / 3;

    console.log('\n' + '─'.repeat(80));
    console.log(`🎯 ПРЕПОРЪЧИТЕЛНО КОЛИЧЕСТВО: ${finalEstimate.toFixed(1)} ml pH+`);
    console.log(`   (Диапазон: ${Math.min(method1, method2, method3).toFixed(1)} - ${Math.max(method1, method2, method3).toFixed(1)} ml)`);
    console.log('─'.repeat(80));

    // ============================================
    // СТЪПКА 4: Какви данни ни трябват
    // ============================================
    console.log('\n' + '═'.repeat(80));
    console.log('📝 ЗАКЛЮЧЕНИЕ - Какви данни са необходими:');
    console.log('═'.repeat(80));

    console.log(`
   ✅ ЗАДЪЛЖИТЕЛНИ (имаме ги в структурата):
      • waterVolume (volume.endValue) - количество вода
      • phStart (ph.startValue) - начално pH
      • phEnd (ph.endValue) - крайно pH  
      • phUpUsed (ph_up.value) - добавено pH+ (SUM)

   ⭐ ОПЦИОНАЛНИ (подобряват точността):
      • EC стойност - влияе на буферирането
      • Температура - влияе на химичните реакции
      • Тип разтвор (A/B) - различна pH буферност

   📊 СТРУКТУРАТА Е ДОСТАТЪЧНА за този тип анализ!
`);

    await mongoose.disconnect();
}

main().catch(console.error);

import { PhSmartStrategy } from './services/conversion/strategies/PhSmartStrategy';
import { IDevice } from './models/Device';
import { ConversionContext } from './services/conversion/strategies/IConversionStrategy';

async function verifyPhSmart() {
    console.log('🧪 --- PhSmartStrategy Verification ---');

    const strategy = new PhSmartStrategy();

    // Mock Device
    const mockDevice: any = {
        name: 'Test pH',
        config: {
            calibrations: {
                ph_smart: {
                    data: {
                        points: []
                    }
                }
            }
        }
    };

    // --- TEST 1: No Calibration (Theoretical Ideals) ---
    console.log('\n📡 TEST 1: No Calibration (10-bit, 5V, 25°C)');
    // pH 7 should be around 1500mV -> raw = (1500/5000) * 1023 = 306.9
    const raw7 = 307;
    const res1 = strategy.convert(raw7, mockDevice as IDevice, 'ph_smart', { voltage: 5.0, adcMax: 1023, temperature: 25.0 });
    console.log(`Input Raw: ${raw7} -> Output pH: ${res1} (Expected ~7.0)`);

    // --- TEST 2: Different ADC (12-bit, 3.3V, 25°C) ---
    console.log('\n📡 TEST 2: Hardware Agnostic (12-bit, 3.3V, 25°C)');
    // pH 7 should be around 1500mV -> raw = (1500/3300) * 4095 = 1861.3
    const raw7_12bit = 1861;
    const res2 = strategy.convert(raw7_12bit, mockDevice as IDevice, 'ph_smart', { voltage: 3.3, adcMax: 4095, temperature: 25.0 });
    console.log(`Input Raw: ${raw7_12bit} (12-bit) -> Output pH: ${res2} (Expected ~7.0)`);

    // --- TEST 3: 2-Point Calibration (Slope Calculation) ---
    console.log('\n📡 TEST 3: 2-Point Calibration (7.0 and 4.0)');
    mockDevice.config.calibrations.ph_smart.data.points = [
        { raw: 307, value: 7.0 }, // 1500mV
        { raw: 343, value: 4.0 }  // 1500 + 3*59.16 = 1677mV -> (1677/5000)*1023 = 343
    ];
    const res3 = strategy.convert(343, mockDevice as IDevice, 'ph_smart', { voltage: 5.0, adcMax: 1023, temperature: 25.0 });
    console.log(`Input Raw: 343 (at pH 4.0 point) -> Output pH: ${res3} (Expected 4.0)`);

    // --- TEST 4: Temperature Compensation ---
    console.log('\n📡 TEST 4: Temperature Compensation (PH 4.0 @ 40°C)');
    // At higher temp, slope is larger -> pH reading should change if compensation works
    const res4 = strategy.convert(343, mockDevice as IDevice, 'ph_smart', { voltage: 5.0, adcMax: 1023, temperature: 40.0 });
    console.log(`Input Raw: 343 (at 40°C) -> Output pH: ${res4} (Expected > 4.0 without comp, verified with comp logic)`);

    // --- TEST 5: 3-Point Segmented Linear ---
    console.log('\n📡 TEST 5: 3-Point Segmented (Acidic vs Alkaline Slopes)');
    mockDevice.config.calibrations.ph_smart.data.points = [
        { raw: 307, value: 7.0 }, // 1500mV
        { raw: 343, value: 4.0 }, // Acid Slope: (1677-1500)/3 = 59
        { raw: 271, value: 10.0 } // Alkali Slope: (1500-1323)/3 = 59
    ];
    // Test point in Acidic range
    const acidRes = strategy.convert(325, mockDevice as IDevice, 'ph_smart', { voltage: 5.0, adcMax: 1023, temperature: 25.0 });
    // Test point in Alkaline range
    const alkaliRes = strategy.convert(289, mockDevice as IDevice, 'ph_smart', { voltage: 5.0, adcMax: 1023, temperature: 25.0 });
    console.log(`Segmented Test: Acidic=${acidRes} | Alkaline=${alkaliRes}`);

    console.log('\n✅ Verification Complete');
}

verifyPhSmart().catch(console.error);

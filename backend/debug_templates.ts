import { db } from './src/core/DatabaseService';
import { ControllerTemplate } from './src/models/ControllerTemplate';
import { logger } from './src/core/LoggerService';

async function debug() {
    try {
        await db.connect();
        const templates = await ControllerTemplate.find({ key: 'lilygo_t_relay_4' });

        if (templates.length === 0) {
            console.log('❌ Template lilygo_t_relay_4 not found in DB');
        } else {
            const template = templates[0];
            console.log(`✅ Template: ${template.label}`);
            console.log(`📡 Ports Count: ${template.ports.length}`);
            template.ports.forEach((p: any) => {
                console.log(`   - [${p.id}] ${p.label} (GPIO ${p.pin})`);
            });
        }

        await db.disconnect();
    } catch (err) {
        console.error('🔥 Debug Error:', err);
    }
}

debug();

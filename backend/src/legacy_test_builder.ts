
import { FirmwareBuilder } from './services/FirmwareBuilder';
import { logger } from './core/LoggerService';
import fs from 'fs';
import path from 'path';

// Mock logger
logger.info = console.log;
logger.warn = console.warn;
logger.error = console.error;

const builder = new FirmwareBuilder();

const config = {
    boardId: 'wemos_d1_mini',
    transportId: 'serial_standard',
    pluginIds: [],
    commandIds: ['modbus_rtu_read'],
    settings: {
        ssid: 'TestNetwork',
        password: 'TestPassword123'
    }
};

try {
    console.log('Building firmware...');
    console.log('Building firmware...');
    const source = builder.build(config, {});

    const outputPath = path.join(__dirname, '../test_output.ino');
    fs.writeFileSync(outputPath, source);

    console.log('Success! Output written to test_output.ino');

    // Check for CAPABILITIES
    const capabilitiesMatch = source.match(/const char\* CAPABILITIES\[\] = \{ (.*) \};/);
    if (capabilitiesMatch) {
        console.log('Found CAPABILITIES:', capabilitiesMatch[1]);
    } else {
        console.error('CAPABILITIES array NOT found!');
    }

    // Check for CAPABILITIES_COUNT
    const countMatch = source.match(/const int CAPABILITIES_COUNT = (\d+);/);
    if (countMatch) {
        console.log('Found CAPABILITIES_COUNT:', countMatch[1]);
    } else {
        console.error('CAPABILITIES_COUNT NOT found!');
    }

} catch (error) {
    console.error('Build failed:', error);
}

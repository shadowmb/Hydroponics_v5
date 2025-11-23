import { DeviceTemplate } from '../models/DeviceTemplate';

const templates = [
    {
        _id: 'dfrobot_ph_pro',
        name: 'DFRobot pH Sensor Pro',
        description: 'Professional analog pH sensor (0-14 pH)',
        physicalType: 'ph',
        requiredCommand: 'ANALOG',
        defaultUnits: ['pH'],
        portRequirements: [{ type: 'analog', count: 1, description: 'Analog Pin (A0-A5)' }],
        executionConfig: {
            commandType: 'ANALOG',
            responseMapping: { conversionMethod: 'ph_dfrobot_pro' }
        },
        uiConfig: { category: 'Sensors', icon: 'droplet' }
    },
    {
        _id: 'dfrobot_ec_k1',
        name: 'DFRobot EC Sensor (K=1.0)',
        description: 'Analog Electrical Conductivity sensor',
        physicalType: 'ec',
        requiredCommand: 'ANALOG',
        defaultUnits: ['mS/cm', 'µS/cm'],
        portRequirements: [{ type: 'analog', count: 1, description: 'Analog Pin (A0-A5)' }],
        executionConfig: {
            commandType: 'ANALOG',
            responseMapping: { conversionMethod: 'ec_dfrobot_k1' }
        },
        uiConfig: { category: 'Sensors', icon: 'activity' }
    },
    {
        _id: 'dht22',
        name: 'DHT22 (Temp/Humidity)',
        description: 'Digital temperature and humidity sensor',
        physicalType: 'humidity',
        requiredCommand: 'SINGLE_WIRE_PULSE',
        defaultUnits: ['%RH', '°C'],
        portRequirements: [{ type: 'digital', count: 1, description: 'Digital Pin (D2-D13)' }],
        executionConfig: {
            commandType: 'SINGLE_WIRE_PULSE',
            parameters: { model: 'dht22' },
            responseMapping: { conversionMethod: 'dht22' }
        },
        uiConfig: { category: 'Sensors', icon: 'thermometer' }
    },
    {
        _id: 'ds18b20',
        name: 'DS18B20 Temperature',
        description: 'Waterproof OneWire temperature sensor',
        physicalType: 'temp',
        requiredCommand: 'SINGLE_WIRE_ONEWIRE',
        defaultUnits: ['°C', '°F'],
        portRequirements: [{ type: 'digital', count: 1, description: 'Digital Pin (D2-D13)' }],
        executionConfig: {
            commandType: 'SINGLE_WIRE_ONEWIRE',
            responseMapping: { conversionMethod: 'ds18b20' }
        },
        uiConfig: { category: 'Sensors', icon: 'thermometer' }
    },
    {
        _id: 'standard_relay',
        name: 'Standard Relay',
        description: 'Generic relay for controlling pumps, lights, etc.',
        physicalType: 'relay',
        requiredCommand: 'SET_PIN',
        defaultUnits: ['On/Off'],
        portRequirements: [{ type: 'digital', count: 1, description: 'Digital Pin' }],
        executionConfig: {
            commandType: 'SET_PIN'
        },
        uiConfig: { category: 'Actuators', icon: 'power' }
    }
];

export const seedDeviceTemplates = async () => {
    try {
        console.log('Seeding Device Templates...');
        for (const t of templates) {
            await DeviceTemplate.findByIdAndUpdate(t._id, t, { upsert: true, new: true });
        }
        console.log(`Seeded ${templates.length} device templates.`);
    } catch (error) {
        console.error('Error seeding device templates:', error);
    }
};

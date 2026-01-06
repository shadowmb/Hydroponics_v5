/**
 * Hydroponics Hardware Simulator v2
 * 
 * Now with:
 * - Dynamic controller/sensor templates from backend config
 * - Pin-based sensor assignment
 * - Template-accurate response formats
 */

import dgram from 'dgram';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import { DeviceState } from './DeviceState';
import { UdpProtocolHandler } from './UdpProtocolHandler';
import { ScenarioEngine } from './ScenarioEngine';
import { ControllerRegistry } from './ControllerRegistry';
import { SensorRegistry } from './SensorRegistry';
import { PinAssignmentManager } from './PinAssignmentManager';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const UDP_PORT = parseInt(process.env.UDP_PORT || '8888');
let httpPort = parseInt(process.env.HTTP_PORT || '3001');
const CONTROLLER_MAC = process.env.MAC || 'SIM:00:00:00:00:01';
const CONTROLLER_MODEL = process.env.MODEL || 'Simulator-ESP32';

// Initialize registries
const controllerRegistry = new ControllerRegistry();
const sensorRegistry = new SensorRegistry();

import { ProfileManager, SimulatorProfile } from './ProfileManager';

// ... (existing imports)

// Initialize state management
const deviceState = new DeviceState();
const pinManager = new PinAssignmentManager(sensorRegistry);
const profileManager = new ProfileManager();

// Protocol handler with pin awareness
// Mutable configuration for dynamic updates
const controllerConfig: SimulatorProfile = {
    id: 'default',
    name: 'Default Simulator',
    mac: process.env.MAC || 'SIM:00:00:00:00:01',
    controllerType: process.env.MODEL || 'Arduino_Uno_R4_WiFi',
    udpPort: parseInt(process.env.UDP_PORT || '8888'),
    created: new Date().toISOString(),
    lastUsed: new Date().toISOString()
};

const protocolHandler = new UdpProtocolHandler(
    deviceState,
    pinManager,
    sensorRegistry,
    // Proxy object to map Profile to ControllerInfo
    {
        get mac() { return controllerConfig.mac; },
        get model() { return controllerConfig.controllerType; },
        firmwareVersion: '1.0-v5-sim-profiled'
    }
);

const scenarioEngine = new ScenarioEngine(deviceState);

// Active controller selection
let activeController = 'Arduino_Uno_R4_WiFi'; // Will be set in setup

// SSE clients for real-time UDP log
const sseClients: Set<any> = new Set();

// ============ UDP Server ============

let udpServer: dgram.Socket | null = null;

// Helper to broadcast to all SSE clients
function broadcastToSSE(data: any) {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    for (const client of sseClients) {
        try {
            client.write(message);
        } catch (e) {
            sseClients.delete(client);
        }
    }
}

function startUdpServer(port: number): Promise<void> {
    return new Promise((resolve, reject) => {
        const socket = dgram.createSocket('udp4');
        let bound = false;

        const errorHandler = (err: any) => {
            if (!bound) {
                socket.close();
                reject(err);
            } else {
                console.error(`[UDP] Server error:\n${err.stack}`);
                socket.close();
            }
        };

        socket.on('error', errorHandler);

        socket.on('message', (msg, rinfo) => {
            const command = msg.toString().trim();
            const timestamp = new Date().toISOString();
            console.log(`[UDP] ← ${rinfo.address}:${rinfo.port} | ${command}`);

            broadcastToSSE({
                type: 'incoming',
                from: `${rinfo.address}:${rinfo.port}`,
                command,
                timestamp
            });

            const response = protocolHandler.handleCommand(command);

            if (response !== null) {
                const responseStr = typeof response === 'string' ? response : JSON.stringify(response);
                console.log(`[UDP] → ${responseStr}`);

                broadcastToSSE({
                    type: 'outgoing',
                    response: responseStr,
                    timestamp
                });

                socket.send(responseStr, rinfo.port, rinfo.address, (err) => {
                    if (err) console.error('[UDP] Send error:', err);
                });
            }
        });

        socket.bind(port, () => {
            bound = true;
            const address = socket.address();
            console.log(`[UDP] Simulator listening on ${address.address}:${address.port}`);
            udpServer = socket;
            resolve();
        });
    });
}

// udpServer.bind() moved to setup

// ============ HTTP Server (UI + API) ============

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ---------- SSE Endpoint for UDP Log ----------

app.get('/api/udp-log', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected', message: 'UDP Log stream connected' })}\n\n`);

    // Add client to SSE set
    sseClients.add(res);
    console.log(`[SSE] Client connected. Total: ${sseClients.size}`);

    // Remove client on disconnect
    req.on('close', () => {
        sseClients.delete(res);
        console.log(`[SSE] Client disconnected. Total: ${sseClients.size}`);
    });
});

// ---------- Controller API ----------

// List available controllers
app.get('/api/controllers', (req, res) => {
    res.json(controllerRegistry.listControllers());
});

// Get active controller
app.get('/api/controller', (req, res) => {
    const controller = controllerRegistry.getController(activeController);
    const adcMax = controllerRegistry.getAdcMaxValue(activeController);
    res.json({
        key: activeController,
        label: controller?.label,
        pins: controllerRegistry.getAllPins(activeController),
        adcMax
    });
});

// Get controller pins
app.get('/api/pins', (req, res) => {
    const pins = controllerRegistry.getAllPins(activeController);
    const assignments = pinManager.getAllAssignments();

    // Mark which pins are assigned
    const pinsWithStatus = pins.map(pin => {
        const assignment = pinManager.getAssignment(`${pin.id}_${pin.pin}`);
        return {
            ...pin,
            assigned: !!assignment,
            sensorId: assignment?.sensorId
        };
    });

    res.json(pinsWithStatus);
});

// ---------- Sensor API ----------

// List available sensors
app.get('/api/sensors', (req, res) => {
    res.json(sensorRegistry.listSensors());
});

// Get sensor details
app.get('/api/sensor/:id', (req, res) => {
    const sensor = sensorRegistry.getSensor(req.params.id);
    if (!sensor) {
        return res.status(404).json({ success: false, error: 'Sensor not found' });
    }
    res.json(sensor);
});

// ---------- Pin Assignment API ----------

// Get current assignments with controller-aware ADC limits
app.get('/api/assignments', (req, res) => {
    const adcMax = controllerRegistry.getAdcMaxValue(activeController);
    const assignments = pinManager.getAllAssignments();

    // Override ADC limits with controller-specific max
    const assignmentsWithAdcLimits = assignments.map(a => ({
        ...a,
        limits: a.hardwareCmd === 'ANALOG'
            ? { min: 0, max: adcMax, unit: 'adc' }
            : a.limits
    }));

    res.json(assignmentsWithAdcLimits);
});

// Assign sensor to pin(s)
app.post('/api/assign', (req, res) => {
    const { sensorId, pins } = req.body;
    if (!sensorId || !pins || !Array.isArray(pins)) {
        return res.status(400).json({ success: false, error: 'Missing sensorId or pins' });
    }

    const success = pinManager.assignSensor(sensorId, pins);
    if (success) {
        res.json({ success: true, sensorId, pins });
    } else {
        res.status(400).json({ success: false, error: 'Failed to assign sensor' });
    }
});

// Unassign pin
app.delete('/api/assign/:pin', (req, res) => {
    pinManager.unassignPin(req.params.pin);
    res.json({ success: true });
});

// Update sensor value
app.post('/api/value/:pin', (req, res) => {
    const { pin } = req.params;
    const { key, value } = req.body;

    pinManager.setValue(pin, key || 'value', value);
    res.json({ success: true, pin, key, value });
});

// ---------- State API ----------

app.get('/api/state', (req, res) => {
    res.json({
        controller: activeController,
        assignments: pinManager.getAllAssignments(),
        uptime: deviceState.getUptime(),
        isOffline: deviceState.getIsOffline()
    });
});

// ---------- Scenario API ----------

app.get('/api/scenarios', (req, res) => {
    res.json(scenarioEngine.listScenarios());
});

app.post('/api/scenario/:name/start', (req, res) => {
    try {
        scenarioEngine.startScenario(req.params.name);
        res.json({ success: true, scenario: req.params.name });
    } catch (e: any) {
        res.status(400).json({ success: false, error: e.message });
    }
});

app.post('/api/scenario/stop', (req, res) => {
    scenarioEngine.stopScenario();
    res.json({ success: true });
});

// ---------- Config Persistence ----------

app.get('/api/config/export', (req, res) => {
    res.json({
        controller: activeController,
        assignments: pinManager.exportConfig()
    });
});

app.post('/api/config/import', (req, res) => {
    const { config } = req.body;
    if (!Array.isArray(config)) {
        return res.status(400).json({ success: false, error: 'Invalid config format' });
    }
    pinManager.importConfig(config);
    res.json({ success: true });
});

app.post('/api/reset', (req, res) => {
    pinManager.reset();
    res.json({ success: true });
});


// ============ Setup & Main ============

let isConfigured = false;
let configuredUdpPort: number | null = null;

// Status Endpoint
app.get('/api/status', (req, res) => {
    res.json({
        configured: isConfigured,
        activeController,
        udpPort: configuredUdpPort,
        httpPort: httpPort,
        mac: controllerConfig.mac
    });
});

// Setup Endpoint
// Profiles API
app.get('/api/profiles', (req, res) => {
    res.json(profileManager.listProfiles());
});

app.post('/api/profiles', (req, res) => {
    const profile = req.body;
    // Validate basics
    if (!profile.name || !profile.controllerType) {
        return res.status(400).json({ success: false, error: 'Name and Type are required' });
    }

    // Generate ID if missing
    if (!profile.id) {
        profile.id = profile.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    }

    // Ensure data exists
    if (!profile.created) profile.created = new Date().toISOString();

    if (profileManager.saveProfile(profile)) {
        res.json({ success: true, profile });
    } else {
        res.status(500).json({ success: false, error: 'Failed to save profile' });
    }
});

app.delete('/api/profiles/:id', (req, res) => {
    if (profileManager.deleteProfile(req.params.id)) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false, error: 'Failed to delete profile' });
    }
});

// Setup Endpoint
app.post('/api/setup', async (req, res) => {
    if (isConfigured) {
        return res.status(400).json({ success: false, error: 'Already configured' });
    }

    // Support both manual setup and profile-based setup
    let config: SimulatorProfile = { ...req.body };
    const { profileId } = req.body;

    if (profileId) {
        const profile = profileManager.getProfile(profileId);
        if (!profile) {
            return res.status(404).json({ success: false, error: 'Profile not found' });
        }
        config = profile;
        // Update last used
        profileManager.saveProfile(profile);
    }

    const { controllerType, udpPort, mac, name } = config;
    // Normalized check (UI might send "controller" instead of "controllerType" for manual)
    const ctrlType = controllerType || req.body.controller;
    const port = parseInt(udpPort as any);

    // Validate Controller
    const ctrl = controllerRegistry.getController(ctrlType);
    if (!ctrl) {
        return res.status(400).json({ success: false, error: 'Invalid controller' });
    }

    // Validate Port
    if (isNaN(port) || port < 1024 || port > 65535) {
        return res.status(400).json({ success: false, error: 'Invalid UDP port' });
    }

    try {
        // Apply Config
        controllerConfig.id = config.id || (name ? name.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'manual');
        controllerConfig.name = name || 'Manual Session';
        controllerConfig.controllerType = ctrlType;
        controllerConfig.udpPort = port;
        controllerConfig.mac = mac || 'SIM:00:00:00:00:01';

        // Update active controller for API
        activeController = ctrlType;

        // Save Profile if Name is provided and it's not a temporary manual session
        if (name && !profileId) {
            const newProfile: SimulatorProfile = {
                id: controllerConfig.id,
                name: controllerConfig.name,
                controllerType: controllerConfig.controllerType,
                udpPort: controllerConfig.udpPort,
                mac: controllerConfig.mac,
                created: new Date().toISOString(),
                lastUsed: new Date().toISOString()
            };
            profileManager.saveProfile(newProfile);
            console.log(`[Setup] Created new profile: ${newProfile.name} (${newProfile.id})`);
        }

        // Set Pin Manager Profile
        // If profileId exists, use it. If not, use the newly generated ID if creating one.
        // Fallback to "manual_TYPE" only if absolutely necessary
        const pinConfigId = profileId || controllerConfig.id;
        pinManager.setConfigProfile(pinConfigId);

        // Start UDP
        await startUdpServer(port);
        configuredUdpPort = port;

        isConfigured = true;

        console.log(`[Setup] Configured: ${activeController} (${controllerConfig.mac}) on UDP ${configuredUdpPort}`);
        res.json({ success: true, profileId: controllerConfig.id });

    } catch (e: any) {
        console.error('[Setup] Error:', e);
        if (e.code === 'EADDRINUSE') {
            return res.status(400).json({ success: false, error: `Port ${port} is busy. Please try another.` });
        }
        res.status(500).json({ success: false, error: e.message });
    }
});

app.post('/api/reconfigure', (req, res) => {
    console.log('[Setup] Reconfigure requested.');

    if (udpServer) {
        try {
            udpServer.close();
        } catch (e) { console.error('Error closing UDP:', e); }
        udpServer = null;
    }

    isConfigured = false;
    configuredUdpPort = null;

    res.json({ success: true });
});

function startHttpServer(port: number) {
    const server = app.listen(port, () => {
        httpPort = port;
        console.log('[Startup] Web-based Setup Mode');
        console.log(`[HTTP] Server listening on port ${port}`);
        console.log(`[Info] Open http://localhost:${port} to configure and start the simulator.`);
    });

    server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`[Startup] Port ${port} is busy, trying ${port + 1}...`);
            startHttpServer(port + 1);
        } else {
            console.error('[Startup] Failed to start HTTP server:', err);
            process.exit(1);
        }
    });
}

function main() {
    startHttpServer(httpPort);
}

main();

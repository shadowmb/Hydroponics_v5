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
const HTTP_PORT = parseInt(process.env.HTTP_PORT || '3001');
const CONTROLLER_MAC = process.env.MAC || 'SIM:00:00:00:00:01';
const CONTROLLER_MODEL = process.env.MODEL || 'Simulator-ESP32';

// Initialize registries
const controllerRegistry = new ControllerRegistry();
const sensorRegistry = new SensorRegistry();

// Initialize state management
const deviceState = new DeviceState();
const pinManager = new PinAssignmentManager(sensorRegistry);

// Protocol handler with pin awareness
const protocolHandler = new UdpProtocolHandler(
    deviceState,
    pinManager,
    sensorRegistry,
    {
        mac: CONTROLLER_MAC,
        model: CONTROLLER_MODEL,
        firmwareVersion: '1.0-v5-sim'
    }
);

const scenarioEngine = new ScenarioEngine(deviceState);

// Active controller selection
let activeController = 'Arduino_Uno_R4_WiFi';

// SSE clients for real-time UDP log
const sseClients: Set<any> = new Set();

// ============ UDP Server ============

const udpServer = dgram.createSocket('udp4');

udpServer.on('error', (err) => {
    console.error(`[UDP] Server error:\n${err.stack}`);
    udpServer.close();
});

udpServer.on('message', (msg, rinfo) => {
    const command = msg.toString().trim();
    const timestamp = new Date().toISOString();
    console.log(`[UDP] ← ${rinfo.address}:${rinfo.port} | ${command}`);

    // Broadcast incoming command to SSE clients
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

        // Broadcast response to SSE clients
        broadcastToSSE({
            type: 'outgoing',
            response: responseStr,
            timestamp
        });

        udpServer.send(responseStr, rinfo.port, rinfo.address, (err) => {
            if (err) console.error('[UDP] Send error:', err);
        });
    }
});

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

udpServer.on('listening', () => {
    const address = udpServer.address();
    console.log(`[UDP] Simulator listening on ${address.address}:${address.port}`);
});

udpServer.bind(UDP_PORT);

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

// Set active controller
app.post('/api/controller/:key', (req, res) => {
    const { key } = req.params;
    const controller = controllerRegistry.getController(key);
    if (!controller) {
        return res.status(404).json({ success: false, error: 'Controller not found' });
    }
    activeController = key;
    pinManager.clear(); // Clear assignments when switching controller
    res.json({ success: true, controller: key });
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
    const { controller, assignments } = req.body;
    if (controller) {
        activeController = controller;
    }
    if (assignments) {
        pinManager.importConfig(assignments);
    }
    res.json({ success: true });
});

app.listen(HTTP_PORT, () => {
    console.log(`[HTTP] Control UI at http://localhost:${HTTP_PORT}`);
});

// ============ Graceful Shutdown ============

process.on('SIGINT', () => {
    console.log('\n[SIM] Shutting down...');
    scenarioEngine.stopScenario();
    udpServer.close();
    process.exit(0);
});

console.log(`
╔═══════════════════════════════════════════════════════╗
║       HYDROPONICS HARDWARE SIMULATOR v2.0             ║
╠═══════════════════════════════════════════════════════╣
║  UDP Port:  ${UDP_PORT.toString().padEnd(42)}║
║  HTTP Port: ${HTTP_PORT.toString().padEnd(42)}║
║  Controller: ${activeController.padEnd(41)}║
║  MAC:       ${CONTROLLER_MAC.padEnd(42)}║
╚═══════════════════════════════════════════════════════╝
`);

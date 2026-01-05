/**
 * Hydroponics Hardware Simulator
 * 
 * Standalone UDP server that mimics real ESP32/Arduino controllers.
 * Enables testing without physical hardware.
 */

import dgram from 'dgram';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { DeviceState } from './DeviceState';
import { UdpProtocolHandler } from './UdpProtocolHandler';
import { ScenarioEngine } from './ScenarioEngine';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const UDP_PORT = parseInt(process.env.UDP_PORT || '8888');
const HTTP_PORT = parseInt(process.env.HTTP_PORT || '3001');
const CONTROLLER_MAC = process.env.MAC || 'SIM:00:00:00:00:01';
const CONTROLLER_MODEL = process.env.MODEL || 'Simulator-ESP32';

// Initialize components
const deviceState = new DeviceState();
const protocolHandler = new UdpProtocolHandler(deviceState, {
    mac: CONTROLLER_MAC,
    model: CONTROLLER_MODEL,
    firmwareVersion: '1.0-v5-sim'
});
const scenarioEngine = new ScenarioEngine(deviceState);

// ============ UDP Server ============

const udpServer = dgram.createSocket('udp4');

udpServer.on('error', (err) => {
    console.error(`[UDP] Server error:\n${err.stack}`);
    udpServer.close();
});

udpServer.on('message', (msg, rinfo) => {
    const command = msg.toString().trim();
    console.log(`[UDP] ← ${rinfo.address}:${rinfo.port} | ${command}`);

    const response = protocolHandler.handleCommand(command);

    if (response !== null) {
        const responseStr = typeof response === 'string' ? response : JSON.stringify(response);
        console.log(`[UDP] → ${responseStr}`);

        udpServer.send(responseStr, rinfo.port, rinfo.address, (err) => {
            if (err) console.error('[UDP] Send error:', err);
        });
    }
});

udpServer.on('listening', () => {
    const address = udpServer.address();
    console.log(`[UDP] Simulator listening on ${address.address}:${address.port}`);
});

udpServer.bind(UDP_PORT);

// ============ HTTP Server (UI) ============

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// API: Get current state
app.get('/api/state', (req, res) => {
    res.json(deviceState.getFullState());
});

// API: Update sensor value
app.post('/api/sensor/:name', (req, res) => {
    const { name } = req.params;
    const { value } = req.body;
    deviceState.setSensorValue(name, value);
    res.json({ success: true, sensor: name, value });
});

// API: Toggle relay
app.post('/api/relay/:pin', (req, res) => {
    const { pin } = req.params;
    const { state } = req.body;
    deviceState.setRelayState(pin, state);
    res.json({ success: true, pin, state });
});

// API: List scenarios
app.get('/api/scenarios', (req, res) => {
    res.json(scenarioEngine.listScenarios());
});

// API: Start scenario
app.post('/api/scenario/:name/start', (req, res) => {
    try {
        scenarioEngine.startScenario(req.params.name);
        res.json({ success: true, scenario: req.params.name });
    } catch (e: any) {
        res.status(400).json({ success: false, error: e.message });
    }
});

// API: Stop scenario
app.post('/api/scenario/stop', (req, res) => {
    scenarioEngine.stopScenario();
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
║       HYDROPONICS HARDWARE SIMULATOR v1.0             ║
╠═══════════════════════════════════════════════════════╣
║  UDP Port:  ${UDP_PORT.toString().padEnd(42)}║
║  HTTP Port: ${HTTP_PORT.toString().padEnd(42)}║
║  MAC:       ${CONTROLLER_MAC.padEnd(42)}║
║  Model:     ${CONTROLLER_MODEL.padEnd(42)}║
╚═══════════════════════════════════════════════════════╝
`);

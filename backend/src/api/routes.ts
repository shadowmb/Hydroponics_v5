import { FastifyInstance } from 'fastify';
import { HardwareController } from './controllers/HardwareController';
import { AutomationController } from './controllers/AutomationController';
import { SessionController } from './controllers/SessionController';
import { ProgramController } from './controllers/ProgramController';
import { FirmwareGeneratorController } from './controllers/FirmwareGeneratorController';

export async function apiRoutes(app: FastifyInstance) {

    // Hardware Routes
    app.get('/api/hardware/serial-ports', HardwareController.getSerialPorts);
    app.post('/api/hardware/command', HardwareController.sendCommand);
    // Device Management
    app.get('/api/hardware/device-templates', HardwareController.getDeviceTemplates);
    app.get('/api/hardware/devices', HardwareController.getDevices);
    app.post('/api/hardware/devices', HardwareController.createDevice);
    app.put('/api/hardware/devices/:id', HardwareController.updateDevice);
    app.delete('/api/hardware/devices/:id', HardwareController.deleteDevice);
    app.post('/api/hardware/devices/:id/test', HardwareController.testDevice);

    // Controller Management
    app.get('/api/hardware/templates', HardwareController.getTemplates);
    app.get('/api/hardware/controllers', HardwareController.getControllers);
    app.post('/api/hardware/controllers', HardwareController.createController);
    app.get('/api/hardware/controllers/:id', HardwareController.getController);
    app.put('/api/hardware/controllers/:id', HardwareController.updateController);
    app.delete('/api/hardware/controllers/:id', HardwareController.deleteController);
    app.post('/api/hardware/sync-status', HardwareController.syncStatus);


    // Discovery Routes
    app.post('/api/discovery/scan', require('./controllers/discovery-controller').scanNetwork);

    // Firmware Generator Routes
    app.get('/api/firmware/controllers', FirmwareGeneratorController.getControllers);
    app.get('/api/firmware/commands', FirmwareGeneratorController.getCommands);
    app.post('/api/firmware/validate', FirmwareGeneratorController.validate);
    app.post('/api/firmware/generate', FirmwareGeneratorController.generate);

    // Relay Management
    app.get('/api/hardware/relays', HardwareController.getRelays);
    app.post('/api/hardware/relays', HardwareController.createRelay);
    app.put('/api/hardware/relays/:id', HardwareController.updateRelay);
    app.delete('/api/hardware/relays/:id', HardwareController.deleteRelay);

    // Automation Routes
    app.post('/api/automation/start', AutomationController.start);
    app.post('/api/automation/stop', AutomationController.stop);
    app.post('/api/automation/pause', AutomationController.pause);
    app.post('/api/automation/resume', AutomationController.resume);
    app.get('/api/automation/status', AutomationController.getStatus);

    // Session Routes
    // Session Routes
    app.get('/api/sessions/:id', SessionController.getSession);

    // Program Routes
    app.post('/api/programs', ProgramController.create);
    app.get('/api/programs', ProgramController.list);
    app.get('/api/programs/:id', ProgramController.get);
    app.put('/api/programs/:id', ProgramController.update);
    app.delete('/api/programs/:id', ProgramController.delete);
}

import { FastifyInstance } from 'fastify';
import { HardwareController } from './controllers/HardwareController';
import { AutomationController } from './controllers/AutomationController';
import { SessionController } from './controllers/SessionController';
import { FlowController } from './controllers/FlowController';
import { ProgramController } from './controllers/ProgramController';
import { NotificationController } from './controllers/NotificationController';
import { NotificationRuleController } from './controllers/NotificationRuleController';

export async function apiRoutes(app: FastifyInstance) {

    // Notification Routes
    app.get('/api/notifications/channels', NotificationController.getChannels);
    app.post('/api/notifications/channels', NotificationController.createChannel);
    app.put('/api/notifications/channels/:id', NotificationController.updateChannel);
    app.delete('/api/notifications/channels/:id', NotificationController.deleteChannel);

    app.get('/api/notifications/providers', NotificationController.getProviders);
    app.post('/api/notifications/providers', NotificationController.createProvider);
    app.put('/api/notifications/providers/:id', NotificationController.updateProvider);
    app.delete('/api/notifications/providers/:id', NotificationController.deleteProvider);
    app.post('/api/notifications/providers/test', NotificationController.testProvider);

    // Hardware Routes
    app.get('/api/hardware/serial-ports', HardwareController.getSerialPorts);
    app.post('/api/hardware/command', HardwareController.sendCommand);
    // Device Management
    app.get('/api/hardware/device-templates', HardwareController.getDeviceTemplates);
    app.get('/api/hardware/template-units', HardwareController.getTemplateUnits);
    app.get('/api/hardware/devices', HardwareController.getDevices);
    app.get('/api/hardware/devices/pinned', HardwareController.getPinnedDevices);
    app.post('/api/hardware/devices', HardwareController.createDevice);
    app.put('/api/hardware/devices/:id', HardwareController.updateDevice);
    app.patch('/api/hardware/devices/:id/pin', HardwareController.togglePinDevice);
    app.delete('/api/hardware/devices/:id', HardwareController.deleteDevice);
    app.post('/api/hardware/devices/:id/restore', HardwareController.restoreDevice);
    app.delete('/api/hardware/devices/:id/hard', HardwareController.hardDeleteDevice);
    app.post('/api/hardware/devices/:id/test', HardwareController.testDevice);
    app.get('/api/hardware/devices/:id/history', HardwareController.getDeviceHistory);
    app.post('/api/hardware/devices/:id/refresh', HardwareController.refreshDevice);
    app.get('/api/hardware/devices/:id/available-units', HardwareController.getAvailableUnits);

    // Controller Management
    app.get('/api/hardware/templates', HardwareController.getTemplates);
    app.get('/api/hardware/controllers', HardwareController.getControllers);
    app.post('/api/hardware/controllers', HardwareController.createController);
    app.get('/api/hardware/controllers/:id', HardwareController.getController);
    app.put('/api/hardware/controllers/:id', HardwareController.updateController);
    app.delete('/api/hardware/controllers/:id', HardwareController.deleteController);
    app.post('/api/hardware/controllers/:id/restore', HardwareController.restoreController);
    app.delete('/api/hardware/controllers/:id/hard', HardwareController.hardDeleteController);
    app.post('/api/hardware/sync-status', HardwareController.syncStatus);
    app.post('/api/hardware/controllers/:id/refresh', HardwareController.refreshController);


    // Discovery Routes
    app.post('/api/discovery/scan', require('./controllers/discovery-controller').scanNetwork);


    // Firmware Builder Routes (v5)
    const builderController = new (require('./controllers/FirmwareBuilderController').FirmwareBuilderController)();
    app.get('/api/firmware/builder/boards', builderController.getBoards);
    app.get('/api/firmware/builder/transports', builderController.getTransports);
    app.get('/api/firmware/builder/plugins', builderController.getPlugins);
    app.get('/api/firmware/builder/commands', builderController.getCommands);
    app.post('/api/firmware/builder/build', builderController.buildFirmware);

    app.get('/api/hardware/relays', HardwareController.getRelays);
    app.post('/api/hardware/relays', HardwareController.createRelay);
    app.put('/api/hardware/relays/:id', HardwareController.updateRelay);
    app.delete('/api/hardware/relays/:id', HardwareController.deleteRelay);
    app.post('/api/hardware/relays/:id/restore', HardwareController.restoreRelay);
    app.delete('/api/hardware/relays/:id/hard', HardwareController.hardDeleteRelay);
    app.post('/api/hardware/relays/:id/refresh', HardwareController.refreshRelay);

    // Automation Routes
    app.post('/api/automation/load', AutomationController.load);
    app.post('/api/automation/start', AutomationController.start);
    app.post('/api/automation/stop', AutomationController.stop);
    app.post('/api/automation/unload', AutomationController.unload);
    app.post('/api/automation/pause', AutomationController.pause);
    app.post('/api/automation/resume', AutomationController.resume);
    app.get('/api/automation/status', AutomationController.getStatus);
    app.get('/api/system/status', AutomationController.getSystemStatus);

    // Session Routes
    // Session Routes
    app.get('/api/sessions/:id', SessionController.getSession);

    // Calibration Routes
    app.get('/api/calibration/strategies', require('./controllers/CalibrationController').CalibrationController.getStrategies);
    app.post('/api/hardware/devices/:id/calibration', require('./controllers/CalibrationController').CalibrationController.saveCalibration);
    app.delete('/api/hardware/devices/:id/calibration/:strategyId', require('./controllers/CalibrationController').CalibrationController.deleteCalibration);

    // Flow Routes (formerly Programs)
    app.post('/api/flows', FlowController.create);
    app.get('/api/flows', FlowController.list);
    app.get('/api/flows/:id', FlowController.get);
    app.put('/api/flows/:id', FlowController.update);
    app.delete('/api/flows/:id', FlowController.delete);
    app.post('/api/flows/:id/restore', FlowController.restore);
    app.delete('/api/flows/:id/hard', FlowController.hardDelete);

    // Cycle Routes - Removed
    // app.register(require('./routes/cycles').cycleRoutes, { prefix: '/api/cycles' });

    // Program Routes
    app.post('/api/programs', ProgramController.create);
    app.get('/api/programs', ProgramController.list);
    app.get('/api/programs/:id', ProgramController.get);
    app.put('/api/programs/:id', ProgramController.update);
    app.delete('/api/programs/:id', ProgramController.delete);
    app.post('/api/programs/:id/restore', ProgramController.restore);
    app.delete('/api/programs/:id/hard', ProgramController.hardDelete);
    app.get('/api/scheduler/status', ProgramController.getSchedulerStatus);
    app.post('/api/scheduler/start', ProgramController.startScheduler);
    app.post('/api/scheduler/stop', ProgramController.stopScheduler);

    // Active Program Routes
    const ActiveProgramController = require('./controllers/ActiveProgramController').ActiveProgramController;
    app.get('/api/active-program', ActiveProgramController.getActive);
    app.get('/api/active-program/variables', ActiveProgramController.getVariables);
    app.post('/api/active-program/load', ActiveProgramController.load);
    app.patch('/api/active-program/update', ActiveProgramController.update);
    app.post('/api/active-program/start', ActiveProgramController.start);
    app.post('/api/active-program/stop', ActiveProgramController.stop);
    app.post('/api/active-program/pause', ActiveProgramController.pause);
    app.post('/api/active-program/unload', ActiveProgramController.unload);
    app.patch('/api/active-program/schedule/:itemId', ActiveProgramController.updateScheduleItem);
    app.post('/api/active-program/schedule/swap', ActiveProgramController.swapCycles);
    app.post('/api/active-program/schedule/:itemId/skip', ActiveProgramController.skipCycle);
    app.post('/api/active-program/schedule/:itemId/restore', ActiveProgramController.restoreCycle);
    app.post('/api/active-program/schedule/:itemId/retry', ActiveProgramController.retryCycle);
    app.post('/api/active-program/schedule/:itemId/force-start', ActiveProgramController.forceStartCycle);
    app.post('/api/active-program/windows/:windowId/skip', ActiveProgramController.skipWindow);
    app.post('/api/active-program/windows/:windowId/restore', ActiveProgramController.restoreWindow);

    // Notification Rules (System)
    app.get('/api/notifications/rules', NotificationRuleController.list);
    app.put('/api/notifications/rules/:event', NotificationRuleController.update);
}

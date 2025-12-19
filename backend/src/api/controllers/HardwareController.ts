import { FastifyRequest, FastifyReply } from 'fastify';
import { hardware } from '../../modules/hardware/HardwareService';
import { HardwareCommandSchema } from '../schemas/requests';
import { logger } from '../../core/LoggerService';
import { Controller } from '../../models/Controller';
import { ControllerTemplate } from '../../models/ControllerTemplate';
import { DeviceTemplate, IDeviceTemplate } from '../../models/DeviceTemplate';

export class HardwareController {

    // --- Serial Ports ---

    static async getSerialPorts(req: FastifyRequest, reply: FastifyReply) {
        try {
            // Dynamic import to avoid issues if the module isn't perfectly installed in all envs
            const { SerialPort } = await import('serialport');
            const ports = await SerialPort.list();
            return reply.send({ success: true, data: ports });
        } catch (error) {
            // Return empty list instead of error to avoid breaking UI
            return reply.send({ success: true, data: [] });
        }
    }

    static async refreshDevice(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = req.params as { id: string };
            await hardware.refreshDeviceStatus(id);
            return reply.send({ success: true });
        } catch (error: any) {
            req.log.error(error);
            return reply.status(500).send({ success: false, error: error.message || 'Failed to refresh device' });
        }
    }

    static async refreshController(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = req.params as { id: string };
            await hardware.refreshControllerStatus(id);
            return reply.send({ success: true });
        } catch (error: any) {
            req.log.error(error);
            return reply.status(500).send({ success: false, error: error.message || 'Failed to refresh controller' });
        }
    }

    static async refreshRelay(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = req.params as { id: string };
            await hardware.refreshRelayStatus(id);
            return reply.send({ success: true });
        } catch (error: any) {
            req.log.error(error);
            return reply.status(500).send({ success: false, error: error.message || 'Failed to refresh relay' });
        }
    }

    // --- Templates ---

    static async getTemplates(req: FastifyRequest, reply: FastifyReply) {
        try {
            console.log('Schema _id type:', (ControllerTemplate.schema.paths['_id'] as any).instance);
            const templates = await ControllerTemplate.find();
            return reply.send({
                success: true,
                data: templates,
                debug: { schemaIdType: (ControllerTemplate.schema.paths['_id'] as any).instance }
            });
        } catch (error) {
            req.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to fetch templates' });
        }
    }

    // --- Controllers ---

    static async createController(req: FastifyRequest, reply: FastifyReply) {
        try {
            const body = req.body as any;

            // Check if template exists
            const template = await ControllerTemplate.findOne({ key: body.type });
            if (!template) {
                return reply.status(400).send({ success: false, error: 'Invalid controller type' });
            }

            const ports = new Map();
            template.ports.forEach(p => {
                ports.set(p.id, {
                    isActive: !p.reserved,
                    isOccupied: false,
                    pwm: p.pwm || false,
                    interface: p.interface
                });
            });

            const controller = new Controller({
                ...body,
                ports,
                status: 'offline' // Always starts offline
            });

            await controller.save();
            return reply.send({ success: true, data: controller });
        } catch (error: any) {
            req.log.error(error);
            if (error.code === 11000) {
                return reply.status(400).send({ success: false, error: 'Controller with this name or MAC already exists' });
            }
            return reply.status(500).send({ success: false, error: error.message || 'Failed to create controller' });
        }
    }

    static async getControllers(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { deleted } = req.query as { deleted?: string };

            let query = Controller.find();
            if (deleted === 'true') {
                // @ts-ignore
                query = Controller.find({ deletedAt: { $ne: null } }).setOptions({ withDeleted: true });
            }

            const controllers = await query.sort({ createdAt: -1 });
            return reply.send({ success: true, data: controllers });
        } catch (error) {
            req.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to fetch controllers' });
        }
    }

    static async getController(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = req.params as { id: string };
            const controller = await Controller.findById(id);
            if (!controller) {
                return reply.status(404).send({ success: false, error: 'Controller not found' });
            }
            return reply.send({ success: true, data: controller });
        } catch (error) {
            req.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to fetch controller' });
        }
    }

    static async updateController(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = req.params as { id: string };
            const body = req.body as any;

            const controller = await Controller.findByIdAndUpdate(
                id,
                { $set: body },
                { new: true }
            );

            if (!controller) {
                return reply.status(404).send({ success: false, error: 'Controller not found' });
            }

            // If deactivated, force disconnect
            if (body.isActive === false) {
                await hardware.disconnectController(id);
                await hardware.refreshControllerStatus(id); // This will cascade 'offline' status
            }

            return reply.send({ success: true, data: controller });
        } catch (error) {
            req.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to update controller' });
        }
    }

    static async deleteController(req: FastifyRequest, reply: FastifyReply) {
        try {
            console.log('Deleting controller...');
            const { id } = req.params as { id: string };
            const { DeviceModel } = await import('../../models/Device');
            const { Relay } = await import('../../models/Relay');

            const controller = await Controller.findById(id);
            if (!controller) {
                return reply.status(404).send({ success: false, error: 'Controller not found' });
            }

            // 1. Detach Devices
            await DeviceModel.updateMany(
                { 'hardware.parentId': id },
                { $set: { 'hardware.parentId': null, 'hardware.port': null } }
            );

            // 2. Detach Relays
            await Relay.updateMany(
                { controllerId: id },
                { $set: { controllerId: null } }
            );

            // 3. Soft Delete Controller
            await controller.softDelete();

            return reply.send({ success: true, message: 'Controller deleted and devices/relays detached' });
        } catch (error) {
            console.error('Error deleting controller:', error);
            req.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to delete controller' });
        }
    }

    static async restoreController(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = req.params as { id: string };
            const { name } = req.body as { name?: string };
            // @ts-ignore
            const controller = await Controller.findOne({ _id: id, deletedAt: { $ne: null } }).setOptions({ withDeleted: true });
            if (!controller) {
                return reply.status(404).send({ success: false, error: 'Controller not found in recycle bin' });
            }

            if (name) {
                const existing = await Controller.findOne({ name, _id: { $ne: id } });
                if (existing) {
                    return reply.status(400).send({ success: false, error: 'Controller name already exists' });
                }
                controller.name = name;
            }

            await controller.restore();
            return reply.send({ success: true, message: 'Controller restored' });
        } catch (error: any) {
            req.log.error(error);
            return reply.status(500).send({ success: false, error: error.message || 'Failed to restore controller' });
        }
    }

    static async hardDeleteController(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = req.params as { id: string };
            // @ts-ignore
            const controller = await Controller.findOne({ _id: id, deletedAt: { $ne: null } }).setOptions({ withDeleted: true });
            if (!controller) {
                return reply.status(404).send({ success: false, error: 'Controller not found in recycle bin' });
            }
            // @ts-ignore
            await Controller.deleteOne({ _id: id }, { hardDelete: true });
            return reply.send({ success: true, message: 'Controller permanently deleted' });
        } catch (error: any) {
            req.log.error(error);
            return reply.status(500).send({ success: false, error: error.message || 'Failed to permanently delete controller' });
        }
    }

    // --- Relays ---

    static async createRelay(req: FastifyRequest, reply: FastifyReply) {
        try {
            const body = req.body as any;
            const { Relay } = await import('../../models/Relay'); // Dynamic import to avoid circular deps if any

            // 1. Validate Input
            if (!body.name || !body.controllerId || !body.type || !body.channels) {
                return reply.status(400).send({ success: false, error: 'Missing required fields' });
            }

            // 2. Get Controller
            const controller = await Controller.findById(body.controllerId);
            if (!controller) {
                return reply.status(404).send({ success: false, error: 'Controller not found' });
            }

            // 3. Validate Ports Availability
            const channels = body.channels as any[];
            let hasMappedPort = false;

            for (const channel of channels) {
                const portId = channel.controllerPortId;
                if (portId) {
                    hasMappedPort = true;
                    const portState = controller.ports.get(portId);

                    if (!portState) {
                        return reply.status(400).send({ success: false, error: `Invalid port ${portId}` });
                    }
                    if (portState.isOccupied) {
                        return reply.status(400).send({ success: false, error: `Port ${portId} is already occupied` });
                    }
                }
            }

            if (!hasMappedPort) {
                return reply.status(400).send({ success: false, error: 'At least one channel must be mapped to a controller port' });
            }

            // 4. Create Relay
            const relay = new Relay({
                name: body.name,
                controllerId: body.controllerId,
                type: body.type,
                channels: body.channels,
                description: body.description
            });
            await relay.save();

            // 5. Update Controller Ports (Mark as Occupied)
            const updatedPorts = controller.ports; // Mongoose Map
            channels.forEach((channel: any) => {
                if (channel.controllerPortId) {
                    const portState = updatedPorts.get(channel.controllerPortId);
                    if (portState) {
                        portState.isOccupied = true;
                        portState.occupiedBy = {
                            type: 'relay',
                            id: relay._id.toString(),
                            name: relay.name
                        };
                        // Ensure port is active so relay works
                        portState.isActive = true;
                    }
                }
            });

            // We must set the path modified for Map types in Mongoose if we mutate deep props
            // But here we are setting properties on the object returned by .get()
            // Mongoose Map handling can be tricky. Best to use set()
            // Re-setting the modified map
            controller.markModified('ports');
            await controller.save();

            return reply.send({ success: true, data: relay });

        } catch (error: any) {
            req.log.error(error);
            return reply.status(500).send({ success: false, error: error.message || 'Failed to create relay' });
        }
    }
    static async getRelays(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { Relay } = await import('../../models/Relay');
            const { deleted } = req.query as { deleted?: string };

            let query = Relay.find();
            if (deleted === 'true') {
                // @ts-ignore
                query = Relay.find({ deletedAt: { $ne: null } }).setOptions({ withDeleted: true });
            }

            const relays = await query.populate('controllerId', 'name');
            return reply.send({ success: true, data: relays });
        } catch (error) {
            req.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to fetch relays' });
        }
    }

    static async updateRelay(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = req.params as { id: string };
            const body = req.body as any;
            const { Relay } = await import('../../models/Relay');

            // 1. Find Existing Relay
            const relay = await Relay.findById(id);
            if (!relay) {
                return reply.status(404).send({ success: false, error: 'Relay not found' });
            }

            // 2. Free up OLD Controller Ports
            // We do this first to ensure ports are available if we are just re-mapping on the same controller
            const oldController = await Controller.findById(relay.controllerId);
            if (oldController) {
                relay.channels.forEach((channel: any) => {
                    if (channel.controllerPortId) {
                        const portState = oldController.ports.get(channel.controllerPortId);
                        // Only free if it was occupied by THIS relay
                        if (portState && portState.occupiedBy?.id === relay._id.toString()) {
                            portState.isOccupied = false;
                            portState.occupiedBy = undefined;
                        }
                    }
                });
                oldController.markModified('ports');
                await oldController.save();
            }

            // 3. Validate NEW Input
            if (!body.name || !body.controllerId || !body.type || !body.channels) {
                return reply.status(400).send({ success: false, error: 'Missing required fields' });
            }

            // 4. Get NEW Controller
            const newController = await Controller.findById(body.controllerId);
            if (!newController) {
                return reply.status(404).send({ success: false, error: 'New controller not found' });
            }

            // 5. Validate NEW Ports Availability
            const channels = body.channels as any[];
            let hasMappedPort = false;

            for (const channel of channels) {
                const portId = channel.controllerPortId;
                if (portId) {
                    hasMappedPort = true;
                    const portState = newController.ports.get(portId);

                    if (!portState) {
                        // Rollback: If validation fails, we should ideally re-occupy old ports, 
                        // but for simplicity in this context we'll just error. 
                        // In a real tx we'd abort.
                        return reply.status(400).send({ success: false, error: `Invalid port ${portId}` });
                    }
                    if (portState.isOccupied) {
                        return reply.status(400).send({ success: false, error: `Port ${portId} is already occupied` });
                    }
                }
            }

            if (!hasMappedPort) {
                return reply.status(400).send({ success: false, error: 'At least one channel must be mapped to a controller port' });
            }

            // 6. Update Relay Document
            relay.name = body.name;
            relay.controllerId = body.controllerId;
            relay.type = body.type;
            relay.channels = body.channels;
            relay.description = body.description;
            await relay.save();

            // 7. Occupy NEW Controller Ports
            const updatedPorts = newController.ports;
            channels.forEach((channel: any) => {
                if (channel.controllerPortId) {
                    const portState = updatedPorts.get(channel.controllerPortId);
                    if (portState) {
                        portState.isOccupied = true;
                        portState.occupiedBy = {
                            type: 'relay',
                            id: relay._id.toString(),
                            name: relay.name
                        };
                        portState.isActive = true;
                    }
                }
            });

            newController.markModified('ports');
            await newController.save();

            return reply.send({ success: true, data: relay });

        } catch (error: any) {
            req.log.error(error);
            return reply.status(500).send({ success: false, error: error.message || 'Failed to update relay' });
        }
    }

    static async deleteRelay(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = req.params as { id: string };
            const { Relay } = await import('../../models/Relay');

            // 1. Find Relay
            const relay = await Relay.findById(id);
            if (!relay) {
                return reply.status(404).send({ success: false, error: 'Relay not found' });
            }

            // 2. Free up Controller Ports
            const controller = await Controller.findById(relay.controllerId);
            if (controller) {
                relay.channels.forEach((channel: any) => {
                    if (channel.controllerPortId) {
                        const portState = controller.ports.get(channel.controllerPortId);
                        if (portState && portState.occupiedBy?.id === relay._id.toString()) {
                            portState.isOccupied = false;
                            portState.occupiedBy = undefined;
                        }
                    }
                });
                controller.markModified('ports');
                await controller.save();
            }

            // 3. Delete Relay (Soft Delete)
            // @ts-ignore
            const relayToDelete = await Relay.findById(id);
            if (relayToDelete) {
                // @ts-ignore
                await relayToDelete.softDelete();
            }

            return reply.send({ success: true, message: 'Relay deleted' });
        } catch (error) {
            req.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to delete relay' });
        }
    }

    static async restoreRelay(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = req.params as { id: string };
            const { name } = req.body as { name?: string };
            const { Relay } = await import('../../models/Relay');
            // @ts-ignore
            const relay = await Relay.findOne({ _id: id, deletedAt: { $ne: null } }).setOptions({ withDeleted: true });
            if (!relay) {
                return reply.status(404).send({ success: false, error: 'Relay not found in recycle bin' });
            }

            if (name) {
                const existing = await Relay.findOne({ name, _id: { $ne: id } });
                if (existing) {
                    return reply.status(400).send({ success: false, error: 'Relay name already exists' });
                }
                relay.name = name;
            }

            await relay.restore();
            return reply.send({ success: true, message: 'Relay restored' });
        } catch (error: any) {
            req.log.error(error);
            return reply.status(500).send({ success: false, error: error.message || 'Failed to restore relay' });
        }
    }

    static async hardDeleteRelay(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = req.params as { id: string };
            const { Relay } = await import('../../models/Relay');
            // @ts-ignore
            const relay = await Relay.findOne({ _id: id, deletedAt: { $ne: null } }).setOptions({ withDeleted: true });
            if (!relay) {
                return reply.status(404).send({ success: false, error: 'Relay not found in recycle bin' });
            }
            // @ts-ignore
            await Relay.deleteOne({ _id: id }, { hardDelete: true });
            return reply.send({ success: true, message: 'Relay permanently deleted' });
        } catch (error: any) {
            req.log.error(error);
            return reply.status(500).send({ success: false, error: error.message || 'Failed to permanently delete relay' });
        }
    }

    static async sendCommand(req: FastifyRequest, reply: FastifyReply) {
        // 1. Validate Body
        const body = HardwareCommandSchema.parse(req.body);

        try {
            logger.info({ cmd: body }, '🎮 API Command Received');

            // 2. Execute
            const result = await hardware.sendCommand(
                body.deviceId,
                body.driverId,
                body.command,
                body.params,
                body.context
            );

            // 3. Response
            return reply.send({ success: true, data: result });

        } catch (error: any) {
            logger.error({ error }, '❌ API Command Failed');
            // Let Global Error Handler catch it, or throw specific
            throw { statusCode: 500, message: error.message };
        }
    }

    // --- Devices ---

    static async getDeviceTemplates(req: FastifyRequest, reply: FastifyReply) {
        try {
            const templates = await DeviceTemplate.find();
            return reply.send({ success: true, data: templates });
        } catch (error) {
            return reply.status(500).send({ success: false, error: 'Failed to fetch device templates' });
        }
    }

    static async getTemplateUnits(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { templates } = await import('../../modules/hardware/DeviceTemplateManager');
            const units = templates.getAllUnits();
            return reply.send({ success: true, data: units });
        } catch (error) {
            req.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to fetch template units' });
        }
    }

    static async getDevices(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { deleted } = req.query as { deleted?: string };
            const { DeviceModel } = await import('../../models/Device');

            let query = DeviceModel.find();
            if (deleted === 'true') {
                // @ts-ignore
                query = DeviceModel.find({ deletedAt: { $ne: null } }).setOptions({ withDeleted: true });
            }

            const devices = await query.populate('config.driverId'); // Populate template
            return reply.send({ success: true, data: devices });
        } catch (error) {
            req.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to fetch devices' });
        }
    }

    static async getPinnedDevices(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { DeviceModel } = await import('../../models/Device');

            // Get only pinned devices, sorted by dashboardOrder
            const devices = await DeviceModel.find({ dashboardPinned: true })
                .sort({ dashboardOrder: 1 })
                .populate('config.driverId')
                .limit(6); // Max 6 pinned devices

            return reply.send({ success: true, data: devices });
        } catch (error) {
            req.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to fetch pinned devices' });
        }
    }

    static async togglePinDevice(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = req.params as { id: string };
            const { pinned, order } = req.body as { pinned: boolean; order?: number };
            const { DeviceModel } = await import('../../models/Device');

            const device = await DeviceModel.findById(id);
            if (!device) {
                return reply.status(404).send({ success: false, error: 'Device not found' });
            }

            // Check if we're trying to pin and already have 6 pinned
            if (pinned) {
                const pinnedCount = await DeviceModel.countDocuments({ dashboardPinned: true });
                if (pinnedCount >= 6 && !device.dashboardPinned) {
                    return reply.status(400).send({
                        success: false,
                        error: 'Maximum 6 devices can be pinned to dashboard'
                    });
                }
            }

            device.dashboardPinned = pinned;
            if (order !== undefined) {
                device.dashboardOrder = order;
            }

            await device.save();
            return reply.send({ success: true, data: device });
        } catch (error) {
            req.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to toggle pin device' });
        }
    }

    static async getAvailableUnits(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = req.params as { id: string };
            const { DeviceModel } = await import('../../models/Device');
            const { templates } = await import('../../modules/hardware/DeviceTemplateManager');
            // Use require to allow weak linking or dynamic loading of StrategyRegistry if needed
            // But usually, standard import works if we have path alias
            const { StrategyRegistry } = require('../../../../shared/strategies/StrategyRegistry');


            const device = await DeviceModel.findById(id);
            if (!device) return reply.status(404).send({ success: false, error: 'Device not found' });

            const driverId = String(device.config.driverId);
            // Use getTemplate to access full metadata (uiConfig, supportedStrategies) 
            // getDriver returns a subset focused on execution
            const template = templates.getTemplate(driverId);

            if (!template) return reply.status(404).send({ success: false, error: 'Driver template not found' });

            // 1. Check for Active Role in Template
            const activeRoleKey = device.config?.activeRole;
            const roleConfig = activeRoleKey && template.roles?.[activeRoleKey];

            if (roleConfig && roleConfig.units && roleConfig.units.length > 0) {
                // STRICT MODE: If role has units, return ONLY those.
                // This effectively hides "mm" when role is "volume".
                return reply.send({ success: true, data: roleConfig.units });
            }

            // 2. Base Units from Driver (Fallback)
            const units = new Set<string>(template.uiConfig?.units || []);

            // 3. Strategy Units (only calibrated ones) - Legacy/Fallback logic
            if (device.config.calibrations && template.supportedStrategies) {
                for (const strategyId of template.supportedStrategies) {
                    // Check if device has data for this strategy
                    if (device.config.calibrations[strategyId]) {
                        // Find strategy definition
                        const strategyDef = StrategyRegistry.get ? StrategyRegistry.get(strategyId) : (StrategyRegistry.STRATEGIES ? StrategyRegistry.STRATEGIES[strategyId] : undefined);
                        if (strategyDef && strategyDef.outputUnit && strategyDef.outputUnit !== 'any') {
                            units.add(strategyDef.outputUnit);
                        }
                    }
                }
            }

            return reply.send({ success: true, data: Array.from(units) });

        } catch (error: any) {
            req.log.error(error);
            return reply.status(500).send({ success: false, error: error.message || 'Failed to fetch available units' });
        }
    }

    static async createDevice(req: FastifyRequest, reply: FastifyReply) {
        try {
            const body = req.body as any;
            req.log.info({ body }, 'Create Device Body');
            const { DeviceModel } = await import('../../models/Device');

            // 1. Validate Input
            if (!body.name || !body.type || !body.config?.driverId) {
                return reply.status(400).send({ success: false, error: 'Missing required fields' });
            }

            // 2. Validate Template
            const template = await DeviceTemplate.findById(body.config.driverId);
            if (!template) {
                return reply.status(400).send({ success: false, error: 'Invalid device template' });
            }

            // 3. Validate Connection (Controller OR Relay)
            let controller: any = null;
            if (body.hardware?.parentId) {
                // --- Controller Connection ---
                controller = await Controller.findById(body.hardware.parentId);
                if (!controller) {
                    return reply.status(404).send({ success: false, error: 'Controller not found' });
                }

                // Check Single Port (Legacy)
                if (body.hardware.port) {
                    const portState = controller.ports.get(body.hardware.port);
                    if (portState && portState.isOccupied) {
                        return reply.status(400).send({ success: false, error: `Port ${body.hardware.port} is already occupied` });
                    }
                }

                // Check Multi-Pins
                if (body.hardware.pins && !Array.isArray(body.hardware.pins)) {
                    // Transform map to array for validation and saving
                    const pinsMap = body.hardware.pins;
                    const pinsArray = [];

                    for (const [role, portId] of Object.entries(pinsMap)) {
                        // Resolve GPIO
                        const resolved = await HardwareController.resolvePins(body.hardware.parentId, portId as string);
                        pinsArray.push({
                            role,
                            portId: portId as string,
                            gpio: resolved[0]?.gpio || 0
                        });
                    }

                    // Validate each pin
                    for (const pin of pinsArray) {
                        const portState = controller.ports.get(pin.portId);
                        if (portState && portState.isOccupied) {
                            return reply.status(400).send({ success: false, error: `Port ${pin.portId} (for ${pin.role}) is already occupied` });
                        }
                    }

                    // Update body to use array
                    body.hardware.pins = pinsArray;
                }
            } else if (body.hardware?.relayId) {
                // --- Relay Connection ---
                const { Relay } = await import('../../models/Relay');
                const relay = await Relay.findById(body.hardware.relayId);
                if (!relay) {
                    return reply.status(404).send({ success: false, error: 'Relay not found' });
                }

                const channelIndex = body.hardware.channel;
                const channel = relay.channels.find((c: any) => c.channelIndex === channelIndex);

                if (!channel) {
                    return reply.status(400).send({ success: false, error: 'Invalid relay channel' });
                }
                if (channel.isOccupied) {
                    return reply.status(400).send({ success: false, error: `Relay channel ${channelIndex} is already occupied` });
                }
            }

            // 4. Apply Template-Driven Defaults
            if (!body.config) body.config = {};

            // Apply defaultRole if not provided
            if (!body.config.activeRole && template.defaultRole) {
                body.config.activeRole = template.defaultRole;
                req.log.info({ role: body.config.activeRole }, '🔄 [HardwareController] Applied defaultRole from template');

                // If role was applied, also check for its defaultStrategy
                const roleDef = template.roles instanceof Map
                    ? template.roles.get(body.config.activeRole)
                    : (template.roles as any)?.[body.config.activeRole];

                if (roleDef?.defaultStrategy && !body.config.conversionStrategy) {
                    body.config.conversionStrategy = roleDef.defaultStrategy;
                    req.log.info({ strategy: body.config.conversionStrategy }, '🔄 [HardwareController] Applied defaultStrategy from template');
                }
            }

            // 5. Create Device
            // Merge tags: User tags + Template tags (deduplicated)
            const templateTags = template.uiConfig?.tags || [];
            const userTags = body.tags || [];
            const mergedTags = Array.from(new Set([...userTags, ...templateTags]));

            const device = new DeviceModel({
                name: body.name,
                type: body.type,
                hardware: body.hardware,
                config: body.config,
                tags: mergedTags, // Add tags support
                group: template.uiConfig?.category || 'Other' // Auto-populate group from template
            });

            await device.save();

            // 5. Occupy Port/Channel
            if (body.hardware?.parentId) {
                const updates: any = {};

                // Occupy Single Port
                if (body.hardware.port) {
                    updates[`ports.${body.hardware.port}.isOccupied`] = true;
                    updates[`ports.${body.hardware.port}.occupiedBy`] = {
                        type: 'device',
                        id: device._id,
                        name: device.name
                    };
                }

                // Occupy Multi-Pins
                if (body.hardware.pins && Array.isArray(body.hardware.pins)) {
                    body.hardware.pins.forEach((pin: any) => {
                        updates[`ports.${pin.portId}.isOccupied`] = true;
                        updates[`ports.${pin.portId}.occupiedBy`] = {
                            type: 'device',
                            id: device._id,
                            name: device.name
                        };
                    });
                }

                if (Object.keys(updates).length > 0) {
                    await Controller.updateOne(
                        { _id: body.hardware.parentId },
                        { $set: updates }
                    );
                }
            } else if (body.hardware?.relayId) {
                const { Relay } = await import('../../models/Relay');
                await Relay.updateOne(
                    { _id: body.hardware.relayId, 'channels.channelIndex': body.hardware.channel },
                    {
                        $set: {
                            'channels.$.isOccupied': true,
                            'channels.$.occupiedBy': {
                                type: 'device',
                                id: device._id,
                                name: device.name
                            }
                        }
                    }
                );
            }

            return reply.send({ success: true, data: device });
        } catch (error) {
            req.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to create device' });
        }
    }

    static async updateDevice(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = req.params as { id: string };
            const body = req.body as any;
            const { DeviceModel } = await import('../../models/Device');

            const device = await DeviceModel.findById(id);
            if (!device) {
                return reply.status(404).send({ success: false, error: 'Device not found' });
            }

            // Transform Multi-Pins Map to Array (if present)
            if (body.hardware?.pins && !Array.isArray(body.hardware.pins)) {
                const pins = [];
                for (const [role, portId] of Object.entries(body.hardware.pins)) {
                    // Resolve GPIO
                    const resolved = await HardwareController.resolvePins(body.hardware.parentId || device.hardware.parentId, portId as string);
                    pins.push({
                        role,
                        portId: portId as string,
                        gpio: resolved[0]?.gpio || 0
                    });
                }
                body.hardware.pins = pins;
            }

            // Handle Hardware Changes (Free old, Occupy new)
            const oldHardware = device.hardware;
            const newHardware = body.hardware;

            // Only process if hardware config changed
            if (newHardware && (
                oldHardware?.parentId !== newHardware.parentId ||
                oldHardware?.port !== newHardware.port ||
                oldHardware?.relayId !== newHardware.relayId ||
                oldHardware?.channel !== newHardware.channel ||
                JSON.stringify(oldHardware?.pins) !== JSON.stringify(newHardware.pins)
            )) {
                // 1. Free Old Resources
                if (oldHardware?.parentId) {
                    const oldController = await Controller.findById(oldHardware.parentId);
                    if (oldController) {
                        const updates: any = {};
                        const unsets: any = {};

                        // Free Single Port
                        if (oldHardware.port) {
                            const portState = oldController.ports.get(oldHardware.port);
                            if (portState && portState.occupiedBy?.id === device._id.toString()) {
                                updates[`ports.${oldHardware.port}.isOccupied`] = false;
                                unsets[`ports.${oldHardware.port}.occupiedBy`] = 1;
                            }
                        }

                        // Free Multi-Pins
                        if (oldHardware.pins && Array.isArray(oldHardware.pins)) {
                            oldHardware.pins.forEach((pin: any) => {
                                const portState = oldController.ports.get(pin.portId);
                                if (portState && portState.occupiedBy?.id === device._id.toString()) {
                                    updates[`ports.${pin.portId}.isOccupied`] = false;
                                    unsets[`ports.${pin.portId}.occupiedBy`] = 1;
                                }
                            });
                        }

                        if (Object.keys(updates).length > 0) {
                            await Controller.updateOne(
                                { _id: oldHardware.parentId },
                                { $set: updates, $unset: unsets }
                            );
                        }
                    }
                } else if (oldHardware?.relayId && oldHardware?.channel !== undefined) {
                    const { Relay } = await import('../../models/Relay');
                    const relay = await Relay.findById(oldHardware.relayId);
                    if (relay) {
                        const channel = relay.channels.find((c: any) => c.channelIndex === oldHardware.channel);
                        if (channel && channel.occupiedBy?.id === device._id.toString()) {
                            await Relay.updateOne(
                                { _id: oldHardware.relayId, 'channels.channelIndex': oldHardware.channel },
                                {
                                    $set: { 'channels.$.isOccupied': false },
                                    $unset: { 'channels.$.occupiedBy': 1 }
                                }
                            );
                        }
                    }
                }

                // 2. Occupy New Resources
                if (newHardware.parentId) {
                    const newController = await Controller.findById(newHardware.parentId);
                    if (newController) {
                        const updates: any = {};

                        // Occupy Single Port
                        if (newHardware.port) {
                            updates[`ports.${newHardware.port}.isOccupied`] = true;
                            updates[`ports.${newHardware.port}.occupiedBy`] = {
                                type: 'device',
                                id: device._id,
                                name: body.name || device.name
                            };
                        }

                        // Occupy Multi-Pins
                        if (newHardware.pins && Array.isArray(newHardware.pins)) {
                            newHardware.pins.forEach((pin: any) => {
                                updates[`ports.${pin.portId}.isOccupied`] = true;
                                updates[`ports.${pin.portId}.occupiedBy`] = {
                                    type: 'device',
                                    id: device._id,
                                    name: body.name || device.name
                                };
                            });
                        }

                        if (Object.keys(updates).length > 0) {
                            await Controller.updateOne(
                                { _id: newHardware.parentId },
                                { $set: updates }
                            );
                        }
                    }
                } else if (newHardware.relayId && newHardware.channel !== undefined) {
                    const { Relay } = await import('../../models/Relay');
                    await Relay.updateOne(
                        { _id: newHardware.relayId, 'channels.channelIndex': newHardware.channel },
                        {
                            $set: {
                                'channels.$.isOccupied': true,
                                'channels.$.occupiedBy': {
                                    type: 'device',
                                    id: device._id,
                                    name: body.name || device.name
                                }
                            }
                        }
                    );
                }
            }

            // Update device fields
            // Use set() to handle dot notation (e.g. 'config.validation') correctly
            Object.keys(body).forEach(key => {
                if (key !== 'hardware') { // Hardware is handled specially above
                    device.set(key, body[key]);
                }
            });
            await device.save();

            return reply.send({ success: true, data: device });
        } catch (error: any) {
            req.log.error(error);
            return reply.status(500).send({ success: false, error: error.message || 'Failed to update device' });
        }
    }

    static async deleteDevice(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = req.params as { id: string };
            const { DeviceModel } = await import('../../models/Device');
            const device = await DeviceModel.findById(id);
            if (!device) {
                return reply.status(404).send({ success: false, error: 'Device not found' });
            }

            // Free resources
            try {
                if (device.hardware?.parentId) {
                    const controller = await Controller.findById(device.hardware.parentId);
                    if (controller) {
                        const updates: any = {};
                        const unsets: any = {};

                        if (device.hardware.port) {
                            const portState = controller.ports.get(device.hardware.port);
                            if (portState && portState.occupiedBy?.id === device._id.toString()) {
                                updates[`ports.${device.hardware.port}.isOccupied`] = false;
                                unsets[`ports.${device.hardware.port}.occupiedBy`] = 1;
                            }
                        }

                        if (device.hardware.pins && Array.isArray(device.hardware.pins)) {
                            device.hardware.pins.forEach((pin: any) => {
                                const portState = controller.ports.get(pin.portId);
                                if (portState && portState.occupiedBy?.id === device._id.toString()) {
                                    updates[`ports.${pin.portId}.isOccupied`] = false;
                                    unsets[`ports.${pin.portId}.occupiedBy`] = 1;
                                }
                            });
                        }

                        if (Object.keys(updates).length > 0) {
                            await Controller.updateOne(
                                { _id: device.hardware.parentId },
                                { $set: updates, $unset: unsets }
                            );
                        }
                    }
                } else if (device.hardware?.relayId && device.hardware?.channel !== undefined) {
                    const { Relay } = await import('../../models/Relay');
                    const relay = await Relay.findById(device.hardware.relayId);
                    if (relay) {
                        const channel = relay.channels.find((c: any) => c.channelIndex === device.hardware.channel);
                        if (channel && channel.occupiedBy?.id === device._id.toString()) {
                            await Relay.updateOne(
                                { _id: device.hardware.relayId, 'channels.channelIndex': device.hardware.channel },
                                {
                                    $set: { 'channels.$.isOccupied': false },
                                    $unset: { 'channels.$.occupiedBy': 1 }
                                }
                            );
                        }
                    }
                }
            } catch (resourceError) {
                req.log.warn({ err: resourceError, deviceId: device._id }, 'Failed to free resources during device deletion (ignoring)');
            }

            await device.softDelete();
            return reply.send({ success: true, message: 'Device deleted' });
        } catch (error: any) {
            req.log.error(error);
            return reply.status(500).send({ success: false, error: error.message || 'Failed to delete device' });
        }
    }

    static async restoreDevice(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = req.params as { id: string };
            const { name } = req.body as { name?: string };
            const { DeviceModel } = await import('../../models/Device');
            // @ts-ignore
            const device = await DeviceModel.findOne({ _id: id, deletedAt: { $ne: null } }).setOptions({ withDeleted: true });
            if (!device) {
                return reply.status(404).send({ success: false, error: 'Device not found in recycle bin' });
            }

            if (name) {
                // Check for name collision
                const existing = await DeviceModel.findOne({ name, _id: { $ne: id } });
                if (existing) {
                    return reply.status(400).send({ success: false, error: 'Device name already exists' });
                }
                device.name = name;
            }

            await device.restore();
            return reply.send({ success: true, message: 'Device restored' });
        } catch (error: any) {
            req.log.error(error);
            return reply.status(500).send({ success: false, error: error.message || 'Failed to restore device' });
        }
    }

    static async hardDeleteDevice(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = req.params as { id: string };
            const { DeviceModel } = await import('../../models/Device');
            // @ts-ignore
            const device = await DeviceModel.findOne({ _id: id, deletedAt: { $ne: null } }).setOptions({ withDeleted: true });
            if (!device) {
                return reply.status(404).send({ success: false, error: 'Device not found in recycle bin' });
            }
            // @ts-ignore
            await DeviceModel.deleteOne({ _id: id }, { hardDelete: true });
            return reply.send({ success: true, message: 'Device permanently deleted' });
        } catch (error: any) {
            req.log.error(error);
            return reply.status(500).send({ success: false, error: error.message || 'Failed to permanently delete device' });
        }
    }

    static async getDeviceHistory(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = req.params as { id: string };
            const { startDate, endDate, limit } = req.query as { startDate?: string, endDate?: string, limit?: string };
            const { Reading } = await import('../../models/Reading');

            const query: any = { 'metadata.deviceId': id };

            if (startDate || endDate) {
                query.timestamp = {};
                if (startDate) query.timestamp.$gte = new Date(startDate);
                if (endDate) query.timestamp.$lte = new Date(endDate);
            }

            const limitVal = limit ? parseInt(limit) : 100;

            const readings = await Reading.find(query)
                .sort({ timestamp: -1 })
                .limit(limitVal);

            // Return in chronological order for charts
            return reply.send({ success: true, data: readings.reverse() });
        } catch (error: any) {
            req.log.error(error);
            return reply.status(500).send({ success: false, error: error.message || 'Failed to fetch device history' });
        }
    }

    static async testDevice(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = req.params as { id: string };
            const { strategy } = req.body as { strategy?: string };
            const result = await hardware.readSensorValue(id, strategy);
            return reply.send({ success: true, data: result });
        } catch (error: any) {
            req.log.error(error);
            return reply.status(500).send({ success: false, error: error.message || 'Test failed' });
        }
    }

    static async syncStatus(req: FastifyRequest, reply: FastifyReply) {
        try {
            logger.info('🔄 Syncing hardware status...');
            const results = await hardware.syncStatus();
            return reply.send({ success: true, data: results });
        } catch (error: any) {
            req.log.error(error);
            return reply.status(500).send({ success: false, error: error.message || 'Failed to sync status' });
        }
    }

    private static async resolvePins(controllerId: string, portId: string): Promise<{ role: string, portId: string, gpio: number }[]> {
        const controller = await Controller.findById(controllerId);
        if (!controller) return [];

        const template = await ControllerTemplate.findOne({ key: controller.type });
        if (!template) return [];

        const port = template.ports.find(p => p.id === portId);
        if (!port) return [];

        return [{
            role: 'default',
            portId: port.id,
            gpio: port.pin
        }];
    }
}


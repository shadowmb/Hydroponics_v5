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
                    isOccupied: false
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
            const controllers = await Controller.find().sort({ createdAt: -1 });
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
            const relays = await Relay.find().populate('controllerId', 'name');
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

            // 3. Delete Relay
            await Relay.findByIdAndDelete(id);

            return reply.send({ success: true, message: 'Relay deleted' });
        } catch (error) {
            req.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to delete relay' });
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
            req.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to fetch device templates' });
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
            if (body.hardware?.parentId) {
                // --- Controller Connection ---
                const controller = await Controller.findById(body.hardware.parentId);
                if (!controller) {
                    return reply.status(404).send({ success: false, error: 'Controller not found' });
                }

                if (body.hardware.port) {
                    const portState = controller.ports.get(body.hardware.port);
                    if (portState && portState.isOccupied) {
                        return reply.status(400).send({ success: false, error: `Port ${body.hardware.port} is already occupied` });
                    }
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

            // 4. Create Device
            // 4. Create Device
            const deviceData = {
                name: body.name,
                type: body.type,
                isEnabled: body.isEnabled !== undefined ? body.isEnabled : true,
                hardware: body.hardware,
                config: body.config,
                metadata: body.metadata
            };

            console.log('Creating Device with Data:', JSON.stringify(deviceData, null, 2));
            const device = new DeviceModel(deviceData);
            await device.save();

            // 5. Occupy Port/Channel
            if (body.hardware?.parentId && body.hardware?.port) {
                // Occupy Controller Port
                const controller = await Controller.findById(body.hardware.parentId);
                if (controller) {
                    const portState = controller.ports.get(body.hardware.port);
                    if (portState) {
                        portState.isOccupied = true;
                        portState.occupiedBy = {
                            type: 'device',
                            id: device._id.toString(),
                            name: device.name
                        };
                        portState.isActive = true;
                        controller.markModified('ports');
                        await controller.save();
                    }
                }
            } else if (body.hardware?.relayId && body.hardware?.channel !== undefined) {
                // Occupy Relay Channel
                const { Relay } = await import('../../models/Relay');
                const relay = await Relay.findById(body.hardware.relayId);
                if (relay) {
                    const channel = relay.channels.find((c: any) => c.channelIndex === body.hardware.channel);
                    if (channel) {
                        channel.isOccupied = true;
                        channel.occupiedBy = {
                            type: 'device',
                            id: device._id.toString(),
                            name: device.name
                        };
                        relay.markModified('channels');
                        await relay.save();
                    }
                }
            }

            return reply.send({ success: true, data: device });

        } catch (error: any) {
            req.log.error(error);
            if (error.code === 11000) {
                return reply.status(400).send({ success: false, error: 'Device with this name already exists' });
            }
            return reply.status(500).send({ success: false, error: error.message || 'Failed to create device' });
        }
    }

    static async getDevices(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { DeviceModel } = await import('../../models/Device');
            const devices = await DeviceModel.find().populate('config.driverId'); // Populate template
            return reply.send({ success: true, data: devices });
        } catch (error) {
            req.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to fetch devices' });
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

            // Handle Hardware Changes (Free old, Occupy new)
            const oldHardware = device.hardware;
            const newHardware = body.hardware;

            // Only process if hardware config changed
            if (newHardware && (
                oldHardware?.parentId !== newHardware.parentId ||
                oldHardware?.port !== newHardware.port ||
                oldHardware?.relayId !== newHardware.relayId ||
                oldHardware?.channel !== newHardware.channel
            )) {
                // 1. Free Old Resources
                if (oldHardware?.parentId && oldHardware?.port) {
                    const oldController = await Controller.findById(oldHardware.parentId);
                    if (oldController) {
                        const portState = oldController.ports.get(oldHardware.port);
                        if (portState && portState.occupiedBy?.id === device._id.toString()) {
                            portState.isOccupied = false;
                            portState.occupiedBy = undefined;
                            oldController.markModified('ports');
                            await oldController.save();
                        }
                    }
                } else if (oldHardware?.relayId && oldHardware?.channel !== undefined) {
                    const { Relay } = await import('../../models/Relay');
                    const oldRelay = await Relay.findById(oldHardware.relayId);
                    if (oldRelay) {
                        const channel = oldRelay.channels.find((c: any) => c.channelIndex === oldHardware.channel);
                        if (channel && channel.occupiedBy?.id === device._id.toString()) {
                            channel.isOccupied = false;
                            channel.occupiedBy = undefined;
                            oldRelay.markModified('channels');
                            await oldRelay.save();
                        }
                    }
                }

                // 2. Occupy New Resources
                if (newHardware.parentId && newHardware.port) {
                    const newController = await Controller.findById(newHardware.parentId);
                    if (newController) {
                        const portState = newController.ports.get(newHardware.port);
                        if (portState) {
                            if (portState.isOccupied) {
                                return reply.status(400).send({ success: false, error: `Port ${newHardware.port} is already occupied` });
                            }
                            portState.isOccupied = true;
                            portState.occupiedBy = {
                                type: 'device',
                                id: device._id.toString(),
                                name: body.name || device.name
                            };
                            portState.isActive = true;
                            newController.markModified('ports');
                            await newController.save();
                        }
                    }
                } else if (newHardware.relayId && newHardware.channel !== undefined) {
                    const { Relay } = await import('../../models/Relay');
                    const newRelay = await Relay.findById(newHardware.relayId);
                    if (newRelay) {
                        const channel = newRelay.channels.find((c: any) => c.channelIndex === newHardware.channel);
                        if (channel) {
                            if (channel.isOccupied) {
                                return reply.status(400).send({ success: false, error: `Channel ${newHardware.channel} is already occupied` });
                            }
                            channel.isOccupied = true;
                            channel.occupiedBy = {
                                type: 'device',
                                id: device._id.toString(),
                                name: body.name || device.name
                            };
                            newRelay.markModified('channels');
                            await newRelay.save();
                        }
                    }
                }
            }

            Object.assign(device, body);
            await device.save();

            return reply.send({ success: true, data: device });
        } catch (error) {
            req.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to update device' });
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

            // Free Resources (Controller OR Relay)
            try {
                if (device.hardware?.parentId && device.hardware?.port) {
                    const controller = await Controller.findById(device.hardware.parentId);
                    if (controller) {
                        const portState = controller.ports.get(device.hardware.port);
                        if (portState && portState.occupiedBy?.id === device._id.toString()) {
                            portState.isOccupied = false;
                            portState.occupiedBy = undefined;
                            controller.markModified('ports');
                            await controller.save();
                        }
                    }
                } else if (device.hardware?.relayId && device.hardware?.channel !== undefined) {
                    const { Relay } = await import('../../models/Relay');
                    const relay = await Relay.findById(device.hardware.relayId);
                    if (relay) {
                        const channel = relay.channels.find((c: any) => c.channelIndex === device.hardware.channel);
                        if (channel && channel.occupiedBy?.id === device._id.toString()) {
                            channel.isOccupied = false;
                            channel.occupiedBy = undefined;
                            relay.markModified('channels');
                            await relay.save();
                        }
                    }
                }
            } catch (resourceError) {
                req.log.warn({ err: resourceError, deviceId: device._id }, 'Failed to free resources during device deletion (ignoring)');
            }
            await device.softDelete(); // Use soft delete plugin
            return reply.send({ success: true, message: 'Device deleted' });

        } catch (error: any) {
            req.log.error(error);
            return reply.status(500).send({
                success: false,
                error: 'Failed to delete device',
                details: error.message,
                stack: error.stack
            });
        }
    }

    static async testDevice(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = req.params as { id: string };
            const { DeviceModel } = await import('../../models/Device');
            const { ConversionService } = await import('../../services/ConversionService');

            const device = await DeviceModel.findById(id).populate('config.driverId');
            if (!device) {
                return reply.status(404).send({ success: false, error: 'Device not found' });
            }

            const template = device.config.driverId as any as IDeviceTemplate; // Populated
            if (!template) {
                return reply.status(400).send({ success: false, error: 'Device template not found' });
            }

            const commandType = template.requiredCommand;
            const params = {
                pin: device.hardware?.port, // e.g. "A0" or "D2"
                ...template.executionConfig.parameters // merge static params
            };

            const controllerId = device.hardware?.parentId;
            if (!controllerId) {
                return reply.status(400).send({ success: false, error: 'Device not connected to a controller' });
            }

            // MOCKING FOR NOW
            const mockRawValue = Math.floor(Math.random() * 1024); // Random ADC

            // 2. Convert Result
            const convertedValue = ConversionService.convert(
                mockRawValue,
                template,
                device.config.calibration
            );

            return reply.send({
                success: true,
                data: {
                    raw: mockRawValue,
                    value: convertedValue,
                    unit: template.defaultUnits[0]
                }
            });

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
}


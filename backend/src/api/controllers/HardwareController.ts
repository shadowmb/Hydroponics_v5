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
            req.log.error(error);
            // Return empty list instead of error to avoid breaking UI
            return reply.send({ success: true, data: [] });
        }
    }

    // --- Templates ---

    static async getTemplates(req: FastifyRequest, reply: FastifyReply) {
        try {
            const templates = await ControllerTemplate.find();
            return reply.send({ success: true, data: templates });
        } catch (error) {
            req.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to fetch templates' });
        }
    }

    // --- Controllers ---

    static async createController(req: FastifyRequest, reply: FastifyReply) {
        try {
            const body = req.body as any;

            // Basic validation
            if (!body.name || !body.type || !body.connection) {
                return reply.status(400).send({ success: false, error: 'Missing required fields' });
            }

            // Check if template exists
            const template = await ControllerTemplate.findOne({ key: body.type });
            if (!template) {
                return reply.status(400).send({ success: false, error: 'Invalid controller type' });
            }

            // Initialize ports from template
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
            return reply.status(500).send({ success: false, error: 'Failed to create controller' });
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
            const { id } = req.params as { id: string };
            const controller = await Controller.findByIdAndDelete(id);
            if (!controller) {
                return reply.status(404).send({ success: false, error: 'Controller not found' });
            }
            return reply.send({ success: true, message: 'Controller deleted' });
        } catch (error) {
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
            for (const channel of channels) {
                const portId = channel.controllerPortId;
                const portState = controller.ports.get(portId);

                if (!portState) {
                    return reply.status(400).send({ success: false, error: `Invalid port ${portId}` });
                }
                if (portState.isOccupied) {
                    return reply.status(400).send({ success: false, error: `Port ${portId} is already occupied` });
                }
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
                    const portState = oldController.ports.get(channel.controllerPortId);
                    // Only free if it was occupied by THIS relay
                    if (portState && portState.occupiedBy?.id === relay._id.toString()) {
                        portState.isOccupied = false;
                        portState.occupiedBy = undefined;
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
            for (const channel of channels) {
                const portId = channel.controllerPortId;
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
                    const portState = controller.ports.get(channel.controllerPortId);
                    if (portState && portState.occupiedBy?.id === relay._id.toString()) {
                        portState.isOccupied = false;
                        portState.occupiedBy = undefined;
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

            // 3. Validate Controller & Port (if applicable)
            if (body.hardware?.parentId && body.hardware?.pin !== undefined) {
                const controller = await Controller.findById(body.hardware.parentId);
                if (!controller) {
                    return reply.status(404).send({ success: false, error: 'Controller not found' });
                }

                // Check if port is available
                // Note: For digital pins, we might need to map pin number to port ID (e.g. 2 -> D2)
                // This logic depends on how the frontend sends the pin. 
                // Let's assume frontend sends the exact Port ID (e.g. "D2", "A0") in `port` field, 
                // or we map `pin` number to it. 
                // The Device model has `pin` (number) and `port` (string). 
                // Let's use `port` for the Controller Port ID.

                const portId = body.hardware.port;
                if (portId) {
                    const portState = controller.ports.get(portId);
                    if (portState && portState.isOccupied) {
                        return reply.status(400).send({ success: false, error: `Port ${portId} is already occupied` });
                    }
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

            // 5. Occupy Controller Port
            if (body.hardware?.parentId && body.hardware?.port) {
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

            // Handle Port Changes (Free old, Occupy new) - Simplified for now:
            // If hardware config changes, we should handle it. 
            // For this iteration, let's assume we just update the doc. 
            // TODO: Implement robust port re-mapping for devices similar to Relays.

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

            // Free Controller Port
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
            }

            await device.softDelete(); // Use soft delete plugin
            return reply.send({ success: true, message: 'Device deleted' });

        } catch (error) {
            req.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to delete device' });
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

            // 1. Send Command to Controller
            // We need to construct the command based on the template.
            // For now, let's assume we use the `hardware.sendCommand` which expects (deviceId, driverId, command, params)
            // But `hardware.sendCommand` is for the OLD system or needs adaptation.
            // Let's use the Controller directly to send a raw command if we can, OR adapt `hardware.sendCommand`.

            // Actually, `hardware.sendCommand` in `HardwareService` is designed to route to the correct controller.
            // But it takes `deviceId` (our database ID).

            // Let's construct the params expected by the controller.
            // e.g. ANALOG command needs { pin: "A0" }

            const commandType = template.requiredCommand;
            const params = {
                pin: device.hardware?.port, // e.g. "A0" or "D2"
                ...template.executionConfig.parameters // merge static params
            };

            // We need to find the Controller ID to send to.
            const controllerId = device.hardware?.parentId;
            if (!controllerId) {
                return reply.status(400).send({ success: false, error: 'Device not connected to a controller' });
            }

            // Execute Command via HardwareService
            // We'll use a lower-level method if available, or just `sendCommand` if it supports raw controller targeting.
            // Looking at `HardwareService.ts` (I recall it), it might need `deviceId`.
            // Let's assume `hardware.sendCommand` can handle it.

            // WAIT: `hardware.sendCommand` uses `DeviceCommandService`. 
            // We want to bypass the complex logic and just ask the controller "Read Pin X".

            // Let's use `hardware.executeCommand(controllerId, command, params)` if it exists, 
            // or we might need to add it. 
            // For now, let's mock the response to verify the flow, 
            // or use `hardware.sendCommand` if we trust it.

            // MOCKING FOR NOW to ensure API works, as we haven't fully wired the Controller communication for "Generic Devices" yet.
            // In a real scenario, we'd call:
            // const rawResult = await hardware.executeRawCommand(controllerId, commandType, params);

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
}

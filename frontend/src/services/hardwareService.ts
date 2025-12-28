import axios from 'axios';

// Local type definitions to avoid cross-project imports

export interface IPortTemplate {
    id: string;
    label: string;
    type: 'digital' | 'analog';
    reserved?: boolean;
    pwm?: boolean;
}

export interface IControllerTemplate {
    key: string;
    label: string;
    communication_by: string[];
    communication_type: string[];
    electrical_specs?: {
        logic_voltage: string;
        input_voltage: string;
        max_current_per_pin: string;
        analog_resolution: string;
        adc_range: string;
    };
    constraints?: string[];
    ports: IPortTemplate[];
}

export interface IPortState {
    isActive: boolean;
    isOccupied: boolean;
    occupiedBy?: {
        type: 'relay' | 'device';
        id: string;
        name: string;
    };
    deviceId?: string; // Deprecated
    pwm?: boolean; // Capability from template
    triggerLogic?: 'HIGH' | 'LOW';
}

export interface IController {
    _id: string;
    name: string;
    type: string;
    description?: string;
    macAddress?: string;
    status: 'online' | 'offline' | 'error';
    lastConnectionCheck?: string | Date;
    connection: {
        type: 'serial' | 'network';
        ip?: string;
        port?: number;
        serialPort?: string;
        baudRate?: number;
    };
    ports: Record<string, IPortState>;
    capabilities?: string[];
    isActive: boolean;
}

// Use environment variable for API URL if available, otherwise default to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const hardwareService = {
    getTemplates: async (): Promise<IControllerTemplate[]> => {
        const response = await axios.get(`${API_URL}/hardware/templates`);
        return response.data.data;
    },

    getSerialPorts: async (): Promise<any[]> => {
        try {
            const response = await axios.get(`${API_URL}/hardware/serial-ports`);
            return response.data.data;
        } catch (error) {
            console.error('Failed to fetch serial ports', error);
            return [];
        }
    },

    getControllers: async (): Promise<IController[]> => {
        const response = await axios.get(`${API_URL}/hardware/controllers`);
        return response.data.data;
    },

    createController: async (controller: Partial<IController>): Promise<IController> => {
        const response = await axios.post(`${API_URL}/hardware/controllers`, controller);
        return response.data.data;
    },

    updateController: async (id: string, updates: Partial<IController>): Promise<IController> => {
        const response = await axios.put(`${API_URL}/hardware/controllers/${id}`, updates);
        return response.data.data;
    },

    deleteController: async (id: string): Promise<void> => {
        await axios.delete(`${API_URL}/hardware/controllers/${id}`);
    },

    syncStatus: async (): Promise<any> => {
        const response = await axios.post(`${API_URL}/hardware/sync-status`);
        return response.data.data;
    },

    // --- Relays ---

    getRelays: async (): Promise<any[]> => {
        const response = await axios.get(`${API_URL}/hardware/relays`);
        return response.data.data;
    },

    createRelay: async (relay: any): Promise<any> => {
        const response = await axios.post(`${API_URL}/hardware/relays`, relay);
        return response.data.data;
    },

    updateRelay: async (id: string, relay: any): Promise<any> => {
        const response = await axios.put(`${API_URL}/hardware/relays/${id}`, relay);
        return response.data.data;
    },

    deleteRelay: async (id: string): Promise<void> => {
        await axios.delete(`${API_URL}/hardware/relays/${id}`);
    },
    // --- Devices ---

    getDeviceTemplates: async (): Promise<any[]> => {
        const response = await axios.get(`${API_URL}/hardware/device-templates`);
        return response.data.data;
    },

    getTemplateUnits: async (): Promise<string[]> => {
        const response = await axios.get(`${API_URL}/hardware/template-units`);
        return response.data.data;
    },

    getDevices: async (): Promise<any[]> => {
        const response = await axios.get(`${API_URL}/hardware/devices`);
        return response.data.data;
    },

    createDevice: async (device: any): Promise<any> => {
        const response = await axios.post(`${API_URL}/hardware/devices`, device);
        return response.data.data;
    },

    updateDevice: async (id: string, device: any): Promise<any> => {
        const response = await axios.put(`${API_URL}/hardware/devices/${id}`, device);
        return response.data.data;
    },

    deleteDevice: async (id: string): Promise<void> => {
        await axios.delete(`${API_URL}/hardware/devices/${id}`);
    },

    testDevice: async (id: string, strategy?: string): Promise<any> => {
        const response = await axios.post(`${API_URL}/hardware/devices/${id}/test`, { strategy });
        return response.data.data;
    },

    executeCommand: async (deviceId: string, command: string, params: any = {}, context: any = {}): Promise<any> => {
        // Need to fetch device to get driverId? Or pass it?
        // The backend endpoint expects: { deviceId, driverId, command, params, context }
        // We should probably fetch the device first or let the caller provide driverId.
        // But to make it easy for UI, let's fetch device here or assume caller passes it?
        // Actually, ActuatorControlPanel has the device object. It can pass driverId.
        // Let's update the signature to accept driverId or just deviceId and we fetch it?
        // Fetching here adds latency.
        // Let's look at the backend HardwareCommandSchema.
        // It requires: deviceId, driverId, command.

        // Let's update ActuatorControlPanel to pass driverId.
        // So here we accept driverId.
        return (await axios.post(`${API_URL}/hardware/command`, {
            deviceId,
            // We need driverId. 
            // If we don't have it, we can't call this.
            // Let's change signature to include driverId.
            driverId: params.driverId, // Hacky? No, let's make it explicit argument.
            command,
            params,
            context
        })).data.data;
    },

    refreshDevice: async (id: string): Promise<void> => {
        await axios.post(`${API_URL}/hardware/devices/${id}/refresh`);
    },

    refreshController: async (id: string): Promise<void> => {
        await axios.post(`${API_URL}/hardware/controllers/${id}/refresh`);
    }
};

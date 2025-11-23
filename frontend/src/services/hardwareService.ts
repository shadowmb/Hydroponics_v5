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
}

export interface IController {
    _id: string;
    name: string;
    type: string;
    description?: string;
    macAddress?: string;
    status: 'online' | 'offline' | 'error';
    connection: {
        type: 'serial' | 'network';
        ip?: string;
        port?: number;
        serialPort?: string;
        baudRate?: number;
    };
    ports: Record<string, IPortState>;
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

    testDevice: async (id: string): Promise<any> => {
        const response = await axios.post(`${API_URL}/hardware/devices/${id}/test`);
        return response.data.data;
    }
};

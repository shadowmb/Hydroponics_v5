import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface BoardDefinition {
    id: string;
    name: string;
    description: string;
    architecture: string;
    voltage: number;
    clock_speed_hz: number;
    memory: {
        flash_bytes: number;
        sram_bytes: number;
        eeprom_bytes: number;
    };
    interfaces: {
        serial: { hardware: string[], usb: string };
        wifi: { type: 'native' | 'none', chipset?: string };
        i2c?: string[];
        spi?: string[];
    };
    pins: {
        digital_count: number;
        analog_input_count: number;
        pwm_pins: (number | string)[];
        uart_pins?: (number | string)[];
        i2c_pins?: (number | string)[];
        spi_pins?: (number | string)[];
    };
    electrical_specs?: {
        logic_voltage: string;
        input_voltage: string;
        max_current_per_pin: string;
        analog_resolution: string;
        adc_range: string;
    };
    constraints?: string[];
}

export interface TransportDefinition {
    id: string;
    type: string;
    name: string;
    description: string;
    compatible_architectures: string[];
    parameters: Array<{
        name: string;
        type: string;
        default: any;
        label: string;
    }>;
}

export interface PluginDefinition {
    id: string;
    name: string;
    description: string;
    category: string;
    compatible_architectures: string[];
    compatible_transports: string[];
    parameters: Array<{
        name: string;
        type: string;
        default: any;
        label: string;
    }>;
}

export interface CommandDefinition {
    id: string;
    name: string;
    description?: string;
}

export interface DeviceTemplate {
    _id: string;
    name: string;
    description: string;
    physicalType: string;
    requiredCommand: string;
    portRequirements?: Array<{
        type: 'analog' | 'digital' | 'i2c' | 'uart';
        count: number;
    }>;
    requirements?: {
        interface?: 'digital' | 'analog' | 'i2c' | 'uart' | 'onewire';
        voltage?: string;
        pin_count?: {
            digital?: number;
            analog?: number;
            uart?: number;
            i2c?: number;
        };
    };
    uiConfig: {
        category: string;
        icon?: string;
    };
    commands?: Record<string, { hardwareCmd: string }>;
    variants?: Array<{
        id: string;
        label: string;
        description?: string;
        commands?: Record<string, { hardwareCmd: string }>;
    }>;
}

export interface BuildConfiguration {
    boardId: string;
    transportId: string;
    pluginIds: string[];
    commandIds: string[];
    settings: Record<string, any>;
}

export const firmwareBuilderService = {
    getBoards: async (): Promise<BoardDefinition[]> => {
        const response = await axios.get(`${API_URL}/firmware/builder/boards`);
        return response.data.data;
    },

    getTransports: async (): Promise<TransportDefinition[]> => {
        const response = await axios.get(`${API_URL}/firmware/builder/transports`);
        return response.data.data;
    },

    getPlugins: async (): Promise<PluginDefinition[]> => {
        const response = await axios.get(`${API_URL}/firmware/builder/plugins`);
        return response.data.data;
    },

    getCommands: async (): Promise<CommandDefinition[]> => {
        const response = await axios.get(`${API_URL}/firmware/builder/commands`);
        return response.data.data;
    },

    getDeviceTemplates: async (): Promise<DeviceTemplate[]> => {
        const response = await axios.get(`${API_URL}/hardware/device-templates`);
        return response.data.data;
    },

    build: async (config: BuildConfiguration): Promise<{ filename: string, content: string }> => {
        const response = await axios.post(`${API_URL}/firmware/builder/build`, config);
        return response.data.data;
    }
};

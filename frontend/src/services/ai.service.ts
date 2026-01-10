import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface AIAction {
    id?: string;
    name: string;
    enabled: boolean;
    trigger: any;
    payload: any;
    outputs: any;
    lastRun?: string;
}

export const aiService = {
    // Actions CRUD
    getActions: async (): Promise<AIAction[]> => {
        const response = await axios.get(`${API_URL}/ai/actions`);
        return response.data.data;
    },

    createAction: async (action: AIAction): Promise<AIAction> => {
        const response = await axios.post(`${API_URL}/ai/actions`, action);
        return response.data.data;
    },

    updateAction: async (id: string, action: AIAction): Promise<AIAction> => {
        const response = await axios.put(`${API_URL}/ai/actions/${id}`, action);
        return response.data.data;
    },

    deleteAction: async (id: string): Promise<boolean> => {
        const response = await axios.delete(`${API_URL}/ai/actions/${id}`);
        return response.data.success;
    },

    // Run Manually (Test)
    runAction: async (id: string): Promise<void> => {
        await axios.post(`${API_URL}/ai/actions/${id}/run`);
    },

    // Shortcuts CRUD
    getShortcuts: async (): Promise<any[]> => {
        const response = await axios.get(`${API_URL}/ai/shortcuts`);
        return response.data.data;
    },

    createShortcut: async (data: any): Promise<any> => {
        const response = await axios.post(`${API_URL}/ai/shortcuts`, data);
        return response.data.data;
    },

    updateShortcut: async (id: string, data: any): Promise<any> => {
        const response = await axios.put(`${API_URL}/ai/shortcuts/${id}`, data);
        return response.data.data;
    },

    deleteShortcut: async (id: string): Promise<boolean> => {
        const response = await axios.delete(`${API_URL}/ai/shortcuts/${id}`);
        return response.data.success;
    }
};

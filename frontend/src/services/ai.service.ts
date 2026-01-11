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

// Helper to safely handle missing plugin
const safeRequest = async <T>(request: () => Promise<T>, fallback: any = null): Promise<T> => {
    try {
        return await request();
    } catch (error: any) {
        // If 404, it means plugin is missing (not installed)
        if (error.response && error.response.status === 404) {
            console.warn('⚠️ AI Plugin missing or endpoint not found.');
            return fallback;
        }
        throw error;
    }
};

export const aiService = {
    // Check if AI Plugin is installed/active
    checkHealth: async (): Promise<boolean> => {
        try {
            const res = await axios.get(`${API_URL}/ai/health`, { timeout: 2000 });
            return res.status === 200 && res.data.module === 'ai';
        } catch (e) {
            return false;
        }
    },

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
    },

    // Settings
    getSettings: async (): Promise<any> => {
        const response = await axios.get(`${API_URL}/settings/ai`);
        return response.data;
    },

    // Sessions
    getSessions: async (): Promise<any[]> => {
        const response = await axios.get(`${API_URL}/ai/sessions`);
        return response.data.data;
    },

    getSession: async (id: string): Promise<any> => {
        const response = await axios.get(`${API_URL}/ai/sessions/${id}`);
        return response.data.data;
    },

    createSession: async (): Promise<any> => {
        const response = await axios.post(`${API_URL}/ai/sessions`);
        return response.data.data;
    },

    deleteSession: async (id: string): Promise<boolean> => {
        const response = await axios.delete(`${API_URL}/ai/sessions/${id}`);
        return response.data.success;
    },

    updateSessionTitle: async (id: string, title: string): Promise<any> => {
        const response = await axios.patch(`${API_URL}/ai/sessions/${id}/title`, { title });
        return response.data.data;
    }
};

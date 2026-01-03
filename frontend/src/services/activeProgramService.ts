import axios from 'axios';
import type { IActiveProgram } from '../types/ActiveProgram';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const BASE_URL = `${API_URL}/active-program`;

export const activeProgramService = {
    getActive: async (): Promise<IActiveProgram | null> => {
        const response = await axios.get<IActiveProgram>(BASE_URL);
        return response.data;
    },

    load: async (programId: string, overrides: Record<string, any> = {}, minCycleInterval: number = 0): Promise<IActiveProgram> => {
        const response = await axios.post<IActiveProgram>(`${BASE_URL}/load`, { programId, overrides, minCycleInterval });
        return response.data;
    },

    update: async (updates: Partial<IActiveProgram> & { globalOverrides?: Record<string, any> }): Promise<IActiveProgram> => {
        const response = await axios.patch<IActiveProgram>(`${BASE_URL}/update`, updates);
        return response.data;
    },

    getVariables: async (): Promise<Record<string, any[]>> => {
        const response = await axios.get<Record<string, any[]>>(`${BASE_URL}/variables`);
        return response.data;
    },

    start: async (startTime?: Date): Promise<IActiveProgram> => {
        const response = await axios.post<IActiveProgram>(`${BASE_URL}/start`, { startTime });
        return response.data;
    },

    stop: async (): Promise<IActiveProgram> => {
        const response = await axios.post<IActiveProgram>(`${BASE_URL}/stop`);
        return response.data;
    },

    pause: async (): Promise<IActiveProgram> => {
        const response = await axios.post<IActiveProgram>(`${BASE_URL}/pause`);
        return response.data;
    },

    unload: async (): Promise<void> => {
        await axios.post(`${BASE_URL}/unload`);
    },

    updateScheduleItem: async (itemId: string, updates: { time?: string, overrides?: Record<string, any> }): Promise<IActiveProgram> => {
        const response = await axios.patch<IActiveProgram>(`${BASE_URL}/schedule/${itemId}`, updates);
        return response.data;
    },

    swapCycles: async (itemIdA: string, itemIdB: string): Promise<IActiveProgram> => {
        const response = await axios.post<IActiveProgram>(`${BASE_URL}/schedule/swap`, { itemIdA, itemIdB });
        return response.data;
    },

    skipCycle: async (itemId: string, type: 'once' | 'until', untilDate?: Date): Promise<IActiveProgram> => {
        const response = await axios.post<IActiveProgram>(`${BASE_URL}/schedule/${itemId}/skip`, { type, untilDate });
        return response.data;
    },

    restoreCycle: async (itemId: string): Promise<IActiveProgram> => {
        const response = await axios.post<IActiveProgram>(`${BASE_URL}/schedule/${itemId}/restore`);
        return response.data;
    },

    retryCycle: async (itemId: string): Promise<IActiveProgram> => {
        const response = await axios.post<IActiveProgram>(`${BASE_URL}/schedule/${itemId}/retry`);
        return response.data;
    },

    forceStartCycle: async (itemId: string): Promise<IActiveProgram> => {
        const response = await axios.post<IActiveProgram>(`${BASE_URL}/schedule/${itemId}/force-start`);
        return response.data;
    },

    // Advanced Window Methods
    skipWindow: async (windowId: string, untilDate: Date): Promise<IActiveProgram> => {
        const response = await axios.post<IActiveProgram>(`${BASE_URL}/windows/${windowId}/skip`, { untilDate });
        return response.data;
    },

    restoreWindow: async (windowId: string): Promise<IActiveProgram> => {
        const response = await axios.post<IActiveProgram>(`${BASE_URL}/windows/${windowId}/restore`);
        return response.data;
    },

    updateTrigger: async (windowId: string, trigger: any): Promise<IActiveProgram> => {
        const response = await axios.patch<IActiveProgram>(`${BASE_URL}/windows/${windowId}/triggers`, trigger);
        return response.data;
    }
};

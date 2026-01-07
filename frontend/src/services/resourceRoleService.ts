
import axios from 'axios';

export type AnalyticsType = 'SUM' | 'DELTA' | 'TREND' | 'NONE';

export interface ResourceRole {
    _id: string;
    key: string;
    label: string;
    analyticsType: AnalyticsType;
    unit?: string;
    color?: string;
    description?: string;
    showInSummary?: boolean;
    measuredBy?: string;
    createdAt?: string;
    updatedAt?: string;
}

const API_URL = '/api/system/roles';

export const resourceRoleService = {
    async getAll(): Promise<ResourceRole[]> {
        const response = await axios.get<{ success: boolean; data: ResourceRole[] }>(API_URL);
        return response.data.data;
    },

    async sync(): Promise<{ added: number; updated: number }> {
        const response = await axios.post<{ success: boolean; data: { added: number; updated: number } }>(`${API_URL}/sync`);
        return response.data.data;
    },

    async update(key: string, data: Partial<ResourceRole>): Promise<ResourceRole> {
        const response = await axios.put<{ success: boolean; data: ResourceRole }>(`${API_URL}/${key}`, data);
        return response.data.data;
    }
};

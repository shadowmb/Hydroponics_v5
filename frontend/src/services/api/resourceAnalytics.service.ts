import axios from 'axios';

// Base URL configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface ResourceTotal {
    value: number;
    unit: string;
    type: 'SUM' | 'DELTA' | 'TREND' | 'NONE';
    count?: number;
    average?: number;
    min?: number;
    max?: number;
    startValue?: number;
    endValue?: number;
}

export interface ResourceTotalsResponse {
    totals: Record<string, ResourceTotal>;
    meta?: {
        totalRecords: number;
        firstDate?: string;
        lastDate?: string;
    };
}

export interface PeriodSummaryResponse {
    current: Record<string, ResourceTotal>;
    previous?: Record<string, ResourceTotal>;
    trends?: Record<string, {
        direction: 'up' | 'down' | 'flat';
        percentage: number;
    }>;
}

export interface DailyResourceData {
    date: string;
    resources: Record<string, number>;
}

export interface ResourceAnalyticsFilters {
    programId?: string;
    windowId?: string;
    flowId?: string;
}

export const resourceAnalyticsService = {
    /**
     * Get All-Time totals for resources
     */
    getAllTotals: async (filters: ResourceAnalyticsFilters = {}): Promise<ResourceTotalsResponse> => {
        try {
            const params = new URLSearchParams();
            // Only add programId if it's not empty (allows "All Programs")
            if (filters.programId) params.append('programId', filters.programId);
            if (filters.windowId) params.append('windowId', filters.windowId);
            if (filters.flowId) params.append('flowId', filters.flowId);

            const response = await axios.get(`${API_URL}/api/analytics/resources/all`, { params });
            const rawData = response.data.data || {};

            // Transform: Backend returns { role1: {...}, role2: {...} }
            // Frontend expects { totals: {...}, meta: {...} }
            return {
                totals: rawData,
                meta: {
                    totalRecords: Object.keys(rawData).length
                }
            };
        } catch (error) {
            console.error('Error fetching all resource totals:', error);
            throw error;
        }
    },

    /**
     * Get totals for a specific period
     */
    getPeriodTotals: async (from: string, to: string, filters: ResourceAnalyticsFilters = {}): Promise<PeriodSummaryResponse> => {
        try {
            const params = new URLSearchParams();
            params.append('from', from);
            params.append('to', to);
            if (filters.programId) params.append('programId', filters.programId);
            if (filters.windowId) params.append('windowId', filters.windowId);
            if (filters.flowId) params.append('flowId', filters.flowId);

            const response = await axios.get(`${API_URL}/api/analytics/resources/period`, { params });
            const rawData = response.data.data || {};

            // Transform: Backend returns { role1: {...}, role2: {...} }
            // Frontend expects { current: {...}, trends: {...} }
            return {
                current: rawData,
                previous: {},
                trends: {} // Trend calculation not implemented in backend yet
            };
        } catch (error) {
            console.error('Error fetching period resource totals:', error);
            throw error;
        }
    },

    /**
     * Get daily breakdown for charts
     */
    getDailyBreakdown: async (from: string, to: string, roles: string[], filters: ResourceAnalyticsFilters = {}): Promise<DailyResourceData[]> => {
        try {
            const params = new URLSearchParams();
            params.append('from', from);
            params.append('to', to);
            if (roles.length > 0) params.append('roles', roles.join(','));
            if (filters.programId) params.append('programId', filters.programId);
            if (filters.windowId) params.append('windowId', filters.windowId);
            if (filters.flowId) params.append('flowId', filters.flowId);

            const response = await axios.get(`${API_URL}/api/analytics/resources/daily`, { params });
            return response.data.data || [];
        } catch (error) {
            console.error('Error fetching daily breakdown:', error);
            throw error;
        }
    }
};

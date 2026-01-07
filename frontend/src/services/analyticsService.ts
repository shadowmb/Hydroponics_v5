import { API_BASE_URL } from '../core/config';

export interface AnalyticsFilters {
    from?: string;
    to?: string;
    windowId?: string;
    flowId?: string;
    blockType?: string;
    device?: string;
    action?: string;
    unit?: string;
    page?: number;
    limit?: number;
}

export interface FilterOptions {
    windows: { id: string; name: string }[];
    flows: { id: string; name: string }[];
    devices: string[];
    actions: string[];
    blockTypes: string[];
    units: string[];
}

export interface SensorStat {
    device: string;
    avg: number;
    min: number;
    max: number;
    count: number;
    unit: string;
}

export interface ActuatorStat {
    device: string;
    totalVolume: number;
    totalDuration: number;
    count: number;
    unit: string;
}

export interface AnalyticsSummary {
    sensors: SensorStat[];
    actuators: ActuatorStat[];
    triggers: {
        matched: number;
        fallback: number;
        skipped: number;
    };
}

export interface AnalyticsDataRow {
    timestamp: string;
    device: string;
    action: string;
    value: number | null;
    unit: string;
    duration: number | null;
    volume: number | null;
    window: string;
    flow: string;
    blockType: string;
    message?: string;
    metadata?: any;
}

export interface AnalyticsResponse {
    filters: FilterOptions;
    summary: AnalyticsSummary;
    data: AnalyticsDataRow[];
    pagination: {
        total: number;
        page: number;
        limit: number;
    };
}

export interface ExecutedProgram {
    programId: string;
    name: string;
    lastExecution: string;
}

export const analyticsService = {
    /**
     * Fetch list of programs that have execution data
     */
    async getExecutedPrograms(): Promise<ExecutedProgram[]> {
        const response = await fetch(`${API_BASE_URL}/api/analytics/programs`);
        const json = await response.json();

        if (!json.success) {
            throw new Error(json.error || 'Failed to fetch programs');
        }

        return json.data;
    },

    /**
     * Fetch analytics data for a program
     */
    async getAnalytics(programId: string, filters: AnalyticsFilters = {}): Promise<AnalyticsResponse> {
        const params = new URLSearchParams();

        if (filters.from) params.append('from', filters.from);
        if (filters.to) params.append('to', filters.to);
        if (filters.windowId) params.append('windowId', filters.windowId);
        if (filters.flowId) params.append('flowId', filters.flowId);
        if (filters.blockType) params.append('blockType', filters.blockType);
        if (filters.device) params.append('device', filters.device);
        if (filters.action) params.append('action', filters.action);
        if (filters.unit) params.append('unit', filters.unit);
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());

        const response = await fetch(`${API_BASE_URL}/api/analytics/program/${programId}?${params.toString()}`);
        const json = await response.json();

        if (!json.success) {
            throw new Error(json.error || 'Failed to fetch analytics');
        }

        return json.data;
    },

    /**
     * Fetch available filter options for a program (Cascading)
     */
    async getFilterOptions(programId: string, filters: AnalyticsFilters): Promise<FilterOptions> {
        const params = new URLSearchParams();
        if (filters.from) params.append('from', filters.from);
        if (filters.to) params.append('to', filters.to);
        if (filters.windowId) params.append('windowId', filters.windowId);
        if (filters.flowId) params.append('flowId', filters.flowId);
        if (filters.blockType) params.append('blockType', filters.blockType);
        if (filters.device) params.append('device', filters.device);
        if (filters.action) params.append('action', filters.action);
        if (filters.unit) params.append('unit', filters.unit);

        const response = await fetch(`${API_BASE_URL}/api/analytics/program/${programId}/filters?${params.toString()}`);
        const json = await response.json();

        if (!json.success) {
            throw new Error(json.error || 'Failed to fetch filter options');
        }

        return json.data;
    },

    /**
     * Fetch session timeline for a program on a specific date
     */
    async getSessionTimeline(programId: string, date: string): Promise<SessionTimelineResponse> {
        const response = await fetch(`${API_BASE_URL}/api/analytics/program/${programId}/sessions?date=${date}`);
        const json = await response.json();

        if (!json.success) {
            throw new Error(json.error || 'Failed to fetch session timeline');
        }

        return json.data;
    }
};

// ========== SESSION TIMELINE TYPES ==========

export interface SessionFlowSummary {
    flowName: string;
    sessionId: string;
    startTime: string;
    endTime: string;
    sensorReadings: {
        device: string;
        value: number;
        unit: string;
    }[];
    actuatorActions: {
        device: string;
        action: string;
        totalValue: number;
        unit: string;
        count: number;
    }[];
}

export interface SessionTimelineEntry {
    windowId: string;
    windowName: string;
    startTime: string;
    endTime: string;
    triggerInfo: string | null;
    flows: SessionFlowSummary[];
    contextStart: Record<string, { value: number; unit: string }>;
    contextEnd: Record<string, { value: number; unit: string }>;
    totalDosedMl: number;
    totalPulseSeconds: number;
}

export interface SessionTimelineResponse {
    programId: string;
    date: string;
    sessions: SessionTimelineEntry[];
}

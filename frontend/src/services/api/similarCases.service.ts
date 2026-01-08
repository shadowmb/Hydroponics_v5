import axios from 'axios';

// Base URL configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface SimilarCasesCriterion {
    role: string;
    field?: 'value' | 'startValue' | 'endValue' | 'min' | 'max' | 'average';
    value?: number;
    tolerance?: number;
    showOnly?: boolean;
}

export interface SimilarCasesFilters {
    programId?: string;
    windowId?: string;
    flowId?: string;
}

export interface SimilarCaseRecord {
    date: string;
    context: {
        programId: string;
        programName: string;
        windowId?: string;
        windowName?: string;
        flowId?: string;
        flowName?: string;
        executionType: string;
    };
    resources: Record<string, {
        value?: number;
        startValue?: number;
        endValue?: number;
        unit: string;
    }>;
}

export interface SimilarCasesResponse {
    records: SimilarCaseRecord[];
    stats?: {
        count: number;
        averages: Record<string, number>;
    };
}

export const similarCasesService = {
    /**
     * Find similar cases based on criteria
     */
    search: async (
        filters: SimilarCasesFilters,
        criteria: SimilarCasesCriterion[],
        limit: number = 10
    ): Promise<SimilarCasesResponse> => {
        try {
            const response = await axios.post(`${API_URL}/api/analytics/resources/similar`, {
                filters,
                criteria,
                limit
            });

            return response.data.data;
        } catch (error: any) {
            console.error('[similarCasesService] Error searching:', error);
            throw error;
        }
    }
};

import { programDailyLogRepository } from '../modules/persistence/repositories/ProgramDailyLogRepository';
import { ProgramDailyLogModel } from '../modules/persistence/schemas/ProgramDailyLog.schema';
import { logger } from '../core/LoggerService';

interface AnalyticsFilters {
    programId: string;
    from: string;  // YYYY-MM-DD
    to: string;    // YYYY-MM-DD
    windowId?: string;
    flowId?: string;
    blockType?: string;
    device?: string;  // blockLabel
    action?: string;
}

interface FilterOptions {
    windows: { id: string; name: string }[];
    flows: { id: string; name: string }[];
    devices: string[];
    actions: string[];
    blockTypes: string[];
}

interface SensorStat {
    device: string;
    avg: number;
    min: number;
    max: number;
    count: number;
    unit: string;
}

interface ActuatorStat {
    device: string;
    totalVolume: number;
    totalDuration: number;
    count: number;
    unit: string;
}

interface AnalyticsSummary {
    sensors: SensorStat[];
    actuators: ActuatorStat[];
    triggers: {
        matched: number;
        fallback: number;
        skipped: number;
    };
}

interface AnalyticsDataRow {
    timestamp: Date;
    device: string;
    action: string;
    value: number | null;
    unit: string;
    duration: number | null;
    volume: number | null;
    window: string;
    flow: string;
}

interface AnalyticsResponse {
    filters: FilterOptions;
    summary: AnalyticsSummary;
    data: AnalyticsDataRow[];
    pagination: {
        total: number;
        page: number;
        limit: number;
    };
}

export class AnalyticsService {

    /**
     * Get list of programs that have execution data in ProgramDailyLog
     */
    async getExecutedPrograms(): Promise<{ programId: string; name: string; lastExecution: string }[]> {
        const pipeline = [
            {
                $group: {
                    _id: '$programId',
                    lastExecution: { $max: '$date' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { lastExecution: -1 } }
        ];

        const result = await ProgramDailyLogModel.aggregate(pipeline as any[]);

        return result.map((r: any) => ({
            programId: r._id,
            name: r._id,  // Use programId as name for now
            lastExecution: r.lastExecution
        }));
    }

    /**
     * Get all available filter options for a program
     */
    async getFilterOptions(programId: string, from: string, to: string): Promise<FilterOptions> {
        const pipeline = [
            {
                $match: {
                    programId,
                    date: { $gte: from, $lte: to }
                }
            },
            { $unwind: '$events' },
            {
                $group: {
                    _id: null,
                    windows: {
                        $addToSet: {
                            id: '$events.metadata.windowId',
                            name: { $ifNull: ['$events.metadata.windowName', '$events.metadata.windowId'] }
                        }
                    },
                    flows: {
                        $addToSet: '$events.executionSessionId'
                    },
                    devices: {
                        $addToSet: '$events.metadata.blockLabel'
                    },
                    actions: {
                        $addToSet: '$events.metadata.logData.action'
                    },
                    blockTypes: {
                        $addToSet: '$events.metadata.blockType'
                    }
                }
            }
        ];

        const result = await ProgramDailyLogModel.aggregate(pipeline);

        if (result.length === 0) {
            return {
                windows: [],
                flows: [],
                devices: [],
                actions: [],
                blockTypes: []
            };
        }

        const data = result[0];

        return {
            windows: (data.windows || []).filter((w: any) => w.id),
            flows: (data.flows || []).filter((f: any) => f).map((f: string) => ({ id: f, name: f })),
            devices: (data.devices || []).filter((d: any) => d),
            actions: (data.actions || []).filter((a: any) => a),
            blockTypes: (data.blockTypes || []).filter((b: any) => b)
        };
    }

    /**
     * Get analytics data with filters, summary, and pagination
     */
    async getAnalytics(filters: AnalyticsFilters, page: number = 1, limit: number = 100): Promise<AnalyticsResponse> {
        // Build match conditions
        const eventMatch: any = {
            'events.metadata.logData': { $exists: true }
        };

        if (filters.windowId) {
            eventMatch['events.metadata.windowId'] = filters.windowId;
        }
        if (filters.flowId) {
            eventMatch['events.executionSessionId'] = filters.flowId;
        }
        if (filters.blockType) {
            eventMatch['events.metadata.blockType'] = filters.blockType;
        }
        if (filters.device) {
            eventMatch['events.metadata.blockLabel'] = filters.device;
        }
        if (filters.action) {
            eventMatch['events.metadata.logData.action'] = filters.action;
        }

        // Main aggregation pipeline
        const pipeline = [
            {
                $match: {
                    programId: filters.programId,
                    date: { $gte: filters.from, $lte: filters.to }
                }
            },
            { $unwind: '$events' },
            { $match: eventMatch },
            {
                $project: {
                    timestamp: '$events.timestamp',
                    type: '$events.type',
                    device: '$events.metadata.blockLabel',
                    blockType: '$events.metadata.blockType',
                    action: '$events.metadata.logData.action',
                    value: '$events.metadata.logData.primaryValue',
                    unit: '$events.metadata.logData.primaryUnit',
                    duration: '$events.metadata.logData.durationMs',
                    volume: '$events.metadata.logData.calculatedVolumeMl',
                    window: { $ifNull: ['$events.metadata.windowName', '$events.metadata.windowId'] },
                    flow: '$events.executionSessionId'
                }
            },
            { $sort: { timestamp: -1 } }
        ];

        const allData = await ProgramDailyLogModel.aggregate(pipeline as any[]);

        // Calculate summary
        const summary = this.calculateSummary(allData);

        // Get filter options
        const filterOptions = await this.getFilterOptions(filters.programId, filters.from, filters.to);

        // Paginate
        const total = allData.length;
        const skip = (page - 1) * limit;
        const paginatedData = allData.slice(skip, skip + limit);

        // Get trigger stats separately
        const triggerStats = await this.getTriggerStats(filters.programId, filters.from, filters.to);
        summary.triggers = triggerStats;

        return {
            filters: filterOptions,
            summary,
            data: paginatedData,
            pagination: {
                total,
                page,
                limit
            }
        };
    }

    /**
     * Calculate summary statistics from data
     */
    private calculateSummary(data: any[]): AnalyticsSummary {
        const sensorMap = new Map<string, { values: number[]; unit: string }>();
        const actuatorMap = new Map<string, { volume: number; duration: number; count: number; unit: string }>();

        for (const row of data) {
            if (row.action === 'READ' && row.value !== null && row.value !== undefined) {
                // Sensor reading
                const key = row.device || 'Unknown';
                if (!sensorMap.has(key)) {
                    sensorMap.set(key, { values: [], unit: row.unit || '' });
                }
                sensorMap.get(key)!.values.push(row.value);
            } else if (row.action === 'DOSE' || row.action === 'PULSE_ON' || row.action === 'PULSE_OFF') {
                // Actuator action
                const key = row.device || 'Unknown';
                if (!actuatorMap.has(key)) {
                    actuatorMap.set(key, { volume: 0, duration: 0, count: 0, unit: row.unit || '' });
                }
                const stat = actuatorMap.get(key)!;
                stat.count++;
                if (row.volume) stat.volume += row.volume;
                if (row.duration) stat.duration += row.duration;
            }
        }

        // Convert maps to arrays
        const sensors: SensorStat[] = [];
        for (const [device, stat] of sensorMap.entries()) {
            const values = stat.values;
            sensors.push({
                device,
                avg: values.reduce((a, b) => a + b, 0) / values.length,
                min: Math.min(...values),
                max: Math.max(...values),
                count: values.length,
                unit: stat.unit
            });
        }

        const actuators: ActuatorStat[] = [];
        for (const [device, stat] of actuatorMap.entries()) {
            actuators.push({
                device,
                totalVolume: stat.volume,
                totalDuration: stat.duration,
                count: stat.count,
                unit: stat.unit
            });
        }

        return {
            sensors,
            actuators,
            triggers: { matched: 0, fallback: 0, skipped: 0 }  // Filled later
        };
    }

    /**
     * Get trigger statistics
     */
    private async getTriggerStats(programId: string, from: string, to: string) {
        const pipeline = [
            {
                $match: {
                    programId,
                    date: { $gte: from, $lte: to }
                }
            },
            { $unwind: '$events' },
            {
                $match: {
                    'events.type': { $in: ['TRIGGER_MATCH', 'TRIGGER_SKIP', 'FLOW_EXECUTED'] }
                }
            },
            {
                $group: {
                    _id: '$events.type',
                    count: { $sum: 1 }
                }
            }
        ];

        const result = await ProgramDailyLogModel.aggregate(pipeline);

        const stats = { matched: 0, fallback: 0, skipped: 0 };
        for (const row of result) {
            if (row._id === 'TRIGGER_MATCH') stats.matched = row.count;
            if (row._id === 'TRIGGER_SKIP') stats.skipped = row.count;
            // FALLBACK would need special handling if we have that event type
        }

        return stats;
    }
}

export const analyticsService = new AnalyticsService();

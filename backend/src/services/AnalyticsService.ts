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
    /**
     * Get all available filter options for a program, respecting current selections (Cascading)
     */
    async getFilterOptions(filters: AnalyticsFilters): Promise<FilterOptions> {
        // Base match for Program and Date
        const baseMatch: any = {
            programId: filters.programId,
            date: { $gte: filters.from, $lte: filters.to }
        };

        const pipeline = [
            { $match: baseMatch },
            { $unwind: '$events' },
            {
                $facet: {
                    // Windows: Depend only on Program + Date
                    windows: [
                        {
                            $group: {
                                _id: null,
                                items: {
                                    $addToSet: {
                                        id: '$events.metadata.windowId',
                                        name: { $ifNull: ['$events.metadata.windowName', '$events.metadata.windowId'] }
                                    }
                                }
                            }
                        }
                    ],
                    // Flows: Depend on Program + Date + Window
                    flows: [
                        {
                            $match: {
                                ...(filters.windowId ? { 'events.metadata.windowId': filters.windowId } : {})
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                items: {
                                    $addToSet: {
                                        id: '$events.executionSessionId',
                                        name: { $ifNull: ['$events.metadata.flowName', '$events.executionSessionId'] }
                                    }
                                }
                            }
                        }
                    ],
                    // Devices: Depend on Program + Date + Window + Flow
                    devices: [
                        {
                            $match: {
                                ...(filters.windowId ? { 'events.metadata.windowId': filters.windowId } : {}),
                                ...(filters.flowId ? { 'events.executionSessionId': filters.flowId } : {})
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                items: { $addToSet: '$events.metadata.blockLabel' }
                            }
                        }
                    ],
                    // Actions: Depend on Program + Date + Window + Flow + Device
                    actions: [
                        {
                            $match: {
                                ...(filters.windowId ? { 'events.metadata.windowId': filters.windowId } : {}),
                                ...(filters.flowId ? { 'events.executionSessionId': filters.flowId } : {}),
                                ...(filters.device ? { 'events.metadata.blockLabel': filters.device } : {})
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                items: { $addToSet: '$events.metadata.logData.action' }
                            }
                        }
                    ],
                    // Block Types: Broadest filter (usually not cascaded strictly, or depends on Flow)
                    // Let's make it depend on Window + Flow to be relevant
                    blockTypes: [
                        {
                            $match: {
                                ...(filters.windowId ? { 'events.metadata.windowId': filters.windowId } : {}),
                                ...(filters.flowId ? { 'events.executionSessionId': filters.flowId } : {})
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                items: { $addToSet: '$events.metadata.blockType' }
                            }
                        }
                    ]
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

        const facets = result[0];

        // Helper to deduplicate items by ID, preferring human-readable names
        const deduplicate = (items: { id: string; name: string }[]) => {
            const map = new Map<string, string>();
            items.forEach(item => {
                if (!item.id) return;
                const currentName = map.get(item.id);
                if (!currentName || (currentName === item.id && item.name !== item.id)) {
                    map.set(item.id, item.name);
                }
            });
            return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
        };

        const windows = facets.windows[0]?.items || [];
        const flows = facets.flows[0]?.items || [];
        const devices = facets.devices[0]?.items || [];
        const actions = facets.actions[0]?.items || [];
        const blockTypes = facets.blockTypes[0]?.items || [];

        return {
            windows: deduplicate(windows).sort((a, b) => a.name.localeCompare(b.name)),
            flows: deduplicate(flows).sort((a, b) => a.name.localeCompare(b.name)),
            devices: devices.filter((d: any) => d).sort(),
            actions: actions.filter((a: any) => a).sort(),
            blockTypes: blockTypes.filter((b: any) => b).sort()
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
                    flow: { $ifNull: ['$events.metadata.flowName', '$events.executionSessionId'] }, // Use flowName
                    metadata: '$events.metadata'
                }
            },
            { $sort: { timestamp: -1 } }
        ];

        const allData = await ProgramDailyLogModel.aggregate(pipeline as any[]);

        // Calculate summary
        const summary = this.calculateSummary(allData);

        // Get filter options
        const filterOptions = await this.getFilterOptions(filters);

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

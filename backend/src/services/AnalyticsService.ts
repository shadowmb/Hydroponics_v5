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
    unit?: string;
}

interface FilterOptions {
    windows: { id: string; name: string }[];
    flows: { id: string; name: string }[];
    devices: string[];
    actions: string[];
    blockTypes: string[];
    units: string[];
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

// ========== SESSION TIMELINE TYPES ==========

interface SessionFlowSummary {
    flowName: string;
    sessionId: string;
    startTime: Date;
    endTime: Date;
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

interface SessionTimelineEntry {
    windowId: string;
    windowName: string;
    startTime: Date;
    endTime: Date;
    triggerInfo: string | null;
    flows: SessionFlowSummary[];
    // Aggregated context at start and end
    contextStart: Record<string, { value: number; unit: string }>;
    contextEnd: Record<string, { value: number; unit: string }>;
    // Totals
    totalDosedMl: number;
    totalPulseSeconds: number;
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
                                ...(filters.flowId ? { 'events.executionSessionId': filters.flowId } : {}),
                                ...(filters.unit ? { 'events.metadata.logData.primaryUnit': filters.unit } : {})
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
                                ...(filters.device ? { 'events.metadata.blockLabel': filters.device } : {}),
                                ...(filters.unit ? { 'events.metadata.logData.primaryUnit': filters.unit } : {})
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
                                ...(filters.flowId ? { 'events.executionSessionId': filters.flowId } : {}),
                                ...(filters.unit ? { 'events.metadata.logData.primaryUnit': filters.unit } : {})
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                items: { $addToSet: '$events.metadata.blockType' }
                            }
                        }
                    ],
                    units: [
                        {
                            $match: {
                                ...(filters.windowId ? { 'events.metadata.windowId': filters.windowId } : {}),
                                ...(filters.flowId ? { 'events.executionSessionId': filters.flowId } : {})
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                items: { $addToSet: '$events.metadata.logData.primaryUnit' }
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
                blockTypes: [],
                units: []
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
        const units = facets.units[0]?.items || [];

        return {
            windows: deduplicate(windows).sort((a, b) => a.name.localeCompare(b.name)),
            flows: deduplicate(flows).sort((a, b) => a.name.localeCompare(b.name)),
            devices: devices.filter((d: any) => d).sort(),
            actions: actions.filter((a: any) => a).sort(),
            blockTypes: blockTypes.filter((b: any) => b).sort(),
            units: units.filter((u: any) => u).sort()
        };
    }

    /**
     * Get analytics data with filters, summary, and pagination
     */
    async getAnalytics(filters: AnalyticsFilters, page: number = 1, limit: number = 100): Promise<AnalyticsResponse> {
        // Build match conditions
        // Build match conditions
        const eventMatch: any = {
            $or: [
                { 'events.metadata.logData': { $exists: true } },
                { 'events.metadata.blockType': 'LOOP' }
            ]
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
        if (filters.unit) {
            eventMatch['events.metadata.logData.primaryUnit'] = filters.unit;
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
                    action: { $ifNull: ['$events.metadata.logData.action', '$events.metadata.blockType'] }, // Fallback to blockType (e.g. LOOP)
                    message: '$events.message',
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

    // ========== SESSION TIMELINE AGGREGATION ==========

    /**
     * Get session timeline - aggregates events by windowId to show
     * the "chain" of flows executed in each time window
     */
    async getSessionTimeline(programId: string, date: string): Promise<SessionTimelineEntry[]> {
        logger.info(`[AnalyticsService] Getting session timeline for program ${programId} on ${date}`);

        // Fetch all logs for this program and date
        const logs = await ProgramDailyLogModel.find({
            programId,
            date
        }).lean();

        if (!logs || logs.length === 0) {
            return [];
        }

        // Flatten all events from all log documents
        const allEvents: any[] = [];
        for (const log of logs) {
            if (log.events && Array.isArray(log.events)) {
                allEvents.push(...log.events);
            }
        }

        // Sort by timestamp
        allEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        // Group by windowId
        const windowGroups: Map<string, any[]> = new Map();

        for (const event of allEvents) {
            const windowId = event.metadata?.windowId || 'unknown';
            if (!windowGroups.has(windowId)) {
                windowGroups.set(windowId, []);
            }
            windowGroups.get(windowId)!.push(event);
        }

        // Build timeline entries
        const timeline: SessionTimelineEntry[] = [];

        for (const [windowId, events] of windowGroups) {
            if (windowId === 'unknown' || events.length === 0) continue;

            // Get window metadata from first event
            const windowName = events[0].metadata?.windowName || windowId;

            // Find trigger info
            const triggerEvent = events.find(e => e.type === 'TRIGGER_MATCH');
            const triggerInfo = triggerEvent?.message || null;

            // Group events by flow (executionSessionId)
            const flowGroups: Map<string, any[]> = new Map();
            for (const event of events) {
                const sessionId = event.executionSessionId || event.metadata?.sessionId;
                if (sessionId) {
                    if (!flowGroups.has(sessionId)) {
                        flowGroups.set(sessionId, []);
                    }
                    flowGroups.get(sessionId)!.push(event);
                }
            }

            // Build flow summaries
            const flows: SessionFlowSummary[] = [];
            for (const [sessionId, flowEvents] of flowGroups) {
                const flowName = flowEvents[0]?.metadata?.flowName || 'Unknown Flow';
                const timestamps = flowEvents.map(e => new Date(e.timestamp).getTime());
                const startTime = new Date(Math.min(...timestamps));
                const endTime = new Date(Math.max(...timestamps));

                // Extract sensor readings (last known value per device)
                const sensorMap: Map<string, { value: number; unit: string; isPrimary?: boolean }> = new Map();
                const actuatorMap: Map<string, { action: string; totalValue: number; unit: string; count: number }> = new Map();

                for (const event of flowEvents) {
                    const blockType = event.metadata?.blockType;
                    const logData = event.metadata?.logData;
                    // Use deviceName/deviceId from logData (reliable), fallback to blockLabel (legacy)
                    const deviceKey = logData?.deviceId || logData?.deviceName || event.metadata?.blockLabel || 'Unknown';
                    const deviceName = logData?.deviceName || event.metadata?.blockLabel || 'Unknown';

                    if (blockType === 'SENSOR_READ' && logData) {
                        // Use structured measurements array (new format)
                        if (logData.measurements && Array.isArray(logData.measurements)) {
                            for (const m of logData.measurements) {
                                if (typeof m.value === 'number' && !isNaN(m.value)) {
                                    const readingKey = `${deviceName}:${m.key}`;
                                    sensorMap.set(readingKey, {
                                        value: m.value,
                                        unit: m.unit,
                                        isPrimary: m.isPrimary
                                    });
                                }
                            }
                        }
                        // Also store primaryValue for backward compatibility
                        if (logData.primaryValue !== undefined) {
                            sensorMap.set(deviceName, {
                                value: logData.primaryValue,
                                unit: logData.primaryUnit || ''
                            });
                        }
                    }

                    if (blockType === 'ACTUATOR_SET' && logData) {
                        const existing = actuatorMap.get(deviceKey) || {
                            action: logData.action,
                            totalValue: 0,
                            unit: logData.primaryUnit || '',
                            count: 0,
                            resourceRole: logData.resourceRole
                        };
                        existing.totalValue += logData.primaryValue || 0;
                        existing.count += 1;
                        actuatorMap.set(deviceKey, existing);
                    }
                }

                flows.push({
                    flowName,
                    sessionId,
                    startTime,
                    endTime,
                    sensorReadings: Array.from(sensorMap.entries()).map(([device, data]) => ({
                        device,
                        value: data.value,
                        unit: data.unit
                    })),
                    actuatorActions: Array.from(actuatorMap.entries()).map(([device, data]) => ({
                        device,
                        action: data.action,
                        totalValue: data.totalValue,
                        unit: data.unit,
                        count: data.count
                    }))
                });
            }

            // Sort flows by start time
            flows.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

            // Calculate context start/end (first and last sensor readings across all flows)
            const contextStart: Record<string, { value: number; unit: string }> = {};
            const contextEnd: Record<string, { value: number; unit: string }> = {};

            if (flows.length > 0) {
                // Context Start: from first flow
                for (const reading of flows[0].sensorReadings) {
                    contextStart[reading.device] = { value: reading.value, unit: reading.unit };
                }
                // Context End: from last flow
                for (const reading of flows[flows.length - 1].sensorReadings) {
                    contextEnd[reading.device] = { value: reading.value, unit: reading.unit };
                }
            }

            // Calculate totals
            let totalDosedMl = 0;
            let totalPulseSeconds = 0;

            for (const flow of flows) {
                for (const act of flow.actuatorActions) {
                    if (act.unit === 'doses' || act.unit === 'ml') {
                        totalDosedMl += act.totalValue;
                    }
                    if (act.unit === 's') {
                        totalPulseSeconds += act.totalValue;
                    }
                }
            }

            // Timestamps from window events or first/last flow
            const windowStartEvent = events.find(e => e.type === 'WINDOW_EVENT' && e.message?.includes('стартира'));
            const windowEndEvent = events.find(e => e.type === 'WINDOW_EVENT' && e.message?.includes('завърши'));

            const windowStartTime = windowStartEvent
                ? new Date(windowStartEvent.timestamp)
                : (flows.length > 0 ? flows[0].startTime : new Date());
            const windowEndTime = windowEndEvent
                ? new Date(windowEndEvent.timestamp)
                : (flows.length > 0 ? flows[flows.length - 1].endTime : new Date());

            timeline.push({
                windowId,
                windowName,
                startTime: windowStartTime,
                endTime: windowEndTime,
                triggerInfo,
                flows,
                contextStart,
                contextEnd,
                totalDosedMl,
                totalPulseSeconds
            });
        }

        // Sort timeline by start time
        timeline.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

        return timeline;
    }
}

export const analyticsService = new AnalyticsService();

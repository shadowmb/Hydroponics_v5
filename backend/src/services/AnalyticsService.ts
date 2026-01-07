import { programDailyLogRepository } from '../modules/persistence/repositories/ProgramDailyLogRepository';
import { ProgramDailyLogModel } from '../modules/persistence/schemas/ProgramDailyLog.schema';
import { logger } from '../core/LoggerService';
import ResourceRoleManager from './ResourceRoleManager';
import { AnalyticsType } from '../models/ResourceRole';

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

// ========== SESSION TRACE TYPES (REFACTORED V2) ==========

export interface ExecutionStep {
    id: string;
    timestamp: Date;
    type: 'TRIGGER' | 'ACTION' | 'LOGIC' | 'ENVIRONMENT_SCAN' | 'FLOW_START' | 'FLOW_END' | 'ERROR' | 'LOOP_SUMMARY';
    label: string;
    description?: string;
    status: 'SUCCESS' | 'FAILURE' | 'SKIPPED' | 'INFO';
    icon?: string;
    metadata?: any;
    // For sensor scans
    readings?: {
        device: string;
        value: number;
        unit: string;
        isPrimary: boolean;
        role?: string;
    }[];
    resourceRole?: string;
    // For Loop Summary
    loopStats?: {
        iterations: number;
        durationSeconds: number;
        resources: Record<string, {
            role: string;
            type: 'SUM' | 'DELTA' | 'TREND' | 'NONE';
            value: number; // Sum or Delta or End
            startValue?: number; // For Delta/Trend
            endValue?: number;   // For Delta/Trend
            unit: string;
        }>;
    };
    // If it's a folded loop, it contains children
    children?: ExecutionStep[];
}

export interface ExecutionSession {
    id: string;
    type: 'TRIGGER_MATCH' | 'FALLBACK' | 'SCHEDULED' | 'MANUAL';
    description: string; // e.g. "Trigger: Moist < 30%"
    startTime: Date;
    endTime: Date;
    steps: ExecutionStep[];
    totals: Record<string, number>; // Totals just for this session
}

export interface ExecutionTrace {
    windowId: string;
    windowName: string;
    startTime: Date;
    endTime: Date;
    sessions: ExecutionSession[]; // New Hierarchy
    durationSeconds: number;
    totals: {
        dosedMl: number;
        energyWh: number;
        byRole: Record<string, number>;
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
    /**
     * Get execution trace - detailed diagnostic view of session execution
     */
    async getSessionTimeline(programId: string, date: string): Promise<ExecutionTrace[]> {
        logger.info(`[AnalyticsService] Getting session timeline V2 for program ${programId} on ${date}`);

        const logs = await ProgramDailyLogModel.find({ programId, date }).lean();
        if (!logs || logs.length === 0) return [];

        const rolesList = await ResourceRoleManager.getAllRoles();
        const roleMap = new Map<string, { type: AnalyticsType, unit?: string }>();
        rolesList.forEach(r => roleMap.set(r.key, { type: r.analyticsType, unit: r.unit }));

        const allEvents: any[] = [];
        for (const log of logs) {
            if (log.events && Array.isArray(log.events)) allEvents.push(...log.events);
        }
        allEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        const windowGroups = new Map<string, any[]>();
        for (const event of allEvents) {
            const windowId = event.metadata?.windowId || 'unknown';
            if (!windowGroups.has(windowId)) windowGroups.set(windowId, []);
            windowGroups.get(windowId)!.push(event);
        }

        const traces: ExecutionTrace[] = [];

        for (const [windowId, events] of windowGroups) {
            if (windowId === 'unknown' || events.length === 0) continue;

            const windowName = events[0].metadata?.windowName || windowId;
            const startTime = new Date(events[0].timestamp);
            const endTime = new Date(events[events.length - 1].timestamp);

            const { sessions, windowTotals } = this.processWindowEvents(events, roleMap);

            traces.push({
                windowId,
                windowName,
                startTime,
                endTime,
                durationSeconds: (endTime.getTime() - startTime.getTime()) / 1000,
                sessions,
                totals: {
                    dosedMl: windowTotals['volume'] || 0,
                    energyWh: 0,
                    byRole: windowTotals
                }
            });
        }

        return traces.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    }

    private processWindowEvents(events: any[], roleMap: Map<string, { type: AnalyticsType, unit?: string }>) {
        const sessions: ExecutionSession[] = [];
        const windowTotals: Record<string, number> = {};

        let currentSession: ExecutionSession | null = null;
        let sessionEvents: any[] = [];

        const flushSession = () => {
            if (currentSession) {
                const { steps, sessionTotals } = this.processSessionSteps(sessionEvents, roleMap);
                currentSession.steps = steps;
                currentSession.totals = sessionTotals;
                currentSession.endTime = new Date(sessionEvents[sessionEvents.length - 1]?.timestamp || currentSession.startTime);
                sessions.push(currentSession);
                Object.entries(sessionTotals).forEach(([key, val]) => {
                    windowTotals[key] = (windowTotals[key] || 0) + val;
                });
            }
        };

        const startNewSession = (type: ExecutionSession['type'], description: string, time: Date) => {
            flushSession();
            currentSession = {
                id: `sess_${time.getTime()}_${Math.random().toString(36).substr(2, 5)}`,
                type,
                description,
                startTime: time,
                endTime: time,
                steps: [],
                totals: {}
            };
            sessionEvents = [];
        };

        for (const event of events) {
            const type = event.type;
            const msg = event.message || '';

            if (type === 'TRIGGER_MATCH') {
                startNewSession('TRIGGER_MATCH', msg || 'Trigger Condition Matched', new Date(event.timestamp));
            } else if (type === 'WINDOW_EVENT' && msg.includes('стартира')) {
                if (!currentSession) {
                    startNewSession('SCHEDULED', 'Window Started', new Date(event.timestamp));
                }
            } else if (type === 'WINDOW_EVENT' && msg.includes('Fallback')) {
                startNewSession('FALLBACK', 'Fallback Activation', new Date(event.timestamp));
            }

            if (!currentSession) {
                startNewSession('SCHEDULED', 'Execution Segment', new Date(event.timestamp));
            }
            sessionEvents.push(event);
        }

        flushSession();
        return { sessions, windowTotals };
    }

    private processSessionSteps(events: any[], roleMap: Map<string, { type: AnalyticsType, unit?: string }>) {
        const steps: ExecutionStep[] = [];
        const sessionTotals: Record<string, number> = {};

        interface LoopContext {
            blockId: string;
            step: ExecutionStep;
            events: any[];
        }
        const loopStack: LoopContext[] = [];

        let currentScan: { device: string; value: number; unit: string; isPrimary: boolean, role?: string }[] | null = null;
        let currentScanTime: Date | null = null;

        const flushScan = () => {
            if (currentScan && currentScan.length > 0 && currentScanTime) {
                const step: ExecutionStep = {
                    id: `scan_${currentScanTime.getTime()}`,
                    timestamp: currentScanTime,
                    type: 'ENVIRONMENT_SCAN',
                    label: 'Read Sensors',
                    status: 'INFO',
                    readings: [...currentScan]
                };
                if (loopStack.length > 0) {
                    const ctx = loopStack[loopStack.length - 1];
                    ctx.step.children = ctx.step.children || [];
                    ctx.step.children.push(step);
                } else {
                    steps.push(step);
                }
                currentScan = null;
                currentScanTime = null;
            }
        };

        for (const event of events) {
            const meta = event.metadata || {};
            const logData = meta.logData;
            const timestamp = new Date(event.timestamp);
            const blockType = meta.blockType;

            // --- LOOP LOGIC ---
            if (blockType === 'LOOP') {
                flushScan();
                const blockId = meta.blockId;
                const iteration = logData?.iteration;
                const isContinuing = event.message?.includes('(Continuing)') ?? false;
                const isDone = event.message?.includes('(Done)') ?? false;

                // 1. Loop Start (Iteration 1 & Continuing)
                if (iteration === 1 && isContinuing) {
                    const loopStep: ExecutionStep = {
                        id: `loop_${timestamp.getTime()}_${blockId}`,
                        timestamp,
                        type: 'LOOP_SUMMARY',
                        label: meta.blockLabel || 'Loop Cycle',
                        status: 'SUCCESS',
                        children: [],
                        loopStats: { iterations: 1, durationSeconds: 0, resources: {} }
                    };

                    if (loopStack.length > 0) {
                        const parent = loopStack[loopStack.length - 1];
                        parent.step.children = parent.step.children || [];
                        parent.step.children.push(loopStep);
                    } else {
                        steps.push(loopStep);
                    }

                    loopStack.push({ blockId, step: loopStep, events: [event] });
                    continue;
                }

                // 2. Loop Iteration > 1 (Continuing)
                if (iteration > 1 && isContinuing) {
                    if (loopStack.length > 0) {
                        const ctx = loopStack[loopStack.length - 1];
                        if (ctx.blockId === blockId) {
                            ctx.step.loopStats!.iterations = iteration;
                        }
                    }
                    continue;
                }

                // 3. Loop End (Done)
                if (isDone) {
                    if (loopStack.length > 0) {
                        const ctx = loopStack[loopStack.length - 1];
                        if (ctx.blockId === blockId) {
                            loopStack.pop();
                            if (ctx.events.length > 0) {
                                const start = new Date(ctx.events[0].timestamp).getTime();
                                const end = timestamp.getTime();
                                ctx.step.loopStats!.durationSeconds = (end - start) / 1000;
                            }
                        }
                    }
                    continue;
                }
            }

            // --- SENSOR LOGIC ---
            if (blockType === 'SENSOR_READ' && logData) {
                if (!currentScan) { currentScan = []; currentScanTime = timestamp; }
                const label = meta.blockLabel || logData.deviceName || 'Unknown';
                const role = logData.resourceRole;

                if (logData.measurements) {
                    logData.measurements.forEach((m: any) => currentScan!.push({
                        device: label, value: m.value, unit: m.unit, isPrimary: m.isPrimary, role
                    }));
                } else if (logData.primaryValue !== undefined) {
                    currentScan!.push({
                        device: label, value: logData.primaryValue, unit: logData.primaryUnit, isPrimary: true, role
                    });
                }

                if (role && logData.primaryValue !== undefined) {
                    const rType = roleMap.get(role)?.type || 'NONE';
                    const rUnit = logData.primaryUnit || roleMap.get(role)?.unit || '';

                    this.accumulateStats(sessionTotals, role, logData.primaryValue, rType);

                    if (loopStack.length > 0) {
                        const ctx = loopStack[loopStack.length - 1];
                        this.accumulateLoopStats(ctx.step.loopStats!.resources, role, logData.primaryValue, rType, rUnit);
                    }
                }
                if (loopStack.length > 0) loopStack[loopStack.length - 1].events.push(event);
                continue;
            } else {
                flushScan();
            }

            // --- ACTUATOR LOGIC ---
            if (blockType === 'ACTUATOR_SET' && logData) {
                const role = logData.resourceRole;

                // Determine amount and unit
                // Prefer calculatedVolumeMl for normalization to liquid volume
                let amount = 0;
                let unit = logData.unit || logData.primaryUnit || '';

                if (logData.calculatedVolumeMl !== undefined) {
                    amount = Number(logData.calculatedVolumeMl);
                    unit = 'ml'; // Enforce normalized unit 'ml'
                } else if (logData.primaryValue !== undefined) {
                    amount = Number(logData.primaryValue);
                } else {
                    // Legacy/Fallback
                    amount = Number(logData.amount) || 0;
                }

                const step: ExecutionStep = {
                    id: `act_${timestamp.getTime()}`,
                    timestamp,
                    type: 'ACTION',
                    label: meta.blockLabel || logData.deviceName,
                    status: 'SUCCESS',
                    resourceRole: role,
                    metadata: logData
                };

                if (loopStack.length > 0) {
                    const ctx = loopStack[loopStack.length - 1];
                    ctx.step.children = ctx.step.children || [];
                    ctx.step.children.push(step);
                    ctx.events.push(event);

                    if (role && amount > 0) {
                        const rType = roleMap.get(role)?.type || 'NONE';
                        // Use determined unit, or fallback to role default
                        const rUnit = unit || roleMap.get(role)?.unit || '';
                        this.accumulateLoopStats(ctx.step.loopStats!.resources, role, amount, rType, rUnit);
                    }
                } else {
                    steps.push(step);
                }

                if (role && amount > 0) {
                    this.accumulateStats(sessionTotals, role, amount, roleMap.get(role)?.type || 'NONE');
                }
                continue;
            }

            // --- WAIT/IF/LOG LOGIC ---
            // If inside loop, capture them for duration tracking, otherwise ignore or add as steps?
            // User mostly cares about Sensors and Actions. But IF blocks are useful.
            // --- GENERIC EVENT LOGIC ---
            let stepType: ExecutionStep['type'] = 'LOGIC';
            if (event.type === 'TRIGGER_MATCH') stepType = 'TRIGGER';
            else if (event.type === 'FLOW_EXECUTED') stepType = 'FLOW_START';

            const genericStep: ExecutionStep = {
                id: `evt_${timestamp.getTime()}_${Math.random()}`,
                timestamp,
                type: stepType,
                label: event.message || meta.blockType || 'Event',
                status: 'INFO',
                description: event.metadata?.description,
                metadata: event.metadata
            };

            // If inside loop, capture them for duration tracking, otherwise ignore or add as steps?
            // User mostly cares about Sensors and Actions. But IF blocks are useful.
            if (loopStack.length > 0) {
                // Only add children if it's significant? 
                // For now, let's keep it clean and NOT add every generic step to avoiding spamming the folded loop
                // unless it is an important control flow event.
                // loopStack[loopStack.length - 1].step.children?.push(genericStep);
                loopStack[loopStack.length - 1].events.push(event);
            } else {
                if (event.type === 'TRIGGER_MATCH' ||
                    event.type === 'WINDOW_EVENT' ||
                    event.type === 'FLOW_EXECUTED' ||
                    meta.blockType === 'IF') {
                    steps.push(genericStep);
                }
            }
        }
        flushScan();
        return { steps, sessionTotals };
    }

    private countLoopIterations(events: any[]): number {
        return events.filter(e => e.message === 'Loop Condition Check').length || 1;
    }

    private accumulateStats(totals: Record<string, number>, role: string, value: number, type: AnalyticsType) {
        if (type === 'SUM') {
            totals[role] = (totals[role] || 0) + value;
        }
    }

    private accumulateLoopStats(
        stats: Record<string, { role: string; type: AnalyticsType; value: number; unit: string }>,
        role: string,
        value: number,
        type: AnalyticsType,
        unit: string
    ) {
        if (!stats[role]) {
            stats[role] = { role, type, value: 0, unit };
        }

        if (type === 'SUM') {
            stats[role].value += value;
        }
    }
}
export const analyticsService = new AnalyticsService();

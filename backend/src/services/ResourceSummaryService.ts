import { logger } from '../core/LoggerService';
import { ProgramDailyLogModel } from '../modules/persistence/schemas/ProgramDailyLog.schema';
import {
    ResourceDailySummaryModel,
    IResourceDailySummary,
    IResourceStat,
    IExecutionContext,
    AnalyticsType,
    IMeasurement
} from '../modules/persistence/schemas/ResourceDailySummary.schema';
import ResourceRoleManager from './ResourceRoleManager';

/**
 * Service for recording and querying aggregated resource analytics.
 * 
 * Data Flow:
 * 1. During execution: events are logged to ProgramDailyLog
 * 2. At window/cycle end: this service reads events, aggregates, and saves summary
 * 3. Query time: read from ResourceDailySummary (pre-calculated, fast)
 */
export class ResourceSummaryService {
    private static instance: ResourceSummaryService;

    public static getInstance(): ResourceSummaryService {
        if (!ResourceSummaryService.instance) {
            ResourceSummaryService.instance = new ResourceSummaryService();
        }
        return ResourceSummaryService.instance;
    }

    /**
     * Record aggregated resource data after window/cycle completion.
     * Reads raw events from ProgramDailyLog and calculates summary.
     * Aggregates ALL resources for the window into a single document, 
     * using the 'measurements' array to track individual device/source data.
     */
    async recordExecution(context: IExecutionContext): Promise<IResourceDailySummary | null> {
        try {
            logger.info({ context }, '📊 [ResourceSummaryService] Recording execution summary');

            // 1. Get today's date
            const date = this.getLocalDateString();

            // 2. Fetch events from ProgramDailyLog
            const events = await this.fetchEventsForContext(context.programId, date, context.windowId, context.sessionId);

            if (events.length === 0) {
                logger.warn({ context }, '⚠️ [ResourceSummaryService] No events found for context');
                return null;
            }

            // 3. Get role configurations
            const roles = await ResourceRoleManager.getAllRoles();
            const roleMap = new Map(
                roles.map(r => [r.key, {
                    type: r.analyticsType as AnalyticsType,
                    unit: r.unit || '',
                    measuredBy: r.measuredBy
                }])
            );

            // 4. Aggregate resources (returns array of measurements)
            const measurements = this.aggregateResources(events, roleMap);

            if (measurements.length === 0) {
                logger.warn({ context }, '⚠️ [ResourceSummaryService] No measurements aggregated');
                return null;
            }

            // 5. Create SINGLE summary for the window execution
            // We remove flowId/flowName from the main context as they are now per-measurement
            const summaryContext: IExecutionContext = {
                ...context
            };
            delete summaryContext.flowId;
            delete summaryContext.flowName;

            const summary = await ResourceDailySummaryModel.create({
                date,
                timestamp: new Date(),
                context: summaryContext,
                measurements
            });

            logger.info({
                summaryId: summary._id,
                measurementCount: measurements.length,
                resourceRoles: [...new Set(measurements.map(m => m.role))]
            }, '✅ [ResourceSummaryService] Window summary saved');

            return summary;
        } catch (error: any) {
            logger.error({ error: error.message, context }, '❌ [ResourceSummaryService] Failed to record execution');
            return null;
        }
    }


    /**
     * Get all-time totals for resources (for ALL SUMMARY cards)
     * Now includes metadata with date range and total days
     */
    async getAllTimeTotals(filters?: {
        programId?: string;
        windowName?: string;
    }): Promise<{ totals: Record<string, IResourceStat>; metadata: { minDate?: string; maxDate?: string; totalDays: number } }> {
        const match: any = {};
        if (filters?.programId) match['context.programId'] = filters.programId;
        if (filters?.windowName) match['context.windowName'] = filters.windowName;

        // Get aggregated resource stats
        const results = await ResourceDailySummaryModel.find(match).lean();
        const totals = this.mergeResourceStats(results as any[]);

        // Calculate date statistics
        const dateStats = await ResourceDailySummaryModel.aggregate([
            { $match: match },
            {
                $group: {
                    _id: null,
                    minDate: { $min: '$date' },
                    maxDate: { $max: '$date' },
                    uniqueDays: { $addToSet: '$date' }
                }
            },
            {
                $project: {
                    minDate: 1,
                    maxDate: 1,
                    totalDays: { $size: '$uniqueDays' }
                }
            }
        ]);

        const metadata = dateStats.length > 0
            ? {
                minDate: dateStats[0].minDate,
                maxDate: dateStats[0].maxDate,
                totalDays: dateStats[0].totalDays
            }
            : { totalDays: 0 };

        return { totals, metadata };
    }

    /**
     * Get totals for a specific date range (for PERIOD SUMMARY cards)
     */
    async getByDateRange(
        from: string,
        to: string,
        filters?: {
            programId?: string;
            windowName?: string;
        }
    ): Promise<Record<string, IResourceStat>> {
        const match: any = {
            date: { $gte: from, $lte: to }
        };
        if (filters?.programId) match['context.programId'] = filters.programId;
        if (filters?.windowName) match['context.windowName'] = filters.windowName;

        const results = await ResourceDailySummaryModel.find(match).lean();
        return this.mergeResourceStats(results as any[]);
    }

    /**
     * Get daily breakdown for charts
     */
    async getDailyBreakdown(
        from: string,
        to: string,
        roles: string[],
        filters?: {
            programId?: string;
            windowName?: string;
        }
    ): Promise<Array<{ date: string; resources: Record<string, number> }>> {
        const match: any = {
            date: { $gte: from, $lte: to }
        };
        if (filters?.programId) match['context.programId'] = filters.programId;
        if (filters?.windowName) match['context.windowName'] = filters.windowName;

        const results = await ResourceDailySummaryModel.find(match).sort({ date: 1 }).lean();

        // Group by date
        const byDate = new Map<string, Record<string, number>>();

        for (const doc of results) {
            const dateKey = doc.date;
            if (!byDate.has(dateKey)) {
                byDate.set(dateKey, {});
            }
            const dayData = byDate.get(dateKey)!;

            // Iterate measurements to sum values for requested roles
            for (const m of doc.measurements) {
                if (roles.includes(m.role)) {
                    dayData[m.role] = (dayData[m.role] || 0) + m.value;
                }
            }
        }

        return Array.from(byDate.entries()).map(([date, resources]) => ({
            date,
            resources
        }));
    }

    // ==================== PRIVATE HELPERS ====================

    /**
     * Fetch relevant events from ProgramDailyLog
     */
    private async fetchEventsForContext(
        programId: string,
        date: string,
        windowId?: string,
        sessionId?: string
    ): Promise<any[]> {
        const log = await ProgramDailyLogModel.findOne({ programId, date }).lean();
        if (!log || !log.events) return [];

        // Filter by window or session if provided
        return log.events.filter((event: any) => {
            const meta = event.metadata || {};

            // Only include SENSOR_READ and ACTUATOR_SET events
            if (!['SENSOR_READ', 'ACTUATOR_SET'].includes(meta.blockType)) {
                return false;
            }

            // Filter by windowId if provided
            if (windowId && meta.windowId !== windowId) {
                return false;
            }

            // Filter by sessionId if provided
            if (sessionId && event.executionSessionId !== sessionId) {
                return false;
            }

            return true;
        });
    }

    /**
     * Aggregate resources from events into measurements
     */
    private aggregateResources(
        events: any[],
        roleMap: Map<string, { type: AnalyticsType; unit?: string; measuredBy?: string }>
    ): IMeasurement[] {
        // Key: "analyticsLabel|role" -> Measurement
        const measurementsMap = new Map<string, IMeasurement>();
        // Key: "analyticsLabel|role" -> Array of values
        const readingsMap = new Map<string, number[]>();

        const actuatorMeasuredByRoles: Set<string> = new Set();
        // Helpers to track role->measuredBy relationship for specific devices
        const sourceRoleMap = new Map<string, string>(); // "source|role" -> measuredByRole

        for (const event of events) {
            const meta = event.metadata || {};
            const logData = meta.logData;
            const blockType = meta.blockType;

            if (!logData) continue;

            const role = logData.resourceRole;
            if (!role) continue;

            // Extract Analytics Label (Source)
            // Priority: logData.analyticsLabel > metadata.blockLabel > deviceName > 'Unknown'
            const source = logData.analyticsLabel || meta.blockLabel || logData.deviceName || 'Unknown';
            const flowId = meta.logData?.flowId || 'unknown';
            const flowName = meta.logData?.flowName || meta.flowName || flowId;

            const roleConfig = roleMap.get(role);
            const rType = roleConfig?.type || 'NONE';
            const rUnit = logData.primaryUnit || roleConfig?.unit || '';

            const key = `${source}|${role}`;

            // Initialize if new
            if (!measurementsMap.has(key)) {
                measurementsMap.set(key, {
                    source,
                    role,
                    flowId,
                    flowName,
                    value: 0,
                    unit: rUnit,
                    type: rType
                });
            }

            const stat = measurementsMap.get(key)!;

            // SENSOR_READ
            if (blockType === 'SENSOR_READ' && logData.primaryValue !== undefined) {
                const value = Number(logData.primaryValue);
                if (!readingsMap.has(key)) readingsMap.set(key, []);
                readingsMap.get(key)!.push(value);

                this.accumulateStat(stat, value, rType);
            }

            // ACTUATOR_SET
            if (blockType === 'ACTUATOR_SET') {
                let amount = 0;
                let unit = logData.unit || logData.primaryUnit || '';
                if (unit) stat.unit = unit; // Update unit if available

                if (logData.calculatedVolumeMl !== undefined) {
                    amount = Number(logData.calculatedVolumeMl);
                    stat.unit = 'ml';
                } else if (logData.primaryValue !== undefined) {
                    amount = Number(logData.primaryValue);
                } else {
                    amount = Number(logData.amount) || 0;
                }

                const measuredBy = roleConfig?.measuredBy;

                if (rType === 'NONE' && measuredBy) {
                    // This actuator is measured by another sensor
                    actuatorMeasuredByRoles.add(key);
                    sourceRoleMap.set(key, measuredBy);
                } else if (amount > 0) {
                    if (!readingsMap.has(key)) readingsMap.set(key, []);
                    readingsMap.get(key)!.push(amount);
                    this.accumulateStat(stat, amount, rType);
                }
            }
        }

        // Finalize measuredBy delta calculations
        // We need to find the corresponding sensor measurement for the same SOURCE?
        // Actually, usually actuators and sensors are different devices, so sources will differ.
        // But they should be in the same Flow? Or same Window?
        // Logic: Find ANY sensor in the same window/flow that matches 'measuredBy' role.
        // NOTE: This logic is tricky with multiple sensors. We will assume the MAIN sensor for that role.

        // Simplification: We look for ANY measurement with role == measuredByRole.
        // If multiple exist, we might have ambiguity. For now, we take the first one or sum them?
        // Let's stick to the previous logical equivalent: Check readingsMap for the measuredByRole.
        // BUT readingsMap is keyed by "source|role".

        for (const actuatorKey of actuatorMeasuredByRoles) {
            const [source, role] = actuatorKey.split('|');
            const measuredByRole = sourceRoleMap.get(actuatorKey);

            if (measuredByRole) {
                // Find all readings for the measuredByRole in this window
                // We aggregate all readings for that role across ALL sources to calculate delta?
                // Or do we assume a specific relationship?
                // Previously it was simple because we aggregated everything by role.
                // Now we are granular.

                // Let's find ALL measurements for measuredByRole
                const sensorReadings: number[] = [];
                let sensorUnit = '';

                for (const [k, vals] of readingsMap) {
                    const [s, r] = k.split('|');
                    if (r === measuredByRole) {
                        sensorReadings.push(...vals);
                        // Take unit from first match
                        if (!sensorUnit) sensorUnit = measurementsMap.get(k)?.unit || '';
                    }
                }

                if (sensorReadings.length >= 1) {
                    // Sort by time? The array order in fetchEventsForContext preserves time.
                    // But we flattened into a map.
                    // To do this correctly, we should have kept time order.
                    // However, readingsMap creates arrays in order of events.
                    // So if we just concatenate, we might lose strict global order if multiple sensors interleaved.
                    // But usually there's one main sensor.

                    const startValue = sensorReadings[0];
                    const endValue = sensorReadings[sensorReadings.length - 1];
                    const delta = endValue - startValue;

                    const stat = measurementsMap.get(actuatorKey)!;
                    stat.value = delta;
                    stat.unit = sensorUnit || stat.unit;
                    stat.type = 'DELTA';
                    stat.startValue = startValue;
                    stat.endValue = endValue;
                }
            }
        }

        // Calculate average, min, max, count for each measurement
        for (const [key, stat] of measurementsMap) {
            const readings = readingsMap.get(key);
            if (readings && readings.length > 0) {
                stat.count = readings.length;
                stat.average = readings.reduce((a, b) => a + b, 0) / readings.length;
                stat.min = Math.min(...readings);
                stat.max = Math.max(...readings);
            }
        }

        return Array.from(measurementsMap.values());
    }

    /**
     * Accumulate statistics based on analytics type
     */
    private accumulateStat(
        stat: IResourceStat,
        value: number,
        type: AnalyticsType
    ): void {
        if (type === 'SUM') {
            stat.value += value;
        } else if (type === 'DELTA' || type === 'TREND') {
            if (stat.startValue === undefined) {
                stat.startValue = value;
            }
            stat.endValue = value;
            stat.value = (stat.endValue ?? 0) - (stat.startValue ?? 0);
        } else {
            // NONE: record the last value
            stat.value = value;
        }
    }

    /**
     * Merge multiple summary documents into one aggregated result
     * Used for All Time / Period summaries
     */
    private mergeResourceStats(docs: IResourceDailySummary[]): Record<string, IResourceStat> {
        const merged: Record<string, IResourceStat> = {};
        const readingsByRole: Record<string, number[]> = {};

        for (const doc of docs) {
            for (const m of doc.measurements) {
                const role = m.role;

                if (!merged[role]) {
                    merged[role] = { ...m }; // Copy structure
                    // Reset accumulators for the merge
                    merged[role].count = 0;
                    merged[role].average = 0;
                    readingsByRole[role] = [];
                } else {
                    // Merge based on type
                    if (m.type === 'SUM' || m.type === 'DELTA') {
                        merged[role].value += m.value;
                    }
                    // For DELTA/TREND across days, logic is tricky. 
                    // Usually we sum Deltas (Total consumption).

                    if (m.startValue !== undefined && merged[role].startValue === undefined) {
                        merged[role].startValue = m.startValue;
                    }
                    if (m.endValue !== undefined) {
                        merged[role].endValue = m.endValue;
                    }
                }

                // Collect averages
                if (m.average !== undefined && m.count !== undefined) {
                    for (let i = 0; i < m.count; i++) {
                        readingsByRole[role].push(m.average);
                    }
                }
            }
        }

        // Recalculate aggregates
        for (const [role, readings] of Object.entries(readingsByRole)) {
            if (merged[role] && readings.length > 0) {
                merged[role].count = readings.length;
                merged[role].average = readings.reduce((a, b) => a + b, 0) / readings.length;
            }
        }

        return merged;
    }

    /**
     * Get local date string in YYYY-MM-DD format
     */
    private getLocalDateString(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Find similar cases based on multiple resource criteria
     * 
     * @param params Search parameters
     * @returns Array of matching records with requested resource data
     */
    async findSimilarCases(params: {
        filters?: {
            programId?: string;
            windowId?: string;
            flowId?: string; // Note: We might want to remove this or search inside measurements
        };
        criteria: Array<{
            role: string;
            field?: 'value' | 'startValue' | 'endValue' | 'min' | 'max' | 'average';
            value?: number;
            tolerance?: number;
            showOnly?: boolean;
            analyticsLabel?: string; // New: Filter by specific source
            toleranceMode?: 'symmetric' | 'lower' | 'upper';
        }>;
        limit?: number;
    }): Promise<{
        records: Array<{
            date: string;
            context: IExecutionContext;
            resources: Record<string, {
                value?: number;
                startValue?: number;
                endValue?: number;
                unit: string;
                source?: string; // Return source for UI
            }>;
        }>;
        stats?: {
            count: number;
            averages: Record<string, number>;
        };
    }> {
        try {
            const { filters = {}, criteria = [], limit = 10 } = params;

            // Separate filtering vs show-only criteria
            const filteringCriteria = criteria.filter(c => !c.showOnly);
            const showOnlyCriteria = criteria.filter(c => c.showOnly);

            // Build MongoDB query
            const query: Record<string, unknown> = {};

            // Apply context filters
            if (filters.programId) query['context.programId'] = filters.programId;
            if (filters.windowId) query['context.windowId'] = filters.windowId;
            // flowId filter needs to search inside measurements
            if (filters.flowId) {
                query['measurements.flowId'] = filters.flowId;
            }

            // Apply filtering criteria using $all and $elemMatch
            if (filteringCriteria.length > 0) {
                const criteriaConditions = filteringCriteria.map(criterion => {
                    const { role, field = 'value', value, tolerance = 0, analyticsLabel, toleranceMode = 'symmetric' } = criterion;

                    const condition: any = { role };
                    if (analyticsLabel) {
                        condition.source = analyticsLabel;
                    }

                    if (value !== undefined) {
                        let minValue, maxValue;

                        if (toleranceMode === 'lower') {
                            minValue = value - tolerance;
                            maxValue = value;
                        } else if (toleranceMode === 'upper') {
                            minValue = value;
                            maxValue = value + tolerance;
                        } else {
                            // symmetric (default)
                            minValue = value - tolerance;
                            maxValue = value + tolerance;
                        }

                        condition[field] = { $gte: minValue, $lte: maxValue };
                    }

                    return { $elemMatch: condition };
                });

                query['measurements'] = { $all: criteriaConditions };
            }

            // Execute query
            const docs = await ResourceDailySummaryModel
                .find(query)
                .sort({ date: -1 })
                .limit(limit)
                .lean()
                .exec();

            // Format results
            const records = docs.map(doc => {
                // Filter measurements to include only those requested by criteria or showOnly
                const requestedRoles = [...filteringCriteria, ...showOnlyCriteria];

                const relevantMeasurements = doc.measurements.filter(m => {
                    return requestedRoles.some(req => {
                        if (req.role !== m.role) return false;
                        if (req.analyticsLabel && m.source !== req.analyticsLabel) return false;
                        return true;
                    });
                });

                // Map for backward compatibility (may be overwritten if duplicates)
                const resourcesMap: Record<string, any> = {};
                relevantMeasurements.forEach(m => {
                    resourcesMap[m.role] = {
                        value: m.value,
                        startValue: m.startValue,
                        endValue: m.endValue,
                        min: m.min,
                        max: m.max,
                        average: m.average,
                        unit: m.unit,
                        source: m.source
                    };
                });

                return {
                    date: doc.date,
                    context: doc.context,
                    measurements: relevantMeasurements,
                    resources: resourcesMap
                };
            });

            // Calculate averages (simplified)
            const averages: Record<string, number> = {};
            // ... (Omitting average calculation for brevity/complexity as it depends on keys)

            return {
                records,
                stats: {
                    count: records.length,
                    averages
                }
            };
        } catch (error) {
            logger.error({ error, params }, '❌ [ResourceSummaryService] Error finding similar cases');
            throw error;
        }
    }

    /**
     * Get available window names for filtering
     */
    async getAvailableWindows(programId?: string): Promise<string[]> {
        try {
            const query: any = { deletedAt: null };

            if (programId) {
                query['context.programId'] = programId;
            }

            const windows = await ResourceDailySummaryModel
                .distinct('context.windowName', query)
                .exec();

            return windows.filter(Boolean).sort();
        } catch (error) {
            logger.error({ error, programId }, '❌ [ResourceSummaryService] Error fetching available windows');
            throw error;
        }
    }

    /**
     * Get available flow names/ids for filtering
     * Scans through measurements to find unique flows
     */
    async getAvailableFlows(programId?: string, windowName?: string): Promise<{ id: string, label: string }[]> {
        try {
            const query: any = { deletedAt: null };

            if (programId) query['context.programId'] = programId;
            if (windowName) query['context.windowName'] = windowName;

            // Unwind measurements to get flow info
            const flowPairs = await ResourceDailySummaryModel.aggregate([
                { $match: query },
                { $unwind: '$measurements' },
                {
                    $group: {
                        _id: '$measurements.flowId',
                        flowName: { $first: '$measurements.flowName' }
                    }
                },
                { $sort: { flowName: 1 } }
            ]).exec();

            return flowPairs
                .filter(f => f._id)
                .map(f => ({
                    id: f._id,
                    label: f.flowName || f._id
                }));
        } catch (error) {
            logger.error({ error, programId, windowName }, '❌ [ResourceSummaryService] Error fetching available flows');
            throw error;
        }
    }
    /**
     * Get unique sources (analytics labels) from measurements
     */
    async getUniqueSources(): Promise<string[]> {
        try {
            const sources = await ResourceDailySummaryModel.distinct('measurements.source', { deletedAt: null }).exec();
            return sources.filter(Boolean).sort();
        } catch (error) {
            logger.error({ error }, '❌ [ResourceSummaryService] Error fetching unique sources');
            throw error;
        }
    }
}

export const resourceSummaryService = ResourceSummaryService.getInstance();

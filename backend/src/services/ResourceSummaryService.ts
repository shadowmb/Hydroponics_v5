import { logger } from '../core/LoggerService';
import { ProgramDailyLogModel } from '../modules/persistence/schemas/ProgramDailyLog.schema';
import {
    ResourceDailySummaryModel,
    IResourceDailySummary,
    IResourceStat,
    IExecutionContext,
    AnalyticsType
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

            // 4. Aggregate resources
            const resources = this.aggregateResources(events, roleMap);

            if (Object.keys(resources).length === 0) {
                logger.warn({ context }, '⚠️ [ResourceSummaryService] No resources aggregated');
                return null;
            }

            // 5. Save summary
            const summary = await ResourceDailySummaryModel.create({
                date,
                timestamp: new Date(),
                context,
                resources
            });

            logger.info({
                summaryId: summary._id,
                resourceCount: Object.keys(resources).length
            }, '✅ [ResourceSummaryService] Summary saved');

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

            for (const role of roles) {
                if (doc.resources[role]) {
                    dayData[role] = (dayData[role] || 0) + doc.resources[role].value;
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
     * Aggregate resources from events
     */
    private aggregateResources(
        events: any[],
        roleMap: Map<string, { type: AnalyticsType; unit?: string; measuredBy?: string }>
    ): Record<string, IResourceStat> {
        const stats: Record<string, IResourceStat> = {};
        const readingsByRole: Record<string, number[]> = {};
        const actuatorMeasuredByRoles: Set<string> = new Set();

        for (const event of events) {
            const meta = event.metadata || {};
            const logData = meta.logData;
            const blockType = meta.blockType;

            if (!logData) continue;

            const role = logData.resourceRole;
            if (!role) continue;

            const roleConfig = roleMap.get(role);
            const rType = roleConfig?.type || 'NONE';
            const rUnit = logData.primaryUnit || roleConfig?.unit || '';

            // SENSOR_READ
            if (blockType === 'SENSOR_READ' && logData.primaryValue !== undefined) {
                const value = Number(logData.primaryValue);
                if (!readingsByRole[role]) readingsByRole[role] = [];
                readingsByRole[role].push(value);
                this.accumulateStat(stats, role, value, rType, rUnit);
            }

            // ACTUATOR_SET
            if (blockType === 'ACTUATOR_SET') {
                let amount = 0;
                let unit = logData.unit || logData.primaryUnit || '';

                if (logData.calculatedVolumeMl !== undefined) {
                    amount = Number(logData.calculatedVolumeMl);
                    unit = 'ml';
                } else if (logData.primaryValue !== undefined) {
                    amount = Number(logData.primaryValue);
                } else {
                    amount = Number(logData.amount) || 0;
                }

                const measuredBy = roleConfig?.measuredBy;

                if (rType === 'NONE' && measuredBy) {
                    actuatorMeasuredByRoles.add(role);
                } else if (amount > 0) {
                    if (!readingsByRole[role]) readingsByRole[role] = [];
                    readingsByRole[role].push(amount);
                    this.accumulateStat(stats, role, amount, rType, unit);
                }
            }
        }

        // Finalize measuredBy delta calculations
        for (const actuatorRole of actuatorMeasuredByRoles) {
            const measuredByRole = roleMap.get(actuatorRole)?.measuredBy;
            if (measuredByRole && readingsByRole[measuredByRole]?.length >= 1) {
                const readings = readingsByRole[measuredByRole];
                const startValue = readings[0];
                const endValue = readings[readings.length - 1];
                const delta = endValue - startValue;

                const linkedRoleConfig = roleMap.get(measuredByRole);
                const unit = linkedRoleConfig?.unit || stats[measuredByRole]?.unit || '';

                stats[actuatorRole] = {
                    value: delta,
                    unit: unit,
                    type: 'DELTA',
                    startValue,
                    endValue
                };
            }
        }

        // Calculate average, min, max, count for each role
        for (const [role, readings] of Object.entries(readingsByRole)) {
            if (stats[role] && readings.length > 0) {
                stats[role].count = readings.length;
                stats[role].average = readings.reduce((a, b) => a + b, 0) / readings.length;
                stats[role].min = Math.min(...readings);
                stats[role].max = Math.max(...readings);
            }
        }

        return stats;
    }

    /**
     * Accumulate statistics based on analytics type
     */
    private accumulateStat(
        stats: Record<string, IResourceStat>,
        role: string,
        value: number,
        type: AnalyticsType,
        unit: string
    ): void {
        if (!stats[role]) {
            stats[role] = { value: 0, unit, type };
        }

        if (type === 'SUM') {
            stats[role].value += value;
        } else if (type === 'DELTA' || type === 'TREND') {
            if (stats[role].startValue === undefined) {
                stats[role].startValue = value;
            }
            stats[role].endValue = value;
            stats[role].value = (stats[role].endValue ?? 0) - (stats[role].startValue ?? 0);
        } else {
            // NONE: record the last value
            stats[role].value = value;
        }
    }

    /**
     * Merge multiple summary documents into one aggregated result
     */
    private mergeResourceStats(docs: IResourceDailySummary[]): Record<string, IResourceStat> {
        const merged: Record<string, IResourceStat> = {};
        const readingsByRole: Record<string, number[]> = {};

        for (const doc of docs) {
            for (const [role, stat] of Object.entries(doc.resources)) {
                if (!merged[role]) {
                    merged[role] = { ...stat };
                    readingsByRole[role] = [];
                } else {
                    // Merge based on type
                    if (stat.type === 'SUM' || stat.type === 'DELTA') {
                        // SUM: accumulate values
                        // DELTA: each record's value is already the calculated delta, so sum them
                        merged[role].value += stat.value;
                    }
                    // For DELTA/TREND, keep first start and last end (for Phase 2 analysis)
                    if (stat.startValue !== undefined && merged[role].startValue === undefined) {
                        merged[role].startValue = stat.startValue;
                    }
                    if (stat.endValue !== undefined) {
                        merged[role].endValue = stat.endValue;
                    }
                }

                // Collect for average recalculation
                if (stat.average !== undefined && stat.count !== undefined) {
                    for (let i = 0; i < stat.count; i++) {
                        readingsByRole[role].push(stat.average);
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
            flowId?: string;
        };
        criteria: Array<{
            role: string;
            field?: 'value' | 'startValue' | 'endValue' | 'min' | 'max' | 'average';
            value?: number;
            tolerance?: number;
            showOnly?: boolean; // If true, don't filter, just show in results
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
            const allRoles = [...new Set([...filteringCriteria.map(c => c.role), ...showOnlyCriteria.map(c => c.role)])];

            // Build MongoDB query
            const query: Record<string, unknown> = {};

            // Apply context filters
            if (filters.programId) query['context.programId'] = filters.programId;
            if (filters.windowId) query['context.windowId'] = filters.windowId;
            if (filters.flowId) query['context.flowId'] = filters.flowId;

            // Apply filtering criteria
            for (const criterion of filteringCriteria) {
                const { role, field = 'value', value, tolerance = 0 } = criterion;

                if (value !== undefined) {
                    const fieldPath = `resources.${role}.${field}`;
                    const minValue = value - tolerance;
                    const maxValue = value + tolerance;

                    query[fieldPath] = {
                        $gte: minValue,
                        $lte: maxValue
                    };
                }
            }

            // Execute query
            const docs = await ResourceDailySummaryModel
                .find(query)
                .sort({ date: -1 })
                .limit(limit)
                .lean()
                .exec();

            // Format results
            const records = docs.map(doc => ({
                date: doc.date,
                context: doc.context,
                resources: Object.fromEntries(
                    allRoles
                        .filter(role => doc.resources[role])
                        .map(role => {
                            const res = doc.resources[role];
                            return [
                                role,
                                {
                                    value: res.value,
                                    startValue: res.startValue,
                                    endValue: res.endValue,
                                    min: res.min,
                                    max: res.max,
                                    average: res.average,
                                    unit: res.unit
                                }
                            ];
                        })
                )
            }));

            // Calculate averages for all displayed resources
            const averages: Record<string, number> = {};
            for (const role of allRoles) {
                const values = records
                    .map(r => r.resources[role]?.value)
                    .filter((v): v is number => v !== undefined && v !== null);

                if (values.length > 0) {
                    averages[role] = values.reduce((a, b) => a + b, 0) / values.length;
                }
            }

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
     * @param programId Optional program ID to filter windows
     * @returns Array of unique window names
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
}

export const resourceSummaryService = ResourceSummaryService.getInstance();

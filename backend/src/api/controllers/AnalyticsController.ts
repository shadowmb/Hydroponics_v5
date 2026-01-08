import { FastifyRequest, FastifyReply } from 'fastify';
import { analyticsService } from '../../services/AnalyticsService';

interface AnalyticsQuery {
    from?: string;
    to?: string;
    windowId?: string;
    flowId?: string;
    blockType?: string;
    device?: string;
    action?: string;
    page?: string;
    limit?: string;
    unit?: string;
}

interface AnalyticsParams {
    programId: string;
}

export const AnalyticsController = {
    /**
     * GET /api/analytics/programs
     * Get list of programs that have execution data
     */
    async getExecutedPrograms(
        request: FastifyRequest,
        reply: FastifyReply
    ) {
        try {
            const programs = await analyticsService.getExecutedPrograms();
            return reply.send({
                success: true,
                data: programs
            });
        } catch (error: any) {
            console.error('[AnalyticsController] Error:', error);
            return reply.status(500).send({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * GET /api/analytics/program/:programId
     * Get analytics data for a specific program
     */
    async getAnalytics(
        request: FastifyRequest<{ Params: AnalyticsParams; Querystring: AnalyticsQuery }>,
        reply: FastifyReply
    ) {
        try {
            const { programId } = request.params;
            const {
                from,
                to,
                windowId,
                flowId,
                blockType,
                device,
                action,
                page = '1',
                limit = '100',
                unit
            } = request.query;

            // Default date range: last 7 days
            const now = new Date();
            const defaultTo = now.toISOString().split('T')[0];
            const defaultFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            const filters = {
                programId,
                from: from || defaultFrom,
                to: to || defaultTo,
                windowId,
                flowId,
                blockType,
                device,
                action,
                unit
            };

            const result = await analyticsService.getAnalytics(
                filters,
                parseInt(page, 10),
                parseInt(limit, 10)
            );

            return reply.send({
                success: true,
                data: result
            });
        } catch (error: any) {
            console.error('[AnalyticsController] Error:', error);
            return reply.status(500).send({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * GET /api/analytics/program/:programId/filters
     * Get available filter options for a program
     */
    async getFilterOptions(
        request: FastifyRequest<{ Params: AnalyticsParams; Querystring: AnalyticsQuery }>,
        reply: FastifyReply
    ) {
        try {
            const { programId } = request.params;
            const {
                from,
                to,
                windowId,
                flowId,
                blockType,
                device,
                action,
                unit
            } = request.query;

            // Default date range: last 30 days
            const now = new Date();
            const defaultTo = now.toISOString().split('T')[0];
            const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            const filters = {
                programId,
                from: from || defaultFrom,
                to: to || defaultTo,
                windowId,
                flowId,
                blockType,
                device,
                action,
                unit
            };

            const result = await analyticsService.getFilterOptions(filters);

            return reply.send({
                success: true,
                data: filters
            });
        } catch (error: any) {
            console.error('[AnalyticsController] Error:', error);
            return reply.status(500).send({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * GET /api/analytics/program/:programId/sessions
     * Get session timeline - aggregated view of flows per window
     */
    async getSessionTimeline(
        request: FastifyRequest<{ Params: AnalyticsParams; Querystring: { date?: string } }>,
        reply: FastifyReply
    ) {
        try {
            const { programId } = request.params;
            const { date } = request.query;

            // Default date: today
            const targetDate = date || new Date().toISOString().split('T')[0];

            const timeline = await analyticsService.getSessionTimeline(programId, targetDate);

            return reply.send({
                success: true,
                data: {
                    programId,
                    date: targetDate,
                    sessions: timeline
                }
            });
        } catch (error: any) {
            console.error('[AnalyticsController] Error getting session timeline:', error);
            return reply.status(500).send({
                success: false,
                error: error.message
            });
        }
    },

    // ==================== RESOURCE SUMMARY ENDPOINTS ====================

    /**
     * GET /api/analytics/resources/all
     * Get all-time totals for resources (ALL SUMMARY cards)
     */
    async getResourceAllTotals(
        request: FastifyRequest<{ Querystring: { programId?: string; flowId?: string; windowId?: string } }>,
        reply: FastifyReply
    ) {
        try {
            const { resourceSummaryService } = require('../../services/ResourceSummaryService');
            const { programId, flowId, windowId } = request.query;

            const totals = await resourceSummaryService.getAllTimeTotals({
                programId,
                flowId,
                windowId
            });

            return reply.send({
                success: true,
                data: totals
            });
        } catch (error: any) {
            console.error('[AnalyticsController] Error getting resource totals:', error);
            return reply.status(500).send({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * GET /api/analytics/resources/period
     * Get totals for a specific date range (PERIOD SUMMARY cards)
     */
    async getResourcePeriodTotals(
        request: FastifyRequest<{ Querystring: { from: string; to: string; programId?: string; flowId?: string; windowId?: string } }>,
        reply: FastifyReply
    ) {
        try {
            const { resourceSummaryService } = require('../../services/ResourceSummaryService');
            const { from, to, programId, flowId, windowId } = request.query;

            if (!from || !to) {
                return reply.status(400).send({
                    success: false,
                    error: 'Missing required parameters: from, to'
                });
            }

            const totals = await resourceSummaryService.getByDateRange(from, to, {
                programId,
                flowId,
                windowId
            });

            return reply.send({
                success: true,
                data: totals
            });
        } catch (error: any) {
            console.error('[AnalyticsController] Error getting resource period totals:', error);
            return reply.status(500).send({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * GET /api/analytics/resources/daily
     * Get daily breakdown for charts
     */
    async getResourceDailyBreakdown(
        request: FastifyRequest<{ Querystring: { from: string; to: string; roles: string; programId?: string; flowId?: string } }>,
        reply: FastifyReply
    ) {
        try {
            const { resourceSummaryService } = require('../../services/ResourceSummaryService');
            const { from, to, roles, programId, flowId } = request.query;

            if (!from || !to || !roles) {
                return reply.status(400).send({
                    success: false,
                    error: 'Missing required parameters: from, to, roles'
                });
            }

            const rolesArray = roles.split(',').map(r => r.trim());
            const breakdown = await resourceSummaryService.getDailyBreakdown(from, to, rolesArray, {
                programId,
                flowId
            });

            return reply.send({
                success: true,
                data: breakdown
            });
        } catch (error: any) {
            console.error('[AnalyticsController] Error getting daily breakdown:', error);
            return reply.status(500).send({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * POST /api/analytics/resources/similar
     * Find similar cases based on multiple resource criteria
     */
    async findSimilarCases(
        request: FastifyRequest<{
            Body: {
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
                    showOnly?: boolean;
                }>;
                limit?: number;
            }
        }>,
        reply: FastifyReply
    ) {
        try {
            const { resourceSummaryService } = require('../../services/ResourceSummaryService');
            const { filters, criteria, limit } = request.body;

            if (!criteria || !Array.isArray(criteria)) {
                return reply.status(400).send({
                    success: false,
                    error: 'Missing or invalid criteria array'
                });
            }

            const result = await resourceSummaryService.findSimilarCases({
                filters,
                criteria,
                limit
            });

            return reply.send({
                success: true,
                data: result
            });
        } catch (error: any) {
            console.error('[AnalyticsController] Error finding similar cases:', error);
            return reply.status(500).send({
                success: false,
                error: error.message
            });
        }
    }
};

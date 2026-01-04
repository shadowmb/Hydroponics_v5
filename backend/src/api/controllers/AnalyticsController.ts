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
                limit = '100'
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
                action
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
        request: FastifyRequest<{ Params: AnalyticsParams; Querystring: { from?: string; to?: string } }>,
        reply: FastifyReply
    ) {
        try {
            const { programId } = request.params;
            const { from, to } = request.query;

            // Default date range: last 30 days
            const now = new Date();
            const defaultTo = now.toISOString().split('T')[0];
            const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            const filters = await analyticsService.getFilterOptions(
                programId,
                from || defaultFrom,
                to || defaultTo
            );

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
    }
};

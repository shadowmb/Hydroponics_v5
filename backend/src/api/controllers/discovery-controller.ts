import { FastifyRequest, FastifyReply } from 'fastify';
import { discoveryService } from '../../services/discovery-service';

interface ScanQuery {
    port?: number;
    broadcastAddress?: string;
    timeout?: number;
}

export const scanNetwork = async (req: FastifyRequest<{ Body: ScanQuery }>, reply: FastifyReply) => {
    try {
        const { port, broadcastAddress, timeout } = req.body || {};

        const results = await discoveryService.scan(port, broadcastAddress, timeout);

        return reply.send({
            success: true,
            data: results
        });
    } catch (error: any) {
        req.log.error(error);
        return reply.status(500).send({
            success: false,
            error: 'Discovery scan failed',
            details: error.message
        });
    }
};

import { FastifyRequest, FastifyReply } from 'fastify';
import { discoveryService } from '../../services/discovery-service';

interface ScanQuery {
    startPort?: number;
    endPort?: number; // Optional end of range
    broadcastAddress?: string;
    timeout?: number;
    port?: number; // Legacy support
}

export const scanNetwork = async (req: FastifyRequest<{ Body: ScanQuery }>, reply: FastifyReply) => {
    try {
        const { port, startPort, endPort, broadcastAddress, timeout } = req.body || {};

        // Handle legacy 'port' parameter if startPort is missing
        const finalStartPort = startPort || port || 8888;
        const finalEndPort = endPort || finalStartPort; // Default to single port if range not specified

        const results = await discoveryService.scan(finalStartPort, finalEndPort, broadcastAddress, timeout);

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

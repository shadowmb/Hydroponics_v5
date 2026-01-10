import { FastifyInstance } from 'fastify';
import { AIService } from '../services/AIService';
import { config } from '../../../core/ConfigService';

export default async function AIController(fastify: FastifyInstance) {

    fastify.post('/chat', async (request, reply) => {
        // Basic validation
        // TODO: Add Zod validation for body
        const { messages } = request.body as any;

        // Determine provider from config or request (Phase 1 uses default/config)
        const provider = 'gemini'; // Default for Phase 1
        const service = new AIService(provider);

        try {
            // 1. Get the chat stream (AsyncIterable)
            const stream = await service.chat(messages);

            // 2. Set SSE Headers
            reply.raw.setHeader('Content-Type', 'text/event-stream');
            reply.raw.setHeader('Cache-Control', 'no-cache');
            reply.raw.setHeader('Connection', 'keep-alive');
            reply.raw.setHeader('Access-Control-Allow-Origin', '*'); // For dev

            // 3. Iterate and send SSE formatted chunks
            // @tanstack/ai stream chunks need to be formatted as "data: ...\n\n"
            // But wait, the `chat` returns `StreamChunk` objects, not SSE strings.
            // I need to use `toServerSentEventsStream` or format it myself?
            // Let's us the helper from @tanstack/ai if possible, but the import might be tricky if it targets Web APIs.
            // Manual formatting is safer for Node/Fastify here.

            for await (const chunk of stream) {
                // Simple SSE format
                const payload = JSON.stringify(chunk);
                reply.raw.write(`data: ${payload}\n\n`);
            }

            reply.raw.end();
            return reply; // Explicitly return reply to signal we are done


        } catch (error) {
            request.log.error(error);
            console.error('❌ AI Controller Error:', error);
            // If headers sent, we can't send JSON error, just end.
            if (!reply.raw.headersSent) {
                // Returns actual error for debugging (remove in production)
                reply.status(500).send({
                    error: 'AI Error',
                    details: (error as Error).message,
                    stack: (error as Error).stack
                });
            } else {
                reply.raw.end();
            }
        }
    });
}

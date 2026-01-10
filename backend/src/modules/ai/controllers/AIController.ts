import { FastifyInstance } from 'fastify';
import { aiService } from '../services/AIService';
import { config } from '../../../core/ConfigService';

export default async function AIController(fastify: FastifyInstance) {

    fastify.post('/chat', async (request, reply) => {
        // Basic validation
        // TODO: Add Zod validation for body
        const { messages, role = 'assistant' } = request.body as any; // Extract role

        // Use singleton service
        // const service = new AIService(provider); // REMOVED

        // EXPERIMENTAL: Keyword-based RAG & System Overview
        try {
            const fs = require('fs');
            const path = require('path');

            // Assuming process.cwd() is 'backend' folder
            const projectRoot = path.join(process.cwd(), '../');
            const mapFile = path.join(projectRoot, 'Docs/UserManual/knowledge-map.json');
            const overviewFile = path.join(projectRoot, 'Docs/UserManual/System-Overview.md');

            // 1. Extract user query for analysis
            const userMessages = messages.filter((m: any) => m.role === 'user');
            const lastMessage = userMessages.length > 0 ? userMessages[userMessages.length - 1].content.toLowerCase() : '';

            // 2. Load Global Context (System Overview)
            let systemPrompt = '';
            if (fs.existsSync(overviewFile)) {
                systemPrompt += fs.readFileSync(overviewFile, 'utf-8') + '\n\n';
            }

            // 3. Load Specific Context (Keyword RAG)
            let specificContext = '';
            if (fs.existsSync(mapFile)) {
                const map = JSON.parse(fs.readFileSync(mapFile, 'utf-8'));
                console.log(`🔍 AI Probe: Scanning keywords in message: "${lastMessage.substring(0, 50)}..."`);

                for (const [pattern, filename] of Object.entries(map.keywords)) {
                    const regex = new RegExp(pattern, 'i');
                    if (regex.test(lastMessage)) {
                        const filePath = path.join(projectRoot, 'Docs/UserManual', filename as string);
                        if (fs.existsSync(filePath)) {
                            console.log(`✅ AI Probe: Keyword hit [${pattern}] -> Loading ${filename}`);
                            specificContext += `\n=== SPECIFIC TOPIC: ${filename} ===\n` + fs.readFileSync(filePath, 'utf-8') + '\n';
                        }
                    }
                }
            }

            // 4. Construct Final System Message
            messages.unshift({
                role: 'system',
                content: `
${systemPrompt}

${specificContext ? `
=== DETAILED CONTEXT START ===
${specificContext}
=== DETAILED CONTEXT END ===
` : `
(No specific documentation matched this query. Use General Knowledge from Overview to guide the user.)
`}
`
            });

        } catch (err) {
            console.error('❌ AI Probe: Failed to inject context', err);
        }

        try {
            // 1. Get the chat stream (AsyncIterable)
            // Pass the extracted role to the service
            const stream = await aiService.chat(messages, role);

            // 2. Set SSE Headers
            reply.raw.setHeader('Content-Type', 'text/event-stream');
            reply.raw.setHeader('Cache-Control', 'no-cache');
            reply.raw.setHeader('Connection', 'keep-alive');
            reply.raw.setHeader('Access-Control-Allow-Origin', '*'); // For dev

            // 3. Iterate and send SSE formatted chunks
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
                reply.type('application/json').status(500).send({
                    error: 'AI Error',
                    details: String((error as Error).message),
                    stack: String((error as Error).stack)
                });
            } else {
                reply.raw.end();
            }
        }
    });
}

import { FastifyInstance } from 'fastify';
import { aiService } from '../services/AIService';
import { chatSessionService } from '../services/ChatSessionService';
import { config } from '../../../core/ConfigService';

export default async function AIController(fastify: FastifyInstance) {

    fastify.post('/chat', async (request, reply) => {
        // Basic validation
        const body = request.body as any;
        const query = request.query as any;
        const messages = body.messages;
        const role = body.role || 'assistant';
        const sessionId = body.sessionId || query.sessionId;

        console.log(`🔍 AI Request: Role=${role}, SessionId=${sessionId}, MsgCount=${messages?.length}`);

        // 1. Save User Message (if sessionId provided)
        if (sessionId) {
            // The last message is the new user input
            const lastUserMsg = messages[messages.length - 1];
            if (lastUserMsg && lastUserMsg.role === 'user') {
                await chatSessionService.addMessage(sessionId, {
                    role: 'user',
                    content: lastUserMsg.content,
                    timestamp: new Date()
                });
            }
        }

        // EXPERIMENTAL: Keyword-based RAG & System Overview
        // ... (Keep existing RAG logic context injection) ...
        try {
            const fs = require('fs');
            const path = require('path');
            const projectRoot = path.join(process.cwd(), '../');
            const mapFile = path.join(projectRoot, 'Docs/UserManual/knowledge-map.json');
            const overviewFile = path.join(projectRoot, 'Docs/UserManual/System-Overview.md');

            // 1. Extract user query for analysis
            const userMessages = messages.filter((m: any) => m.role === 'user');
            const lastMessage = userMessages.length > 0 ? userMessages[userMessages.length - 1].content.toLowerCase() : '';

            let systemPrompt = '';
            if (fs.existsSync(overviewFile)) {
                systemPrompt += fs.readFileSync(overviewFile, 'utf-8') + '\n\n';
            }

            let specificContext = '';
            // Only use specific context for 'assistant' role to avoid polluting analyzer
            if (role === 'assistant' && fs.existsSync(mapFile)) {
                const map = JSON.parse(fs.readFileSync(mapFile, 'utf-8'));
                // ... (Keep keyword scanning) ...
                for (const [pattern, filename] of Object.entries(map.keywords)) {
                    const regex = new RegExp(pattern, 'i');
                    if (regex.test(lastMessage)) {
                        const filePath = path.join(projectRoot, 'Docs/UserManual', filename as string);
                        if (fs.existsSync(filePath)) {
                            specificContext += `\n=== SPECIFIC TOPIC: ${filename} ===\n` + fs.readFileSync(filePath, 'utf-8') + '\n';
                        }
                    }
                }
            }

            // Construct Final System Message
            // (We prepend to avoid duplicating if already there from previous calls? 
            // Actually usually backend constructs the full prompt for the stateless model)
            // But if we persist the SYSTEM message in session, it's bad.
            // Best practice: Inject system message here transiently.
            messages.unshift({
                role: 'system',
                content: `
${systemPrompt}
${specificContext ? `=== DETAILED CONTEXT START ===\n${specificContext}\n=== DETAILED CONTEXT END ===` : ''}
`
            });

        } catch (err) {
            console.error('❌ AI Probe: Failed to inject context', err);
        }

        try {
            // 2. Get the chat stream
            // Pass the extracted role to the service
            const stream = await aiService.chat(messages, role);

            // 3. Set SSE Headers
            reply.raw.setHeader('Content-Type', 'text/event-stream');
            reply.raw.setHeader('Cache-Control', 'no-cache');
            reply.raw.setHeader('Connection', 'keep-alive');
            reply.raw.setHeader('Access-Control-Allow-Origin', '*');

            let fullAiResponse = '';

            // 4. Iterate and send SSE formatted chunks
            for await (const chunk of stream) {
                // Determine content to save
                if (chunk && chunk.delta) {
                    fullAiResponse += chunk.delta;
                } else if (chunk && chunk.content) {
                    // If content is present but no delta, it might be a chunk or full text.
                    // In the observed case, it was full accumulated text. 
                    // To be safe, if we haven't started accumulating via delta, we might assume it's a chunk?
                    // actually, let's trust delta if validation shows it works.
                    // Fallback: If no delta, we append content. 
                    // BUT if content is cumulative, this is bad. 
                    // For now, given the logs: delta IS present. So this fix works.
                    fullAiResponse += chunk.content;
                } else if (typeof chunk === 'string') {
                    fullAiResponse += chunk;
                }

                // Simple SSE format
                const payload = JSON.stringify(chunk);
                reply.raw.write(`data: ${payload}\n\n`);
            }

            // 5. Save AI Message (if sessionId provided) - AFTER stream ends
            if (sessionId && fullAiResponse) {
                await chatSessionService.addMessage(sessionId, {
                    role: 'assistant', // or 'model'
                    content: fullAiResponse,
                    timestamp: new Date()
                });

                // Optional: Auto-Update Title if it's the first exchange?
                // Logic can be added here or via a separate 'generate-title' call.
            }

            reply.raw.end();
            return reply;

        } catch (error) {
            request.log.error(error);
            console.error('❌ AI Controller Error:', error);
            if (!reply.raw.headersSent) {
                reply.type('application/json').status(500).send({
                    error: 'AI Error',
                    details: String((error as Error).message),
                    stack: String((error as Error).stack)
                });
            } else {
                reply.raw.write(`data: ${JSON.stringify({ error: (error as Error).message })}\n\n`);
                reply.raw.end();
            }
        }
    });
}

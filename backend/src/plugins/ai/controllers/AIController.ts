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

        // --- 1. EXTRACT UI CONTEXT & CLEAN MESSAGE ---
        const userMessages = messages.filter((m: any) => m.role === 'user');
        let lastMessageContent = userMessages.length > 0 ? userMessages[userMessages.length - 1].content : '';
        let uiContext: any = null;

        // Regex to find and strip the Context Marker (Multiline support with [\s\S])
        const contextRegex = /(?:\n+:::HYDROPONICS_CTX_V5:::)([\s\S]*?)$/;
        const match = lastMessageContent.match(contextRegex);

        if (match) {
            const jsonString = match[1].trim();
            // Remove the marker from the content used for analysis and saving
            lastMessageContent = lastMessageContent.replace(contextRegex, '').trim();

            // Update the original message object reference so it saves cleanly later
            if (userMessages.length > 0) {
                userMessages[userMessages.length - 1].content = lastMessageContent;
            }

            try {
                uiContext = JSON.parse(jsonString);
                console.log('🔍 Extracted UI Context:', uiContext);
            } catch (e) {
                console.warn('⚠️ Failed to parse UI Context JSON', e);
            }
        }

        // --- 2. Save User Message (Cleaned) ---
        if (sessionId) {
            console.log(`💾 Attempting to save message to session ${sessionId}`);
            // Use the cleaned content
            if (lastMessageContent && userMessages.length > 0) {
                // userMessages[last] is already updated in place above, usually by reference.
                // But let's be explicit with content: lastMessageContent
                const saveResult = await chatSessionService.addMessage(sessionId, {
                    role: 'user',
                    content: lastMessageContent,
                    timestamp: new Date()
                });
                console.log(`💾 User message saved: ${!!saveResult}`);
            } else {
                console.warn('⚠️ Last message is not from user or missing content');
            }
        } else {
            console.warn('⚠️ No sessionId provided, skipping save.');
        }

        // EXPERIMENTAL: Keyword-based RAG & System Overview
        // ... (Keep existing RAG logic context injection) ...
        try {
            const fs = require('fs');
            const path = require('path');
            const docsBasePath = path.join(process.cwd(), 'src/plugins/ai/docs');
            const mapFile = path.join(process.cwd(), 'src/plugins/ai/config/knowledge-map.json');
            const overviewFile = path.join(docsBasePath, 'System-Overview.md');

            // Context extracted above (Step 1)

            const lastMessageLower = lastMessageContent.toLowerCase();

            // Helper function for safe file reading
            const safeReadFile = (filePath: string, label: string): string => {
                try {
                    if (fs.existsSync(filePath)) {
                        return fs.readFileSync(filePath, 'utf-8');
                    } else {
                        console.warn(`⚠️ RAG Warning: File not found - ${label} (${filePath})`);
                        return '';
                    }
                } catch (err) {
                    console.error(`❌ RAG Error: Failed to read ${label}`, err);
                    return '';
                }
            };

            let systemPrompt = '';
            const overviewContent = safeReadFile(overviewFile, 'System Overview');
            if (overviewContent) {
                systemPrompt += overviewContent + '\n\n';
            }

            let specificContext = '';

            // --- STATE-DRIVEN RAG: Dynamic Document Injection ---
            // 1. Wizard-Specific Docs
            if (uiContext?.wizard === 'FirmwareBuilder') {
                const fwDoc = path.join(docsBasePath, 'Firmware-Generator-Walkthrough.md');
                const fwContent = safeReadFile(fwDoc, 'Firmware Builder Guide');
                if (fwContent) {
                    specificContext += `\n=== WIZARD GUIDE: Firmware Builder ===\n` + fwContent + '\n';
                }

                // Granular Step-Based Loading
                const stepDocs: Record<number, { file: string; label: string }> = {
                    2: { file: 'Transport-Config.md', label: 'Transport Configuration' },
                    3: { file: 'Plugins-Reference.md', label: 'Plugins Reference' },
                    4: { file: 'Test-Devices.md', label: 'Devices Configuration' }
                };

                if (uiContext.step && stepDocs[uiContext.step]) {
                    const stepInfo = stepDocs[uiContext.step];
                    const stepDocPath = path.join(docsBasePath, stepInfo.file);
                    const stepContent = safeReadFile(stepDocPath, stepInfo.label);
                    if (stepContent) {
                        specificContext += `\n=== SUPPLEMENTAL: ${stepInfo.label} ===\n` + stepContent + '\n';
                    }
                }
            }

            // 2. Path-Specific Docs (Dynamic from knowledge-map.json)
            if (role === 'assistant') {
                try {
                    const mapContent = safeReadFile(mapFile, 'Knowledge Map');
                    if (mapContent) {
                        const map = JSON.parse(mapContent);

                        // Check for path mappings
                        if (map.path_mappings && uiContext?.path) {
                            for (const [pathPattern, filename] of Object.entries(map.path_mappings)) {
                                // Exact match or startsWith for nested routes
                                if (uiContext.path === pathPattern || uiContext.path.startsWith(pathPattern + '/')) {
                                    const filePath = path.join(docsBasePath, filename as string);
                                    if (!specificContext.includes(filename as string)) {
                                        const pathContent = safeReadFile(filePath, `Path Guide: ${filename as string}`);
                                        if (pathContent) {
                                            specificContext += `\n=== PAGE GUIDE: ${(filename as string).replace('.md', '')} ===\n` + pathContent + '\n';
                                        }
                                    }
                                }
                            }
                        }

                        // 3. Keyword-based RAG (Fallback/Additive)
                        if (map.keywords) {
                            for (const [pattern, filename] of Object.entries(map.keywords)) {
                                const regex = new RegExp(pattern, 'i');
                                if (regex.test(lastMessageLower)) {
                                    const filePath = path.join(docsBasePath, filename as string);
                                    // Avoid duplicating if already loaded by state or path
                                    if (!specificContext.includes(filename as string)) {
                                        const keywordContent = safeReadFile(filePath, `Keyword Match: ${filename}`);
                                        if (keywordContent) {
                                            specificContext += `\n=== SEARCHED TOPIC: ${filename} ===\n` + keywordContent + '\n';
                                        }
                                    }
                                }
                            }
                        }
                    }
                } catch (err) {
                    console.error('❌ RAG Error: Failed to parse knowledge map', err);
                }
            }

            // Construct Final System Message
            // (We prepend to avoid duplicating if already there from previous calls? 
            // Actually usually backend constructs the full prompt for the stateless model)
            // But if we persist the SYSTEM message in session, it's bad.
            // Best practice: Inject system message here transiently.
            const finalSystemPrompt = `
${systemPrompt}
${uiContext ? `<system_context>\nUser State: ${JSON.stringify(uiContext)}\n</system_context>` : ''}
${specificContext ? `=== DETAILED CONTEXT START ===\n${specificContext}\n=== DETAILED CONTEXT END ===` : ''}
`;
            messages.unshift({
                role: 'system',
                content: finalSystemPrompt
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
    // Health Check Endpoint
    fastify.get('/health', async () => ({
        status: 'ok',
        module: 'ai',
        version: '1.0.0'
    }));

    // Detailed Status (optional for debugging)
    fastify.get('/status', async () => ({
        active: true,
        plugins: ['chat', 'insights', 'actions']
    }));
}

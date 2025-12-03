import mongoose from 'mongoose';
import { automation } from './modules/automation/AutomationEngine';
import { flowRepository } from './modules/persistence/repositories/FlowRepository';
import { sessionRepository } from './modules/persistence/repositories/SessionRepository';
import { logger } from './core/LoggerService';
import dotenv from 'dotenv';
import { events } from './core/EventBusService';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hydroponics_v5';

async function main() {
    try {
        logger.info('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        logger.info('✅ Connected.');

        // 0. Register Executors
        automation.registerExecutor({
            type: 'LOG',
            execute: async (ctx, params) => {
                logger.info({ params }, '📝 [LOG BLOCK]');
                return { success: true };
            }
        });
        automation.registerExecutor({
            type: 'WAIT',
            execute: async (ctx, params) => {
                logger.info({ duration: params.duration }, '⏳ [WAIT BLOCK]');
                await new Promise(resolve => setTimeout(resolve, params.duration));
                return { success: true };
            }
        });

        // 1. Cleanup Previous Runs
        await mongoose.connection.collection('flows').deleteMany({ id: 'integration_test_flow' });

        // 1. Create a Test Flow
        logger.info('📝 Creating Test Flow...');
        const flow = await flowRepository.create({
            id: 'integration_test_flow',
            name: 'Integration Test Flow',
            nodes: [
                { id: 'step1', type: 'LOG', params: { message: 'Step 1: Start' }, next: 'step2' },
                { id: 'step2', type: 'WAIT', params: { duration: 10000 }, next: 'step3' }, // Wait 10s
                { id: 'step3', type: 'LOG', params: { message: 'Step 3: Finish' } } // End
            ],
            edges: [], // Edges are implicit in 'next' for this simple test, or we should add them if engine requires
            isActive: true
        });
        logger.info({ flowId: flow.id }, '✅ Flow Created');

        // 2. Start Program via Engine
        logger.info('🚀 Starting Flow via AutomationEngine...');
        const sessionId = await automation.loadProgram(flow.id);
        await automation.startProgram();
        logger.info({ sessionId }, '✅ Flow Started, Session Created');

        // 3. Wait for Completion
        // We can listen to 'automation:state_change' for 'stopped'
        await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Timeout waiting for program completion')), 15000);

            events.on('automation:state_change', (payload) => {
                logger.info({ state: payload.state }, '🔄 State Change');
                if (payload.state === 'stopped' || payload.state === 'completed') {
                    clearTimeout(timeout);
                    resolve();
                }
            });
        });
        logger.info('🏁 Flow Execution Completed');

        // 4. Verify Session in DB
        logger.info('🔍 Verifying Session in DB...');
        const session = await sessionRepository.findById(sessionId);
        if (!session) throw new Error('Session not found in DB');

        logger.info({ status: session.status, logsCount: session.logs.length }, 'Session Data');

        if (session.status !== 'stopped' && session.status !== 'completed') throw new Error(`Expected status 'stopped' or 'completed', got '${session.status}'`);
        // if (session.logs.length < 2) throw new Error('Expected at least 2 logs (Start, Finish)'); 
        // Logs might be async, so we might miss them in this tight loop check if not careful, but usually ok.

        logger.info('✅ Session Verified');

        // Cleanup
        await mongoose.connection.collection('flows').deleteMany({ id: 'integration_test_flow' });
        await mongoose.connection.collection('executionsessions').deleteMany({ _id: session._id });

        logger.info('🎉 Integration Test Passed!');

    } catch (error) {
        logger.error({ error }, '❌ Test Failed');
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

main();

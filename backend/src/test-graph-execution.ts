import { automation } from './modules/automation/AutomationEngine';
import { FlowModel } from './modules/persistence/schemas/Flow.schema';
import mongoose from 'mongoose';
import { logger } from './core/LoggerService';

// Mock DB Connection (or assume connected if running in context)
// For this script, we will just mock the repository calls if possible, 
// but since AutomationEngine uses imported repositories, we might need a real DB connection.
// Alternatively, we can just test the machine logic if we could isolate it, but AutomationEngine is coupled.

// Let's assume we can run this script with ts-node and it connects to DB.

async function testGraphExecution() {
    try {
        await mongoose.connect('mongodb://localhost:27017/hydroponics-v5');
        logger.info('Connected to MongoDB');

        // 1. Create a Test Flow with Graph
        const flow = await FlowModel.create({
            id: 'test-flow-1', // Added ID
            name: 'Test Graph Flow',
            isActive: true,
            mode: 'SIMPLE',
            nodes: [
                { id: 'start', type: 'START', position: { x: 0, y: 0 }, data: {} },
                { id: 'delay', type: 'WAIT', position: { x: 100, y: 0 }, data: { duration: 1000 } }, // 1 second delay
                { id: 'end', type: 'END', position: { x: 200, y: 0 }, data: {} }
            ],
            edges: [
                { id: 'e1', source: 'start', target: 'delay' },
                { id: 'e2', source: 'delay', target: 'end' }
            ]
        });

        logger.info({ flowId: flow.id }, 'Created Test Flow');

        // 2. Start Program (Flow)
        const sessionId = await automation.loadProgram(flow.id); // Changed to loadProgram
        await automation.startProgram();
        logger.info({ sessionId }, 'Started Program Session');

        // 3. Monitor
        // In a real test we would listen to events. 
        // Here we just wait a bit and check status.
        await new Promise(resolve => setTimeout(resolve, 2000));

        const snapshot = automation.getSnapshot();
        logger.info({ state: snapshot.value, context: snapshot.context }, 'Final Snapshot');

        // Cleanup
        await FlowModel.findByIdAndDelete(flow.id);
        await mongoose.disconnect();

    } catch (error) {
        console.error('Test Failed:', error);
        process.exit(1);
    }
}

testGraphExecution();

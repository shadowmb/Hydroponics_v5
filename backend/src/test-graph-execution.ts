import { automation } from './modules/automation/AutomationEngine';
import { ProgramModel } from './models/Program';
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

        // 1. Create a Test Program with Graph
        const program = await ProgramModel.create({
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

        logger.info({ programId: program.id }, 'Created Test Program');

        // 2. Start Program
        const sessionId = await automation.startProgram(program.id);
        logger.info({ sessionId }, 'Started Program Session');

        // 3. Monitor
        // In a real test we would listen to events. 
        // Here we just wait a bit and check status.
        await new Promise(resolve => setTimeout(resolve, 2000));

        const snapshot = automation.getSnapshot();
        logger.info({ state: snapshot.value, context: snapshot.context }, 'Final Snapshot');

        // Cleanup
        await ProgramModel.findByIdAndDelete(program.id);
        await mongoose.disconnect();

    } catch (error) {
        console.error('Test Failed:', error);
        process.exit(1);
    }
}

testGraphExecution();

import { automation } from '../automation/AutomationEngine';
import { events } from '../../core/EventBusService';
import { logger } from '../../core/LoggerService';
// import { cycleRepository } from '../persistence/repositories/CycleRepository'; // Removed
import { cycleSessionRepository } from '../persistence/repositories/CycleSessionRepository';
import { ICycleSession } from '../persistence/schemas/CycleSession.schema';

export class CycleManager {
    private currentSession: ICycleSession | null = null;

    constructor() {
        this.setupEventListeners();
    }

    private setupEventListeners() {
        events.on('automation:state_change', async (data) => {
            const session = this.currentSession;
            if (!session) return;
            if (session.status !== 'running') return;

            // Check if the event belongs to the current flow session
            if (data.sessionId !== session.currentFlowSessionId) return;

            if (data.state === 'completed') {
                logger.info({ cycleId: session.cycleId, step: session.currentStepIndex }, '✅ Cycle Step Completed');
                await this.advanceStep();
            } else if (data.state === 'error') {
                const errorMsg = data.error || 'Unknown error';
                logger.error({ cycleId: session.cycleId, error: errorMsg }, '❌ Cycle Step Failed');
                await this.failCycle(`Flow execution failed: ${errorMsg}`);
            } else if (data.state === 'stopped') {
                // If flow stopped manually, stop the cycle
                await this.stopCycle();
            }
        });
    }

    public async startCycle(cycleId: string, steps: { flowId: string, overrides: any }[], overrides: Record<string, any> = {}): Promise<string> {
        // 1. Check if busy
        if (this.currentSession && this.currentSession.status === 'running') {
            throw new Error('A cycle is already running');
        }

        if (!steps || steps.length === 0) throw new Error('Cycle has no steps');

        // 2. Create Session with Embedded Steps
        this.currentSession = await cycleSessionRepository.create({
            cycleId: cycleId,
            startTime: new Date(),
            status: 'running',
            currentStepIndex: 0,
            logs: [],
            steps: steps, // Store steps in session
            context: overrides // Store global overrides in context
        });

        logger.info({ cycleId, sessionId: this.currentSession.id, stepsCount: steps.length }, '🚀 Starting Cycle');

        // 3. Start First Step
        await this.executeStep(0);

        return this.currentSession.id;
    }

    public async stopCycle() {
        if (!this.currentSession || this.currentSession.status !== 'running') return;

        logger.info({ sessionId: this.currentSession.id }, '🛑 Stopping Cycle');

        // Stop current flow if running
        automation.stopProgram();

        this.currentSession.status = 'stopped';
        this.currentSession.endTime = new Date();
        await cycleSessionRepository.update(this.currentSession.id, {
            status: 'stopped',
            endTime: new Date()
        });

        this.currentSession = null;
    }

    private async executeStep(index: number) {
        if (!this.currentSession) return;

        // Use embedded steps
        const steps = this.currentSession.steps;
        if (!steps) {
            await this.failCycle('Cycle session missing steps definition');
            return;
        }

        const step = steps[index];
        if (!step) {
            await this.failCycle(`Step ${index} not found`);
            return;
        }

        try {
            logger.info({ step: index, flowId: step.flowId }, '▶️ Executing Cycle Step');

            // Load Flow with Overrides
            // Merge: Step Overrides < Session Context (Global Overrides)
            // Note: In previous logic I wrote Step < Global. 
            // Let's stick to: Step overrides are specific, Global are general.
            // Usually specific overrides (on the step) should win? 
            // Or Global overrides (passed at runtime) are meant to override everything?
            // Let's assume Runtime Global Overrides > Static Step Overrides.
            const sessionOverrides = this.currentSession.context || {};
            const finalOverrides = { ...step.overrides, ...sessionOverrides };

            const flowSessionId = await automation.loadProgram(step.flowId, finalOverrides);

            // Update Session with current flow session ID
            this.currentSession.currentFlowSessionId = flowSessionId;
            this.currentSession.currentStepIndex = index;
            await cycleSessionRepository.update(this.currentSession.id, {
                currentStepIndex: index,
                currentFlowSessionId: flowSessionId
            });

            // Start Flow
            await automation.startProgram();

        } catch (error: any) {
            logger.error({ error, step }, '❌ Failed to start cycle step');
            await this.failCycle(error.message);
        }
    }

    private async advanceStep() {
        if (!this.currentSession) return;

        const nextIndex = this.currentSession.currentStepIndex + 1;
        const steps = this.currentSession.steps;

        if (steps && nextIndex < steps.length) {
            // Execute Next Step
            await this.executeStep(nextIndex);
        } else {
            // Cycle Completed
            logger.info({ sessionId: this.currentSession.id }, '🏁 Cycle Completed Successfully');
            this.currentSession.status = 'completed';
            this.currentSession.endTime = new Date();
            await cycleSessionRepository.update(this.currentSession.id, {
                status: 'completed',
                endTime: new Date()
            });

            // Capture ID before nulling
            const cycleId = this.currentSession.cycleId;
            this.currentSession = null;

            // Notify ActiveProgramService
            const activeProgramService = require('./ActiveProgramService').activeProgramService;
            await activeProgramService.markCycleCompleted(cycleId);
        }
    }

    private async failCycle(reason: string) {
        if (!this.currentSession) return;

        logger.error({ sessionId: this.currentSession.id, reason }, '❌ Cycle Failed');

        this.currentSession.status = 'failed';
        this.currentSession.endTime = new Date();
        await cycleSessionRepository.update(this.currentSession.id, {
            status: 'failed',
            endTime: new Date(),
            logs: [...this.currentSession.logs, { level: 'error', message: reason, timestamp: new Date() }]
        });

        // Capture ID before nulling
        const cycleId = this.currentSession.cycleId;
        this.currentSession = null;

        // Notify ActiveProgramService
        const activeProgramService = require('./ActiveProgramService').activeProgramService;
        await activeProgramService.markCycleFailed(cycleId, reason);
    }
}

export const cycleManager = new CycleManager();

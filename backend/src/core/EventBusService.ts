import { EventEmitter2 } from 'eventemitter2';
import { logger } from './LoggerService';
import { ExecutionContext } from '../modules/automation/interfaces';

// 1. Define Event Map (Strict Typing)
// Key = Event Name, Value = Payload Type
export interface SystemEvents {
    // Hardware Events
    'device:connected': { deviceId: string };
    'device:disconnected': { deviceId: string };
    'sensor:data': { deviceId: string; value: number; timestamp: Date };
    'error:critical': { source: string; message: string; error?: any };
    'controller:update': { id: string; status: any };
    'device:update': { id: string; status: any };
    'device:data': {
        deviceId: string;
        driverId?: string;
        deviceName?: string;
        value: any;
        raw?: any;
        unit?: string;
        baseValue?: number | null;
        baseUnit?: string;
        hwValue?: number;
        hwUnit?: string;
        readings?: Record<string, any>;
        details?: any;
        timestamp?: Date | string
    };
    'command:sent': { deviceId: string; controllerId: string; packet: any; raw?: string };

    // Automation Events
    'automation:block_start': { blockId: string; type: string; sessionId?: string | null };
    'automation:block_end': {
        blockId: string;
        success: boolean;
        output?: any;
        summary?: string;
        sessionId?: string | null;
        error?: string;
        notification?: { channelId: string; mode: string; config?: any };
    };
    'automation:state_change': { state: string; currentBlock: string | null; context: ExecutionContext; sessionId?: string | null; error?: string | null };
    'automation:execution_step': { blockId: string; type: string; sessionId?: string | null; label: string; duration?: number; timestamp: number; params?: any };
    'log': { timestamp: Date | string; level: string; message: string; blockId?: string; data?: any; sessionId?: string | null };

    // System Lifecycle Events
    'automation:program_start': { programId: string; sessionId: string; programName?: string };
    'automation:program_stop': { sessionId: string; reason?: string };
    'scheduler:cycle_start': { cycleId: string; programId?: string; timestamp: Date; cycleName?: string };
    'scheduler:cycle_complete': { cycleId: string; programId?: string; duration?: number; timestamp: Date; cycleName?: string };
}

export class EventBusService {
    private static instance: EventBusService;
    private bus: EventEmitter2;

    private constructor() {
        this.bus = new EventEmitter2({
            wildcard: true,           // Allows 'device.*'
            delimiter: ':',           // Standard namespacing
            maxListeners: 20,         // Slightly higher than default 10
            verboseMemoryLeak: true,  // Warn if we mess up
        });

        const id = Math.random().toString(36).substring(7);
        console.log(`⚡ EventBusService Created: ${id}`);
        logger.info(`⚡ EventBusService Created: ${id}`);

        // Global Error Handler for the Bus itself
        this.bus.on('error', (err) => {
            logger.error({ err }, '🔥 Uncaught EventBus Error');
        });
    }

    public static getInstance(): EventBusService {
        if (!EventBusService.instance) {
            EventBusService.instance = new EventBusService();
        }
        return EventBusService.instance;
    }

    /**
     * Emit an event (Fire-and-Forget).
     * We do NOT await listeners.
     */
    public emit<K extends keyof SystemEvents>(event: K, payload: SystemEvents[K]): void {
        try {
            // logger.debug({ event, payload }, '📢 Emit'); // Optional: verbose logging
            this.bus.emit(event, payload);
        } catch (error) {
            logger.error({ error, event }, '❌ Failed to emit event');
        }
    }

    /**
     * Register a listener.
     * Should be called ONLY during Bootstrap phase.
     */
    public on<K extends keyof SystemEvents>(event: K, listener: (payload: SystemEvents[K]) => void): void {
        this.bus.on(event, (payload) => {
            try {
                // Wrap listener execution to prevent crashing the bus
                listener(payload as SystemEvents[K]);
            } catch (error) {
                logger.error({ error, event }, '❌ Error in Event Listener');
            }
        });
    }

    /**
     * Remove a listener (Use sparingly).
     */
    public off<K extends keyof SystemEvents>(event: K, listener: (payload: SystemEvents[K]) => void): void {
        this.bus.off(event, listener as any);
    }
}

export const events = EventBusService.getInstance();

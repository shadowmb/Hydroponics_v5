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

    // Automation Events
    'automation:block_start': { blockId: string; type: string; sessionId?: string | null };
    'automation:block_end': { blockId: string; success: boolean; output?: any; sessionId?: string | null };
    'automation:state_change': { state: string; currentBlock: string | null; context: ExecutionContext; sessionId?: string | null };
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

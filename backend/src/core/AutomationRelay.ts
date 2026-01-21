import { EventEmitter } from 'events';
import { AutomationEngine } from '../modules/automation/AutomationEngine';
import { logger } from './LoggerService';

/**
 * AutomationRelay
 * 
 * Bridge between AutomationEngine (local EventEmitter) and global event bus (Socket.IO).
 * Listens to all flow:* events from the engine and forwards them to the global bus.
 * 
 * This keeps AutomationEngine clean and decoupled from Socket.IO infrastructure.
 */
export class AutomationRelay {
    constructor(
        private engine: AutomationEngine,
        private globalBus: EventEmitter
    ) {
        this.setupBridge();
        logger.info('🌉 AutomationRelay Bridge Initialized');
    }

    private setupBridge() {
        // Use centralized event list from AutomationEngine
        AutomationEngine.EVENTS.forEach(eventName => {
            this.engine.on(eventName, (data: any) => {
                // Forward directly to global bus (no name transformation)
                this.globalBus.emit(eventName, data);
                logger.debug({ event: eventName }, '🌉 Relay: Engine → Global Bus');
            });
        });
    }
}

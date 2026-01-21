import { activeProgramService } from './ActiveProgramService';
import { logger } from '../../core/LoggerService';

/**
 * PauseTimeoutService
 * Monitors paused programs and auto-stops them if timeout expires.
 */
class PauseTimeoutService {
    private checkInterval: NodeJS.Timeout | null = null;
    private readonly CHECK_INTERVAL_MS = 30000; // 30 seconds

    /**
     * Start the timeout monitor
     */
    start() {
        if (this.checkInterval) {
            logger.warn('PauseTimeoutService already running');
            return;
        }

        this.checkInterval = setInterval(() => this.check(), this.CHECK_INTERVAL_MS);
        logger.info('⏰ PauseTimeoutService started (check interval: 30s)');
    }

    /**
     * Check for expired pause timeouts
     */
    private async check() {
        try {
            const active = await activeProgramService.getActive();
            if (!active || active.status !== 'paused') return;

            if (active.pausedAt && active.pauseTimeout) {
                const elapsed = (Date.now() - active.pausedAt.getTime()) / 1000;

                if (elapsed >= active.pauseTimeout) {
                    logger.warn({
                        elapsed,
                        timeout: active.pauseTimeout,
                        programName: active.name
                    }, '⏰ Pause Timeout Expired - Auto-Stopping Program');

                    await activeProgramService.stop();

                    // TODO: Emit notification event for user
                    // events.emit('program:pause_timeout', { programId: active.sourceProgramId });
                }
            }
        } catch (error: any) {
            logger.error({ error: error.message }, '❌ Error in PauseTimeoutService check');
        }
    }

    /**
     * Stop the timeout monitor
     */
    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
            logger.info('⏰ PauseTimeoutService stopped');
        }
    }
}

export const pauseTimeoutService = new PauseTimeoutService();


import { EventEmitter } from 'events';

class TimeService extends EventEmitter {
    private static instance: TimeService;
    private offsetMs: number = 0;
    private isSimulating: boolean = false;
    private simulationSpeed: number = 1;
    private lastRealTick: number = Date.now();
    private timezone: string = process.env.TZ || 'UTC';

    private constructor() {
        super();
        // Start internal ticker to manage potentially complex simulation speeds
        // For simple 1x simulation with offset, standard Date.now() calc is enough.
        // For >1x speed, we need to accumulate drift.
        this.lastRealTick = Date.now();
    }

    public static getInstance(): TimeService {
        if (!TimeService.instance) {
            TimeService.instance = new TimeService();
        }
        return TimeService.instance;
    }

    /**
     * Returns the current system time (Real or Simulated)
     */
    public now(): Date {
        if (!this.isSimulating && this.offsetMs === 0) {
            return new Date();
        }

        // Simplest logic: RealTime + Offset
        // If we want Speed > 1x, we need: StartSimTime + (RealElapsed * Speed)
        // For now, let's stick to simple Offset based simulation for reliability
        // unless speed > 1 is requested.

        if (this.simulationSpeed === 1) {
            return new Date(Date.now() + this.offsetMs);
        } else {
            // High speed logic could be added here
            // But for "Next Morning" jump, simple offset is best.
            return new Date(Date.now() + this.offsetMs);
        }
    }

    /**
     * Returns the current time as ISO String
     */
    public toISOString(): string {
        return this.now().toISOString();
    }

    /**
     * Sets the simulation mode
     * @param enable - Enable or disable simulation
     * @param targetDate - Optional target date to jump to
     */
    public async initialize() {
        try {
            const { settingsService } = require('../modules/settings/services/SettingsService');
            const config = await settingsService.getSetting('time_config');
            if (config) {
                if (config.timezone) {
                    this.timezone = config.timezone;
                    process.env.TZ = config.timezone;
                    console.log(`[TimeService] Restored Timezone: ${this.timezone}`);
                }
                if (config.manualOffsetMs) {
                    this.offsetMs = config.manualOffsetMs;
                    // If we have a saved manual offset (Real World Correction), we usually treat it as permanent correction, NOT simulation.
                    // So we do NOT set isSimulating = true.
                    // However, if offset is present, `now()` logic needs to know if it should apply it.
                    // Current logic: `if (!this.isSimulating && this.offsetMs === 0) return new Date();`
                    // So if offsetMs != 0, it falls through to correction logic, which is correct.
                    console.log(`[TimeService] Restored Manual Offset: ${this.offsetMs}ms`);
                }
            }
        } catch (error) {
            console.error('[TimeService] Failed to load time config:', error);
        }
    }

    /**
     * Sets the simulation mode
     * @param enable - Enable or disable simulation
     * @param targetDate - Optional target date to jump to
     */
    public setSimulation(enable: boolean, targetDate?: Date) {
        this.isSimulating = enable;
        if (!enable) {
            // Check if we have a persisted manual offset to fallback to?
            // For now, disabling simulation resets everything specific to simulation, 
            // BUT we should preserve "Real World Correction" if it was separate.
            // Current simplified architecture mixes them.
            // Ideally, we'd reload config or keep separate variables.
            // For now, let's assume 'disableSimulation' clears ALL offsets (including manual).
            // Users can re-apply Manual Offset if needed, or we improve architecture later.
            // Wait, per user request: "Manual Offset" IS "Real World Setting". It SHOULD NOT be cleared by disableSimulation if it's meant to be permanent?
            // But 'disableSimulation' implies "Return to Real Time". 
            // Real Time + Correction IS the new Real Time.
            // So, let's load the PERSISTED offset if we are disabling simulation.

            this.simulationSpeed = 1;
            this.reloadPersistedOffset().then(() => {
                console.log(`[TimeService] Simulation DISABLED. Time restored (with potential offset).`);
                this.emit('time-changed', { isSimulating: this.isSimulating, time: this.now() });
            });
            return;
        } else if (targetDate) {
            this.offsetMs = targetDate.getTime() - Date.now();
            console.log(`[TimeService] Simulation ENABLED. Jumped to: ${targetDate.toISOString()} (Offset: ${this.offsetMs}ms)`);
        }
        this.emit('time-changed', { isSimulating: this.isSimulating, time: this.now() });
    }

    private async reloadPersistedOffset() {
        const { settingsService } = require('../modules/settings/services/SettingsService');
        const config = await settingsService.getSetting('time_config');
        if (config && config.manualOffsetMs) {
            this.offsetMs = config.manualOffsetMs;
        } else {
            this.offsetMs = 0;
        }
    }

    /**
     * Manually sets the offset in minutes
     * @param minutes - Offset in minutes
     * @param persist - Whether to save this as a permanent configuration
     */
    public async setManualOffset(minutes: number, persist: boolean = false) {
        this.offsetMs = minutes * 60 * 1000;

        if (persist) {
            // Real World Correction
            this.isSimulating = false; // It's not a simulation, it's a correction
            await this.saveConfig({ manualOffsetMs: this.offsetMs });
        } else {
            // Temporary Simulation Jump (legacy behavior or specific simulation tool usage)
            this.isSimulating = minutes !== 0;
        }

        this.emit('time-changed', { isSimulating: this.isSimulating, time: this.now() });
        console.log(`[TimeService] Manual offset applied: ${minutes} min (Persist: ${persist}). Current Time: ${this.now().toISOString()}`);
    }

    public getTimezone(): string {
        return this.timezone;
    }

    public async setTimezone(tz: string) {
        this.timezone = tz;
        process.env.TZ = tz;
        console.log(`[TimeService] Timezone set to: ${tz}`);
        await this.saveConfig({ timezone: tz });
    }

    private async saveConfig(updates: Partial<{ timezone: string, manualOffsetMs: number }>) {
        const { settingsService } = require('../modules/settings/services/SettingsService');
        const currentConfig = await settingsService.getSetting('time_config') || {};
        const newConfig = { ...currentConfig, ...updates };
        await settingsService.saveSetting('time_config', newConfig, 'system', 'System Time Configuration');
    }

    public getStatus() {
        return {
            isSimulating: this.isSimulating,
            now: this.now(),
            realNow: new Date(),
            offsetMs: this.offsetMs,
            timezone: this.timezone
        };
    }
}

export const timeService = TimeService.getInstance();

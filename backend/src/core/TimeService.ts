
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
    public setSimulation(enable: boolean, targetDate?: Date) {
        this.isSimulating = enable;
        if (!enable) {
            this.offsetMs = 0;
            this.simulationSpeed = 1;
            console.log(`[TimeService] Simulation DISABLED. Time restored to: ${new Date().toISOString()}`);
        } else if (targetDate) {
            this.offsetMs = targetDate.getTime() - Date.now();
            console.log(`[TimeService] Simulation ENABLED. Jumped to: ${targetDate.toISOString()} (Offset: ${this.offsetMs}ms)`);
        }
        this.emit('time-changed', { isSimulating: this.isSimulating, time: this.now() });
    }

    /**
     * Manually sets the offset in minutes
     */
    public setManualOffset(minutes: number) {
        this.offsetMs = minutes * 60 * 1000;
        // Only enable simulation flag if offset is significant
        this.isSimulating = minutes !== 0;
        this.emit('time-changed', { isSimulating: this.isSimulating, time: this.now() });
        console.log(`[TimeService] Manual offset applied: ${minutes} min. Current Sim Time: ${this.now().toISOString()}`);
    }

    public getTimezone(): string {
        return this.timezone;
    }

    public setTimezone(tz: string) {
        this.timezone = tz;
        // Note: This changes the reported string, but Node process.env.TZ usually requires restart to fully take effect on Date objects.
        // However, if we handle formatting manually, we can use this.
        process.env.TZ = tz;
        console.log(`[TimeService] Timezone set to: ${tz}`);
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

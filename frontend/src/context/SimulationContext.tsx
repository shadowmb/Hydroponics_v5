
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';

// --- Types ---
interface SimulationContextType {
    // State
    isSimulating: boolean;
    virtualTime: Date;
    simulationSpeed: string;
    serverTimezone: string;
    manualOffsetMinutes: number; // For manual offset logic

    // Actions
    enableSimulation: () => void;
    disableSimulation: () => void;
    setVirtualTime: (date: Date) => void;
    setSimulationSpeed: (speed: string) => void;
    setServerTimezone: (tz: string) => void;
    setManualOffset: (offsetMinutes: number) => void;
}

// --- Defaults ---
const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

// --- Provider ---
export function SimulationProvider({ children }: { children: ReactNode }) {
    const [isSimulating, setIsSimulating] = useState(false);
    const [virtualTime, setVirtualTime] = useState(new Date());
    const [simulationSpeed, setSimulationSpeed] = useState('1x');
    const [serverTimezone, setServerTimezone] = useState('Europe/Sofia');
    const [manualOffsetMinutes, setManualOffsetMinutes] = useState(0);

    // Initial Fetch from Backend & Socket Listener
    useEffect(() => {
        // 1. Fetch initial state
        fetch('/api/time')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.data) {
                    const { isSimulating, now, timezone, offsetMs } = data.data;
                    setIsSimulating(isSimulating);
                    setVirtualTime(new Date(now));
                    setServerTimezone(timezone);
                    setManualOffsetMinutes(Math.round(offsetMs / 60000));
                }
            })
            .catch(err => console.error("Failed to fetch time status:", err));

        // 2. Listen for Socket Sync (Real-time updates from Backend)
        const onTimeSync = (data: { isSimulating: boolean, time: string, offsetMs: number }) => {
            console.log('🔄 Socket Time Sync:', data);
            setIsSimulating(data.isSimulating);
            setVirtualTime(new Date(data.time));
            if (data.offsetMs !== undefined) {
                setManualOffsetMinutes(Math.round(data.offsetMs / 60000));
            }
        };

        import('../core/SocketService').then(({ socketService }) => {
            socketService.on('time:sync', onTimeSync);
        });

        // Cleanup
        return () => {
            import('../core/SocketService').then(({ socketService }) => {
                socketService.off('time:sync', onTimeSync);
            });
        };
    }, []);

    // --- Clock Logic (The Heartbeat) ---
    useEffect(() => {
        const timer = setInterval(() => {
            // Priority: Simulating > Manual Offset > Real Time
            if (isSimulating && simulationSpeed !== 'paused') {
                // Determine tick size based on speed
                let tickMs = 1000;
                if (simulationSpeed === '60x') tickMs = 60000; // 1 real sec = 1 virt minute
                if (simulationSpeed === '3600x') tickMs = 3600000; // 1 real sec = 1 virt hour

                // Purely visual tick on frontend (backend has its own tick)
                setVirtualTime(prev => new Date(prev.getTime() + tickMs));
            } else if (!isSimulating) {
                // If not simulating, Virtual Time tracks Real Time + Manual Offset
                const realNow = new Date();
                if (manualOffsetMinutes !== 0) {
                    setVirtualTime(new Date(realNow.getTime() + manualOffsetMinutes * 60000));
                } else {
                    setVirtualTime(realNow);
                }
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [isSimulating, simulationSpeed, manualOffsetMinutes]);

    // --- API Actions ---

    const enableSimulation = () => {
        setIsSimulating(true);
        // Inform backend
        fetch('/api/time/simulate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enable: true })
        }).catch(() => toast.error("Failed to enable simulation on server"));
    };

    const disableSimulation = () => {
        setIsSimulating(false);
        setSimulationSpeed('1x');
        // Do NOT reset manual offset here. Backend will restore persisted offset if exists.
        // setManualOffsetMinutes(0); 

        // Inform backend
        fetch('/api/time/simulate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enable: false })
        }).catch(() => toast.error("Failed to reset server time"));
    };

    const setVirtualTimeAction = (date: Date) => {
        setVirtualTime(date);
        // If simulating, this is a jump
        if (isSimulating) {
            fetch('/api/time/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enable: true, targetTime: date.toISOString() })
            });
        }
    };

    const setSimulationSpeedAction = (speed: string) => {
        setSimulationSpeed(speed);
        // Note: We don't necessarily need to send speed to backend unless backend logic depends on it.
        // For now, TimeService supports simple offset, so we keep speed logic localized or send if needed.
        // Our current TimeService implementation in backend handles offsets mostly. 
        // If we want backend to "tick fast", we would need to implement that loop there. 
        // For "Next Morning" jumps, we use setVirtualTime (Jump).
        // Let's keep speed visual for now as per current requirements, or simple jumps.
    };

    const setServerTimezoneAction = (tz: string) => {
        setServerTimezone(tz);
        fetch('/api/time/timezone', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ timezone: tz })
        }).then(res => {
            if (res.ok) toast.success(`Server timezone set to ${tz}`);
        });
    };

    const setManualOffsetAction = (offsetMinutes: number) => {
        setManualOffsetMinutes(offsetMinutes);
        fetch('/api/time/offset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ minutes: offsetMinutes, persist: true }) // Added persist: true
        }).catch(() => toast.error("Failed to set offset on server"));
    };

    const value = {
        isSimulating,
        virtualTime,
        simulationSpeed,
        serverTimezone,
        manualOffsetMinutes, // Expose for UI
        enableSimulation,
        disableSimulation,
        setVirtualTime: setVirtualTimeAction,
        setSimulationSpeed: setSimulationSpeedAction,
        setServerTimezone: setServerTimezoneAction,
        setManualOffset: setManualOffsetAction
    };

    return (
        <SimulationContext.Provider value={value}>
            {children}
        </SimulationContext.Provider>
    );
}

// --- Hook ---
export function useSimulation() {
    const context = useContext(SimulationContext);
    if (context === undefined) {
        throw new Error('useSimulation must be used within a SimulationProvider');
    }
    return context;
}

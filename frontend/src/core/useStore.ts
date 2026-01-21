import { create } from 'zustand';
import type { IDevice, IExecutionSession } from '../../../shared/types';
import type { IActiveProgram } from '../types/ActiveProgram';

interface AppState {
    systemStatus: 'online' | 'offline' | 'degraded';
    dbConnected: boolean;
    devices: Map<string, IDevice>;
    activeSession: IExecutionSession | null;
    activeProgram: IActiveProgram | null;

    setSystemStatus: (status: 'online' | 'offline' | 'degraded', dbConnected?: boolean) => void;
    setDevices: (devices: IDevice[]) => void;
    updateDevice: (device: IDevice) => void;
    deviceTemplates: any[];
    setDeviceTemplates: (templates: any[]) => void;
    setActiveSession: (session: IExecutionSession | null) => void;
    setActiveProgram: (program: IActiveProgram | null) => void;
    logs: any[];
    addLog: (log: any) => void;
    setLogs: (logs: any[]) => void;
}

export const useStore = create<AppState>((set) => ({
    systemStatus: 'offline',
    dbConnected: false,
    devices: new Map(),
    activeSession: null,
    activeProgram: null,
    timeOffset: 0,
    logs: [],

    setSystemStatus: (status, dbConnected) => set((state) => ({
        systemStatus: status,
        dbConnected: dbConnected !== undefined ? dbConnected : state.dbConnected
    })),

    setDevices: (devicesList) => set((state) => {
        const newMap = new Map(state.devices);
        devicesList.forEach(d => newMap.set(d.id, d));
        return { devices: newMap };
    }),

    updateDevice: (device) => set((state) => {
        const newMap = new Map(state.devices);
        newMap.set(device.id, device);
        return { devices: newMap };
    }),

    deviceTemplates: [],
    setDeviceTemplates: (templates) => set({ deviceTemplates: templates }),

    setActiveSession: (session) => set({ activeSession: session }),

    setActiveProgram: (program) => set({ activeProgram: program }),

    addLog: (log) => set((state) => ({ logs: [log, ...state.logs].slice(0, 50) })), // Keep last 50
    setLogs: (logs) => set({ logs }),
}));

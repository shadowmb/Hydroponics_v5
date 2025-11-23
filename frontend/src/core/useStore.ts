import { create } from 'zustand';
import type { IDevice, IExecutionSession } from '../../../shared/types';

interface AppState {
    systemStatus: 'online' | 'offline';
    devices: Map<string, IDevice>;
    activeSession: IExecutionSession | null;

    setSystemStatus: (status: 'online' | 'offline') => void;
    setDevices: (devices: IDevice[]) => void;
    updateDevice: (device: IDevice) => void;
    setActiveSession: (session: IExecutionSession | null) => void;
}

export const useStore = create<AppState>((set) => ({
    systemStatus: 'offline',
    devices: new Map(),
    activeSession: null,

    setSystemStatus: (status) => set({ systemStatus: status }),

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

    setActiveSession: (session) => set({ activeSession: session }),
}));

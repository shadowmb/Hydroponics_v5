import { io, Socket } from 'socket.io-client';
import { useStore } from './useStore';

class SocketService {
    private socket: Socket | null = null;
    private static instance: SocketService;

    private constructor() { }

    public static getInstance(): SocketService {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }

    public connect() {
        if (this.socket) return;

        // Connect to backend (proxy handles /socket.io -> localhost:3000)
        this.socket = io('/', {
            path: '/socket.io',
            transports: ['websocket'],
            reconnection: true,
        });

        this.socket.on('connect', () => {
            console.log('Socket connected:', this.socket?.id);
            useStore.getState().setSystemStatus('online');
            this.fetchSystemState();
        });

        this.socket.on('disconnect', () => {
            console.log('Socket disconnected');
            useStore.getState().setSystemStatus('offline');
        });

        this.socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
            useStore.getState().setSystemStatus('offline');
        });

        this.setupEventListeners();
    }

    public onConnect(callback: () => void) {
        this.socket?.on('connect', callback);
    }

    public onDisconnect(callback: () => void) {
        this.socket?.on('disconnect', callback);
    }

    private async fetchSystemState() {
        try {
            const res = await fetch('/api/automation/status');
            if (!res.ok) return;
            const status = await res.json();

            console.log('System State:', status);

            if (status.state === 'running' || status.state === 'paused' || status.state === 'loaded' || status.state === 'stopped' || status.state === 'completed') {
                if (status.sessionId) {
                    this.fetchSession(status.sessionId);
                }
            } else {
                useStore.getState().setActiveSession(null);
            }
        } catch (err) {
            console.error('Failed to fetch system state:', err);
        }
    }

    private async fetchSession(sessionId: string) {
        try {
            const res = await fetch(`/api/sessions/${sessionId}`);
            if (!res.ok) return;
            const session = await res.json();
            useStore.getState().setActiveSession(session);
        } catch (err) {
            console.error('Failed to fetch session:', err);
        }
    }

    private setupEventListeners() {
        if (!this.socket) return;

        // Device Updates
        this.socket.on('device:update', (device: any) => {
            console.log('Device update:', device);
            useStore.getState().updateDevice(device);
        });

        // Automation State Changes
        // Automation State Changes
        this.socket.on('automation:state_change', (data: any) => {
            console.log('Automation state change:', data);

            if (data.state === 'running' || data.state === 'paused' || data.state === 'error' || data.state === 'loaded' || data.state === 'stopped' || data.state === 'completed') {
                const currentSession = useStore.getState().activeSession;

                // If we have a session and it matches, update it
                if (currentSession && currentSession.id === data.sessionId) {
                    useStore.getState().setActiveSession({
                        ...currentSession,
                        status: data.state,
                        currentBlockId: data.currentBlock,
                        // context: data.context // Optional: update context if needed
                    });
                } else {
                    // If no session or different ID, fetch full session but override status/block
                    this.fetchSession(data.sessionId).then(() => {
                        const freshSession = useStore.getState().activeSession;
                        if (freshSession) {
                            useStore.getState().setActiveSession({
                                ...freshSession,
                                status: data.state,
                                currentBlockId: data.currentBlock
                            });
                        }
                    });
                }
            } else if (data.state === 'idle') {
                useStore.getState().setActiveSession(null);
            }
        });

        // Automation Block Events (Start/End)
        this.socket.on('automation:block_start', (data: { sessionId: string, blockId: string }) => {
            // console.log('Block start:', data);
            const currentSession = useStore.getState().activeSession;
            if (currentSession && currentSession.id === data.sessionId) {
                useStore.getState().setActiveSession({
                    ...currentSession,
                    currentBlockId: data.blockId,
                    status: 'running'
                });
            }
        });

        this.socket.on('automation:block_end', (_data: { sessionId: string, blockId: string }) => {
            // console.log('Block end:', _data);
        });

        // Real-time Logs
        this.socket.on('log', (log: any) => {
            console.log('Log received:', log);
            useStore.getState().addLog(log);
        });
    }

    public on(event: string, callback: (...args: any[]) => void) {
        this.socket?.on(event, callback);
    }

    public off(event: string, callback: (...args: any[]) => void) {
        this.socket?.off(event, callback);
    }

    public disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export const socketService = SocketService.getInstance();

import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import mongoose from 'mongoose';
import { logger } from './LoggerService';
import { events, SystemEvents } from './EventBusService';

export class SocketService {
    private static instance: SocketService;
    private io: SocketIOServer | null = null;

    private constructor() { }

    public static getInstance(): SocketService {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }

    public initialize(server: HttpServer) {
        this.io = new SocketIOServer(server, {
            cors: {
                origin: '*', // Allow all for dev
                methods: ['GET', 'POST']
            }
        });

        this.io.on('connection', (socket: Socket) => {
            logger.info({ socketId: socket.id }, '🔌 Client Connected to WebSocket');

            // Send initial time sync
            const { isSimulating, now, offsetMs } = require('./TimeService').timeService.getStatus();
            socket.emit('time:sync', { isSimulating, time: now, offsetMs });

            socket.on('disconnect', () => {
                logger.info({ socketId: socket.id }, '🔌 Client Disconnected');
            });
        });

        this.setupEventBridge();
        this.startSystemHealthCheck();
        logger.info('🚀 Socket.io Initialized');
    }

    private startSystemHealthCheck() {
        // Emit system status every 5 seconds
        setInterval(() => {
            if (!this.io) return;
            const dbConnected = mongoose.connection.readyState === 1;

            this.io.emit('system:health', {
                status: dbConnected ? 'online' : 'degraded',
                dbConnected
            });
        }, 5000);
    }

    private setupEventBridge() {
        if (!this.io) return;

        // List of events to forward to frontend
        const eventsToForward: (keyof SystemEvents)[] = [
            'device:connected',
            'device:disconnected',
            'sensor:data',
            'error:critical',
            'command:sent',
            'log',
            // AutomationEngine v2 events (via AutomationRelay)
            'flow:state_change',
            'flow:block_start',
            'flow:block_end',
            'flow:execution_step',
            'flow:signal',
            // Legacy program events (for backward compatibility)
            'automation:program_start',
            // Advanced Program events
            'advanced:window_skipped',
            'advanced:window_active',
            'advanced:trigger_matched',
            'advanced:trigger_skipped',
            'advanced:trigger_evaluation',
            'advanced:window_completed',
            'advanced:fallback_executed',
            'advanced:program_day_complete',
            'active:program_started',
            'time:sync' // Forward time sync events
        ];

        eventsToForward.forEach(eventName => {
            events.on(eventName, (payload) => {
                logger.debug({ event: eventName, payload }, '📡 Forwarding to WebSocket');
                this.io?.emit(eventName, payload);
            });
        });
    }
}

export const socketService = SocketService.getInstance();

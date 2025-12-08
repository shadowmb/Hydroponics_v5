import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
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

            socket.on('disconnect', () => {
                logger.info({ socketId: socket.id }, '🔌 Client Disconnected');
            });
        });

        this.setupEventBridge();
        logger.info('🚀 Socket.io Initialized');
    }

    private setupEventBridge() {
        if (!this.io) return;

        // List of events to forward to frontend
        const eventsToForward: (keyof SystemEvents)[] = [
            'device:connected',
            'device:disconnected',
            'sensor:data',
            'error:critical',
            'automation:block_start',
            'automation:block_end',
            'automation:state_change',
            'command:sent',
            'log',
            'automation:execution_step'
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

import { SystemEvents } from '../../core/EventBusService';

/**
 * Represents a low-level command packet sent to the hardware.
 * Example: { "id": "req_1", "cmd": "DIGITAL_WRITE", "pin": 13, "state": 1 }
 */
export interface HardwarePacket {
    id: string;
    cmd: string;
    pins?: Record<string, string> | Map<string, string> | any[];
    [key: string]: any;
}

/**
 * Represents a response from the hardware.
 * Example: { "id": "req_1", "status": "ok", "data": { ... } }
 */
export interface HardwareResponse {
    id: string;
    status: 'ok' | 'error';
    data?: any;
    error?: string;
}

/**
 * Interface for the Transport Layer (Serial, Mock, TCP).
 * Responsible for sending raw bytes and emitting parsed JSON messages.
 */
export interface IHardwareTransport {
    connect(path: string, options?: any): Promise<void>;

    disconnect(): Promise<void>;
    send(packet: HardwarePacket): Promise<string>;

    // Event handlers
    onMessage(handler: (msg: HardwareResponse | any) => void): void;
    onError(handler: (err: Error) => void): void;
    onClose(handler: () => void): void;

    isConnected(): boolean;
}

/**
 * Interface for a Device Driver (Template).
 * Defines how a high-level command maps to a low-level hardware packet.
 */
export interface IDeviceDriver {
    id: string;          // e.g., 'relay_active_low'
    name: string;
    capabilities: string[];
    commands?: Record<string, any>;
    initialState?: Record<string, any>;

    /**
     * Translates a high-level command to a hardware packet.
     * @param commandName e.g., 'ON'
     * @param params e.g., { duration: 500 }
     * @param context Device configuration (pin, address)
     */
    createPacket(
        commandName: string,
        params: Record<string, any>,
        context: { pin?: number | string; pins?: Map<string, string> | Record<string, string> | any[]; address?: string }
    ): Omit<HardwarePacket, 'id'>; // ID is injected by the Service

    validateParams(commandName: string, params: Record<string, any>): boolean;
}

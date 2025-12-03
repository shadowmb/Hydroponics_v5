/**
 * Shared Types for Hydroponics v5
 * Used by both Backend and Frontend
 */

// --- Hardware Types ---

export interface IDevice {
    id: string; // Custom String ID (e.g. 'dev_1')
    name: string;
    type: string;
    driverId: string;
    pin?: number;
    config: Record<string, any>;
    tags?: string[];
    group?: 'Water' | 'Air' | 'Light' | 'Power' | 'Other';
    // State is runtime only, not stored here
}

// --- Automation Types ---

export interface ExecutionContext {
    // Static Context (From Program)
    programId: string;
    actionTemplateId: string;

    // Runtime Variables (Read/Write)
    variables: Record<string, any>;

    // Hardware State Snapshot (Read-Only)
    devices: Record<string, {
        value: number | boolean;
        lastUpdated: number;
    }>;

    // Execution Metadata
    stepCount: number;
    startTime: number;
    errors: Array<{ nodeId: string; message: string; timestamp: number }>;
}

export interface Block {
    id: string;
    type: string; // 'SENSOR_READ', 'IF', 'WAIT', etc.
    next?: string; // ID of the next block (default path)

    // Configuration params (e.g. deviceId, duration)
    params: Record<string, any>;

    // UI Metadata (for React Flow)
    position?: { x: number; y: number };
}

export interface IVariable {
    id: string;      // e.g., "var_1", "global_1"
    name: string;    // e.g., "Tank Temperature"
    type: 'number' | 'string' | 'boolean';
    value?: any;     // Default/Current value
    scope: 'local' | 'global';
}

export interface IFlow {
    id: string;
    name: string;
    description?: string;
    mode: 'SIMPLE' | 'EXPERT';
    nodes: any[];
    edges: any[];
    inputs?: {
        name: string;
        type: 'number' | 'string' | 'boolean';
        default?: any;
        description?: string;
    }[];
    variables?: IVariable[]; // Local variables defined in this flow
    isActive: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
}

export interface ICycle {
    id: string;
    name: string;
    description?: string;
    steps: {
        flowId: string;
        overrides: Record<string, any>;
    }[];
    isActive: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
}

export interface IProgram {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    schedule: {
        time: string;
        cycleId: string;
    }[];
    createdAt?: Date | string;
    updatedAt?: Date | string;
}

export interface IExecutionSession {
    id?: string; // Optional because it might be _id in Mongoose
    _id?: string;
    programId: string;
    startTime: Date | string; // Date in backend, string in JSON
    endTime?: Date | string;
    status: 'idle' | 'loaded' | 'running' | 'completed' | 'failed' | 'error' | 'paused' | 'stopped';
    logs: any[];
    context: any; // Snapshot of execution context
    currentBlockId?: string | null;
}

// --- Event Bus Types ---

export interface SystemEvents {
    // Hardware Events
    'device:connected': { deviceId: string };
    'device:disconnected': { deviceId: string };
    'device:update': { deviceId: string;[key: string]: any }; // Generic update
    'device:data': { deviceId: string; driverId?: string; deviceName?: string; value: any; raw?: any; details?: any; timestamp?: Date | string };
    'sensor:data': { deviceId: string; value: number; timestamp: Date | string };
    'error:critical': { source: string; message: string; error?: any };

    // Automation Events
    'automation:block_start': { blockId: string; type: string; sessionId?: string | null };
    'automation:block_end': { blockId: string; success: boolean; output?: any; sessionId?: string | null };
    'automation:state_change': { state: string; currentBlock: string | null; context: ExecutionContext; sessionId?: string | null };
    'log': { timestamp: Date | string; level: string; message: string; blockId?: string; data?: any; sessionId?: string | null };
}

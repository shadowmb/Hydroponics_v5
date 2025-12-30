/**
 * Execution Context (The Memory)
 * Passed between blocks during execution.
 */
export interface ExecutionContext {
    // Static Context (From Program)
    programId: string;
    actionTemplateId: string;

    // Runtime Variables (Read/Write)
    variables: Record<string, any>;

    // Variable Definitions (Read-Only Metadata)
    variableDefinitions: Record<string, {
        type: string;
        unit?: string;
        scope: 'local' | 'global';
    }>;

    // Hardware State Snapshot (Read-Only)
    // Updated by the Engine before each block execution
    devices: Record<string, {
        value: number | boolean;
        lastUpdated: number;
    }>;

    // Execution Metadata
    stepCount: number;
    startTime: number;
    errors: Array<{ nodeId: string; message: string; timestamp: number }>;

    // State persisted across Pause/Resume for each block
    resumeState: Record<string, any>;

    /**
     * Safety Stop Registry
     * Tracks devices modified by the flow to allow reversion on stop/error.
     */
    activeResources: Record<string, ActiveResource>;
}

export interface ActiveResource {
    deviceId: string;
    driverId: string;
    initialState: number; // The value before the flow touched it (0 or 1)
    lastCommand: string;  // For logging
    revertOnStop: boolean; // Policy
}

export interface Edge {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
}

/**
 * Block Definition (The Blueprint)
 * Represents a node in the flow graph.
 */
export interface Block {
    id: string;
    type: string;
    // next is derived from edges during execution

    // Configuration params (mapped from data)
    params: Record<string, any>;

    // UI Metadata
    position?: { x: number; y: number };
}

/**
 * Block Execution Result
 * Returned by BlockExecutor.
 */
export interface BlockResult {
    success: boolean;
    nextBlockId?: string | null; // If null, execution stops (or follows default 'next')
    output?: any; // Result to store in variables
    error?: string;
    summary?: string; // Human-readable summary of the result (e.g. "Read 24.5 °C")
    state?: any; // State to persist for this block (e.g. loop iteration)
}

/**
 * Block Executor Interface
 * Pure function logic for a block.
 */
export interface IBlockExecutor {
    type: string;
    execute(ctx: ExecutionContext, params: any, abortSignal?: AbortSignal): Promise<BlockResult>;
}

/**
 * Execution Session (The Instance)
 * Represents a running instance of an ActionTemplate.
 */
export interface ExecutionSession {
    id: string;
    status: 'idle' | 'loaded' | 'running' | 'completed' | 'failed' | 'error' | 'paused' | 'stopped';
    context: ExecutionContext;
    currentBlockId: string | null;
}

/**
 * Error thrown when execution is paused.
 * Carries state to be persisted.
 */
export class PauseError extends Error {
    constructor(public state: any) {
        super('Paused');
        this.name = 'PauseError';
    }
}

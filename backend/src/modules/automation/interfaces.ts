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

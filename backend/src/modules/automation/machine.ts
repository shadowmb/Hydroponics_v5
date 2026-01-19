import { createMachine, assign } from 'xstate';
import { ExecutionContext, Block, Edge } from './interfaces';

export interface AutomationContext {
    execContext: ExecutionContext;
    blocks: Map<string, Block>;
    edges: Edge[];
    currentBlockId: string | null;
    error: string | null;
}

export type AutomationEvent =
    | { type: 'LOAD'; programId: string; templateId: string; blocks: Block[]; edges: Edge[] }
    | { type: 'START' }
    | { type: 'PAUSE'; resumeState?: any }
    | { type: 'RESUME' }
    | { type: 'STOP' }
    | { type: 'UNLOAD' }
    | { type: 'BLOCK_COMPLETE'; data: { nextBlockId?: string | null; output?: any } }
    | { type: 'BLOCK_ERROR'; data: { message: string } };

export const automationMachine = createMachine({
    types: {} as {
        context: AutomationContext;
        events: AutomationEvent;
    },
    id: 'automation',
    initial: 'idle',
    context: {
        execContext: {
            programId: '',
            actionTemplateId: '',
            variables: {},
            devices: {},
            stepCount: 0,
            startTime: 0,
            errors: [],
            resumeState: {},
            activeResources: {}
        },
        blocks: new Map(),
        edges: [],
        currentBlockId: null,
        error: null
    },
    states: {
        idle: {
            on: {
                LOAD: {
                    target: 'loaded',
                    actions: assign(({ context, event }: { context: AutomationContext, event: any }) => {
                        const blockMap = new Map<string, Block>();
                        (event.blocks || []).forEach((b: Block) => blockMap.set(b.id, b));

                        return {
                            blocks: blockMap,
                            edges: event.edges || [],
                            currentBlockId: event.blocks?.[0]?.id || null,
                            execContext: {
                                ...context.execContext,
                                programId: event.programId,
                                actionTemplateId: event.templateId,
                                startTime: 0, // Not started yet
                                stepCount: 0,
                                variables: event.execContext?.variables || {},
                                variableDefinitions: event.execContext?.variableDefinitions || {},
                                errors: [],
                                activeResources: {}
                            }
                        };
                    })
                }
            }
        },
        loaded: {
            on: {
                START: {
                    target: 'running',
                    actions: assign(({ context }: { context: AutomationContext }) => ({
                        execContext: {
                            ...context.execContext,
                            startTime: Date.now()
                        }
                    }))
                },
                UNLOAD: { target: 'idle' }
            }
        },
        running: {
            invoke: {
                src: 'executeBlock',
                input: ({ context }: { context: AutomationContext }) => ({ context }),
                onDone: {
                    target: 'running',
                    reenter: true,
                    actions: assign(({ context, event }: { context: AutomationContext, event: any }) => {
                        const { nextBlockId, output, variables, resumeState, systemAction } = event.output;

                        // Unified System Action Handler
                        // If a block returns a systemAction (e.g. LOG block or onFailure policy), handle it here.
                        if (systemAction === 'PAUSE') {
                            // When pausing, we want to resume from the NEXT block (or the current one if specified in resumeState)
                            // We do NOT update currentBlockId yet. We store the target in resumeState.
                            const targetBlockId = nextBlockId || context.currentBlockId;
                            return {
                                execContext: {
                                    ...context.execContext,
                                    resumeState: { blockId: targetBlockId }
                                }
                            };
                        }

                        if (systemAction === 'STOP') {
                            return {}; // State transition to 'stopped' handles the rest
                        }

                        // Default Flow: Move to next block
                        return {
                            currentBlockId: nextBlockId || null,
                            execContext: {
                                ...context.execContext,
                                stepCount: context.execContext.stepCount + 1,
                                variables: variables || context.execContext.variables, // MERGE BACK
                                resumeState: resumeState || context.execContext.resumeState // MERGE BACK
                            }
                        };
                    })
                },
                always: [
                    // System Action Transition Guards
                    { target: 'paused', guard: ({ event }: any) => event.output?.systemAction === 'PAUSE' },
                    { target: 'stopped', guard: ({ event }: any) => event.output?.systemAction === 'STOP' },
                    // Normal Completion Guard
                    { target: 'completed', guard: ({ context }: any) => !context.currentBlockId }
                ],
                onError: {
                    target: 'error',
                    actions: assign(({ context, event }: { context: AutomationContext, event: any }) => {
                        const msg = (event.error as any)?.message || 'Unknown error';
                        return {
                            error: msg,
                            execContext: {
                                ...context.execContext,
                                errors: [...context.execContext.errors, {
                                    nodeId: context.currentBlockId || 'unknown',
                                    message: msg,
                                    timestamp: Date.now()
                                }]
                            }
                        };
                    })
                }
            } as any,
            always: [
                { target: 'completed', guard: ({ context }: { context: AutomationContext }) => !context.currentBlockId }
            ],
            on: {
                PAUSE: {
                    target: 'paused',
                    actions: assign(({ context, event }: { context: AutomationContext, event: any }) => {
                        // Support explicit resume target (e.g. from LOG block System Action)
                        if (event.resumeState && event.resumeState.blockId) {
                            return { currentBlockId: event.resumeState.blockId };
                        }
                        return {};
                    })
                },
                STOP: { target: 'stopped' },
                BLOCK_ERROR: { target: 'error' }
            }
        },
        paused: {
            on: {
                RESUME: { target: 'running' },
                STOP: { target: 'stopped' }
            }
        },
        stopped: {
            on: {
                START: {
                    target: 'running',
                    actions: assign(({ context }: { context: AutomationContext }) => ({
                        // Reset for restart
                        currentBlockId: Array.from(context.blocks.values())[0]?.id || null,
                        execContext: {
                            ...context.execContext,
                            startTime: Date.now(),
                            stepCount: 0,
                            resumeState: {} // Clear resume state on fresh start
                        }
                    }))
                },
                UNLOAD: { target: 'idle' },
                LOAD: {
                    target: 'loaded',
                    actions: assign(({ context, event }: { context: AutomationContext, event: any }) => {
                        const blockMap = new Map<string, Block>();
                        (event.blocks || []).forEach((b: Block) => blockMap.set(b.id, b));

                        return {
                            blocks: blockMap,
                            edges: event.edges || [],
                            currentBlockId: event.blocks?.[0]?.id || null,
                            execContext: {
                                ...context.execContext,
                                programId: event.programId,
                                actionTemplateId: event.templateId,
                                startTime: 0, // Not started yet
                                stepCount: 0,
                                variables: event.execContext?.variables || {},
                                variableDefinitions: event.execContext?.variableDefinitions || {},
                                errors: [],
                                activeResources: {}
                            }
                        };
                    })
                }
            }
        },
        error: {
            on: {
                STOP: { target: 'stopped' },
                UNLOAD: { target: 'idle' },
                LOAD: {
                    target: 'loaded',
                    actions: assign(({ context, event }: { context: AutomationContext, event: any }) => {
                        const blockMap = new Map<string, Block>();
                        (event.blocks || []).forEach((b: Block) => blockMap.set(b.id, b));

                        return {
                            blocks: blockMap,
                            edges: event.edges || [],
                            currentBlockId: event.blocks?.[0]?.id || null,
                            execContext: {
                                ...context.execContext,
                                programId: event.programId,
                                actionTemplateId: event.templateId,
                                startTime: 0, // Not started yet
                                stepCount: 0,
                                variables: {},
                                errors: [],
                                activeResources: {}
                            }
                        };
                    })
                }
            }
        },
        completed: {
            on: {
                START: {
                    target: 'running',
                    actions: assign(({ context }: { context: AutomationContext }) => ({
                        // Reset for restart
                        currentBlockId: Array.from(context.blocks.values())[0]?.id || null,
                        execContext: {
                            ...context.execContext,
                            startTime: Date.now(),
                            stepCount: 0,
                            resumeState: {}
                        }
                    }))
                },
                UNLOAD: { target: 'idle' },
                LOAD: {
                    target: 'loaded',
                    actions: assign(({ context, event }: { context: AutomationContext, event: any }) => {
                        const blockMap = new Map<string, Block>();
                        (event.blocks || []).forEach((b: Block) => blockMap.set(b.id, b));

                        return {
                            blocks: blockMap,
                            edges: event.edges || [],
                            currentBlockId: event.blocks?.[0]?.id || null,
                            execContext: {
                                ...context.execContext,
                                programId: event.programId,
                                actionTemplateId: event.templateId,
                                startTime: 0, // Not started yet
                                stepCount: 0,
                                variables: {},
                                errors: [],
                                activeResources: {}
                            }
                        };
                    })
                }
            }
        }
    }
} as any);

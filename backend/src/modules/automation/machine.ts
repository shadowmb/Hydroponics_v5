import { createMachine, assign } from 'xstate';
import { ExecutionContext, Block } from './interfaces';

export interface AutomationContext {
    execContext: ExecutionContext;
    blocks: Map<string, Block>;
    currentBlockId: string | null;
    error: string | null;
}

export type AutomationEvent =
    | { type: 'START'; programId: string; templateId: string; blocks: Block[] }
    | { type: 'PAUSE' }
    | { type: 'RESUME' }
    | { type: 'STOP' }
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
            errors: []
        },
        blocks: new Map(),
        currentBlockId: null,
        error: null
    },
    states: {
        idle: {
            on: {
                START: {
                    target: 'running',
                    actions: assign(({ context, event }: { context: AutomationContext, event: any }) => {
                        if (event.type !== 'START') return {};
                        const blockMap = new Map<string, Block>();
                        (event.blocks || []).forEach((b: Block) => blockMap.set(b.id, b));

                        return {
                            blocks: blockMap,
                            currentBlockId: event.blocks?.[0]?.id || null,
                            execContext: {
                                ...context.execContext,
                                programId: event.programId,
                                actionTemplateId: event.templateId,
                                startTime: Date.now(),
                                stepCount: 0,
                                variables: {},
                                errors: []
                            }
                        };
                    })
                }
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
                        const { nextBlockId, output } = event.output;
                        return {
                            currentBlockId: nextBlockId || null,
                            execContext: {
                                ...context.execContext,
                                stepCount: context.execContext.stepCount + 1
                            }
                        };
                    })
                },
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
                PAUSE: { target: 'paused' },
                STOP: { target: 'idle' },
                BLOCK_ERROR: { target: 'error' }
            }
        },
        paused: {
            on: {
                RESUME: { target: 'running' },
                STOP: { target: 'idle' }
            }
        },
        error: {
            on: {
                STOP: { target: 'idle' }
            }
        },
        completed: {
            on: {
                START: { target: 'running' }
            }
        }
    }
} as any);

import { IBlockExecutor, ExecutionContext, BlockResult, PauseError } from '../interfaces';
import { logger } from '../../../core/LoggerService';

export class WaitBlockExecutor implements IBlockExecutor {
    type = 'WAIT';

    async execute(ctx: ExecutionContext, params: any = {}, abortSignal?: AbortSignal): Promise<BlockResult> {
        // Check for resume state
        const blockId = 'WAIT_' + Date.now(); // Ideally we need the real blockId here. 
        // Wait, ctx doesn't have currentBlockId directly accessible in the interface I defined? 
        // Actually ExecutionContext in interfaces.ts DOES NOT have currentBlockId. 
        // AutomationEngine passes it in 'context' to executeBlock, but 'execute' receives 'ctx.execContext'.
        // We need to fix this. The executor needs to know its own ID to look up state.
        // OR, we pass the state directly? No, ctx.resumeState is a map.

        // Let's assume for now we can't easily get the ID inside execute without changing signature.
        // BUT, we can calculate remaining time based on start time if we tracked it?
        // No, we need to save state.

        // RE-READING interfaces.ts: ExecutionContext has 'variables', 'devices', etc.
        // It does NOT have 'currentBlockId'.

        // FIX: I need to pass the blockId to the execute method or add it to ExecutionContext.
        // Adding it to ExecutionContext is cleaner.

        // For now, let's look at how I can get the ID.
        // AutomationEngine calls: executor.execute(context.execContext, block.params, signal);
        // context.execContext is the user-facing context.

        // I will add 'blockId' to the params or context?
        // Let's look at AutomationEngine.ts again.
        // It emits 'automation:block_start' with blockId.

        // I will update AutomationEngine to inject _blockId into params or context.
        // Injecting into params is easiest for now without breaking interfaces.

        let duration = params?.duration || 1; // Default 1 second

        // Convert Seconds to Milliseconds for internal timer
        duration = duration * 1000;

        // Logic for Resume
        // We need to know if we are resuming. 
        // We can check if ctx.resumeState exists.
        // But we need the key.

        // Let's assume params._blockId is injected.
        const myId = params._blockId;
        let remaining = duration;

        if (myId && ctx.resumeState && ctx.resumeState[myId]) {
            remaining = ctx.resumeState[myId].remaining;
            logger.info({ remaining, original: duration }, '⏯️ Resuming WAIT Block');
        } else {
            logger.info({ duration, params }, `⏳ WAIT Block executing for ${duration}ms`);
        }

        const startTime = Date.now();

        await new Promise<void>((resolve, reject) => {
            const timer = setTimeout(resolve, remaining);

            if (abortSignal) {
                abortSignal.addEventListener('abort', () => {
                    clearTimeout(timer);
                    const elapsed = Date.now() - startTime;
                    const newRemaining = Math.max(0, remaining - elapsed);

                    logger.debug({ newRemaining }, '⏳ WAIT Block Paused');
                    reject(new PauseError({ remaining: newRemaining }));
                });
            }
        });

        return { success: true };
    }
}

import { z } from 'zod';

export const HardwareCommandSchema = z.object({
    deviceId: z.string().min(1),
    driverId: z.string().min(1),
    command: z.string().min(1),
    params: z.record(z.any()).optional(),
    context: z.object({
        pin: z.number().optional(),
        address: z.string().optional()
    }).optional()
});

export const AutomationStartSchema = z.object({
    programId: z.string().min(1),
    templateId: z.string().optional(),
    // We might accept blocks directly for testing, or load them from DB
    blocks: z.array(z.any()).optional()
});

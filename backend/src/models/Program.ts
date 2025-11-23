import mongoose, { Schema } from 'mongoose';
import { z } from 'zod';
import { softDeletePlugin, SoftDeleteDocument, SoftDeleteModel } from '../core/softDeletePlugin';

// --- Zod Schema ---
export const ProgramSchemaZod = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    isActive: z.boolean().default(false),

    schedule: z.array(z.object({
        actionTemplateId: z.string(), // UUID reference
        order: z.number(),

        parameterOverrides: z.record(z.any()).default({}),

        trigger: z.object({
            type: z.enum(['TIME', 'EVENT', 'MANUAL']),
            cron: z.string().optional(),
            condition: z.string().optional(),
        }),
    })),
});

export type IProgram = z.infer<typeof ProgramSchemaZod> & SoftDeleteDocument;

// --- Mongoose Schema ---
const ProgramSchema = new Schema<IProgram>(
    {
        name: { type: String, required: true },
        description: String,
        isActive: { type: Boolean, default: false },

        schedule: [{
            actionTemplateId: { type: String, required: true },
            order: { type: Number, required: true },

            parameterOverrides: { type: Map, of: Schema.Types.Mixed },

            trigger: {
                type: { type: String, enum: ['TIME', 'EVENT', 'MANUAL'], required: true },
                cron: String,
                condition: String,
            },
        }],
    },
    {
        timestamps: true,
    }
);

ProgramSchema.plugin(softDeletePlugin);

export const ProgramModel = mongoose.model<IProgram, SoftDeleteModel<IProgram>>('Program', ProgramSchema);

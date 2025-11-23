import mongoose, { Schema } from 'mongoose';
import { z } from 'zod';
import { softDeletePlugin, SoftDeleteDocument, SoftDeleteModel } from '../core/softDeletePlugin';

// --- Zod Schema ---
export const ActionTemplateSchemaZod = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    version: z.number().default(1),

    definition: z.object({
        nodes: z.array(z.any()), // We keep this loose for now (React Flow JSON)
        edges: z.array(z.any()),
    }),

    parameters: z.array(z.object({
        key: z.string(),
        type: z.enum(['NUMBER', 'BOOLEAN', 'STRING']),
        defaultValue: z.any().optional(),
        label: z.string(),
    })).default([]),

    tags: z.array(z.string()).default([]),
});

export type IActionTemplate = z.infer<typeof ActionTemplateSchemaZod> & SoftDeleteDocument;

// --- Mongoose Schema ---
const ActionTemplateSchema = new Schema<IActionTemplate>(
    {
        name: { type: String, required: true },
        description: String,
        version: { type: Number, default: 1 },

        definition: {
            nodes: [],
            edges: [],
        },

        parameters: [{
            key: String,
            type: { type: String, enum: ['NUMBER', 'BOOLEAN', 'STRING'] },
            defaultValue: Schema.Types.Mixed,
            label: String,
        }],

        tags: [String],
    },
    {
        timestamps: true,
    }
);

ActionTemplateSchema.plugin(softDeletePlugin);

export const ActionTemplateModel = mongoose.model<IActionTemplate, SoftDeleteModel<IActionTemplate>>('ActionTemplate', ActionTemplateSchema);

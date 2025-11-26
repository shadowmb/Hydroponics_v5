import mongoose, { Schema, FilterQuery, Query } from 'mongoose';

export interface SoftDeleteDocument extends mongoose.Document {
    deletedAt: Date | null;
    softDelete(): Promise<this>;
    restore(): Promise<this>;
}

export interface SoftDeleteModel<T extends SoftDeleteDocument> extends mongoose.Model<T> {
    findDeleted(): Promise<T[]>;
}

export const softDeletePlugin = (schema: Schema) => {
    schema.add({
        deletedAt: {
            type: Date,
            default: null,
            index: true, // Important for performance
        },
    });

    // 1. Helper Methods
    schema.methods.softDelete = async function () {
        this.deletedAt = new Date();
        // Rename to free up the original name: "MySensor" -> "MySensor_del_1716..."
        if (this.name) {
            this.name = `${this.name}_del_${Date.now()}`;
        }
        return this.save();
    };

    schema.methods.restore = async function () {
        this.deletedAt = null;
        // Attempt to restore original name: "MySensor_del_1716..." -> "MySensor"
        if (this.name && this.name.includes('_del_')) {
            const originalName = this.name.split('_del_')[0];
            // Check if original name is taken
            const Model = this.constructor as any;
            const exists = await Model.findOne({ name: originalName, deletedAt: null });
            if (!exists) {
                this.name = originalName;
            } else {
                // Keep suffix or maybe just remove the timestamp part but keep _restored?
                // For now, let's keep it simple: if taken, fail or keep suffix?
                // Let's try to append _restored if taken
                this.name = `${originalName}_restored_${Date.now()}`;
            }
        }
        return this.save();
    };

    // 2. Block Hard Deletes (unless explicit)
    schema.pre(['deleteOne', 'deleteMany'], function (next) {
        // @ts-ignore
        const options = this.getOptions();
        if (options.hardDelete) {
            return next();
        }
        next(new Error('HARD_DELETE_FORBIDDEN: Use softDelete() instead.'));
    });

    // 3. Query Middleware (The Filter)
    const types = [
        'count',
        'countDocuments',
        'find',
        'findOne',
        'findOneAndUpdate',
        'update',
        'updateOne',
        'updateMany',
    ];

    types.forEach((type) => {
        schema.pre(type as any, function (this: Query<any, any>, next) {
            const options = this.getOptions();

            // Escape Hatch: { withDeleted: true }
            if (options.withDeleted) {
                return next();
            }

            // Apply Filter: { deletedAt: null }
            this.where({ deletedAt: null });
            next();
        });
    });
};

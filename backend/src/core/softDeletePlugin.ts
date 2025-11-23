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
    schema.methods.softDelete = function () {
        this.deletedAt = new Date();
        return this.save();
    };

    schema.methods.restore = function () {
        this.deletedAt = null;
        return this.save();
    };

    // 2. Block Hard Deletes
    schema.pre(['deleteOne', 'deleteMany'], function (next) {
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
            // We merge with existing query to avoid overwriting
            this.where({ deletedAt: null });
            next();
        });
    });
};

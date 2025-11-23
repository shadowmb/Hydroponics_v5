import mongoose, { Schema } from 'mongoose';

export interface ISoftDelete {
    deletedAt: Date | null;
    softDelete(): Promise<this>;
}

export function softDeletePlugin(schema: Schema) {
    schema.add({
        deletedAt: {
            type: Date,
            default: null,
            index: true
        }
    });

    // Filter out deleted docs by default
    const types = ['find', 'findOne', 'findOneAndUpdate', 'count', 'countDocuments'];

    types.forEach((type) => {
        schema.pre(type as any, function (this: any, next) {
            // Allow overriding the filter if explicitly requested
            if (this.getFilter().deletedAt === undefined) {
                this.where({ deletedAt: null });
            }
            next();
        });
    });

    // Add a helper method for soft delete
    schema.methods.softDelete = function () {
        this.deletedAt = new Date();
        return this.save();
    };
}

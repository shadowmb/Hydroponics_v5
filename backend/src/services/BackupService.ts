
import mongoose from 'mongoose';
import { logger } from '../core/LoggerService';

// Import Interfaces for type safety if needed (optional)
import { IActiveProgram } from '../modules/persistence/schemas/ActiveProgram.schema';

export interface BackupMetadata {
    version: string;
    systemVersion: string;
    timestamp: string;
    comment?: string;
    stats: Record<string, number>;
}

export interface BackupPayload {
    meta: BackupMetadata;
    data: Record<string, any[]>;
}

export interface ExportOptions {
    targets: string[]; // e.g., ['infrastructure', 'automation']
    comment?: string;
}

// Definition of Backup Groups and their underlying collections
export const BACKUP_GROUPS = {
    infrastructure: ['controllers', 'relays', 'devices'],
    automation: ['flows', 'programs', 'activeprograms'],
    history: ['programdailylogs', 'executionsessions', 'readings', 'resourcedailysummaries'],
    system: ['systemsettings', 'users', 'resourceroles']
};

export class BackupService {

    /**
     * Generates a backup object containing the requested groups
     */
    public async exportBackup(options: ExportOptions): Promise<BackupPayload> {
        const collectionsToExport = new Set<string>();

        // 1. Resolve groups to collections
        for (const target of options.targets) {
            if (target in BACKUP_GROUPS) {
                BACKUP_GROUPS[target as keyof typeof BACKUP_GROUPS].forEach(c => collectionsToExport.add(c));
            } else {
                // Allow requesting specific collections directly if needed (advanced usage)
                collectionsToExport.add(target);
            }
        }

        // 2. Export data
        const data: Record<string, any[]> = {};
        const stats: Record<string, number> = {};

        for (const collectionName of collectionsToExport) {
            try {
                if (!mongoose.connection.db) {
                    throw new Error('Database not connected');
                }
                const collection = mongoose.connection.db.collection(collectionName);

                // Check if collection exists to avoid errors
                const collections = await mongoose.connection.db.listCollections({ name: collectionName }).toArray();
                if (collections.length === 0) {
                    logger.warn(`Collection '${collectionName}' not found. Skipping.`);
                    continue;
                }

                // Fetch all documents as raw JSON
                const docs = await collection.find({}).toArray();

                // Filter out legacy or unnecessary fields if needed?
                // For 'Restore' purposes, we usually want EXACT copies, including _id and dates.
                // So we keep them as is.

                data[collectionName] = docs;
                stats[collectionName] = docs.length;

                logger.debug(`Exported ${docs.length} records from ${collectionName}`);
            } catch (error) {
                logger.error(`Error exporting collection ${collectionName}:`, error);
                // Continue with other collections? Or fail? 
                // Better to fail partly or warn. We will continue.
            }
        }

        // 3. Construct Payload
        const payload: BackupPayload = {
            meta: {
                version: '1.0',
                systemVersion: process.env.npm_package_version || '5.0.0',
                timestamp: new Date().toISOString(),
                comment: options.comment,
                stats
            },
            data
        };

        return payload;
    }

    /**
     * Restores a backup from a payload.
     * WARNING: destructive operation for the target collections!
     */
    public async restoreBackup(payload: BackupPayload): Promise<{ success: boolean; details: string[] }> {
        const details: string[] = [];
        const collections = Object.keys(payload.data);

        logger.warn(`Starting RESTORE process for ${collections.length} collections...`);

        // Validate payload structure basic
        if (!payload.meta || !payload.data) {
            throw new Error('Invalid backup file format');
        }

        // Using a transaction would be ideal, but for raw inserts across many collections
        // and potentially different sharding setups, we'll keep it simple for V5.
        // We will process sequentially.

        for (const collectionName of collections) {
            const docs = payload.data[collectionName];
            if (!Array.isArray(docs) || docs.length === 0) {
                details.push(`Skipped ${collectionName}: No data`);
                continue;
            }

            try {
                if (!mongoose.connection.db) {
                    throw new Error('Database not connected');
                }
                const collection = mongoose.connection.db.collection(collectionName);

                // 1. Drop existing data in this collection (Backup & Replace strategy)
                // We use deleteMany({}) to clear it.
                await collection.deleteMany({});
                details.push(`Cleared existing data in ${collectionName}`);

                // 2. Insert new data (Raw Insert to preserve _id and dates)
                // We need a pass to revive dates.
                const revivedDocs = this.reviveDates(docs);

                await collection.insertMany(revivedDocs);

                details.push(`Restored ${revivedDocs.length} records in ${collectionName}`);
                logger.info(`Restored ${collectionName}: ${revivedDocs.length} items`);

            } catch (error) {
                logger.error(`Failed to restore ${collectionName}:`, error);
                throw new Error(`Restore failed at ${collectionName}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }

        return { success: true, details };
    }

    /**
     * Helper to inspect a backup file without restoring
     */
    public getBackupPreview(payload: BackupPayload): BackupMetadata {
        return payload.meta;
    }

    /**
     * Recursively traverses objects and converts ISO date strings to Date objects.
     * Essential for raw driver inserts.
     */
    private reviveDates(obj: any): any {
        if (obj === null || obj === undefined) return obj;

        if (Array.isArray(obj)) {
            return obj.map(item => this.reviveDates(item));
        }

        if (typeof obj === 'object') {
            // MongoDB Extended JSON format handling: { "$date": "..." }
            if (obj.$date && typeof obj.$date === 'string') {
                return new Date(obj.$date);
            }

            // Standard recursion
            const newObj: any = {};
            for (const key of Object.keys(obj)) {
                const value = obj[key];
                // Heuristic: keys ending in 'At' (createdAt, updatedAt) or just checking value string format
                // Checking value format is safer.
                if (typeof value === 'string' && this.isIsoDate(value)) {
                    newObj[key] = new Date(value);
                } else {
                    newObj[key] = this.reviveDates(value);
                }
            }
            return newObj;
        }

        return obj;
    }

    private isIsoDate(str: string): boolean {
        // fast check for YYYY-MM-DDTHH:mm:ss...
        if (str.length < 20) return false;
        return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(str);
    }
}

export const backupService = new BackupService();


import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import ResourceRole, { IResourceRole, AnalyticsType } from '../models/ResourceRole';

const CONFIG_DIR = path.join(__dirname, '../../config/devices');

export class ResourceRoleManager {

    /**
     * Scans all device templates for resourceRoles and syncs them to the DB.
     * Preserves existing user configs (analyticsType, custom labels).
     */
    async scanAndSyncRoles(): Promise<{ added: number, updated: number, errors: string[] }> {
        console.log(`[ResourceRoleManager] Scanning templates in ${CONFIG_DIR}...`);

        let files: string[] = [];
        try {
            // Find all JSON files in config/devices recursively
            files = await glob('**/*.json', { cwd: CONFIG_DIR, absolute: true });
        } catch (error) {
            console.error('[ResourceRoleManager] Glob error:', error);
            return { added: 0, updated: 0, errors: [String(error)] };
        }

        const discoveredRoles = new Set<string>();

        // 1. Harvest roles from files
        for (const file of files) {
            try {
                const content = fs.readFileSync(file, 'utf-8');
                const template = JSON.parse(content);

                // Strategy 1: Explicit 'resourceRoles' array
                if (Array.isArray(template.resourceRoles)) {
                    template.resourceRoles.forEach((role: string) => discoveredRoles.add(role));
                }

                // Strategy 2: Keys in 'roles' object (older schema usually)
                if (template.roles && typeof template.roles === 'object') {
                    Object.keys(template.roles).forEach(role => discoveredRoles.add(role));
                }

            } catch (err) {
                console.warn(`[ResourceRoleManager] Failed to parse ${path.basename(file)}:`, err);
            }
        }

        console.log(`[ResourceRoleManager] Discovered ${discoveredRoles.size} unique roles:`, Array.from(discoveredRoles));

        // 2. Sync with DB
        let added = 0;
        let updated = 0;

        for (const key of discoveredRoles) {
            const humanLabel = this.humanizeKey(key);

            // Default analytics type heuristic (can be improved or left as NONE)
            let defaultType: AnalyticsType = 'NONE';
            if (key.includes('volume') || key.includes('level')) defaultType = 'DELTA';
            if (key.includes('dose') || key.includes('pump')) defaultType = 'SUM';
            if (key.includes('ph') || key.includes('ec') || key.includes('temp')) defaultType = 'TREND';

            const result = await ResourceRole.updateOne(
                { key },
                {
                    $setOnInsert: {
                        label: humanLabel,
                        analyticsType: defaultType,
                        unit: '',
                        color: this.getColorByKey(key)
                    }
                },
                { upsert: true }
            );

            if (result.upsertedCount > 0) added++;
            else if (result.modifiedCount > 0) updated++;
        }

        return { added, updated, errors: [] };
    }

    /**
     * Helper: "ph_up" -> "Ph Up"
     */
    private humanizeKey(key: string): string {
        return key
            .split(/[._-]+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Helper: Assign default colors based on keywords
     */
    private getColorByKey(key: string): string {
        const k = key.toLowerCase();
        if (k.includes('ph')) return 'purple';
        if (k.includes('ec')) return 'orange';
        if (k.includes('temp')) return 'red';
        if (k.includes('water') || k.includes('level') || k.includes('vol')) return 'cyan';
        if (k.includes('hum')) return 'blue';
        return 'gray';
    }

    /**
     * Returns all roles from DB
     */
    async getAllRoles(): Promise<IResourceRole[]> {
        return ResourceRole.find().sort({ key: 1 });
    }

    /**
     * Update configuration for a role
     */
    async updateRole(key: string, updateData: Partial<IResourceRole>): Promise<IResourceRole | null> {
        return ResourceRole.findOneAndUpdate(
            { key },
            { $set: updateData },
            { new: true }
        );
    }
}

export default new ResourceRoleManager();

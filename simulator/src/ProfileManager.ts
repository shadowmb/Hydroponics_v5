import * as fs from 'fs';
import * as path from 'path';

export interface SimulatorProfile {
    id: string; // Filename without extension (e.g. "Tank1")
    name: string; // Display name (e.g. "Tank 1 Controller")
    controllerType: string; // e.g. "arduino_uno"
    mac: string;
    udpPort: number;
    description?: string;
    created: string;
    lastUsed: string;
}

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ProfileManager {
    private profilesDir: string;

    constructor() {
        this.profilesDir = path.join(__dirname, '../data/profiles');
        console.log(`[ProfileManager] Profiles Dir: ${this.profilesDir}`);
        if (!fs.existsSync(this.profilesDir)) {
            console.log(`[ProfileManager] Creating profiles dir...`);
            fs.mkdirSync(this.profilesDir, { recursive: true });
        }
    }

    listProfiles(): SimulatorProfile[] {
        if (!fs.existsSync(this.profilesDir)) return [];

        const files = fs.readdirSync(this.profilesDir).filter(f => f.endsWith('.json'));
        const profiles: SimulatorProfile[] = [];

        for (const file of files) {
            try {
                const content = fs.readFileSync(path.join(this.profilesDir, file), 'utf-8');
                const profile = JSON.parse(content);
                // Ensure ID matches filename
                profile.id = file.replace('.json', '');
                profiles.push(profile);
            } catch (e) {
                console.error(`[MX] Failed to load profile ${file}:`, e);
            }
        }

        // Sort by last used (newest first)
        return profiles.sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime());
    }

    getProfile(id: string): SimulatorProfile | null {
        try {
            const filePath = path.join(this.profilesDir, `${id}.json`);
            if (!fs.existsSync(filePath)) return null;

            const content = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(content);
        } catch (e) {
            console.error(`[MX] Error getting profile ${id}:`, e);
            return null;
        }
    }

    saveProfile(profile: SimulatorProfile): boolean {
        try {
            const filePath = path.join(this.profilesDir, `${profile.id}.json`);
            profile.lastUsed = new Date().toISOString();
            if (!profile.created) profile.created = new Date().toISOString();

            fs.writeFileSync(filePath, JSON.stringify(profile, null, 2));
            return true;
        } catch (e) {
            console.error(`[MX] Error saving profile ${profile.id}:`, e);
            return false;
        }
    }

    deleteProfile(id: string): boolean {
        try {
            const filePath = path.join(this.profilesDir, `${id}.json`);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);

                // Also try to delete associated pin assignments
                const assignmentsPath = path.join(__dirname, `../data/assignments_${id}.json`);
                if (fs.existsSync(assignmentsPath)) {
                    fs.unlinkSync(assignmentsPath);
                }

                return true;
            }
            return false;
        } catch (e) {
            console.error(`[MX] Error deleting profile ${id}:`, e);
            return false;
        }
    }
}

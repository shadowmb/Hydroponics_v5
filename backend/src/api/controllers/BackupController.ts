
import { FastifyRequest, FastifyReply } from 'fastify';
import { backupService } from '../../services/BackupService';
import path from 'path';
import fs from 'fs';

export class BackupController {

    static async download(req: FastifyRequest, reply: FastifyReply) {
        try {
            const query = req.query as any;
            const targets = query.targets ? query.targets.split(',') : ['infrastructure', 'automation', 'system']; // Default safe set

            const backup = await backupService.exportBackup({
                targets,
                comment: 'User initiated download'
            });

            const filename = `hydroponics_backup_${new Date().toISOString().split('T')[0]}.json`;

            reply
                .header('Content-Disposition', `attachment; filename="${filename}"`)
                .header('Content-Type', 'application/json')
                .send(backup);
        } catch (error: any) {
            req.log.error(error);
            return reply.status(500).send({ success: false, error: error.message || 'Failed to download backup' });
        }
    }

    static async inspect(req: FastifyRequest, reply: FastifyReply) {
        try {
            // For simplicity and to avoid 'fastify-multipart' dependency issues if not installed,
            // we expect the client to read the file and send the JSON content in the body.
            const payload = req.body as any;

            if (!payload) {
                return reply.status(400).send({ success: false, error: 'No backup content provided' });
            }

            const meta = backupService.getBackupPreview(payload);
            return reply.send({ success: true, data: meta });
        } catch (error: any) {
            req.log.error(error);
            return reply.status(500).send({ success: false, error: error.message || 'Failed to inspect backup' });
        }
    }

    static async restore(req: FastifyRequest, reply: FastifyReply) {
        try {
            const payload = req.body as any;
            if (!payload || !payload.meta || !payload.data) {
                return reply.status(400).send({ success: false, error: 'Invalid backup payload' });
            }

            const result = await backupService.restoreBackup(payload);
            return reply.send({ success: true, data: result });
        } catch (error: any) {
            req.log.error(error);
            return reply.status(500).send({ success: false, error: error.message || 'Failed to restore backup' });
        }
    }

    static async loadDemo(req: FastifyRequest, reply: FastifyReply) {
        try {
            // Rule 4: Use process.cwd() for file paths to be build-safe
            // Assume 'src/seeds' exists in root or is copied to dist
            // Safe bet for TS-Node (Development) is src/seeds. 
            // For Prod, we might need to adjust, but avoiding __dirname is step 1.

            // Try explicit path assuming we run from Project Root
            let seedPath = path.resolve(process.cwd(), 'backend/src/seeds/demo_data.json');

            // Fallback for different CWD (e.g. inside backend folder)
            if (!fs.existsSync(seedPath)) {
                seedPath = path.resolve(process.cwd(), 'src/seeds/demo_data.json');
            }

            if (!fs.existsSync(seedPath)) {
                req.log.warn({ cwd: process.cwd(), seedPath }, 'Demo data file not found');
                return reply.status(404).send({ success: false, error: 'Demo data file not found on server.' });
            }

            const fileContent = fs.readFileSync(seedPath, 'utf-8');
            const payload = JSON.parse(fileContent);

            const result = await backupService.restoreBackup(payload);
            return reply.send({ success: true, data: result, message: 'Demo data loaded successfully' });
        } catch (error: any) {
            req.log.error(error);
            return reply.status(500).send({ success: false, error: error.message || 'Failed to load demo data' });
        }
    }
}

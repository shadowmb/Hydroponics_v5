
import { FastifyRequest, FastifyReply } from 'fastify';
import { backupService } from '../../services/BackupService';

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
            reply.status(500).send({ message: error.message });
        }
    }

    static async inspect(req: FastifyRequest, reply: FastifyReply) {
        try {
            // For simplicity and to avoid 'fastify-multipart' dependency issues if not installed,
            // we expect the client to read the file and send the JSON content in the body.
            const payload = req.body as any;

            if (!payload) {
                return reply.status(400).send({ message: 'No backup content provided' });
            }

            const meta = backupService.getBackupPreview(payload);
            reply.send(meta);
        } catch (error: any) {
            reply.status(500).send({ message: error.message });
        }
    }

    static async restore(req: FastifyRequest, reply: FastifyReply) {
        try {
            const payload = req.body as any;
            if (!payload || !payload.meta || !payload.data) {
                return reply.status(400).send({ message: 'Invalid backup payload' });
            }

            const result = await backupService.restoreBackup(payload);
            reply.send(result);
        } catch (error: any) {
            reply.status(500).send({ message: error.message });
        }
    }

    static async loadDemo(req: FastifyRequest, reply: FastifyReply) {
        try {
            const path = require('path');
            const fs = require('fs');
            // Resolve path to demo data
            // In dev: src/api/controllers/../../seeds/demo_data.json -> src/seeds/demo_data.json
            const seedPath = path.join(__dirname, '../../seeds/demo_data.json');

            if (!fs.existsSync(seedPath)) {
                return reply.status(404).send({ message: 'Demo data not found on server.' });
            }

            const fileContent = fs.readFileSync(seedPath, 'utf-8');
            const payload = JSON.parse(fileContent);

            const result = await backupService.restoreBackup(payload);
            reply.send({ ...result, message: 'Demo data loaded successfully' });
        } catch (error: any) {
            reply.status(500).send({ message: error.message });
        }
    }
}

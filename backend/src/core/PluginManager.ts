import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { FastifyInstance } from 'fastify';
import { logger } from './LoggerService';

export class PluginManager {
    static async loadPlugins(app: FastifyInstance) {
        const pluginsDir = path.join(__dirname, '../plugins');

        if (!fs.existsSync(pluginsDir)) {
            logger.info('ℹ️ No plugins directory found, skipping plugin loading.');
            return;
        }

        const folders = fs.readdirSync(pluginsDir);

        logger.info(`🔌 PluginManager: Scanning ${folders.length} potential plugins...`);

        for (const folder of folders) {
            const pluginPath = path.join(pluginsDir, folder);
            const entryPoint = path.join(pluginPath, 'index.ts');

            // Check if directory and has index.ts
            if (fs.statSync(pluginPath).isDirectory() && fs.existsSync(entryPoint)) {
                try {
                    logger.info(`🔌 Loading Plugin: [${folder}]...`);

                    // Dynamic Import (CommonJS / ts-node friendly)
                    // We use require() because we are in a CJS environment. 
                    // 'entryPoint' is an absolute path (c:\Projects\...), which require handles perfectly.

                    /* eslint-disable-next-line @typescript-eslint/no-var-requires */
                    const pluginModule = require(entryPoint);

                    // Expect default export to be the fastify plugin function
                    const pluginFn = pluginModule.default;

                    if (typeof pluginFn === 'function') {
                        // Register with prefix /api/plugins/{name} or /api/{name}?
                        // Let the plugin decide its own prefix, but usually we pass overrides.
                        // For AI, current logic registers under /api/ai inside the module itself.
                        // So we just register the module.
                        await app.register(pluginFn);
                        logger.info(`✅ Plugin [${folder}] loaded successfully.`);
                    } else {
                        logger.warn(`⚠️ Plugin [${folder}] has no default export function.`);
                    }

                } catch (error) {
                    logger.error({ err: error, plugin: folder }, `❌ Failed to load plugin [${folder}]`);
                }
            }
        }
    }
}

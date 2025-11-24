import fs from 'fs/promises';
import path from 'path';
import { ControllerTemplate } from '../models/ControllerTemplate';

export const seedControllerTemplates = async () => {
    try {
        const dataPath = path.join(process.cwd(), 'src', 'data', 'controller-templates.json');
        const data = await fs.readFile(dataPath, 'utf-8');
        const templates = JSON.parse(data);

        console.log('🌱 Seeding controller templates...');

        const templateDocs = Object.entries(templates).map(([key, templateData]) => {
            const template = templateData as any;
            return {
                _id: key,
                key,
                label: template.label,
                communication_by: template.communication_by,
                communication_type: template.communication_type,
                ports: template.ports
            };
        });

        await ControllerTemplate.insertMany(templateDocs);

        console.log('✅ Controller templates seeded successfully');
    } catch (error) {
        console.error('❌ Error seeding controller templates:', error);
    }
};

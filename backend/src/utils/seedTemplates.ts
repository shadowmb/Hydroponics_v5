import fs from 'fs/promises';
import path from 'path';
import { ControllerTemplate } from '../models/ControllerTemplate';

export const seedControllerTemplates = async () => {
    try {
        const dataPath = path.join(process.cwd(), 'src', 'data', 'controller-templates.json');
        console.log('🌱 Seeding controller templates from:', dataPath);
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

        console.log(`   Found ${templateDocs.length} templates in seed file:`, templateDocs.map(t => t._id).join(', '));

        let created = 0;
        let updated = 0;
        let errors = 0;

        for (const doc of templateDocs) {
            try {
                // Check if template exists before upsert
                const existingBefore = await ControllerTemplate.findOne({ key: doc.key });

                // Exclude immutable _id field from update payload
                const { _id, ...updateData } = doc;

                // Use findOneAndUpdate with upsert (v4 pattern)
                await ControllerTemplate.findOneAndUpdate(
                    { key: doc.key },    // Search by unique key field
                    {
                        $set: updateData,  // Update without _id
                        $setOnInsert: { _id: doc._id }  // Set _id only on creation
                    },
                    {
                        upsert: true,
                        new: true,
                        runValidators: true,
                        setDefaultsOnInsert: true
                    }
                );

                if (!existingBefore) {
                    created++;
                    console.log(`   ✨ Created: ${doc._id}`);
                } else {
                    updated++;
                    console.log(`   🔄 Updated: ${doc._id}`);
                }
            } catch (error: any) {
                errors++;
                console.error(`   ❌ Error seeding ${doc._id}:`, error.message);
            }
        }

        console.log(`✅ Controller templates seeded: ${created} created, ${updated} updated, ${templateDocs.length - created - updated - errors} unchanged, ${errors} errors`);
    } catch (error) {
        console.error('❌ Error seeding controller templates:', error);
    }
};

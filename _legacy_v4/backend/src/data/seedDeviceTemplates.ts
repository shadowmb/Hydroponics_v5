/**
 * Seed data for initial device templates
 * Contains HC-SR04 ultrasonic sensor and standard relay templates
 */

import { DeviceTemplate, IDeviceTemplate } from '../models/DeviceTemplate'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Dynamically load all device template files from the deviceTemplates directory
 */
function loadDeviceTemplates(): Omit<IDeviceTemplate, '_id' | 'createdAt' | 'updatedAt'>[] {
  const templatesDir = path.join(__dirname, 'deviceTemplates')
  const templates: Omit<IDeviceTemplate, '_id' | 'createdAt' | 'updatedAt'>[] = []

  try {
    //console.log(`[DeviceTemplate] DEBUG: Reading from: ${templatesDir}`)

    // Read all files in the deviceTemplates directory
    const files = fs.readdirSync(templatesDir)
    //console.log(`[DeviceTemplate] DEBUG: Found ${files.length} files:`, files)

    // Filter for .ts files (dev mode with ts-node) or .js files (production compiled)
    // Exclude index and types files
    const templateFiles = files.filter(file => {
      const isTsFile = file.endsWith('.ts') && file !== 'index.ts' && file !== 'types.ts'
      const isJsFile = file.endsWith('.js') && file !== 'index.js' && file !== 'types.js'
      return isTsFile || isJsFile
    })
    //console.log(`[DeviceTemplate] DEBUG: Filtered to ${templateFiles.length} template files:`, templateFiles)

    // Load each template file
    for (const file of templateFiles) {
      try {
        // Use absolute path with .js extension for require
        const templatePath = path.resolve(templatesDir, file)
        //console.log(`[DeviceTemplate] DEBUG: Requiring: ${templatePath}`)

        // Clear require cache to force fresh load
        delete require.cache[templatePath]

        // Using require for dynamic import
        const templateModule = require(templatePath)
        //console.log(`[DeviceTemplate] DEBUG: Module keys for ${file}:`, Object.keys(templateModule))

        // Get the default export
        const template = templateModule.default

        if (!template) {
          console.warn(`[DeviceTemplate] Warning: ${file} does not have a default export, skipping`)
          continue
        }

        templates.push(template)
        console.log(`[DeviceTemplate] Loaded template: ${template.displayName} from ${file}`)
      } catch (error) {
        console.error(`[DeviceTemplate] Error loading template file ${file}:`, error)
      }
    }

    console.log(`[DeviceTemplate] Successfully loaded ${templates.length} device templates`)
    return templates
  } catch (error) {
    console.error('[DeviceTemplate] Error reading deviceTemplates directory:', error)
    throw new Error('Failed to load device templates')
  }
}

/**
 * Seed device templates into database using upsert approach
 * Updates existing templates and creates new ones automatically
 */
export async function seedDeviceTemplates(): Promise<void> {
  try {
    console.log('[DeviceTemplate] Starting device template seeding with upsert...')

    // Load templates at runtime, not at import time
    const deviceTemplateSeeds = loadDeviceTemplates()

    let createdCount = 0
    let updatedCount = 0

    // Upsert each device template (update if exists, create if not)
    for (const seedTemplate of deviceTemplateSeeds) {
      const result = await DeviceTemplate.findOneAndUpdate(
        { type: seedTemplate.type }, // Find by unique type
        seedTemplate,                 // Update with seed data
        {
          upsert: true,              // Create if doesn't exist
          new: true,                 // Return updated document
          runValidators: true        // Run schema validators
        }
      )

      // Track if this was a creation or update
      const existingDoc = await DeviceTemplate.findOne({ type: seedTemplate.type })
      if (result && !existingDoc) {
        createdCount++
        console.log(`  + Created: ${seedTemplate.displayName} (${seedTemplate.type})`)
      } else {
        updatedCount++
        console.log(`  ↻ Updated: ${seedTemplate.displayName} (${seedTemplate.type})`)
      }
    }

    console.log(`[DeviceTemplate] Seeding completed: ${createdCount} created, ${updatedCount} updated`)

  } catch (error) {
    console.error('[DeviceTemplate] Error seeding device templates:', error)
    throw error
  }
}

export default seedDeviceTemplates

// ABOUTME: Seed data for dashboard sections including alerts section configuration
// ABOUTME: Contains default dashboard layout and settings with alerts persistence support

import mongoose from 'mongoose'

/**
 * Seed data for dashboard sections
 * Includes the alerts section for persistent settings storage
 */
export const dashboardSectionSeeds = [
  // Sensors section
  {
    sectionId: 'sensors',
    sectionSettings: {},
    modules: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    __v: 0
  },

  // System section
  {
    sectionId: 'system',
    sectionSettings: {},
    modules: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    __v: 0
  },

  // Program section
  {
    sectionId: 'program',
    sectionSettings: {},
    modules: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    __v: 0
  },

  // NEW: Alerts section for persistent settings
  {
    sectionId: 'alerts',
    sectionSettings: {
      alerts: {
        showExecutionErrors: true,
        showSensorAlerts: true,
        showHardwareIssues: true,
        showSystemAlerts: true,
        severityFilter: 'all',
        maxDisplayCount: 10,
        timeWindow: '24h'
      }
    },
    modules: [{
      name: 'AlertContainer',
      visualizationType: 'status',
      isVisible: true,
      displayOrder: 1
    }],
    createdAt: new Date(),
    updatedAt: new Date(),
    __v: 0
  }
]

/**
 * Seed dashboard sections into database
 * Only seeds if collection is empty or specific sections don't exist
 */
export async function seedDashboardSections(): Promise<void> {
  try {
    console.log('[DashboardSections] Starting dashboard sections seeding...')

    const collection = mongoose.connection.db.collection('dashboardsections')

    // Check each section and seed if missing
    for (const sectionData of dashboardSectionSeeds) {
      const existing = await collection.findOne({ sectionId: sectionData.sectionId })

      if (!existing) {
        await collection.insertOne(sectionData)
        console.log(`[DashboardSections] Seeded section: ${sectionData.sectionId}`)
      } else {
        console.log(`[DashboardSections] Section already exists: ${sectionData.sectionId}`)
      }
    }

    console.log(`[DashboardSections] Dashboard sections seeding completed`)

  } catch (error) {
    console.error('[DashboardSections] Error seeding dashboard sections:', error)
    throw error
  }
}

export default dashboardSectionSeeds
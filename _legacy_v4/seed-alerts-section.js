// ABOUTME: MongoDB seed script to create alerts section in dashboardsections collection
// ABOUTME: Run with: node seed-alerts-section.js to initialize alerts settings persistence

const { MongoClient } = require('mongodb');

async function seedAlertsSection() {
  const client = new MongoClient('mongodb://localhost:27017');

  try {
    await client.connect();
    console.log('📡 Connected to MongoDB');

    const db = client.db('hydroponics');
    const collection = db.collection('dashboardsections');

    // Check if alerts section already exists
    const existingAlertsSection = await collection.findOne({ sectionId: 'alerts' });

    if (existingAlertsSection) {
      //console.log('⚠️ Alerts section already exists in database');
      return;
    }

    // Insert new alerts section
    const alertsSection = {
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
        id: 'alerts-main',
        name: 'AlertContainer',
        isVisible: true,
        displayOrder: 1
      }],
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0
    };

    const result = await collection.insertOne(alertsSection);
    console.log('✅ Alerts section created successfully');
    console.log('📋 Document ID:', result.insertedId.toString());

    // Verify the insert
    const verification = await collection.findOne({ sectionId: 'alerts' });
    console.log('🔍 Verification - Document exists:', !!verification);

  } catch (error) {
    console.error('❌ Error seeding alerts section:', error);
  } finally {
    await client.close();
    console.log('📡 MongoDB connection closed');
  }
}

// Run the seed function
seedAlertsSection().catch(console.error);
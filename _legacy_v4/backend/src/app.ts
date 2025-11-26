import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { connectDB } from './config/db'

dotenv.config()

// Import centralized port configuration
const { PORTS, URLS } = require('../../config/ports')

const app = express()
const PORT = process.env.PORT || PORTS.BACKEND_API

// Database connection will be established in startServer() function

// CORS configuration - accepts requests only from same hostname on frontend port
// This allows the system to work on any IP without configuration changes
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., Postman, server-to-server)
    if (!origin) {
      return callback(null, true)
    }

    try {
      const originUrl = new URL(origin)
      const frontendPort = process.env.FRONTEND_PORT || '3000'

      // Accept any hostname but ONLY from the frontend port
      // This ensures security (only frontend on same machine) while allowing any IP
      if (originUrl.port === frontendPort) {
        return callback(null, true)
      }

      // Reject if port doesn't match frontend port
      callback(new Error(`CORS: Origin ${origin} not allowed (expected port ${frontendPort})`))
    } catch (error) {
      callback(new Error(`CORS: Invalid origin ${origin}`))
    }
  },
  credentials: true
}))

// Body parsing middleware must come before routes
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// const debugRoutes = require('./routes/debugRoutes')
// app.use('/api/v1/debug', debugRoutes)

// FlowExecutor API routes
import flowExecutorRoutes from './routes/flowExecutorRoutes'
app.use('/api/v1/flow', flowExecutorRoutes)

// ActionTemplate API routes
import actionTemplateRoutes from './routes/actionTemplateRoutes'
app.use('/api/v1/action-templates', actionTemplateRoutes)

// Program API routes
import programRoutes from './routes/programRoutes'
app.use('/api/v1/programs', programRoutes)

// Active Program API routes
import activeProgramRoutes from './routes/activeProgramRoutes'
app.use('/api/v1/active-programs', activeProgramRoutes)

// DEACTIVATED: Target Registry API routes - Phase 1A (Surgical removal)
// import targetRegistryRoutes from './routes/targetRegistryRoutes'
// app.use('/api/v1/target-registry', targetRegistryRoutes)

// Flow Template API routes
import flowTemplateRoutes from './routes/flowTemplateRoutes'
app.use('/api/v1/flow-templates', flowTemplateRoutes)

// Flow Validation API routes
import flowValidationRoutes from './routes/flowValidationRoutes'
app.use('/api/v1/flows', flowValidationRoutes)

// Execution Status API routes
import executionRoutes from './routes/executionRoutes'
app.use('/api/v1/execution', executionRoutes)

// Debug API routes
import debugRoutes from './routes/debugRoutes'
app.use('/api/v1/debug', debugRoutes)

// Device Management API routes
import deviceRoutes from './routes/deviceRoutes'
app.use('/api/v1/devices', deviceRoutes)

// Controller API routes
import controllerRoutes from './routes/controllerRoutes'
app.use('/api/v1/controllers', controllerRoutes)

// Device Types API routes (static)
import deviceTypesRoutes from './routes/deviceTypes'
app.use('/api/v1/settings', deviceTypesRoutes)

// Device Templates API routes
import deviceTemplatesRoutes from './routes/deviceTemplates'
app.use('/api/v1/device-templates', deviceTemplatesRoutes)

// Arduino Generator API routes
import generatorRoutes from './routes/generatorRoutes'
app.use('/api/v1/generator', generatorRoutes)

// Relay Management API routes
import relayRoutes from './routes/relayRoutes'
app.use('/api/v1/relays', relayRoutes)

// Monitoring API routes
import monitoringRoutes from './routes/monitoringRoutes'
app.use('/api/v1/monitoring', monitoringRoutes)

// Monitoring Flow API routes
import monitoringFlowRoutes from './routes/monitoringFlowRoutes'
app.use('/api/v1/monitoring-flows', monitoringFlowRoutes)

// Logging API routes
import loggingRoutes from './routes/loggingRoutes'
app.use('/api/v1/logs', loggingRoutes)

// ExecutionSession API routes
import executionSessionRoutes from './routes/executionSessionRoutes'
app.use('/api/v1/execution-sessions', executionSessionRoutes)

// Notification API routes
import notificationRoutes from './routes/notificationRoutes'
app.use('/api/v1/notifications', notificationRoutes)

// Dashboard API routes
import dashboardRoutes from './routes/dashboardRoutes'
app.use('/api/v1/dashboard', dashboardRoutes)

// Tutorial API routes
import tutorialRoutes from './routes/tutorialRoutes'
app.use('/api/v1/tutorials', tutorialRoutes)

// Database management API routes
import databaseRoutes from './routes/databaseRoutes'
app.use('/api/v1/database', databaseRoutes)

// Scheduler Service
import { schedulerService } from './services/SchedulerService'

// Notification Scheduler Service
import { notificationSchedulerService } from './services/NotificationSchedulerService'

// Startup Service
import { StartupService } from './services/StartupService'

// Seed data functions
import { seedCommands } from './data/seedCommands'

// WebSocket setup
import { setupWebSocketServer } from './routes/websocketRoutes'

app.get('/health', (_, res) => {
  // Check MongoDB connection status
  const dbReadyState = mongoose.connection.readyState
  const dbStatusMap: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  }

  const dbStatus = dbStatusMap[dbReadyState] || 'unknown'
  const isHealthy = dbReadyState === 1

  // Determine overall system status
  let systemStatus: 'ready' | 'initializing' | 'degraded' = 'ready'
  if (dbReadyState === 2) {
    systemStatus = 'initializing'
  } else if (dbReadyState !== 1) {
    systemStatus = 'degraded'
  }

  // Import lastConnectionError from db.ts
  const { lastConnectionError } = require('./config/db')

  // Build database component response
  const dbComponent: any = {
    status: dbStatus,
    readyState: dbReadyState,
    healthy: isHealthy
  }

  // Add error details if connection failed
  if (!isHealthy && lastConnectionError) {
    dbComponent.error = {
      message: lastConnectionError.message,
      code: lastConnectionError.code,
      uri: lastConnectionError.uri
    }
  }

  res.status(isHealthy ? 200 : 503).json({
    status: systemStatus,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    components: {
      database: dbComponent
    }
  })
})

// Scheduler status endpoint for debugging
app.get('/api/v1/scheduler/status', (_, res) => {
  res.status(200).json({
    success: true,
    data: schedulerService.getStatus(),
    timestamp: new Date().toISOString()
  })
})

// Manual scheduler trigger for testing
app.post('/api/v1/scheduler/trigger', async (_, res) => {
  try {
    await schedulerService.triggerManualCheck()
    res.status(200).json({
      success: true,
      message: 'Scheduler manually triggered',
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

// Notification scheduler status endpoint
app.get('/api/v1/notifications/scheduler/status', (_, res) => {
  res.status(200).json({
    success: true,
    data: notificationSchedulerService.getStatus(),
    timestamp: new Date().toISOString()
  })
})

// Manual notification scheduler reload
app.post('/api/v1/notifications/scheduler/reload', async (_, res) => {
  try {
    await notificationSchedulerService.reloadNotifications()
    res.status(200).json({
      success: true,
      message: 'Notification scheduler reloaded',
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

// Manual notification trigger for testing
app.post('/api/v1/notifications/scheduler/trigger/:messageId', async (req, res) => {
  try {
    await notificationSchedulerService.triggerNotification(req.params.messageId)
    res.status(200).json({
      success: true,
      message: 'Notification manually triggered',
      messageId: req.params.messageId,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

app.get('/', (_, res) => {
  res.status(200).json({
    message: '🌱 Hydroponics Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api/v1',
      flow: '/api/v1/flow',
      flowValidation: '/api/v1/flows',
      actionTemplates: '/api/v1/action-templates',
      flowTemplates: '/api/v1/flow-templates',
      programs: '/api/v1/programs',
      activePrograms: '/api/v1/active-programs',
      // targetRegistry: '/api/v1/target-registry', // DEACTIVATED: Phase 1A
      devices: '/api/v1/devices',
      controllers: '/api/v1/controllers',
      deviceTypes: '/api/v1/settings/device-types',
      monitoring: '/api/v1/monitoring',
      notifications: '/api/v1/notifications',
      tutorials: '/api/v1/tutorials',
      debug: '/api/v1/debug',
      logs: '/api/v1/logs'
    }
  })
})

// Declare server variable
let server: any

// Async startup function
async function startServer() {
  // Step 1: Connect to database (with retries, will exit on failure)
  await connectDB()

  // Step 2: Start HTTP server
  server = app.listen(PORT, async () => {
    console.log(`🌱 Server started on port ${PORT}`)
    console.log(`🔗 Health check: http://localhost:${PORT}/health`)
    console.log(`📚 API Base: http://localhost:${PORT}/api/v1`)
    console.log(`🔌 WebSocket: ws://localhost:${PORT}/ws/flow`)

    // Seed commands
    console.log('📋 Seeding commands...')
    try {
      await seedCommands()
      console.log('✅ Commands seeded')
    } catch (error) {
      console.error('❌ Error seeding commands:', error)
    }

    // Seed device templates
    console.log('📋 Seeding device templates...')
    try {
      const { seedDeviceTemplates } = await import('./data/seedDeviceTemplates')
      await seedDeviceTemplates()
      console.log('✅ Device templates seeded')
    } catch (error) {
      console.error('❌ Error seeding device templates:', error)
    }

    // Seed dashboard sections
    console.log('📋 Seeding dashboard sections...')
    try {
      const { seedDashboardSections } = await import('./data/seedDashboardSections')
      await seedDashboardSections()
      console.log('✅ Dashboard sections seeded')
    } catch (error) {
      console.error('❌ Error seeding dashboard sections:', error)
    }

    // Seed tutorials
    console.log('🎓 Seeding tutorials...')
    try {
      const { seedTutorials } = await import('./data/seedTutorials')
      await seedTutorials()
      console.log('✅ Tutorials seeded')
    } catch (error) {
      console.error('❌ Error seeding tutorials:', error)
    }

    // Initialize hardware controllers
    console.log('🔌 Initializing hardware controllers...')
    try {
      const startupService = StartupService.getInstance()
      await startupService.initializeControllers()
      console.log('✅ Hardware controllers initialized')
    } catch (error) {
      console.error('❌ Failed to initialize hardware controllers:', error)
    }

    // Start scheduler service
    schedulerService.start()

    // Start notification scheduler service
    console.log('📬 Starting notification scheduler...')
    try {
      await notificationSchedulerService.start()
      console.log('✅ Notification scheduler started')
    } catch (error) {
      console.error('❌ Failed to start notification scheduler:', error)
    }
  })

  // Setup WebSocket server
  setupWebSocketServer(server)
}

// Start the server
startServer().catch((error) => {
  console.error('🛑 FATAL: Failed to start server:', error)
  process.exit(1)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...')
  
  // Stop scheduler service
  schedulerService.stop()
  
  // Stop notification scheduler service
  await notificationSchedulerService.stop()
  
  // Shutdown hardware connections
  try {
    const startupService = StartupService.getInstance()
    await startupService.shutdown()
    console.log('✅ Hardware controllers disconnected')
  } catch (error) {
    console.error('❌ Error during hardware shutdown:', error)
  }
  
  server.close(() => {
    console.log('✅ Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully...')
  
  // Stop scheduler service
  schedulerService.stop()
  
  // Shutdown hardware connections
  try {
    const startupService = StartupService.getInstance()
    await startupService.shutdown()
    console.log('✅ Hardware controllers disconnected')
  } catch (error) {
    console.error('❌ Error during hardware shutdown:', error)
  }
  
  server.close(() => {
    console.log('✅ Server closed')
    process.exit(0)
  })
})

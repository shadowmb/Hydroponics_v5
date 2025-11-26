import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { UnifiedLoggingService } from '../services/UnifiedLoggingService'
import { LogTags } from '../utils/LogTags'

dotenv.config()

const MAX_RETRIES = 2
const RETRY_DELAY_MS = 10000

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Create module logger for database operations
const logger = UnifiedLoggingService.createModuleLogger('db.ts')

// Store last connection error for health endpoint
export let lastConnectionError: { message: string; code?: string; uri?: string } | null = null

/**
 * Attempt to reconnect to MongoDB
 * Returns true if successful, false otherwise
 */
export const reconnectDB = async (): Promise<{ success: boolean; message: string; error?: string }> => {
  const mongoUri = process.env.MONGO_URI

  if (!mongoUri) {
    const errorMsg = 'MONGO_URI environment variable is not defined'
    return { success: false, message: errorMsg, error: 'missing_env_variable' }
  }

  // Check if already connected
  if (mongoose.connection.readyState === 1) {
    return { success: true, message: 'Already connected to MongoDB' }
  }

  try {
    console.log('🔄 Attempting manual reconnection to MongoDB...')
    logger.info(LogTags.database.connect.started, {
      attempt: 'manual',
      uri: mongoUri.replace(/:[^:@]+@/, ':****@')
    })

    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    })

    console.log('✅ MongoDB reconnected successfully')
    logger.info(LogTags.database.connect.success, {
      message: 'MongoDB reconnected successfully',
      readyState: mongoose.connection.readyState
    })

    // Clear error on successful connection
    lastConnectionError = null

    return { success: true, message: 'Successfully reconnected to MongoDB' }

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error('❌ MongoDB reconnection failed:', err)

    // Store error details
    lastConnectionError = {
      message: errorMessage,
      code: (err as any)?.code,
      uri: mongoUri.replace(/:[^:@]+@/, ':****@')
    }

    logger.error(LogTags.database.connect.failed, {
      message: 'MongoDB manual reconnection failed',
      error: errorMessage
    })

    return { success: false, message: 'Failed to reconnect to MongoDB', error: errorMessage }
  }
}

export const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGO_URI

  if (!mongoUri) {
    const errorMsg = 'MONGO_URI environment variable is not defined'
    console.error('❌', errorMsg)
    console.error('🛑 Cannot start server without database connection')

    logger.error(LogTags.database.health.critical, {
      message: errorMsg,
      reason: 'missing_env_variable'
    })

    process.exit(1)
  }

  let lastError: any = null

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`🔄 Attempting to connect to MongoDB (${attempt}/${MAX_RETRIES})...`)

      logger.info(LogTags.database.connect.started, {
        attempt,
        maxRetries: MAX_RETRIES,
        uri: mongoUri.replace(/:[^:@]+@/, ':****@') // Hide password in logs
      })

      await mongoose.connect(mongoUri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 45000,
      })

      console.log('✅ MongoDB connected successfully')

      logger.info(LogTags.database.connect.success, {
        message: 'MongoDB connected successfully',
        attempt,
        readyState: mongoose.connection.readyState
      })

      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err)
        logger.error(LogTags.database.health.disconnected, {
          message: 'MongoDB runtime error',
          error: err.message
        })
      })

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB disconnected')
        logger.warn(LogTags.database.health.disconnected, {
          message: 'MongoDB disconnected from server'
        })
      })

      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected')
        logger.info(LogTags.database.health.connected, {
          message: 'MongoDB auto-reconnected successfully'
        })
      })

      process.on('SIGINT', async () => {
        await mongoose.connection.close()
        console.log('🔒 MongoDB connection closed due to app termination')
        logger.info(LogTags.system.shutdown.completed, {
          message: 'MongoDB connection closed gracefully'
        })
        process.exit(0)
      })

      // Clear error on successful connection
      lastConnectionError = null
      return

    } catch (err) {
      lastError = err
      console.error(`❌ MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed:`, err)

      // Store error details for health endpoint
      lastConnectionError = {
        message: err instanceof Error ? err.message : String(err),
        code: (err as any)?.code,
        uri: mongoUri.replace(/:[^:@]+@/, ':****@') // Hide password
      }

      logger.error(LogTags.database.connect.failed, {
        message: `MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed`,
        attempt,
        maxRetries: MAX_RETRIES,
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined
      })

      if (attempt < MAX_RETRIES) {
        console.log(`⏳ Retrying in ${RETRY_DELAY_MS / 1000} seconds...`)

        logger.info(LogTags.database.connect.retry, {
          message: `Retrying MongoDB connection in ${RETRY_DELAY_MS / 1000} seconds`,
          nextAttempt: attempt + 1,
          maxRetries: MAX_RETRIES
        })

        await sleep(RETRY_DELAY_MS)
      }
    }
  }

  console.error('🛑 CRITICAL: Failed to connect to MongoDB after', MAX_RETRIES, 'attempts')
  console.error('🛑 Last error:', lastError)
  console.warn('⚠️ Server will continue running in degraded state without database')

  logger.error(LogTags.database.health.critical, {
    message: 'CRITICAL: Failed to connect to MongoDB after all retry attempts',
    maxRetries: MAX_RETRIES,
    error: lastError instanceof Error ? lastError.message : String(lastError),
    stack: lastError instanceof Error ? lastError.stack : undefined,
    action: 'continue_without_db'
  })
}

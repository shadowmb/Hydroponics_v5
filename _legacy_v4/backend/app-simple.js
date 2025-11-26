const express = require('express')
const cors = require('cors')
require('dotenv').config()

// Import centralized port configuration
const { PORTS, URLS } = require('./config/ports')

const app = express()
const PORT = process.env.PORT || PORTS.BACKEND_API

app.use(cors({
  origin: process.env.CORS_ORIGIN || URLS.FRONTEND_BASE,
  credentials: true
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

app.get('/health', (_, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  })
})

app.get('/', (_, res) => {
  res.status(200).json({
    message: '🌱 Hydroponics Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api/v1'
    }
  })
})

const server = app.listen(PORT, () => {
  console.log(`🌱 Server started on port ${PORT}`)
  console.log(`🔗 Health check: http://localhost:${PORT}/health`)
  console.log(`📚 API Base: http://localhost:${PORT}/api/v1`)
})

process.on('SIGINT', () => {
  console.log('🔒 Server shutting down...')
  server.close()
  process.exit(0)
})
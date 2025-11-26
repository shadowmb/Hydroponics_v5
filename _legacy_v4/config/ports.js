/**
 * Централизирана конфигурация за портове - Hydroponics v4
 * 
 * ВАЖНО: Това е единственото място където се дефинират портовете!
 * Всички останали файлове трябва да импортират от тук.
 */

// Default портове
const DEFAULT_PORTS = {
  // Frontend development server
  FRONTEND_DEV: 3000,  // Changed from 3000 due to WSL2 port conflict
  
  // Backend API server
  BACKEND_API: 5000,
  
  // Database
  MONGODB: 27017
}

// Production портове (ако се различават)
const PRODUCTION_PORTS = {
  FRONTEND_DEV: DEFAULT_PORTS.FRONTEND_DEV,
  BACKEND_API: DEFAULT_PORTS.BACKEND_API,
  MONGODB: DEFAULT_PORTS.MONGODB
}

// Генериране на URL-и
const generateUrls = (ports) => ({
  // Frontend URLs
  FRONTEND_BASE: `http://localhost:${ports.FRONTEND_DEV}`,
  
  // Backend URLs  
  BACKEND_BASE: `http://localhost:${ports.BACKEND_API}`,
  BACKEND_API_BASE: `http://localhost:${ports.BACKEND_API}/api/v1`,
  BACKEND_HEALTH: `http://localhost:${ports.BACKEND_API}/health`,
  BACKEND_DEBUG: `http://localhost:${ports.BACKEND_API}/api/v1/debug`,
  
  // WebSocket URLs
  WEBSOCKET_BASE: `ws://localhost:${ports.BACKEND_API}/ws/flow`,
  
  // Database URLs
  MONGODB_URL: `mongodb://localhost:${ports.MONGODB}/hydroponics-v4`
})

// Export конфигурация според средата
const isProduction = process.env.NODE_ENV === 'production'
const PORTS = isProduction ? PRODUCTION_PORTS : DEFAULT_PORTS
const URLS = generateUrls(PORTS)

module.exports = {
  PORTS,
  URLS,
  
  // За backward compatibility
  FRONTEND_DEV_PORT: PORTS.FRONTEND_DEV,
  BACKEND_API_PORT: PORTS.BACKEND_API,
  MONGODB_PORT: PORTS.MONGODB,
  
  // URL shortcuts
  API_BASE_URL: URLS.BACKEND_API_BASE,
  WEBSOCKET_URL: URLS.WEBSOCKET_BASE,
  FRONTEND_URL: URLS.FRONTEND_BASE
}
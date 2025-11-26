/**
 * Централизирана конфигурация за портове - Frontend
 * 
 * ВАЖНО: Това е единственото място където се дефинират портовете във frontend!
 */

// Default портове
export const DEFAULT_PORTS = {
  // Frontend development server
  FRONTEND_DEV: 3000,  // Changed from 3000 due to WSL2 port conflict
  
  // Backend API server
  BACKEND_API: 5000,
  
  // Database
  MONGODB: 27017
} as const

// Production портове (ако се различават)
export const PRODUCTION_PORTS = {
  FRONTEND_DEV: DEFAULT_PORTS.FRONTEND_DEV,
  BACKEND_API: DEFAULT_PORTS.BACKEND_API,
  MONGODB: DEFAULT_PORTS.MONGODB
} as const

// Генериране на URL-и
const generateUrls = (ports: typeof DEFAULT_PORTS, isProduction: boolean) => {
  // В production използваме относителни URL-ове (nginx proxy-ва към backend)
  // В development използваме динамични URL-ове базирани на текущия hostname

  if (isProduction) {
    // Production: use explicit backend port (no nginx proxy assumed)
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
    const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'https:' : 'http:'
    const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:'

    return {
      FRONTEND_BASE: '',
      BACKEND_BASE: `${protocol}//${hostname}:${ports.BACKEND_API}`,
      BACKEND_API_BASE: `${protocol}//${hostname}:${ports.BACKEND_API}/api/v1`,
      BACKEND_HEALTH: `${protocol}//${hostname}:${ports.BACKEND_API}/health`,
      BACKEND_DEBUG: `${protocol}//${hostname}:${ports.BACKEND_API}/api/v1/debug`,
      WEBSOCKET_BASE: typeof window !== 'undefined'
        ? `${wsProtocol}//${hostname}:${ports.BACKEND_API}/ws/flow`
        : `ws://localhost:${ports.BACKEND_API}/ws/flow`,
      MONGODB_URL: `mongodb://localhost:${ports.MONGODB}/hydroponics`
    } as const
  }

  // Development: динамични URL-ове използващи текущия hostname
  // Това позволява достъп както през localhost, така и през IP адрес
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
  const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'https:' : 'http:'
  const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:'

  return {
    FRONTEND_BASE: `${protocol}//${hostname}:${ports.FRONTEND_DEV}`,
    BACKEND_BASE: `${protocol}//${hostname}:${ports.BACKEND_API}`,
    BACKEND_API_BASE: `${protocol}//${hostname}:${ports.BACKEND_API}/api/v1`,
    BACKEND_HEALTH: `${protocol}//${hostname}:${ports.BACKEND_API}/health`,
    BACKEND_DEBUG: `${protocol}//${hostname}:${ports.BACKEND_API}/api/v1/debug`,
    WEBSOCKET_BASE: `${wsProtocol}//${hostname}:${ports.BACKEND_API}/ws/flow`,
    MONGODB_URL: `mongodb://localhost:${ports.MONGODB}/hydroponics-v4`
  } as const
}

// Export конфигурация според средата
const isProduction = process.env.NODE_ENV === 'production'
export const PORTS = isProduction ? PRODUCTION_PORTS : DEFAULT_PORTS
export const URLS = generateUrls(PORTS, isProduction)

// За backward compatibility
export const FRONTEND_DEV_PORT = PORTS.FRONTEND_DEV
export const BACKEND_API_PORT = PORTS.BACKEND_API
export const MONGODB_PORT = PORTS.MONGODB

// URL shortcuts - тези се използват най-често
export const API_BASE_URL = URLS.BACKEND_API_BASE
export const WEBSOCKET_URL = URLS.WEBSOCKET_BASE
export const FRONTEND_URL = URLS.FRONTEND_BASE

// Types
export type PortConfig = typeof PORTS
export type UrlConfig = typeof URLS
// Hardware Controller Service main export

// Core components
export { HardwareService } from './core/HardwareService'
export { DeviceMapper } from './core/DeviceMapper'

// Protocol adapters
export { SerialAdapter } from './core/adapters/SerialAdapter'
export { HttpAdapter } from './core/adapters/HttpAdapter'

// Helper modules
export { ErrorMapper } from './helpers/ErrorMapper'

// Types
export * from './types'
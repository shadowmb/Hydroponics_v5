// Service Registration for DI Container
// Central registration point for all modules

import { container, SERVICE_TOKENS, ServiceLifetime } from './DIContainer'
// TODO: IMPLEMENT_LATER - Remove after full modular migration
// import { FlowControlLogicImpl } from '../modules/flow-control'
// import { LoggingServiceImpl, createProductionLoggingConfig } from '../modules/logging'
import { LogLevel, LogOutputType, LogFormat } from '../interfaces_old/ILoggingService'

/**
 * Registers all core modules with the DI container
 * Call this at application startup
 */
export async function registerCoreServices(): Promise<void> {
  // TODO: IMPLEMENT_LATER - Modular migration in progress
  // Legacy DI registration disabled - use src-modular/ implementation
  console.warn('[Legacy] ServiceRegistration disabled during modular migration')
  
  // Flow Control Logic (pure functions, zero dependencies)
  // const flowControlResult = container.register(
  //   SERVICE_TOKENS.FLOW_CONTROL_LOGIC,
  //   () => new FlowControlLogicImpl(),
  //   { lifetime: ServiceLifetime.SINGLETON }
  // )

  // Logging Service (singleton for consistent configuration)
  // const loggingResult = container.register(
  //   SERVICE_TOKENS.LOGGING_SERVICE,
  //   () => {
  //     const config = process.env.NODE_ENV === 'production' 
  //       ? createProductionLoggingConfig()
  //       : { 
  //           level: LogLevel.DEBUG,
  //           outputs: [{
  //             type: LogOutputType.CONSOLE,
  //             level: LogLevel.DEBUG, 
  //             format: LogFormat.STRUCTURED
  //           }],
  //           enablePerformanceLogging: true,
  //           enableStackTrace: true
  //         }
  //     return new LoggingServiceImpl(config)
  //   },
  //   { lifetime: ServiceLifetime.SINGLETON }
  // )

  // TODO: IMPLEMENT_LATER - Configuration Manager registration
  // container.register(
  //   SERVICE_TOKENS.CONFIGURATION_MANAGER,
  //   () => new ConfigurationManagerImpl(),
  //   { 
  //     dependencies: [SERVICE_TOKENS.LOGGING_SERVICE],
  //     lifetime: ServiceLifetime.SINGLETON 
  //   }
  // )

  // TODO: IMPLEMENT_LATER - WebSocket Broadcaster registration  
  // container.register(
  //   SERVICE_TOKENS.WEBSOCKET_BROADCASTER,
  //   () => new WebSocketBroadcasterImpl(),
  //   {
  //     dependencies: [SERVICE_TOKENS.LOGGING_SERVICE],
  //     lifetime: ServiceLifetime.SINGLETON
  //   }
  // )

  // Validate all registrations succeeded
  // if (!flowControlResult.success) {
  //   throw new Error(`Failed to register FlowControlLogic: ${flowControlResult.error?.message}`)
  // }

  // if (!loggingResult.success) {
  //   throw new Error(`Failed to register LoggingService: ${loggingResult.error?.message}`)
  // }

  // Validate container configuration
  // const validationResult = container.validateConfiguration()
  // if (!validationResult.success) {
  //   const errors = validationResult.error?.map(e => e.message).join(', ')
  //   throw new Error(`Container validation failed: ${errors}`)
  // }
}

/**
 * Resolves a service from the container with error handling
 */
export async function getService<T>(token: symbol): Promise<T> {
  const result = await container.resolve<T>(token)
  
  if (!result.success) {
    throw new Error(`Failed to resolve service: ${result.error?.message}`)
  }
  
  return result.data!
}

/**
 * Example usage helper for Flow Control Logic
 */
export async function getFlowControlLogic() {
  return getService(SERVICE_TOKENS.FLOW_CONTROL_LOGIC)
}

/**
 * Example usage helper for Logging Service
 */
export async function getLoggingService() {
  return getService(SERVICE_TOKENS.LOGGING_SERVICE)
}
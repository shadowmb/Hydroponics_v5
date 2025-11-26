# Core Module - Dependency Injection Container

This module provides the foundational dependency injection container for the modular system architecture.

## Overview

The DI Container supports:
- **Service Registration** with lifecycle management (singleton, transient, scoped)
- **Dependency Resolution** with automatic dependency injection
- **Circular Dependency Detection** at registration and resolution time
- **Result<T,E> Pattern** for error handling throughout the system
- **Container Scopes** for scoped service lifetime management

## Quick Start

### 1. Register Services

```typescript
import { container, SERVICE_TOKENS } from './DIContainer'
import { FlowControlLogicImpl } from '../modules/flow-control'
import { LoggingServiceImpl } from '../modules/logging'

// Register services
const flowControlResult = container.register(
  SERVICE_TOKENS.FLOW_CONTROL_LOGIC,
  () => new FlowControlLogicImpl()
)

const loggingResult = container.register(
  SERVICE_TOKENS.LOGGING_SERVICE,
  () => new LoggingServiceImpl(),
  { lifetime: ServiceLifetime.SINGLETON }
)

if (!flowControlResult.success || !loggingResult.success) {
  throw new Error('Service registration failed')
}
```

### 2. Resolve Services

```typescript
// Resolve services
const flowControlResult = await container.resolve(SERVICE_TOKENS.FLOW_CONTROL_LOGIC)
const loggingResult = await container.resolve(SERVICE_TOKENS.LOGGING_SERVICE)

if (flowControlResult.success && loggingResult.success) {
  const flowControl = flowControlResult.data
  const logging = loggingResult.data
  
  // Use services...
  const condition = { leftOperand: 5, operator: '>', rightOperand: 3 }
  const isTrue = flowControl.evaluateCondition(condition, {})
  
  logging.logInfo('Condition evaluated', { result: isTrue })
}
```

### 3. Service Registration with Dependencies

```typescript
// Register service with dependencies
container.register(
  SERVICE_TOKENS.CONFIGURATION_MANAGER,
  () => new ConfigurationManagerImpl(
    // Dependencies will be automatically injected
  ),
  { 
    dependencies: [SERVICE_TOKENS.LOGGING_SERVICE],
    lifetime: ServiceLifetime.SINGLETON 
  }
)
```

## Service Tokens

Predefined service tokens are available:

```typescript
export const SERVICE_TOKENS = {
  FLOW_CONTROL_LOGIC: Symbol('IFlowControlLogic'),
  LOGGING_SERVICE: Symbol('ILoggingService'),
  CONFIGURATION_MANAGER: Symbol('IConfigurationManager'),
  WEBSOCKET_BROADCASTER: Symbol('IWebSocketBroadcaster')
} as const
```

## Result<T,E> Pattern

All operations return `Result<T,E>` for consistent error handling:

```typescript
const result = await container.resolve(SERVICE_TOKENS.FLOW_CONTROL_LOGIC)

if (result.success) {
  console.log('Service resolved:', result.data)
} else {
  console.error('Resolution failed:', result.error.message)
  console.error('Error code:', result.error.code)
}
```

## Service Lifetimes

- **Singleton** (default): One instance per container
- **Transient**: New instance on every resolution
- **Scoped**: One instance per scope

```typescript
container.register(token, factory, { lifetime: ServiceLifetime.TRANSIENT })
```

## Container Scopes

For scoped service management:

```typescript
const scope = container.createScope()

// Use container with scope...

container.disposeScope(scope) // Cleans up scoped services
```

## Circular Dependency Detection

The container automatically detects circular dependencies:

```typescript
// This will fail with CIRCULAR_DEPENDENCY error
container.register(tokenA, factory, { dependencies: [tokenB] })
container.register(tokenB, factory, { dependencies: [tokenA] })
```

## Validation

Validate entire container configuration:

```typescript
const validationResult = container.validateConfiguration()

if (!validationResult.success) {
  for (const error of validationResult.error) {
    console.error('Validation error:', error.message)
  }
}
```

## Error Types

The container uses typed errors:

- `SERVICE_NOT_REGISTERED`: Service not found during resolution
- `CIRCULAR_DEPENDENCY`: Circular dependency detected
- `REGISTRATION_FAILED`: Service registration failed
- `RESOLUTION_FAILED`: Service resolution failed

## Testing

The container provides testing utilities:

```typescript
import { DIContainer } from './DIContainer'

describe('MyService', () => {
  let container: DIContainer

  beforeEach(() => {
    container = new DIContainer()
    // Register test services...
  })

  afterEach(() => {
    container.clear() // Clean up for next test
  })
})
```

## Best Practices

1. **Register all services at startup** before resolving any
2. **Use interface-based registration** for better testing
3. **Prefer singleton lifetime** for stateless services
4. **Validate configuration** after all registrations
5. **Handle Result<T,E>** properly throughout the application
6. **Use service tokens** instead of string keys

## Module Integration

This DI Container is the foundation for all other modules in the system. Each module registers its services and resolves dependencies through this container, ensuring clean separation of concerns and testability.
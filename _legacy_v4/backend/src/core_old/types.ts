// Core types for the modular system
// Result<T,E> pattern and error taxonomy

export class Result<T, E = Error> {
  constructor(
    public success: boolean,
    public data?: T,
    public error?: E
  ) {}

  static ok<T>(data: T): Result<T, never> {
    return new Result(true, data)
  }

  static err<E>(error: E): Result<never, E> {
    return new Result<never, E>(false, undefined as never, error)
  }

  static fromPromise<T>(promise: Promise<T>): Promise<Result<T, Error>> {
    return promise
      .then(data => Result.ok(data))
      .catch(error => Result.err(error))
  }

  isOk(): this is Result<T, never> {
    return this.success
  }

  isErr(): this is Result<never, E> {
    return !this.success
  }

  unwrap(): T {
    if (this.success && this.data !== undefined) {
      return this.data
    }
    throw new Error('Called unwrap on error result')
  }

  unwrapOr(defaultValue: T): T {
    return this.success && this.data !== undefined ? this.data : defaultValue
  }

  map<U>(fn: (data: T) => U): Result<U, E> {
    return this.success && this.data !== undefined
      ? Result.ok(fn(this.data))
      : Result.err(this.error as E)
  }

  mapErr<F>(fn: (error: E) => F): Result<T, F> {
    return this.success
      ? Result.ok(this.data as T)
      : Result.err(fn(this.error as E))
  }

  flatMap<U>(fn: (data: T) => Result<U, E>): Result<U, E> {
    return this.success && this.data !== undefined
      ? fn(this.data)
      : Result.err(this.error as E)
  }
}

// Error taxonomy for modular system
export abstract class ModuleError extends Error {
  abstract readonly code: string
  abstract readonly module: string
  
  constructor(
    message: string,
    public readonly context?: Record<string, any>,
    public readonly cause?: Error
  ) {
    super(message)
    this.name = this.constructor.name
    
    if (cause) {
      this.stack = `${this.stack}\nCaused by: ${cause.stack}`
    }
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      module: this.module,
      message: this.message,
      context: this.context,
      cause: this.cause?.message
    }
  }
}

// Specific error types for each module
export class FlowControlError extends ModuleError {
  readonly module = 'FlowControl'
  
  static readonly CODES = {
    INVALID_CONDITION: 'FLOW_CONTROL_INVALID_CONDITION',
    INVALID_LOOP_CONFIG: 'FLOW_CONTROL_INVALID_LOOP_CONFIG',
    TYPE_CONVERSION_FAILED: 'FLOW_CONTROL_TYPE_CONVERSION_FAILED',
    CONNECTION_NOT_FOUND: 'FLOW_CONTROL_CONNECTION_NOT_FOUND'
  } as const

  constructor(
    public readonly code: keyof typeof FlowControlError.CODES,
    message: string,
    context?: Record<string, any>,
    cause?: Error
  ) {
    super(message, context, cause)
  }
}

export class LoggingError extends ModuleError {
  readonly module = 'Logging'
  
  static readonly CODES = {
    OUTPUT_CONFIGURATION_FAILED: 'LOGGING_OUTPUT_CONFIGURATION_FAILED',
    FLUSH_FAILED: 'LOGGING_FLUSH_FAILED',
    INVALID_LOG_LEVEL: 'LOGGING_INVALID_LOG_LEVEL'
  } as const

  constructor(
    public readonly code: keyof typeof LoggingError.CODES,
    message: string,
    context?: Record<string, any>,
    cause?: Error
  ) {
    super(message, context, cause)
  }
}

export class ConfigurationError extends ModuleError {
  readonly module = 'Configuration'
  
  static readonly CODES = {
    LOAD_FAILED: 'CONFIG_LOAD_FAILED',
    VALIDATION_FAILED: 'CONFIG_VALIDATION_FAILED',
    UPDATE_FAILED: 'CONFIG_UPDATE_FAILED',
    PATH_NOT_FOUND: 'CONFIG_PATH_NOT_FOUND',
    FILE_NOT_FOUND: 'CONFIG_FILE_NOT_FOUND'
  } as const

  constructor(
    public readonly code: keyof typeof ConfigurationError.CODES,
    message: string,
    context?: Record<string, any>,
    cause?: Error
  ) {
    super(message, context, cause)
  }
}

export class WebSocketError extends ModuleError {
  readonly module = 'WebSocket'
  
  static readonly CODES = {
    BROADCAST_FAILED: 'WEBSOCKET_BROADCAST_FAILED',
    QUEUE_FAILED: 'WEBSOCKET_QUEUE_FAILED',
    CONNECTION_FAILED: 'WEBSOCKET_CONNECTION_FAILED',
    SUBSCRIPTION_FAILED: 'WEBSOCKET_SUBSCRIPTION_FAILED'
  } as const

  constructor(
    public readonly code: keyof typeof WebSocketError.CODES,
    message: string,
    context?: Record<string, any>,
    cause?: Error
  ) {
    super(message, context, cause)
  }
}

export class DIContainerError extends ModuleError {
  readonly module = 'DIContainer'
  
  static readonly CODES = {
    SERVICE_NOT_REGISTERED: 'DI_SERVICE_NOT_REGISTERED',
    CIRCULAR_DEPENDENCY: 'DI_CIRCULAR_DEPENDENCY',
    REGISTRATION_FAILED: 'DI_REGISTRATION_FAILED',
    RESOLUTION_FAILED: 'DI_RESOLUTION_FAILED',
    INVALID_TOKEN: 'DI_INVALID_TOKEN'
  } as const

  constructor(
    public readonly code: keyof typeof DIContainerError.CODES,
    message: string,
    context?: Record<string, any>,
    cause?: Error
  ) {
    super(message, context, cause)
  }
}
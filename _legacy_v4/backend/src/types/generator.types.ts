// ABOUTME: TypeScript interfaces for Arduino code generation system
// ABOUTME: Type definitions for template sections, generation requests, responses, and command metadata

/**
 * Template sections that compose generated Arduino code
 * Each section represents a distinct part of the Arduino sketch
 */
export interface ITemplateSections {
  INCLUDES: string
  GLOBALS: string
  DISPATCHER: string
  FUNCTIONS: string
}

/**
 * Command metadata extracted from Command model
 * Contains essential information about available Arduino commands
 */
export interface ICommandMetadata {
  name: string
  displayName: string
  filePath: string
  compatibleControllers: string[]
  description: string
  isActive: boolean
  memoryFootprint: number | null
}

/**
 * Request interface for Arduino code generation
 * Specifies which device and commands to include in generated code
 */
export interface IGenerationRequest {
  deviceId: string
  commands: string[]
}

/**
 * Metadata about the generation process
 * Provides additional context about generated code
 */
export interface IGenerationMetadata {
  deviceName: string
  deviceType: string
  controllerId: string
  generatedAt: Date
  commandsIncluded: string[]
  firmwareVersion?: string
  memoryEstimate?: number
}

/**
 * Response interface for Arduino code generation
 * Contains generated code or error information
 */
export interface IGenerationResponse {
  success: boolean
  code?: string
  error?: string
  metadata?: IGenerationMetadata
}

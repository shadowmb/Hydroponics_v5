import { HardwareError, HardwareErrorType } from '../types/HardwareTypes'
import { ErrorType, ErrorSeverity } from '../../modules/flowExecutor/types/ExecutionTypes'

export class ErrorMapper {
  static mapToFlowExecutorError(hardwareError: HardwareError) {
    const mappings: Record<HardwareErrorType, { type: ErrorType; severity: ErrorSeverity }> = {
      [HardwareErrorType.DEVICE_NOT_FOUND]: {
        type: ErrorType.DEVICE_NOT_RESPONDING,
        severity: ErrorSeverity.HIGH
      },
      [HardwareErrorType.CONTROLLER_OFFLINE]: {
        type: ErrorType.DEVICE_NOT_RESPONDING,
        severity: ErrorSeverity.HIGH
      },
      [HardwareErrorType.COMMUNICATION_TIMEOUT]: {
        type: ErrorType.SENSOR_TIMEOUT,
        severity: ErrorSeverity.MEDIUM
      },
      [HardwareErrorType.INVALID_RESPONSE]: {
        type: ErrorType.INVALID_BLOCK_TYPE,
        severity: ErrorSeverity.MEDIUM
      },
      [HardwareErrorType.COMMAND_FAILED]: {
        type: ErrorType.EXECUTION_TIMEOUT,
        severity: ErrorSeverity.HIGH
      }
    }

    const mapping = mappings[hardwareError.type]
    
    return {
      type: mapping.type,
      severity: mapping.severity,
      message: hardwareError.message,
      timestamp: new Date(),
      deviceId: hardwareError.deviceId,
      controllerId: hardwareError.controllerId
    }
  }
}
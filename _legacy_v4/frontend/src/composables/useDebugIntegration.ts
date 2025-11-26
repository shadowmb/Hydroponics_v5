// Composable for easy debug system integration in Vue components
import { onMounted, onUnmounted, getCurrentInstance } from 'vue'
import debugSystem from '../utils/debugSystem'

export function useDebugIntegration(componentName?: string) {
  const instance = getCurrentInstance()
  const actualComponentName = componentName || instance?.type.__name || 'UnknownComponent'

  // Auto-track component lifecycle
  onMounted(() => {
    if (process.env.NODE_ENV === 'development') {
      debugSystem.logDebug(actualComponentName, 'Component mounted')
    }
  })

  onUnmounted(() => {
    if (process.env.NODE_ENV === 'development') {
      debugSystem.logDebug(actualComponentName, 'Component unmounted')
    }
  })

  // Return debug utilities for manual use
  return {
    logDebug: (event: string, data?: any) => {
      if (process.env.NODE_ENV === 'development') {
        debugSystem.logDebug(actualComponentName, event, data)
      }
    },
    logWarn: (event: string, data?: any) => {
      if (process.env.NODE_ENV === 'development') {
        debugSystem.logWarn(actualComponentName, event, data)
      }
    },
    logError: (event: string, data?: any) => {
      if (process.env.NODE_ENV === 'development') {
        debugSystem.logError(actualComponentName, event, data)
      }
    },
    trackDevice: debugSystem.trackDevice.bind(debugSystem),
    trackProgram: debugSystem.trackProgram.bind(debugSystem),
    trackAPI: debugSystem.trackAPI.bind(debugSystem),
    trackFlowEditor: debugSystem.trackFlowEditor.bind(debugSystem)
  }
}

// Specialized hooks for different system parts
export function useDeviceDebug() {
  const debug = useDebugIntegration('DeviceSystem')
  
  return {
    ...debug,
    trackConnection: (deviceId: string, status: 'connected' | 'disconnected' | 'error', data?: any) => {
      debug.trackDevice(deviceId, `connection_${status}`, data)
    },
    trackReading: (deviceId: string, value: number, timestamp?: Date) => {
      debug.trackDevice(deviceId, 'reading', { value, timestamp: timestamp || new Date() })
    },
    trackCommand: (deviceId: string, command: string, result?: any) => {
      debug.trackDevice(deviceId, `command_${command}`, result)
    }
  }
}

export function useProgramDebug() {
  const debug = useDebugIntegration('ProgramSystem')
  
  return {
    ...debug,
    trackExecution: (programId: string, status: 'started' | 'paused' | 'stopped' | 'completed', data?: any) => {
      debug.trackProgram(programId, `execution_${status}`, data)
    },
    trackCycle: (programId: string, cycleIndex: number, status: string, data?: any) => {
      debug.trackProgram(programId, `cycle_${cycleIndex}_${status}`, data)
    },
    trackTask: (programId: string, taskId: string, status: string, data?: any) => {
      debug.trackProgram(programId, `task_${taskId}_${status}`, data)
    }
  }
}

export function useFlowEditorDebug() {
  const debug = useDebugIntegration('FlowEditor')
  
  return {
    ...debug,
    trackBlockAction: (action: string, blockId?: string, data?: any) => {
      debug.trackFlowEditor(action, blockId, data)
    },
    trackConnection: (fromBlock: string, toBlock: string, action: 'created' | 'removed') => {
      debug.trackFlowEditor(`connection_${action}`, undefined, { fromBlock, toBlock })
    },
    trackValidation: (errors: any[], warnings: any[]) => {
      debug.trackFlowEditor('validation_result', undefined, { errors: errors.length, warnings: warnings.length })
    },
    trackExecution: (status: 'started' | 'paused' | 'stopped', data?: any) => {
      debug.trackFlowEditor(`execution_${status}`, undefined, data)
    }
  }
}
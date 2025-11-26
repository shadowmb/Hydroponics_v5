// ABOUTME: Composable for displaying block execution information with timing and details
// ABOUTME: Provides formatted block duration, operator symbols, and execution details for all block types

import { ref, onMounted, onUnmounted, type Ref } from 'vue'

export interface BlockExecutionInfoOptions {
  actionTemplates: Ref<any[]>
  wsStore?: any
}

export function useBlockExecutionInfo(options: BlockExecutionInfoOptions) {
  const { actionTemplates, wsStore } = options

  // Timer for live updates
  const currentTime = ref(Date.now())
  let timerInterval: NodeJS.Timeout | null = null

  onMounted(() => {
    timerInterval = setInterval(() => {
      currentTime.value = Date.now()
    }, 1000)
  })

  onUnmounted(() => {
    if (timerInterval) {
      clearInterval(timerInterval)
    }
  })

  /**
   * Convert operator name to symbol
   */
  const operatorToSymbol = (operator: string): string => {
    const map: Record<string, string> = {
      'greater_than': '>',
      'less_than': '<',
      'greater_equal': '≥',
      'less_equal': '≤',
      'equals': '=',
      'not_equals': '≠'
    }
    return map[operator] || operator
  }

  /**
   * Format block duration as MM:SS
   */
  const formatBlockDuration = (block: any): string => {
    let duration: number

    // Check if block is completed (not running)
    if (!block.isStarted && block.endTime && block.startTime) {
      // Block completed - use final fixed duration
      const startTime = new Date(block.startTime).getTime()
      const endTime = new Date(block.endTime).getTime()
      duration = Math.floor((endTime - startTime) / 1000)
    } else if (block.isStarted && (block.startTime || block.timestamp)) {
      // Block is currently running - count up
      const startTime = new Date(block.startTime || block.timestamp).getTime()
      duration = Math.floor((currentTime.value - startTime) / 1000)
    } else {
      // No timing info available
      duration = 0
    }

    const minutes = Math.floor(duration / 60)
    const seconds = duration % 60

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  /**
   * Get detailed information about block execution
   */
  const getBlockDetails = (block: any): string => {
    if (!block.blockData) return ''

    const data = block.blockData

    // Show error message if block failed
    if (block.success === false) {
      return data.displayText || 'Грешка'
    }

    // Sensor block
    if (block.type === 'sensor') {
      const result = data.result
      if (result && result.value !== undefined) {
        const unit = result.unit || ''
        return `Стойност: ${result.value}${unit}`
      }
    }

    // Actuator block
    if (block.type === 'actuator') {
      const result = data.result
      const params = data.parameters

      // During execution - show parameters
      if (params && !result) {
        const deviceName = data.deviceName || 'Устройство'
        const actionType = params.actionType
        let duration = params.duration || 0

        // If using global variable, get value from ActionTemplate
        if (params.useGlobalVariable && params.selectedGlobalVariable) {
          const actionTemplateId = wsStore?.flowStatusActionTemplateId
          const actionTemplate = actionTemplates.value.find(t => t._id === actionTemplateId)
          if (actionTemplate?.globalVariables) {
            const globalValue = actionTemplate.globalVariables[params.selectedGlobalVariable]
            if (globalValue !== undefined) {
              duration = Number(globalValue)
            }
          }
        }

        const actionMap: Record<string, string> = {
          'on': 'Вкл.',
          'off': 'Изкл.',
          'on_off_timed': 'Вкл. → Изкл.',
          'off_on_timed': 'Изкл. → Вкл.',
          'toggle': 'Превключване'
        }
        const action = actionMap[actionType] || actionType

        let details = `${deviceName}: ${action}`

        if (duration > 0) {
          details += ` (${duration}s)`
        }

        if (params.powerLevel > 0 && params.powerLevel !== 100) {
          details += ` PWM: ${params.powerLevel}%`
        }

        return details
      }

      // After execution - show result
      if (result) {
        const deviceName = result.deviceName || data.deviceName || 'Устройство'
        return `${deviceName}: Завършено`
      }
    }

    // IF block
    if (block.type === 'if') {
      const result = data.result
      if (result) {
        const leftValue = result.leftValue !== undefined ? result.leftValue : ''
        const operator = operatorToSymbol(result.operator || result.comparison || '?')
        const rightValue = result.rightValue !== undefined ? result.rightValue : ''
        const conditionResult = result.conditionResult ? 'True' : 'False'
        return `${leftValue} ${operator} ${rightValue} = ${conditionResult}`
      }
    }

    // LOOP block
    if (block.type === 'loop') {
      const result = data.result
      if (result) {
        const iteration = result.iteration !== undefined ? result.iteration : (result.currentIteration !== undefined ? result.currentIteration : result.iterations)
        const maxIter = result.maxIterations !== undefined ? result.maxIterations : '∞'

        if (result.conditionDetails && result.conditionDetails.result !== undefined) {
          const leftValue = result.conditionDetails.leftValue !== undefined ? result.conditionDetails.leftValue : ''
          const operator = operatorToSymbol(result.conditionDetails.operator || '?')
          const rightValue = result.conditionDetails.rightValue !== undefined ? result.conditionDetails.rightValue : ''
          const condResult = result.conditionDetails.result ? 'True' : 'False'
          return `Итерация ${iteration}/${maxIter}: ${leftValue} ${operator} ${rightValue} = ${condResult}`
        } else {
          return `Итерация ${iteration}/${maxIter}`
        }
      }
    }

    return ''
  }

  return {
    currentTime,
    formatBlockDuration,
    getBlockDetails,
    operatorToSymbol
  }
}

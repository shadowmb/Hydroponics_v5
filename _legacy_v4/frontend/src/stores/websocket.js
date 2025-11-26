// ABOUTME: Global WebSocket store for persistent real-time execution monitoring
// ABOUTME: Maintains single connection across navigation to avoid reconnection overhead

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { WEBSOCKET_URL } from '../config/ports'

export const useWebSocketStore = defineStore('websocket', () => {
  // WebSocket connection state
  const ws = ref(null)
  const wsConnected = ref(false)
  const wsReconnecting = ref(false)
  const actionHistory = ref([])
  const isLoadingInitial = ref(false)

  let wsReconnectTimeout = null
  let useWebSocket = true

  // Computed state
  const connectionStatus = computed(() => {
    if (wsConnected.value) return 'connected'
    if (wsReconnecting.value) return 'connecting'
    return 'disconnected'
  })

  // WebSocket connection management
  const connectWebSocket = () => {
    if (ws.value && (ws.value.readyState === WebSocket.CONNECTING || ws.value.readyState === WebSocket.OPEN)) {
      return // Already connected or connecting
    }

    try {
      console.log('🌐 [WebSocketStore] Creating global WebSocket connection...')
      console.log('🌐 [WebSocketStore] Using WebSocket URL:', WEBSOCKET_URL)
      ws.value = new WebSocket(WEBSOCKET_URL)

      ws.value.onopen = () => {
        console.log('✅ [WebSocketStore] Global WebSocket connected')
        wsConnected.value = true
        wsReconnecting.value = false

        // Clear any reconnection timeout
        if (wsReconnectTimeout) {
          clearTimeout(wsReconnectTimeout)
          wsReconnectTimeout = null
        }

        // Identify client after connection
        if (ws.value && ws.value.readyState === WebSocket.OPEN) {
          ws.value.send(JSON.stringify({
            type: 'identify_client',
            clientInfo: {
              name: 'ProgramDashboard',
              page: 'dashboard'
            }
          }))

          // Request initial state after identification
          ws.value.send(JSON.stringify({ type: 'request_initial_state' }))
        }
      }

      ws.value.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          handleWebSocketMessage(message)
        } catch (error) {
          console.warn('🔴 [WebSocketStore] Failed to parse WebSocket message:', error)
        }
      }

      ws.value.onclose = () => {
        console.log('🔌 [WebSocketStore] Global WebSocket disconnected - attempting reconnection')
        wsConnected.value = false

        // Clear action history during reconnection to avoid stale data
        actionHistory.value = []

        // Attempt to reconnect after delay
        if (useWebSocket) {
          wsReconnecting.value = true
          wsReconnectTimeout = setTimeout(() => {
            connectWebSocket()
          }, 3000) // Reconnect after 3 seconds
        }
      }

      ws.value.onerror = (error) => {
        console.warn('🔴 [WebSocketStore] Global WebSocket error:', error)
        // onclose will handle reconnection
      }

    } catch (error) {
      console.warn('🔴 [WebSocketStore] Failed to create global WebSocket connection:', error)
    }
  }

  const disconnectWebSocket = () => {
    useWebSocket = false

    if (wsReconnectTimeout) {
      clearTimeout(wsReconnectTimeout)
      wsReconnectTimeout = null
    }

    if (ws.value) {
      ws.value.close()
      ws.value = null
    }

    wsConnected.value = false
    wsReconnecting.value = false
    actionHistory.value = []
  }

  // Handle WebSocket messages and transform to actionHistory format
  const handleWebSocketMessage = (message) => {
    console.log('📨 [WebSocketStore] WebSocket message:', message)

    switch (message.type) {
      case 'client_identified':
        console.log('🆔 [WebSocketStore] Client identified:', message.data)
        break

      case 'initial_execution_state':
        handleInitialExecutionState(message.data)
        break

      case 'block_started_enhanced':
        handleBlockStarted(message.data)
        break

      case 'block_executed_enhanced':
        handleBlockExecuted(message.data)
        break

      case 'status_change':
        handleStatusChange(message.data)
        break

      case 'dashboard_refresh':
        handleDashboardRefresh(message.data)
        break

      case 'action_template_completed':
        handleActionTemplateCompleted(message.data)
        break

      case 'action_template_started':
        handleActionTemplateStarted(message.data)
        break

      case 'cycle_completed':
        handleCycleCompleted(message.data)
        break

      case 'flow_status_changed':
        handleFlowStatusChanged(message.data)
        break

      default:
        console.log('📨 [WebSocketStore] Unknown WebSocket message type:', message.type)
    }
  }

  const handleInitialExecutionState = (data) => {
    console.log('🔌 [WebSocketStore] Received initial execution state via WebSocket:', data)

    const history = []

    if (data) {
      const { active, executionContext } = data

      // Check if program is completed
      if (executionContext?.programStatus === 'completed') {
        console.log('🏁 [WebSocketStore] Program completed')
        return
      }

      // Only add active current blocks (in_progress) - no recent completed blocks
      active?.forEach(block => {
        history.push({
          type: block.blockType,
          text: formatBlockText(block),
          timestamp: new Date(block.startTime),
          blockId: block.blockId,
          success: null, // null indicates in progress
          isStarted: true
        })
      })

      // Store only current active blocks
      actionHistory.value = history

      console.log('🔌 [WebSocketStore] Set actionHistory to active blocks only:', history.length)
    }
  }

  const handleBlockStarted = (data) => {
    console.log('🚀 [WebSocketStore] Block started via WebSocket:', data)

    // Set flow start time on first block
    if (actionHistory.value.length === 0) {
      flowStartTime.value = Date.now()
    }

    // Remove any existing entry for this block
    actionHistory.value = actionHistory.value.filter(item => item.blockId !== data.blockId)

    // Add new started block at the beginning
    const newAction = {
      type: data.blockType,
      text: data.displayText || formatBlockText(data),
      timestamp: new Date(data.timing?.startTime || Date.now()),
      startTime: new Date(data.timing?.startTime || Date.now()),
      blockId: data.blockId,
      success: null, // null indicates in progress
      isStarted: true,
      blockData: data
    }

    actionHistory.value = [newAction, ...actionHistory.value]
  }

  const handleBlockExecuted = (data) => {
    console.log('✅ [WebSocketStore] Block executed via WebSocket:', data)

    // Find and update the existing block entry in actionHistory
    const existingIndex = actionHistory.value.findIndex(item => item.blockId === data.blockId)

    if (existingIndex !== -1) {
      // Update block to show completed status
      // Check status field first, then fallback to result.success
      const isSuccess = data.status === 'completed' || (data.status !== 'failed' && data.result?.success === true)
      const isFailed = data.status === 'failed' || data.result?.success === false

      actionHistory.value[existingIndex].success = isSuccess ? true : (isFailed ? false : null)
      actionHistory.value[existingIndex].isStarted = false
      actionHistory.value[existingIndex].endTime = new Date(data.timing?.endTime || Date.now())
      actionHistory.value[existingIndex].blockData = data
      console.log('✅ [WebSocketStore] Updated completed block in actionHistory:', data.blockId, 'success:', actionHistory.value[existingIndex].success)
    }
  }

  const handleStatusChange = (data) => {
    console.log('📊 [WebSocketStore] Status change event:', data)
    console.log('📊 [WebSocketStore] data.event value:', data.event)

    // Note: ActionTemplate status updates are now handled via database refresh
    // through the dashboardRefresh event system for data consistency
  }

  const handleDashboardRefresh = (data) => {
    console.log('🔄 [WebSocketStore] Dashboard refresh requested:', data)

    // Trigger dashboard store refresh
    import('../stores/dashboard').then(({ useDashboardStore }) => {
      const dashboardStore = useDashboardStore()

      // Handle cycle-specific refresh events
      if (data.reason && data.reason.startsWith('cycle_')) {
        console.log(`🔄 [WebSocketStore] Refreshing program data for cycle event: ${data.reason}`)
        dashboardStore.loadProgramData()
      } else if (data.sectionId === 'program') {
        dashboardStore.loadProgramData()
      } else {
        // Default: refresh program data for any dashboard refresh
        dashboardStore.loadProgramData()
      }
    }).catch(error => {
      console.warn('🔴 [WebSocketStore] Failed to refresh dashboard:', error)
    })
  }

  const actionTemplateCompletedEvent = ref(null)
  const flowStartTime = ref(null)
  const flowStatus = ref(null) // 'active', 'paused', 'stopped'
  const flowStatusActionTemplateId = ref(null)
  const currentActionTemplateName = ref(null)

  const handleActionTemplateStarted = (data) => {
    console.log('🎯 [WebSocketStore] ActionTemplate started:', data)

    // Store current ActionTemplate name for display
    currentActionTemplateName.value = data.actionTemplateName

    // Set flow start time if this is the first AT in cycle
    if (data.actionIndex === 1) {
      flowStartTime.value = Date.now()
      // Clear action history when new cycle starts
      actionHistory.value = []
    }
  }

  const handleCycleCompleted = (data) => {
    console.log('🏁 [WebSocketStore] Cycle completed:', data)

    // Calculate total duration
    let totalDuration = 0
    if (flowStartTime.value) {
      totalDuration = Math.floor((Date.now() - flowStartTime.value) / 1000)
    }

    // Determine completion message based on success status
    const isSuccess = data.success !== false
    const completionText = isSuccess
      ? `Цикъл завършен (Обща продължителност: ${totalDuration}s)`
      : `Цикълът спря поради грешка (Обща продължителност: ${totalDuration}s)`

    // Add completion block to action history
    const completionBlock = {
      type: 'completion',
      text: completionText,
      timestamp: new Date(),
      blockId: `completion-${Date.now()}`,
      success: isSuccess,
      isStarted: false,
      blockData: null
    }

    actionHistory.value = [completionBlock, ...actionHistory.value]
    flowStartTime.value = null

    // Note: Keep currentActionTemplateName visible until next cycle starts
    // It will be cleared when handleActionTemplateStarted is called for next cycle

    // Reset flow status
    flowStatus.value = null
    flowStatusActionTemplateId.value = null
  }

  const handleActionTemplateCompleted = (data) => {
    console.log('🏁 [WebSocketStore] ActionTemplate completed:', data)
    actionTemplateCompletedEvent.value = data

    // Calculate total duration
    let totalDuration = 0
    if (flowStartTime.value) {
      totalDuration = Math.floor((Date.now() - flowStartTime.value) / 1000)
    }

    // Determine completion message based on success status
    const isSuccess = data.success !== false
    const completionText = isSuccess
      ? `Успешно изпълнение (Обща продължителност: ${totalDuration}s)`
      : `Изпълнението спря поради грешка (Обща продължителност: ${totalDuration}s)`

    // Add completion block to action history
    const completionBlock = {
      type: 'completion',
      text: completionText,
      timestamp: new Date(),
      blockId: `completion-${Date.now()}`,
      success: isSuccess,
      isStarted: false,
      blockData: null
    }

    actionHistory.value = [completionBlock, ...actionHistory.value]
    flowStartTime.value = null

    // Reset flow status
    flowStatus.value = null
    flowStatusActionTemplateId.value = null
  }

  const handleFlowStatusChanged = (data) => {
    console.log('🔄 [WebSocketStore] Flow status changed:', data)

    if (data.actionTemplateId) {
      flowStatusActionTemplateId.value = data.actionTemplateId

      if (data.status === 'paused') {
        flowStatus.value = 'paused'
      } else if (data.status === 'resumed') {
        flowStatus.value = 'active'
      } else if (data.status === 'stopped') {
        flowStatus.value = 'stopped'
      }
    }
  }

  const formatBlockText = (block) => {
    if (block.blockType === 'sensor') {
      return `Измерва ${block.blockName || 'сензор'}...`
    }
    if (block.blockType === 'actuator') {
      return `Стартира ${block.blockName || 'устройство'}...`
    }
    if (block.blockType === 'if') {
      return `Проверява условие...`
    }
    if (block.blockType === 'loop') {
      return `Изпълнява цикъл...`
    }
    return block.blockName || 'Изпълнява блок...'
  }

  const clearActions = () => {
    actionHistory.value = []
  }

  const setFlowStatus = (status, actionTemplateId) => {
    flowStatus.value = status
    flowStatusActionTemplateId.value = actionTemplateId
  }

  // Initialize WebSocket on store creation
  connectWebSocket()

  return {
    // State
    wsConnected,
    wsReconnecting,
    actionHistory,
    isLoadingInitial,
    connectionStatus,
    actionTemplateCompletedEvent,
    flowStatus,
    flowStatusActionTemplateId,
    currentActionTemplateName,

    // Actions
    connectWebSocket,
    disconnectWebSocket,
    clearActions,
    setFlowStatus
  }
})
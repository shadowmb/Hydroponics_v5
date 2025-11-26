// Global Debug System for Hydroponics Application
// Phase 2: Development-only real-time component watcher

interface DebugLogEntry {
  timestamp: number
  component: string
  event: string
  data?: any
  level: 'info' | 'warn' | 'error'
}

interface ComponentWatchData {
  id: string
  name: string
  lifecycle: string
  props?: Record<string, any>
  refs?: Record<string, any>
  status: 'mounting' | 'mounted' | 'updating' | 'unmounting' | 'unmounted'
}

class HydroponicsDebugSystem {
  private logs: DebugLogEntry[] = []
  private components: Map<string, ComponentWatchData> = new Map()
  private isActive = false
  private logLimit = 1000

  init() {
    if (process.env.NODE_ENV !== 'development') {
      console.warn('🚫 Debug System: Not in development mode, skipping initialization')
      return
    }

    this.isActive = true
    this.setupGlobalLogger()
    this.setupComponentWatcher()
    this.setupDOMAnnotations()
    
    console.log('🔧 Hydroponics Debug System: Initialized successfully')
  }

  private setupGlobalLogger() {
    // Global debug logger accessible via window
    window.__debugLog = (component: string, event: string, data?: any, level: 'info' | 'warn' | 'error' = 'info') => {
      const entry: DebugLogEntry = {
        timestamp: Date.now(),
        component,
        event,
        data,
        level
      }

      this.logs.push(entry)
      
      // Keep only last N logs
      if (this.logs.length > this.logLimit) {
        this.logs.shift()
      }

      // Console output with colored formatting
      const emoji = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '📋'
      console.log(`${emoji} [${component}] ${event}`, data || '')
    }

    // Expose debug data for inspection
    window.__debugData = () => ({
      logs: this.logs,
      components: Array.from(this.components.values()),
      isActive: this.isActive
    })
  }

  private setupComponentWatcher() {
    // Track component lifecycle events through Vue DevTools if available
    if (typeof window !== 'undefined' && (window as any).__VUE_DEVTOOLS_GLOBAL_HOOK__) {
      this.logDebug('DebugSystem', 'Vue DevTools detected - enhanced tracking available')
    }
    
    // Basic component tracking through DOM mutations
    this.logDebug('DebugSystem', 'Component watcher initialized')
  }

  private setupDOMAnnotations() {
    // Add debug attributes to DOM elements
    const observer = new MutationObserver((mutations) => {
      if (!this.isActive) return

      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element
            
            // Add debug attributes for Vue components
            if (element.classList.contains('q-') || element.hasAttribute('data-v-')) {
              this.annotateElement(element)
            }
          }
        })
      })
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    this.logDebug('DebugSystem', 'DOM annotation watcher initialized')
  }

  private annotateElement(element: Element) {
    // Add debug attributes
    element.setAttribute('data-debug-timestamp', Date.now().toString())
    element.setAttribute('data-debug-tracked', 'true')

    // Identify component type
    const classList = Array.from(element.classList)
    const quasarComponent = classList.find(cls => cls.startsWith('q-'))
    if (quasarComponent) {
      element.setAttribute('data-debug-component', quasarComponent)
    }
  }

  // Public API methods
  logDebug(component: string, event: string, data?: any) {
    if (window.__debugLog) {
      window.__debugLog(component, event, data, 'info')
    }
  }

  logWarn(component: string, event: string, data?: any) {
    if (window.__debugLog) {
      window.__debugLog(component, event, data, 'warn')
    }
  }

  logError(component: string, event: string, data?: any) {
    if (window.__debugLog) {
      window.__debugLog(component, event, data, 'error')
    }
  }

  trackDevice(deviceId: string, status: string, data?: any) {
    this.logDebug('DeviceSystem', `Device ${deviceId}: ${status}`, data)
  }

  trackProgram(programId: string, status: string, data?: any) {
    this.logDebug('ProgramSystem', `Program ${programId}: ${status}`, data)
  }

  trackAPI(endpoint: string, method: string, status: number, data?: any) {
    const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info'
    this.logDebug('APICall', `${method} ${endpoint} - ${status}`, data)
  }

  trackFlowEditor(action: string, blockId?: string, data?: any) {
    this.logDebug('FlowEditor', action, { blockId, ...data })
  }

  getLogs(component?: string, limit?: number) {
    let filteredLogs = component 
      ? this.logs.filter(log => log.component === component)
      : this.logs

    return limit ? filteredLogs.slice(-limit) : filteredLogs
  }

  clearLogs() {
    this.logs = []
    console.log('🧹 Debug logs cleared')
  }

  getSystemStatus() {
    return {
      isActive: this.isActive,
      totalLogs: this.logs.length,
      trackedComponents: this.components.size,
      environment: process.env.NODE_ENV
    }
  }
}

// Global instance
const debugSystem = new HydroponicsDebugSystem()

// Auto-initialize in development
if (process.env.NODE_ENV === 'development') {
  debugSystem.init()
}

// Global type declarations
declare global {
  interface Window {
    __debugLog: (component: string, event: string, data?: any, level?: 'info' | 'warn' | 'error') => void
    __debugData: () => {
      logs: DebugLogEntry[]
      components: ComponentWatchData[]
      isActive: boolean
    }
    __hydroDebug: HydroponicsDebugSystem
  }
}

// Expose debug system globally
window.__hydroDebug = debugSystem

export default debugSystem
export type { DebugLogEntry, ComponentWatchData }
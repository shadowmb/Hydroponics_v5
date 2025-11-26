// Component Map Hot Reload Watcher
// Phase 4: Development-only hot reload for component mapping

interface ComponentMapData {
  lastModified: string
  totalFiles: number
  flowEditor: any
  components: any[]
}

class ComponentMapWatcher {
  private isActive = false
  private watchInterval: number | null = null
  private lastCheck = 0
  private currentData: ComponentMapData | null = null

  init() {
    if (process.env.NODE_ENV !== 'development') {
      console.warn('🚫 Component Map Watcher: Not in development mode, skipping initialization')
      return
    }

    this.isActive = true
    this.loadInitialData()
    this.startWatching()
    
    console.log('🔄 Component Map Watcher: Initialized successfully')
  }

  private async loadInitialData() {
    try {
      // Load component map
      const mapResponse = await fetch('/map/project-components-map.json')
      if (mapResponse.ok) {
        this.currentData = await mapResponse.json()
        this.lastCheck = Date.now()
        this.notifyUpdate('initial_load')
      }
    } catch (error) {
      console.warn('⚠️ Component Map Watcher: Could not load initial data', error)
    }
  }

  private startWatching() {
    if (this.watchInterval) return

    // Check for updates every 2 seconds in development
    this.watchInterval = window.setInterval(async () => {
      await this.checkForUpdates()
    }, 2000)
  }

  private async checkForUpdates() {
    if (!this.isActive || !this.currentData) return

    try {
      // Check if component map file was modified
      const mapResponse = await fetch('/map/project-components-map.json?' + Date.now())
      if (!mapResponse.ok) return

      const newData: ComponentMapData = await mapResponse.json()
      
      // Compare modification times
      if (newData.lastModified !== this.currentData.lastModified) {
        console.log('🔄 Component Map updated:', {
          oldFiles: this.currentData.totalFiles,
          newFiles: newData.totalFiles,
          timestamp: newData.lastModified
        })

        this.currentData = newData
        this.notifyUpdate('hot_reload')
      }

    } catch (error) {
      // Silently fail - map file might not exist yet
    }
  }

  private notifyUpdate(type: 'initial_load' | 'hot_reload') {
    // Notify debug system
    if (typeof window !== 'undefined' && window.__hydroDebug) {
      window.__hydroDebug.logDebug('ComponentMapWatcher', `map_${type}`, {
        totalFiles: this.currentData?.totalFiles,
        flowEditorComponents: this.currentData?.flowEditor?.mainComponents?.length,
        timestamp: this.currentData?.lastModified
      })
    }

    // Trigger custom event for other systems to listen
    window.dispatchEvent(new CustomEvent('component-map-updated', {
      detail: {
        type,
        data: this.currentData
      }
    }))
  }

  // Public API
  getCurrentData() {
    return this.currentData
  }

  getFlowEditorIndex() {
    return this.currentData?.flowEditor || null
  }

  forceReload() {
    this.loadInitialData()
  }

  stop() {
    if (this.watchInterval) {
      clearInterval(this.watchInterval)
      this.watchInterval = null
    }
    this.isActive = false
  }

  getStatus() {
    return {
      isActive: this.isActive,
      hasData: !!this.currentData,
      lastCheck: this.lastCheck,
      totalFiles: this.currentData?.totalFiles || 0
    }
  }
}

// Global instance
const componentMapWatcher = new ComponentMapWatcher()

// Auto-initialize in development
if (process.env.NODE_ENV === 'development') {
  componentMapWatcher.init()
}

// Global type declarations
declare global {
  interface Window {
    __componentMapWatcher: ComponentMapWatcher
  }
}

// Expose globally for debugging
window.__componentMapWatcher = componentMapWatcher

export default componentMapWatcher
export type { ComponentMapData }
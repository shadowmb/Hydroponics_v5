import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { controllerApi, deviceApi } from '../services/api'
import { API_BASE_URL } from '../config/ports'

export interface DashboardModule {
  id: string
  name: string
  sectionId: 'sensors' | 'system' | 'program' | 'alerts'
  visualizationType: 'number' | 'gauge' | 'status' | 'chart' | 'bar' | 'line'
  monitoringTagId?: string  // For sensor modules connected to real monitoring data
  monitoringData?: {        // Real data from MonitoringData collection
    tagId: string
    value: number
    timestamp: string
  }
  mockData?: {
    value?: number
    unit?: string
    status?: 'normal' | 'warning' | 'error' | 'offline'
    label?: string
    online?: number
    offline?: number
    total?: number
    percentage?: number
    details?: Array<{
      name: string
      status: string
      lastSeen: string
    }>
  }
  isVisible: boolean
  displayOrder: number

  // Trend indicator (for existing sensor modules)
  trend?: {
    enabled: boolean
    toleranceType?: string
    toleranceTagId?: string | null
    manualTolerance?: number
    previousValue?: number
    currentValue?: number
  }
  
  // Интелигентни граници (Smart Boundaries)
  smartBoundaries?: {
    enabled: boolean
    optimal: {
      min: number
      max: number
    }
    warningTolerance: number  // ± от оптималната зона за warning
    dangerTolerance: number   // ± от оптималната зона за danger
  }
  
  // Тренд индикатор
  trendIndicator?: {
    enabled: boolean
  }

  // Custom range settings for gauge-advanced
  customRange?: {
    min: number
    max: number
  }
}

export interface ProgramData {
  programOverview: {
    name: string
    status: string
    totalExecutions: number
    hasError?: boolean
    errorMessage?: string
  }
  cyclesStatus: {
    totalCycles: number
    completedToday: number
    cycles: Array<{
      cycleId: string
      startTime: string
      status: 'pending' | 'running' | 'completed' | 'failed'
      executionCount: number
      actionTemplatesCount: number
      isCurrentlyExecuting: boolean
    }>
  }
  currentExecution: {
    executionId: string
    flowName: string
    status: string
    currentBlock?: {
      blockName: string
      blockType: string
      status: string
    }
    progressPercent: number
    startTime: string
    totalBlocks: number
    completedBlocks: number
  } | null
  activeCycles?: Array<{
    cycleId: string
    cycleGlobalParameters?: Array<{
      _id: string
      actionTemplateName: string
      status?: 'pending' | 'running' | 'completed'
    }>
  }>
}

export type LayoutType = 'compact' | 'stacked' | 'priority' | 'tiles'
export type ModuleSize = 'small' | 'medium' | 'large' 
export type Spacing = 'tight' | 'normal' | 'spacious'

export interface SectionSizing {
  width: number  // percentage or fr units
  height: number // minimum height in pixels
  maxWidth?: number
  maxHeight?: number
}

export interface LayoutSettings {
  layoutType: LayoutType
  sectionSizing: {
    sensors: SectionSizing
    system: SectionSizing
    program: SectionSizing
    alerts: SectionSizing
  }
  moduleSize: ModuleSize
  spacing: Spacing
  showSectionBorders: boolean
  enableLayoutTransitions: boolean
}

export interface DashboardSettings {
  sensors: {
    maxVisible: number
    showDataLabels: boolean
    compactMode: boolean
  }
  system: {
    selectedDevices: {
      controllers: string[]  // Array of controller IDs
      devices: string[]      // Array of device IDs
    }
    displayLimit: number     // Default 6
  }
  program: {
    showCurrentCycle: boolean
    showTimeline: boolean
    showParameters: boolean
    showExecutionStats: boolean
  }
  alerts: {
    // 4 Alert Types - Enable/Disable
    showExecutionErrors: boolean     // Flow/Program execution failures
    showSensorAlerts: boolean        // Sensor validation warnings/errors
    showHardwareIssues: boolean      // Device/Controller connectivity issues
    showSystemAlerts: boolean        // Performance/Memory alerts

    // Severity Filter
    severityFilter: 'all' | 'critical' | 'critical_warning'

    // Display Options
    maxDisplayCount: number          // 3-10 alerts to show
    timeWindow: '6h' | '24h' | '7d'  // Time range for alerts
  }
  layout: {
    refreshInterval: number // seconds
    enableAnimations: boolean
    compactMode: boolean
    autoRefresh: boolean
    layoutSettings: LayoutSettings
  }
}

export const useDashboardStore = defineStore('dashboard', () => {
  // State
  const modules = ref<DashboardModule[]>([])
  const programData = ref<ProgramData | null>(null)
  const settings = ref<DashboardSettings>({
    sensors: {
      maxVisible: 8,
      showDataLabels: true,
      compactMode: false
    },
    system: {
      selectedDevices: {
        controllers: [],
        devices: []
      },
      displayLimit: 6
    },
    program: {
      showCurrentCycle: true,
      showTimeline: true,
      showParameters: false,
      showExecutionStats: true
    },
    alerts: {
      showExecutionErrors: true,
      showSensorAlerts: true,
      showHardwareIssues: true,
      showSystemAlerts: true,
      severityFilter: 'all',
      maxDisplayCount: 5,
      timeWindow: '24h'
    },
    layout: {
      refreshInterval: 10,
      enableAnimations: true,
      compactMode: false,
      autoRefresh: true,
      layoutSettings: {
        layoutType: 'compact',
        sectionSizing: {
          sensors: { width: 50, height: 300 },
          system: { width: 50, height: 300 },
          program: { width: 50, height: 250 },
          alerts: { width: 50, height: 150 }
        },
        moduleSize: 'medium',
        spacing: 'normal',
        showSectionBorders: true,
        enableLayoutTransitions: true
      }
    }
  })

  const isLoading = ref(false)
  const lastRefresh = ref<Date>(new Date())

  // Computed
  const sensorModules = computed(() => 
    modules.value.filter(m => m.sectionId === 'sensors' && m.isVisible)
      .sort((a, b) => a.displayOrder - b.displayOrder)
  )

  const systemModules = computed(() => 
    modules.value.filter(m => m.sectionId === 'system' && m.isVisible)
      .sort((a, b) => a.displayOrder - b.displayOrder)
  )

  const programModules = computed(() => 
    modules.value.filter(m => m.sectionId === 'program' && m.isVisible)
      .sort((a, b) => a.displayOrder - b.displayOrder)
  )

  const alertModules = computed(() => 
    modules.value.filter(m => m.sectionId === 'alerts' && m.isVisible)
      .sort((a, b) => a.displayOrder - b.displayOrder)
  )

  const allModulesBySections = computed(() => ({
    sensors: sensorModules.value,
    system: systemModules.value,
    program: programModules.value,
    alerts: alertModules.value
  }))

  // Actions
  async function loadSensorModulesFromDB() {
   // console.log('Loading sensor modules from database...')
    
    // First cleanup any existing invalid modules
    cleanupInvalidModules()
    
    try {
      // Load sensors section from database
      const url = `${API_BASE_URL}/dashboard/sections/sensors`
      // console.log('🔍 [DEBUG] Making request to:', url)
      // console.log('🔍 [DEBUG] Current location:', window.location.href)
      
      const response = await fetch(url)
      // console.log('🔍 [DEBUG] Response status:', response.status)
      // console.log('🔍 [DEBUG] Response headers:', Object.fromEntries(response.headers.entries()))
      // console.log('🔍 [DEBUG] Response URL:', response.url)
      
      if (response.ok) {
        const result = await response.json()
        const sensorSection = result.data
        
        //console.log('Found sensor section in database:', sensorSection)
        
        if (sensorSection && sensorSection.modules && sensorSection.modules.length > 0) {
          // Convert database modules to dashboard modules (include all fields)
          const sensorModules = sensorSection.modules.map((dbModule: any) => {
           // console.log(`🔍 [DEBUG] Mapping module "${dbModule.name}":`)
            //console.log('  - DB smartBoundaries:', dbModule.smartBoundaries)
            
            const mappedRanges = dbModule.smartBoundaries ? {
              enabled: dbModule.smartBoundaries.enabled,
              optimal: dbModule.smartBoundaries.optimal,
              warningTolerance: dbModule.smartBoundaries.warningTolerance,
              criticalTolerance: dbModule.smartBoundaries.dangerTolerance
            } : undefined
            
            
           // console.log('  - Mapped ranges:', mappedRanges)
            
            const module = {
              id: `sensor-${dbModule._id}`,
              name: dbModule.name,
              sectionId: 'sensors',
              visualizationType: dbModule.visualizationType,
              monitoringTagId: dbModule.monitoringTagId,
              isVisible: dbModule.isVisible,
              displayOrder: dbModule.displayOrder,
              // Map smartBoundaries from database to ranges expected by component
              ranges: mappedRanges,
              // Map trendIndicator from database to trend expected by component
              trend: dbModule.trendIndicator ? {
                enabled: dbModule.trendIndicator.enabled,
                toleranceType: dbModule.trendIndicator.toleranceType || 'manual',
                toleranceTagId: dbModule.trendIndicator.toleranceTagId || null,
                manualTolerance: dbModule.trendIndicator.manualTolerance || 0.1
              } : undefined,
              // Map customRange from database
              customRange: dbModule.customRange
            }
            
           // console.log('  - Final module:', module)
            return module
          })
          
          // Remove any existing sensor modules (including ones with invalid IDs)
          modules.value = modules.value.filter(m => m.sectionId !== 'sensors')
          
          // Add sensor modules from database
          modules.value = [...sensorModules, ...modules.value]
          
          //console.log('Successfully loaded sensor modules from database:', sensorModules)
          
          // Load real data for these modules
          await refreshData()
        } else {
          console.log('No sensor modules found in database - sensors section is empty')
        }
        
      } else if (response.status === 404) {
        console.log('Sensor section not found in database - no sensor modules available')
      } else {
        const responseText = await response.text()
        console.warn('Failed to load sensor section from database:', response.status)
        console.warn('🔍 [DEBUG] Response text:', responseText.substring(0, 500))
      }
    } catch (error) {
      console.error('Error loading sensor modules from DB:', error)
      //console.error('🔍 [DEBUG] Error type:', error.constructor.name)
     // console.error('🔍 [DEBUG] Error message:', error.message)
    }
  }

  async function loadSystemSettingsFromDB() {
    try {
      console.log('📊 Loading system settings from database...')

      const response = await fetch(`${API_BASE_URL}/dashboard/sections/system`)

      if (response.ok) {
        const result = await response.json()
        const systemSection = result.data

        if (systemSection && systemSection.sectionSettings) {
          console.log('✅ Found system section in database:', systemSection.sectionSettings)

          // Update system settings from database
          if (systemSection.sectionSettings.selectedDevices) {
            settings.value.system.selectedDevices = systemSection.sectionSettings.selectedDevices
          }

          if (systemSection.sectionSettings.displayLimit) {
            settings.value.system.displayLimit = systemSection.sectionSettings.displayLimit
          }

          console.log('✅ System settings loaded from database:', settings.value.system)
        } else {
          console.log('ℹ️ No system settings found in database - using defaults')
        }
      } else if (response.status === 404) {
        console.log('ℹ️ System section not found in database - using default settings')
      } else {
        console.warn('⚠️ Failed to load system section from database:', response.status)
      }
    } catch (error) {
      console.error('❌ Error loading system settings from DB:', error)
    }
  }

  function initializeMockData() {
   // console.log('Initializing mock data...')
    modules.value = [

      // Alert Module (single module - using AlertContainer component)
      {
        id: 'alerts-main',
        name: 'Предупреждения и съобщения',
        sectionId: 'alerts',
        visualizationType: 'status',
        mockData: { value: 0, status: 'normal', label: 'Няма активни предупреждения' },
        isVisible: true,
        displayOrder: 1
      }
    ]
    //console.log('Mock data initialized, total modules:', modules.value.length)
  }

  function updateModuleVisibility(moduleId: string, isVisible: boolean) {
    const module = modules.value.find(m => m.id === moduleId)
    if (module) {
      module.isVisible = isVisible
    }
  }

  function updateModuleOrder(moduleId: string, newOrder: number) {
    const module = modules.value.find(m => m.id === moduleId)
    if (module) {
      module.displayOrder = newOrder
    }
  }

  function addModule(moduleData: Omit<DashboardModule, 'id'> | DashboardModule) {
    //console.log(`🔍 [DEBUG] addModule called with:`, moduleData)
    
    const newModule: DashboardModule = {
      ...moduleData,
      // Only generate ID if not provided (preserve existing IDs like sensor-{dbId})
      id: 'id' in moduleData && moduleData.id ? moduleData.id : `module-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    
    //console.log(`🔍 [DEBUG] Final module being added to store:`, newModule)
    //console.log(`🔍 [DEBUG] Module ranges after spread:`, newModule.ranges)
    
    modules.value.push(newModule)
  }

  function removeModule(moduleId: string) {
    const index = modules.value.findIndex(m => m.id === moduleId)
    if (index > -1) {
      modules.value.splice(index, 1)
    }
  }

  function updateSettings(newSettings: Partial<DashboardSettings>) {
    settings.value = { ...settings.value, ...newSettings }
  }

  function cleanupInvalidModules() {
    console.log('Cleaning up modules with invalid IDs...')
    const initialCount = modules.value.length
    
    modules.value = modules.value.filter(module => {
      // Remove sensor modules with undefined or invalid database IDs  
      if (module.sectionId === 'sensors' && module.id.startsWith('sensor-')) {
        const dbId = module.id.replace('sensor-', '')
        const isValid = dbId && dbId !== 'undefined' && dbId.length === 24
        
        if (!isValid) {
          console.log(`🗑️ Removing invalid sensor module: ${module.name} (ID: ${module.id})`)
          return false
        }
      }
      return true
    })
    
    const removedCount = initialCount - modules.value.length
    if (removedCount > 0) {
      console.log(`✅ Cleaned up ${removedCount} invalid modules`)
    }
  }

  async function refreshData() {
    isLoading.value = true
    
    try {
      // Update sensor modules with real monitoring data
      const allSensorModules = modules.value.filter(m => m.sectionId === 'sensors')
      const sensorModules = modules.value.filter(m => m.sectionId === 'sensors' && m.monitoringTagId)
      
      //console.log('🔍 [DEBUG] All sensor modules:', allSensorModules.map(m => ({ id: m.id, name: m.name, monitoringTagId: m.monitoringTagId })))
      //console.log('🔍 [DEBUG] Sensor modules with monitoring tags:', sensorModules.length)
      
      // Load real data for modules with monitoring tags
      const dataPromises = sensorModules.map(async (module) => {
        try {
          const response = await fetch(`${API_BASE_URL}/monitoring/data/latest/${module.monitoringTagId}`)
          // Debug: console.log(`📡 API call for ${module.name}: ${response.status}`)
          
          if (response.ok) {
            const result = await response.json()
            const data = result.data || result
            
            // Debug: console.log(`✅ Data refreshed for ${module.name}:`, data.value)
            
            // Store previous value for trend calculation (if trend is enabled)
            if (module.trend?.enabled && module.monitoringData?.value && data?.value) {
              const currentValue = data.value
              const previousValue = module.monitoringData.value
              
              // Only update if there's a meaningful change (avoid tiny fluctuations)
              if (Math.abs(currentValue - previousValue) > 0.001) {
                module.trend.previousValue = previousValue
                module.trend.currentValue = currentValue
              }
            }
            
            // Update only real monitoring data for sensors (no more mock data)
            module.monitoringData = data
          } else {
            const errorText = await response.text()
            console.warn(`Failed to refresh data for module ${module.id} (${module.name}). Status: ${response.status}, TagId: ${module.monitoringTagId}, Response:`, errorText)
            
            // Clear monitoring data when API fails
            module.monitoringData = undefined
          }
        } catch (error) {
          console.error(`Failed to refresh data for module ${module.id} (${module.name}):`, error)
          
          // Clear monitoring data when API call fails
          module.monitoringData = undefined
        }
      })
      
      await Promise.all(dataPromises)

      // Load program data
      await loadProgramData()

      // Update mock modules with simulated variations (for non-monitoring modules)
      modules.value.forEach(module => {
        if (!module.monitoringTagId && module.mockData?.value && typeof module.mockData.value === 'number') {
          // Add small random variation to simulate live data
          const variation = (Math.random() - 0.5) * 0.1 // ±5% variation
          const baseValue = module.mockData.value
          module.mockData.value = Math.round((baseValue + baseValue * variation) * 100) / 100
        }
      })
      
      lastRefresh.value = new Date()
      isLoading.value = false
    } catch (error) {
      console.error('Error refreshing dashboard data:', error)
      isLoading.value = false
    }
  }

  function getModuleById(moduleId: string): DashboardModule | undefined {
    return modules.value.find(m => m.id === moduleId)
  }

  function getModulesBySection(sectionId: string): DashboardModule[] {
    return modules.value.filter(m => m.sectionId === sectionId)
  }

  function getLayoutPreset(layoutType: LayoutType): LayoutSettings {
    const presets: Record<LayoutType, LayoutSettings> = {
      compact: {
        layoutType: 'compact',
        sectionSizing: {
          sensors: { width: 50, height: 300 },
          system: { width: 50, height: 300 },
          program: { width: 50, height: 250 },
          alerts: { width: 50, height: 150 }
        },
        moduleSize: 'medium',
        spacing: 'normal',
        showSectionBorders: true,
        enableLayoutTransitions: true
      },
      stacked: {
        layoutType: 'stacked',
        sectionSizing: {
          sensors: { width: 100, height: 200 },
          system: { width: 100, height: 180 },
          program: { width: 100, height: 180 },
          alerts: { width: 100, height: 120 }
        },
        moduleSize: 'medium',
        spacing: 'normal',
        showSectionBorders: true,
        enableLayoutTransitions: true
      },
      priority: {
        layoutType: 'priority',
        sectionSizing: {
          sensors: { width: 100, height: 400 },
          system: { width: 33, height: 150 },
          program: { width: 33, height: 150 },
          alerts: { width: 33, height: 150 }
        },
        moduleSize: 'large',
        spacing: 'normal',
        showSectionBorders: true,
        enableLayoutTransitions: true
      },
      tiles: {
        layoutType: 'tiles',
        sectionSizing: {
          sensors: { width: 25, height: 120 },
          system: { width: 25, height: 120 },
          program: { width: 25, height: 120 },
          alerts: { width: 25, height: 120 }
        },
        moduleSize: 'small',
        spacing: 'tight',
        showSectionBorders: false,
        enableLayoutTransitions: true
      }
    }
    return presets[layoutType]
  }

  function switchLayout(layoutType: LayoutType) {
    const newLayout = getLayoutPreset(layoutType)
    settings.value.layout.layoutSettings = newLayout
  }

  function updateLayoutSettings(newSettings: Partial<LayoutSettings>) {
    settings.value.layout.layoutSettings = {
      ...settings.value.layout.layoutSettings,
      ...newSettings
    }
  }

  // Load system data from real APIs
  async function loadSystemData() {
    try {
      isLoading.value = true

      console.log('🚀 Loading system data...')

      // Load controllers and devices data in parallel
      const [controllersResponse, devicesResponse] = await Promise.all([
        controllerApi.getStatus(),
        deviceApi.getAll()
      ])

      console.log('✅ Controllers response:', controllersResponse)
      console.log('✅ Devices response:', devicesResponse)

      // Create single system module with real data
      const systemModulesData = [
        createUnifiedSystemModule(controllersResponse, devicesResponse)
      ]

      // Replace system modules in the modules array
      modules.value = modules.value.filter(m => m.sectionId !== 'system')
      modules.value.push(...systemModulesData)

      console.log('✅ System modules created:', systemModulesData)

      lastRefresh.value = new Date()
    } catch (error) {
      console.error('❌ Failed to load system data:', error)
      console.error('❌ Error details:', error.response?.data || error.message)
      // Fallback to mock data for system modules if API fails
      fallbackToSystemMockData()
    } finally {
      isLoading.value = false
    }
  }

  function createControllersModule(controllersData: any): DashboardModule {
    const { total = 0, online = 0, offline = 0, controllers = [] } = controllersData

    return {
      id: 'system-controllers',
      name: 'Контролери',
      sectionId: 'system',
      visualizationType: 'status',
      mockData: {
        online,
        offline,
        total,
        status: offline > 0 ? 'warning' : 'normal',
        label: `${online} от ${total}`,
        details: controllers.slice(0, 3).map((c: any) => ({
          name: c.name,
          status: c.status,
          lastSeen: formatLastHeartbeat(c.lastHeartbeat)
        }))
      },
      isVisible: true,
      displayOrder: 1
    }
  }

  function createUnifiedSystemModule(controllersData: any, devicesData: any): DashboardModule {
    const { total: totalControllers = 0, online: onlineControllers = 0 } = controllersData
    const devices = Array.isArray(devicesData) ? devicesData : []

    // Filter devices by category
    const sensors = devices.filter(d => d.category === 'sensor')
    const actuators = devices.filter(d => d.category === 'actuator')

    const onlineDevices = devices.filter(d => d.isActive !== false).length
    const totalDevices = devices.length
    const offlineDevices = totalDevices - onlineDevices
    const offlineControllers = totalControllers - onlineControllers

    const totalOffline = offlineControllers + offlineDevices
    const totalSystem = totalControllers + totalDevices

    console.log('🔍 Unified system data:', {
      controllers: { total: totalControllers, online: onlineControllers },
      sensors: { total: sensors.length },
      actuators: { total: actuators.length },
      totalSystem,
      totalOffline
    })

    return {
      id: 'unified-system',
      name: 'Система',
      sectionId: 'system',
      visualizationType: 'status',
      mockData: {
        online: onlineControllers + onlineDevices,
        offline: totalOffline,
        total: totalSystem,
        status: totalOffline > 0 ? 'warning' : 'normal',
        label: `${totalSystem} устройства (${totalControllers} контролера, ${sensors.length} сензори, ${actuators.length} актуатори)`
      },
      isVisible: true,
      displayOrder: 1
    }
  }

  function formatLastHeartbeat(lastHeartbeat: string | Date | null): string {
    if (!lastHeartbeat) return 'никога'

    const now = new Date()
    const heartbeat = new Date(lastHeartbeat)
    const diffMs = now.getTime() - heartbeat.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)

    if (diffSeconds < 60) return `${diffSeconds}s`
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m`
    return `${Math.floor(diffSeconds / 3600)}h`
  }

  // Load all available controllers and devices for selection
  const availableControllers = ref<any[]>([])
  const availableDevices = ref<any[]>([])

  async function loadAvailableDevices() {
    try {
      const [controllersResponse, devicesResponse] = await Promise.all([
        controllerApi.getStatus(),
        deviceApi.getAll()
      ])

      availableControllers.value = controllersResponse.controllers || []
      availableDevices.value = Array.isArray(devicesResponse) ? devicesResponse : []

      console.log('📡 Available controllers loaded:', availableControllers.value.length)
      console.log('📱 Available devices loaded:', availableDevices.value.length)
    } catch (error) {
      console.error('❌ Failed to load available devices:', error)
    }
  }

  // Filter system data based on selected devices
  function getFilteredSystemData() {
    const selectedControllerIds = settings.value.system.selectedDevices.controllers
    const selectedDeviceIds = settings.value.system.selectedDevices.devices

    // If no devices selected, show first N online devices as fallback
    if (selectedControllerIds.length === 0 && selectedDeviceIds.length === 0) {
      const onlineControllers = availableControllers.value.filter(c => c.status === 'online').slice(0, 3)
      const onlineDevices = availableDevices.value.filter(d => d.isActive).slice(0, settings.value.system.displayLimit - onlineControllers.length)

      return {
        controllers: onlineControllers,
        devices: onlineDevices
      }
    }

    // Filter by selected IDs
    const filteredControllers = availableControllers.value.filter(c => selectedControllerIds.includes(c._id))
    const filteredDevices = availableDevices.value.filter(d => selectedDeviceIds.includes(d._id))

    return {
      controllers: filteredControllers.slice(0, settings.value.system.displayLimit),
      devices: filteredDevices.slice(0, settings.value.system.displayLimit - filteredControllers.length)
    }
  }

  function fallbackToSystemMockData() {
    // Fallback system module if API fails
    const fallbackModules = [
      {
        id: 'unified-system',
        name: 'Система',
        sectionId: 'system',
        visualizationType: 'status',
        mockData: {
          online: 10,
          offline: 1,
          total: 11,
          status: 'warning',
          label: '11 устройства (2 контролера, 7 сензори, 2 актуатори)'
        },
        isVisible: true,
        displayOrder: 1
      }
    ] as DashboardModule[]

    // Replace system modules
    modules.value = modules.value.filter(m => m.sectionId !== 'system')
    modules.value.push(...fallbackModules)
  }

  async function loadProgramData() {
    try {
      console.log('🔄 [DashboardStore] Loading program data from API...')
      const response = await fetch(`${API_BASE_URL}/dashboard/program-data`)
      if (response.ok) {
        const result = await response.json()
        console.log('✅ [DashboardStore] Program data loaded:', result.data)
        console.log('🔍 [DashboardStore] activeCycles in loaded data:', result.data?.activeCycles)
        programData.value = result.data
      }
    } catch (error) {
      console.error('Failed to load program data:', error)
      programData.value = null
    }
  }

  async function pauseProgramFromDashboard() {
    try {
      const response = await fetch(`${API_BASE_URL}/active-programs/pause`, {
        method: 'PUT'
      })

      if (response.ok) {
        // Trigger refresh
        await loadProgramData()
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to pause program:', error)
      return false
    }
  }

  async function loadAlertsSettingsFromDB() {
    try {
      console.log('📊 Loading alerts settings from database...')

      const response = await fetch(`${API_BASE_URL}/dashboard/sections/alerts/settings`)

      if (response.ok) {
        const result = await response.json()
        const alertSettings = result.data

        console.log('✅ Found alerts settings in database:', alertSettings)

        // Update alerts settings from database
        settings.value.alerts = {
          showExecutionErrors: alertSettings.showExecutionErrors ?? true,
          showSensorAlerts: alertSettings.showSensorAlerts ?? true,
          showHardwareIssues: alertSettings.showHardwareIssues ?? true,
          showSystemAlerts: alertSettings.showSystemAlerts ?? true,
          severityFilter: alertSettings.severityFilter ?? 'all',
          maxDisplayCount: alertSettings.maxDisplayCount ?? 10,
          timeWindow: alertSettings.timeWindow ?? '24h'
        }

        console.log('✅ Alerts settings loaded from database:', settings.value.alerts)
      } else if (response.status === 404) {
        console.log('ℹ️ Alerts settings not found in database - using default settings')
      } else {
        console.warn('⚠️ Failed to load alerts settings from database:', response.status)
      }
    } catch (error) {
      console.error('❌ Error loading alerts settings from DB:', error)
    }
  }

  async function saveAlertsSettingsToDB() {
    try {
      console.log('💾 Saving alerts settings to database...', settings.value.alerts)

      const response = await fetch(`${API_BASE_URL}/dashboard/sections/alerts/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings.value.alerts)
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Alerts settings saved to database successfully')
        return true
      } else {
        const errorText = await response.text()
        console.error('❌ Failed to save alerts settings:', response.status, errorText)
        return false
      }
    } catch (error) {
      console.error('❌ Error saving alerts settings to DB:', error)
      return false
    }
  }

  async function updateAlertsSettings(newAlertsSettings: Partial<DashboardSettings['alerts']>) {
    // Update local settings
    settings.value.alerts = { ...settings.value.alerts, ...newAlertsSettings }

    // Save to database
    const success = await saveAlertsSettingsToDB()

    if (success) {
      console.log('✅ Alerts settings updated and saved to database')
    } else {
      console.error('❌ Failed to save alerts settings to database')
    }

    return success
  }

  // Partial update functions for individual alert settings
  async function updateShowExecutionErrors(value: boolean) {
    try {
      console.log('💾 Updating showExecutionErrors:', value)

      const response = await fetch(`${API_BASE_URL}/dashboard/sections/alerts/show-execution-errors`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value })
      })

      if (response.ok) {
        // Update local state
        settings.value.alerts.showExecutionErrors = value
        console.log('✅ ShowExecutionErrors updated successfully')
        return true
      } else {
        const errorText = await response.text()
        console.error('❌ Failed to update showExecutionErrors:', response.status, errorText)
        return false
      }
    } catch (error) {
      console.error('❌ Error updating showExecutionErrors:', error)
      return false
    }
  }

  async function updateShowSensorAlerts(value: boolean) {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/sections/alerts/show-sensor-alerts`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value })
      })

      if (response.ok) {
        settings.value.alerts.showSensorAlerts = value
        return true
      }
      return false
    } catch (error) {
      console.error('❌ Error updating showSensorAlerts:', error)
      return false
    }
  }

  async function updateShowHardwareIssues(value: boolean) {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/sections/alerts/show-hardware-issues`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value })
      })

      if (response.ok) {
        settings.value.alerts.showHardwareIssues = value
        return true
      }
      return false
    } catch (error) {
      console.error('❌ Error updating showHardwareIssues:', error)
      return false
    }
  }

  async function updateShowSystemAlerts(value: boolean) {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/sections/alerts/show-system-alerts`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value })
      })

      if (response.ok) {
        settings.value.alerts.showSystemAlerts = value
        return true
      }
      return false
    } catch (error) {
      console.error('❌ Error updating showSystemAlerts:', error)
      return false
    }
  }

  async function updateSeverityFilter(value: DashboardSettings['alerts']['severityFilter']) {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/sections/alerts/severity-filter`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value })
      })

      if (response.ok) {
        settings.value.alerts.severityFilter = value
        return true
      }
      return false
    } catch (error) {
      console.error('❌ Error updating severityFilter:', error)
      return false
    }
  }

  async function updateMaxDisplayCount(value: number) {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/sections/alerts/max-display-count`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value })
      })

      if (response.ok) {
        settings.value.alerts.maxDisplayCount = value
        return true
      }
      return false
    } catch (error) {
      console.error('❌ Error updating maxDisplayCount:', error)
      return false
    }
  }

  async function updateTimeWindow(value: DashboardSettings['alerts']['timeWindow']) {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/sections/alerts/time-window`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value })
      })

      if (response.ok) {
        settings.value.alerts.timeWindow = value
        return true
      }
      return false
    } catch (error) {
      console.error('❌ Error updating timeWindow:', error)
      return false
    }
  }

  return {
    // State
    modules,
    programData,
    settings,
    isLoading,
    lastRefresh,

    // Computed
    sensorModules,
    systemModules, 
    programModules,
    alertModules,
    allModulesBySections,

    // Actions
    initializeMockData,
    loadSensorModulesFromDB,
    loadSystemSettingsFromDB,
    loadAlertsSettingsFromDB,
    loadSystemData,
    loadAvailableDevices,
    getFilteredSystemData,
    availableControllers,
    availableDevices,
    cleanupInvalidModules,
    updateModuleVisibility,
    updateModuleOrder,
    addModule,
    removeModule,
    updateSettings,
    updateAlertsSettings,
    updateShowExecutionErrors,
    updateShowSensorAlerts,
    updateShowHardwareIssues,
    updateShowSystemAlerts,
    updateSeverityFilter,
    updateMaxDisplayCount,
    updateTimeWindow,
    refreshData,
    loadProgramData,
    pauseProgramFromDashboard,
    getModuleById,
    getModulesBySection,
    getLayoutPreset,
    switchLayout,
    updateLayoutSettings,
  }
})
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { ApiResponse, ApiError } from '../types'
import { API_BASE_URL } from '../config/ports'

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL || API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Add timestamp to prevent caching
    if (config.params) {
      config.params._t = Date.now()
    } else {
      config.params = { _t: Date.now() }
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    return response
  },
  (error) => {
    const apiError: ApiError = {
      message: error.response?.data?.message || error.message || 'Unknown error occurred',
      status: error.response?.status || 500,
      code: error.response?.data?.code || error.code
    }
    
    // Handle specific error cases
    if (apiError.status === 401) {
      // Unauthorized - redirect to login or clear auth
      localStorage.removeItem('auth_token')
      // You might want to emit an event or use a global store here
    }
    
    return Promise.reject(apiError)
  }
)

// API service class
export class ApiService {
  private client: AxiosInstance

  constructor() {
    this.client = apiClient
  }

  // Generic GET request
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<ApiResponse<T>>(url, config)
    return response.data.data
  }

  // Generic POST request
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config)
    return response.data.data
  }

  // Generic PUT request
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config)
    return response.data.data
  }

  // Generic PATCH request
  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<ApiResponse<T>>(url, data, config)
    return response.data.data
  }

  // Generic DELETE request
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<ApiResponse<T>>(url, config)
    return response.data.data
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string; version: string }> {
    const response = await this.client.get('/health')
    return response.data
  }

  // Get raw axios instance for custom requests
  getClient(): AxiosInstance {
    return this.client
  }
}

// Export singleton instance
export const api = new ApiService()

// Export specific API endpoints
export const deviceApi = {
  getAll: async () => {
    const response = await api.getClient().get('/devices')
    return response.data || []
  },
  getById: async (id: string) => {
    const response = await api.getClient().get(`/devices/${id}`)
    return response.data
  },
  create: (data: any) => api.post('/devices', data),
  update: (id: string, data: any) => api.put(`/devices/${id}`, data),
  delete: (id: string) => api.delete(`/devices/${id}`)
}

export const deviceTemplateApi = {
  async getAll() {
    const response = await api.getClient().get('/device-templates')
    return response.data
  }
}

export const generatorApi = {
  /**
   * Get all active controllers and available commands
   */
  async preview() {
    const response = await api.getClient().get('/generator/preview')
    return response.data
  },

  /**
   * Generate firmware for controller with manual commands
   */
  async generate(controllerId: string, communicationType: string, manualCommandNames: string[]) {
    const response = await api.getClient().post('/generator/generate', {
      controllerId,
      communicationType,
      manualCommandNames
    })
    return response.data
  },

  /**
   * Download generated firmware file
   */
  downloadFirmware(filePath: string) {
    // Extract filename from full path
    const filename = filePath.split('/').pop() || 'firmware.ino'

    // Create download link
    const downloadUrl = `${api.getClient().defaults.baseURL}/generator/download?file=${encodeURIComponent(filename)}`

    // Trigger download
    window.open(downloadUrl, '_blank')
  }
}

export const taskApi = {
  getAll: () => api.get('/tasks'),
  getById: (id: string) => api.get(`/tasks/${id}`),
  create: (data: any) => api.post('/tasks', data),
  update: (id: string, data: any) => api.put(`/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`)
}

export const programApi = {
  getAll: () => api.get('/programs'),
  getById: (id: string) => api.get(`/programs/${id}`),
  create: (data: any) => api.post('/programs', data),
  update: (id: string, data: any) => api.put(`/programs/${id}`, data),
  delete: (id: string) => api.delete(`/programs/${id}`),
  start: (id: string) => api.post(`/programs/${id}/start`),
  stop: (id: string) => api.post(`/programs/${id}/stop`),
  pause: (id: string) => api.post(`/programs/${id}/pause`)
}

export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data: any) => api.put('/settings', data)
}

export const deviceSettingsApi = {
  // Device Settings (raw response format)
  getDeviceTypes: async () => {
    const response = await api.getClient().get('/settings/device-types')
    return response.data
  },
  getPorts: async () => {
    const response = await api.getClient().get('/settings/ports')
    return response.data
  },
  getConnectionTypes: async () => {
    const response = await api.getClient().get('/settings/connection-types')
    return response.data
  },
  updateDeviceTypes: (data: any) => api.put('/settings/device-types', data),
  updatePorts: (data: any) => api.put('/settings/ports', data),
  updateConnectionTypes: (data: any) => api.put('/settings/connection-types', data)
}

export const controllerApi = {
  // Physical Controllers (raw response format)
  getAll: async () => {
    const response = await api.getClient().get('/controllers')
    return response.data || []
  },
  getById: async (id: string) => {
    const response = await api.getClient().get(`/controllers/${id}`)
    return response.data
  },
  create: (data: any) => api.post('/controllers', data),
  update: (id: string, data: any) => api.put(`/controllers/${id}`, data),
  delete: (id: string) => api.delete(`/controllers/${id}`),
  updateHeartbeat: (id: string) => api.put(`/controllers/${id}/heartbeat`),
  getDevices: async (id: string) => {
    const response = await api.getClient().get(`/controllers/${id}/devices`)
    return response.data
  },
  getAvailablePorts: async (id: string) => {
    const response = await api.getClient().get(`/controllers/${id}/available-ports`)
    return response.data
  },

  // Dashboard System Status API
  getStatus: async () => {
    const response = await api.getClient().get('/controllers/status')
    return response.data
  },
  getLogs: (limit?: number) => api.get(`/controller/logs${limit ? `?limit=${limit}` : ''}`),
  getSystemInfo: () => api.get('/controller/system')
}

// DEACTIVATED: Target Registry API - Phase 1C
// export const targetRegistryApi = {
//   getAll: (type?: 'control' | 'device', isActive?: boolean) => {
//     const params: any = {}
//     if (type) params.type = type
//     if (isActive !== undefined) params.isActive = isActive
//     return api.get('/target-registry', { params })
//   },
//   getById: (id: string) => api.get(`/target-registry/${id}`),
//   create: (data: any) => api.post('/target-registry', data),
//   update: (id: string, data: any) => api.put(`/target-registry/${id}`, data),
//   delete: (id: string) => api.delete(`/target-registry/${id}`),
//   
//   // 🔥 Runtime tracking endpoints (only used by FlowExecutor)
//   trackUsage: (id: string, usage: {
//     blockId: string
//     blockType: 'actuator' | 'if' | 'loop' | 'custom'
//     fieldName: string
//     flowId?: string
//     flowName?: string
//   }) => api.put(`/target-registry/${id}/track-usage`, usage),
//   
//   untrackUsage: (id: string, blockId: string, fieldName: string) => 
//     api.delete(`/target-registry/${id}/track-usage/${blockId}/${fieldName}`),
//   
//   getUsageByBlock: (blockId: string) => api.get(`/target-registry/usage/by-block/${blockId}`),
//   
//   getAnalytics: (options?: {
//     sortBy?: 'usageCount' | 'lastUsed' | 'visualName'
//     order?: 'asc' | 'desc'
//     limit?: number
//   }) => {
//     const params: any = {}
//     if (options?.sortBy) params.sortBy = options.sortBy
//     if (options?.order) params.order = options.order
//     if (options?.limit) params.limit = options.limit
//     return api.get('/target-registry/analytics', { params })
//   }
// }

export const flowTemplateApi = {
  getAll: (options?: {
    isActive?: boolean
    flowId?: string
    isDraft?: boolean
    latestOnly?: boolean
  }) => {
    const params: any = {}
    if (options?.isActive !== undefined) params.isActive = options.isActive
    if (options?.flowId) params.flowId = options.flowId
    if (options?.isDraft !== undefined) params.isDraft = options.isDraft
    if (options?.latestOnly) params.latestOnly = options.latestOnly
    return api.get('/flow-templates', { params })
  },
  getById: (id: string) => api.get(`/flow-templates/${id}`),
  create: (data: any) => api.post('/flow-templates', data),
  update: (id: string, data: any) => api.put(`/flow-templates/${id}`, data),
  delete: (id: string) => api.delete(`/flow-templates/${id}`),
  save: (data: any) => api.post('/flow-templates/save', data),
  duplicate: (id: string, newName: string) => api.post(`/flow-templates/${id}/duplicate`, { newName }),

  // Flow versioning
  getFlowVersions: (flowId: string) => api.get(`/flow-templates/flow/${flowId}/versions`),
  getLatestVersion: (flowId: string) => api.get(`/flow-templates/flow/${flowId}/latest`),
  incrementVersion: (flowId: string, data: any) => api.post(`/flow-templates/flow/${flowId}/increment`, data),

  // Flow protection
  checkProtection: (id: string) => api.get(`/flow-templates/${id}/protection`),
  checkUsage: (flowId: string) => api.get(`/flow-templates/flow/${flowId}/usage`),

  // Directory management
  organize: () => api.post('/flow-templates/organize'),
  getDirectoryStats: () => api.get('/flow-templates/directory-stats'),

  // Usage counting
  getUsageCount: (flowId: string) => api.get(`/flow-templates/${flowId}/usage-count`),

  // Validation status management (for future use)
  updateValidationStatus: (id: string, validationData: {
    validationStatus: 'draft' | 'invalid' | 'validated' | 'ready'
    validationSummary?: {
      isValid: boolean
      lastValidatedAt: string
      criticalErrors: number
      warnings: number
      canExecute: boolean
    }
  }) => api.put(`/flow-templates/${id}/validation-status`, validationData)
}

export const actionTemplateApi = {
  getAll: (isActive?: boolean) => {
    const params: any = {}
    if (isActive !== undefined) params.isActive = isActive
    return api.get('/action-templates', { params })
  },
  getById: (id: string) => api.get(`/action-templates/${id}`),
  getByFlowId: (flowId: string) => api.get(`/action-templates/by-flow/${flowId}`),
  create: (data: any) => api.post('/action-templates', data),
  update: (id: string, data: any) => api.put(`/action-templates/${id}`, data),
  delete: (id: string) => api.delete(`/action-templates/${id}`),
  getFlowFiles: () => api.get('/action-templates/flow-files'),
  validate: (id: string) => api.post(`/action-templates/${id}/validate`),
  validateAll: () => api.post('/action-templates/validate-all')
}

export default api
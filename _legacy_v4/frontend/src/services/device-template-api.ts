import { api } from './api'

// Device Template interfaces (matching backend)
export interface IPortRequirement {
  role: string
  type: 'digital' | 'analog' | 'pwm'
  required: boolean
  defaultPin?: string
  description?: string
}

export interface IExecutionConfig {
  commandType: string
  parameters?: Record<string, any>
  responseMapping?: Record<string, any>
  timeout?: number
}

export interface IUIConfig {
  icon: string
  color: string
  formFields?: Record<string, any>
  category: string
}

// Calibration point interface
export interface ICalibrationPoint {
  name: string
  displayName: string
  targetValue: number
  targetADC?: number | null
  targetVoltage?: number | null
  unit: string
  bufferSolution?: string
  tolerance: number
  isRequired: boolean
}

// Calibration parameter interface
export interface ICalibrationParameter {
  name: string
  displayName: string
  type: 'boolean' | 'number' | 'select' | 'string'
  defaultValue: any
  options?: string[]
  min?: number
  max?: number
  step?: number
  unit?: string
  description?: string
}

// Calibration validation rules
export interface ICalibrationValidation {
  minCalibrationPoints: number
  maxTimeBetweenCalibrations: number
  stabilityRequiredTime: number
  maxReadingAge: number
}

// Calibration UI configuration
export interface ICalibrationUI {
  showLiveReadings: boolean
  showStabilityIndicator: boolean
  showCalibrationHistory: boolean
  showTemperatureReading?: boolean
  showDriftAlert?: boolean
  readingInterval: number
  stabilityThreshold: number
}

// Main calibration configuration interface
export interface ICalibrationConfig {
  type: 'sensor' | 'actuator'
  calibrationMethod: 'single_point' | 'multi_point' | 'parameter_based'
  isRequired: boolean
  calibrationPoints?: ICalibrationPoint[]
  testActions: string[]
  parametersToCalibrate: ICalibrationParameter[]
  validation: ICalibrationValidation
  ui: ICalibrationUI
}

export interface IDeviceTemplate {
  _id?: string
  type: string
  displayName: string
  description: string
  manufacturer?: string
  model?: string
  portRequirements: IPortRequirement[]
  executionConfig: IExecutionConfig
  uiConfig: IUIConfig
  calibrationConfig?: ICalibrationConfig
  isActive: boolean
  version: string
  createdAt?: Date
  updatedAt?: Date
}

export interface DeviceTemplateResponse {
  success: boolean
  data: IDeviceTemplate | IDeviceTemplate[]
  message?: string
  count?: number
  error?: string
}

/**
 * Device Template API Service
 * Handles all device template related API calls
 */
class DeviceTemplateApiService {
  private baseUrl = '/device-templates'

  /**
   * Get all device templates
   */
  async getAll(params?: { 
    active?: boolean 
  }): Promise<IDeviceTemplate[]> {
    try {
      const queryParams = new URLSearchParams()
      
      if (params?.active !== undefined) {
        queryParams.append('active', params.active.toString())
      }
      
      const url = queryParams.toString() 
        ? `${this.baseUrl}?${queryParams.toString()}`
        : this.baseUrl
      
      // Use raw axios client to get full response structure
      const response = await api.getClient().get(url)
      
      if (response.data.success && Array.isArray(response.data.data)) {
        return response.data.data as IDeviceTemplate[]
      }
      
      throw new Error(response.data.message || 'Failed to fetch device templates')
    } catch (error) {
      console.error('[DeviceTemplateApi] Error fetching templates:', error)
      throw error
    }
  }

  /**
   * Get device template by ID
   */
  async getById(id: string): Promise<IDeviceTemplate> {
    try {
      const response = await api.getClient().get(`${this.baseUrl}/${id}`)
      
      if (response.data.success && !Array.isArray(response.data.data)) {
        return response.data.data as IDeviceTemplate
      }
      
      throw new Error(response.data.message || 'Device template not found')
    } catch (error) {
      console.error(`[DeviceTemplateApi] Error fetching template ${id}:`, error)
      throw error
    }
  }

  /**
   * Get device template by type
   */
  async getByType(type: string): Promise<IDeviceTemplate> {
    try {
      const response = await api.getClient().get(`${this.baseUrl}/type/${type}`)
      
      if (response.data.success && !Array.isArray(response.data.data)) {
        return response.data.data as IDeviceTemplate
      }
      
      throw new Error(response.data.message || `Device template type '${type}' not found`)
    } catch (error) {
      console.error(`[DeviceTemplateApi] Error fetching template type ${type}:`, error)
      throw error
    }
  }

  /**
   * Create new device template
   */
  async create(template: Omit<IDeviceTemplate, '_id' | 'createdAt' | 'updatedAt'>): Promise<IDeviceTemplate> {
    try {
      const response = await api.getClient().post(this.baseUrl, template)
      
      if (response.data.success && !Array.isArray(response.data.data)) {
        return response.data.data as IDeviceTemplate
      }
      
      throw new Error(response.data.message || 'Failed to create device template')
    } catch (error) {
      console.error('[DeviceTemplateApi] Error creating template:', error)
      throw error
    }
  }

  /**
   * Update device template
   */
  async update(id: string, template: Partial<IDeviceTemplate>): Promise<IDeviceTemplate> {
    try {
      const response = await api.getClient().put(`${this.baseUrl}/${id}`, template)
      
      if (response.data.success && !Array.isArray(response.data.data)) {
        return response.data.data as IDeviceTemplate
      }
      
      throw new Error(response.data.message || 'Failed to update device template')
    } catch (error) {
      console.error(`[DeviceTemplateApi] Error updating template ${id}:`, error)
      throw error
    }
  }

  /**
   * Delete device template (soft delete)
   */
  async delete(id: string): Promise<IDeviceTemplate> {
    try {
      const response = await api.getClient().delete(`${this.baseUrl}/${id}`)
      
      if (response.data.success && !Array.isArray(response.data.data)) {
        return response.data.data as IDeviceTemplate
      }
      
      throw new Error(response.data.message || 'Failed to delete device template')
    } catch (error) {
      console.error(`[DeviceTemplateApi] Error deleting template ${id}:`, error)
      throw error
    }
  }

  /**
   * Activate device template
   */
  async activate(id: string): Promise<IDeviceTemplate> {
    try {
      const response = await api.getClient().post(`${this.baseUrl}/${id}/activate`)
      
      if (response.data.success && !Array.isArray(response.data.data)) {
        return response.data.data as IDeviceTemplate
      }
      
      throw new Error(response.data.message || 'Failed to activate device template')
    } catch (error) {
      console.error(`[DeviceTemplateApi] Error activating template ${id}:`, error)
      throw error
    }
  }

  /**
   * Get active templates only
   */
  async getActive(): Promise<IDeviceTemplate[]> {
    return this.getAll({ active: true })
  }
}

// Export singleton instance
export const deviceTemplateApi = new DeviceTemplateApiService()
export default deviceTemplateApi
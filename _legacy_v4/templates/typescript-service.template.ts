import { api } from './api'
import type { ApiResponse } from '../types'

// Define interfaces for this service
export interface IExampleItem {
  _id: string
  name: string
  description?: string
  status: 'active' | 'inactive'
  createdAt: Date
  updatedAt: Date
}

export interface ICreateExampleRequest {
  name: string
  description?: string
}

export interface IUpdateExampleRequest {
  name?: string
  description?: string
  status?: 'active' | 'inactive'
}

export interface IExampleListResponse {
  items: IExampleItem[]
  total: number
  page: number
  limit: number
}

/**
 * Service for managing Example entities
 * Follows the established pattern of static methods and consistent error handling
 */
class ExampleService {
  private static readonly BASE_URL = '/api/v1/examples'

  /**
   * Get all examples with pagination
   */
  static async getAll(page: number = 1, limit: number = 10): Promise<IExampleListResponse> {
    try {
      const response = await api.get<ApiResponse<IExampleListResponse>>(
        `${this.BASE_URL}?page=${page}&limit=${limit}`
      )
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch examples')
      }
      
      return response.data.data
    } catch (error) {
      console.error('Failed to fetch examples:', error)
      throw error instanceof Error ? error : new Error('Unknown error occurred')
    }
  }

  /**
   * Get example by ID
   */
  static async getById(id: string): Promise<IExampleItem> {
    if (!id) {
      throw new Error('Example ID is required')
    }

    try {
      const response = await api.get<ApiResponse<IExampleItem>>(`${this.BASE_URL}/${id}`)
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch example')
      }
      
      return response.data.data
    } catch (error) {
      console.error(`Failed to fetch example ${id}:`, error)
      throw error instanceof Error ? error : new Error('Unknown error occurred')
    }
  }

  /**
   * Create new example
   */
  static async create(data: ICreateExampleRequest): Promise<IExampleItem> {
    // Validation
    if (!data.name?.trim()) {
      throw new Error('Example name is required')
    }

    try {
      const response = await api.post<ApiResponse<IExampleItem>>(this.BASE_URL, data)
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create example')
      }
      
      return response.data.data
    } catch (error) {
      console.error('Failed to create example:', error)
      throw error instanceof Error ? error : new Error('Unknown error occurred')
    }
  }

  /**
   * Update existing example
   */
  static async update(id: string, data: IUpdateExampleRequest): Promise<IExampleItem> {
    if (!id) {
      throw new Error('Example ID is required')
    }

    try {
      const response = await api.put<ApiResponse<IExampleItem>>(`${this.BASE_URL}/${id}`, data)
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update example')
      }
      
      return response.data.data
    } catch (error) {
      console.error(`Failed to update example ${id}:`, error)
      throw error instanceof Error ? error : new Error('Unknown error occurred')
    }
  }

  /**
   * Delete example
   */
  static async delete(id: string): Promise<void> {
    if (!id) {
      throw new Error('Example ID is required')
    }

    try {
      const response = await api.delete<ApiResponse<void>>(`${this.BASE_URL}/${id}`)
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete example')
      }
    } catch (error) {
      console.error(`Failed to delete example ${id}:`, error)
      throw error instanceof Error ? error : new Error('Unknown error occurred')
    }
  }

  /**
   * Toggle example status
   */
  static async toggleStatus(id: string): Promise<IExampleItem> {
    if (!id) {
      throw new Error('Example ID is required')
    }

    try {
      const current = await this.getById(id)
      const newStatus = current.status === 'active' ? 'inactive' : 'active'
      
      return await this.update(id, { status: newStatus })
    } catch (error) {
      console.error(`Failed to toggle status for example ${id}:`, error)
      throw error instanceof Error ? error : new Error('Unknown error occurred')
    }
  }

  /**
   * Search examples by name
   */
  static async search(query: string, page: number = 1, limit: number = 10): Promise<IExampleListResponse> {
    if (!query?.trim()) {
      return await this.getAll(page, limit)
    }

    try {
      const response = await api.get<ApiResponse<IExampleListResponse>>(
        `${this.BASE_URL}/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
      )
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to search examples')
      }
      
      return response.data.data
    } catch (error) {
      console.error('Failed to search examples:', error)
      throw error instanceof Error ? error : new Error('Unknown error occurred')
    }
  }
}

export default ExampleService
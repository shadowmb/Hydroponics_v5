import { api } from './api'

export interface MonitoringTag {
  _id: string
  name: string
  description?: string
  isActive: boolean
  type: 'monitoring' | 'tolerance'
  tolerance?: number
  createdAt: string
  updatedAt: string
}

export interface MonitoringData {
  _id: string
  tagId: string | MonitoringTag
  value: number
  timestamp: string
  flowId: string
  blockId: string
  programId?: string
  cycleId?: string
  createdAt: string
}

export interface CreateTagRequest {
  name: string
  description?: string
  isActive?: boolean
  type?: 'monitoring' | 'tolerance'
  tolerance?: number
}

export interface UpdateTagRequest {
  name?: string
  description?: string
  isActive?: boolean
  type?: 'monitoring' | 'tolerance'
  tolerance?: number
}

export interface MonitoringDataQuery {
  tagId?: string
  flowId?: string
  blockId?: string
  programId?: string
  cycleId?: string
  startDate?: string
  endDate?: string
  limit?: number
  page?: number
  sort?: string
  order?: 'asc' | 'desc'
}

export interface MonitoringDataStats {
  timeRange: string
  count: number
  avgValue: number
  minValue: number
  maxValue: number
  lastValue: number
  firstTimestamp: string
  lastTimestamp: string
}

class MonitoringService {
  private baseUrl = '/monitoring'

  // ========================
  // MONITORING TAGS
  // ========================

  async getTags(activeOnly?: boolean): Promise<MonitoringTag[]> {
    const params = activeOnly !== undefined ? { active: activeOnly.toString() } : undefined
    const response = await api.getClient().get(`${this.baseUrl}/tags`, { params })
    return response.data.data
  }

  async getTag(id: string): Promise<MonitoringTag> {
    const response = await api.getClient().get(`${this.baseUrl}/tags/${id}`)
    return response.data.data
  }

  async createTag(data: CreateTagRequest): Promise<MonitoringTag> {
    const response = await api.getClient().post(`${this.baseUrl}/tags`, data)
    return response.data.data
  }

  async updateTag(id: string, data: UpdateTagRequest): Promise<MonitoringTag> {
    const response = await api.getClient().put(`${this.baseUrl}/tags/${id}`, data)
    return response.data.data
  }

  async deleteTag(id: string): Promise<void> {
    await api.getClient().delete(`${this.baseUrl}/tags/${id}`)
  }

  // ========================
  // MONITORING DATA
  // ========================

  async getData(query: MonitoringDataQuery = {}): Promise<{
    data: MonitoringData[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }> {
    const response = await api.getClient().get(`${this.baseUrl}/data`, { params: query })
    return response.data
  }

  async getLatestData(tagId: string): Promise<MonitoringData> {
    const response = await api.getClient().get(`${this.baseUrl}/data/latest/${tagId}`)
    return response.data.data
  }

  async getDataStats(tagId: string, hours: number = 24): Promise<MonitoringDataStats> {
    const response = await api.getClient().get(`${this.baseUrl}/data/stats/${tagId}`, {
      params: { hours }
    })
    return response.data.data
  }

  async createData(data: {
    tagId: string
    value: number
    flowId: string
    blockId: string
    programId?: string
    cycleId?: string
  }): Promise<MonitoringData> {
    const response = await api.getClient().post(`${this.baseUrl}/data`, data)
    return response.data.data
  }

  // ========================
  // FILTERED TAG METHODS
  // ========================

  async getMonitoringTags(activeOnly?: boolean): Promise<MonitoringTag[]> {
    const allTags = await this.getTags(activeOnly)
    return allTags.filter(tag => tag.type === 'monitoring')
  }

  async getToleranceTags(activeOnly?: boolean): Promise<MonitoringTag[]> {
    const allTags = await this.getTags(activeOnly)
    return allTags.filter(tag => tag.type === 'tolerance')
  }
}

export const monitoringService = new MonitoringService()
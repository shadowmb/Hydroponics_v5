import { Router, Request, Response } from 'express'
import mongoose from 'mongoose'
import { MonitoringTag, IMonitoringTag } from '../models/MonitoringTag'
import { MonitoringData, IMonitoringData } from '../models/MonitoringData'

const router = Router()

// ===============================
// MONITORING TAGS ROUTES
// ===============================

// GET /api/v1/monitoring/tags - Get all monitoring tags
router.get('/tags', async (req: Request, res: Response) => {
  try {
    const { active } = req.query
    
    const filter: any = {}
    if (active !== undefined) {
      filter.isActive = active === 'true'
    }

    const tags = await MonitoringTag.find(filter).sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      data: tags,
      count: tags.length
    })
  } catch (error: any) {
    console.error('Error fetching monitoring tags:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch monitoring tags',
      details: error.message
    })
  }
})

// GET /api/v1/monitoring/tags/:id - Get single monitoring tag
router.get('/tags/:id', async (req: Request, res: Response) => {
  try {
    const tag = await MonitoringTag.findById(req.params.id)

    if (!tag) {
      return res.status(404).json({
        success: false,
        error: 'Monitoring tag not found'
      })
    }

    res.status(200).json({
      success: true,
      data: tag
    })
  } catch (error: any) {
    console.error('Error fetching monitoring tag:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch monitoring tag',
      details: error.message
    })
  }
})

// POST /api/v1/monitoring/tags - Create new monitoring tag
router.post('/tags', async (req: Request, res: Response) => {
  try {
    const { name, description, isActive, type, tolerance } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Tag name is required'
      })
    }

    // Check for duplicate name
    const existingTag = await MonitoringTag.findOne({ name: name.trim() })
    if (existingTag) {
      return res.status(400).json({
        success: false,
        error: 'Tag name already exists'
      })
    }

    const tagData: any = {
      name: name.trim(),
      description: description?.trim() || '',
      isActive: isActive !== false,
      type: type || 'monitoring'
    }

    if (type === 'tolerance' && tolerance !== undefined) {
      tagData.tolerance = tolerance
    }

    const tag = new MonitoringTag(tagData)
    const savedTag = await tag.save()

    res.status(201).json({
      success: true,
      data: savedTag,
      message: 'Monitoring tag created successfully'
    })
  } catch (error: any) {
    console.error('Error creating monitoring tag:', error)

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message)
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      })
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Tag name already exists'
      })
    }

    // Handle custom validation errors from pre-save hooks
    if (error.message && error.message.includes('Tolerance value is required')) {
      return res.status(400).json({
        success: false,
        error: error.message
      })
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create monitoring tag',
      details: error.message
    })
  }
})

// PUT /api/v1/monitoring/tags/:id - Update monitoring tag
router.put('/tags/:id', async (req: Request, res: Response) => {
  try {
    const { name, description, isActive, type, tolerance } = req.body

    const updateData: Partial<IMonitoringTag> = {}
    
    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Tag name cannot be empty'
        })
      }
      updateData.name = name.trim()
    }
    
    if (description !== undefined) updateData.description = description.trim()
    if (isActive !== undefined) updateData.isActive = isActive
    if (type !== undefined) updateData.type = type
    if (tolerance !== undefined) updateData.tolerance = tolerance

    const tag = await MonitoringTag.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )

    if (!tag) {
      return res.status(404).json({
        success: false,
        error: 'Monitoring tag not found'
      })
    }

    res.status(200).json({
      success: true,
      data: tag,
      message: 'Monitoring tag updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating monitoring tag:', error)
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message)
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      })
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Tag name already exists'
      })
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update monitoring tag',
      details: error.message
    })
  }
})

// DELETE /api/v1/monitoring/tags/:id - Delete monitoring tag
router.delete('/tags/:id', async (req: Request, res: Response) => {
  try {
    const tag = await MonitoringTag.findById(req.params.id)

    if (!tag) {
      return res.status(404).json({
        success: false,
        error: 'Monitoring tag not found'
      })
    }

    // Check if tag has associated monitoring data
    const dataCount = await MonitoringData.countDocuments({ tagId: req.params.id })
    if (dataCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete tag: ${dataCount} monitoring records exist. Consider deactivating instead.`
      })
    }

    await MonitoringTag.findByIdAndDelete(req.params.id)

    res.status(200).json({
      success: true,
      message: 'Monitoring tag deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting monitoring tag:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete monitoring tag',
      details: error.message
    })
  }
})

// ===============================
// MONITORING DATA ROUTES
// ===============================

// GET /api/v1/monitoring/data - Get monitoring data with filtering
router.get('/data', async (req: Request, res: Response) => {
  try {
    const { 
      tagId, 
      flowId, 
      blockId, 
      programId, 
      cycleId,
      startDate, 
      endDate, 
      limit = 100, 
      page = 1,
      sort = 'timestamp',
      order = 'desc'
    } = req.query

    // Build filter
    const filter: any = {}
    if (tagId) filter.tagId = tagId
    if (flowId) filter.flowId = flowId
    if (blockId) filter.blockId = blockId
    if (programId) filter.programId = programId
    if (cycleId) filter.cycleId = cycleId

    // Date range filtering
    if (startDate || endDate) {
      filter.timestamp = {}
      if (startDate) filter.timestamp.$gte = new Date(startDate as string)
      if (endDate) filter.timestamp.$lte = new Date(endDate as string)
    }

    // Pagination
    const limitNum = Math.min(parseInt(limit as string), 1000) // Max 1000 records
    const skip = (parseInt(page as string) - 1) * limitNum

    // Sorting
    const sortObj: any = {}
    sortObj[sort as string] = order === 'asc' ? 1 : -1

    const data = await MonitoringData.find(filter)
      .populate('tagId', 'name description')
      .sort(sortObj)
      .limit(limitNum)
      .skip(skip)

    const total = await MonitoringData.countDocuments(filter)

    res.status(200).json({
      success: true,
      data,
      pagination: {
        page: parseInt(page as string),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    })
  } catch (error: any) {
    console.error('Error fetching monitoring data:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch monitoring data',
      details: error.message
    })
  }
})

// GET /api/v1/monitoring/data/latest/:tagId - Get latest value for a tag
router.get('/data/latest/:tagId', async (req: Request, res: Response) => {
  try {
    const latestData = await MonitoringData.findOne({ tagId: req.params.tagId })
      .populate('tagId', 'name description')
      .sort({ timestamp: -1 })

    if (!latestData) {
      return res.status(404).json({
        success: false,
        error: 'No data found for this tag'
      })
    }

    res.status(200).json({
      success: true,
      data: latestData
    })
  } catch (error: any) {
    console.error('Error fetching latest monitoring data:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch latest monitoring data',
      details: error.message
    })
  }
})

// GET /api/v1/monitoring/data/stats/:tagId - Get statistics for a tag
router.get('/data/stats/:tagId', async (req: Request, res: Response) => {
  try {
    const { hours = 24 } = req.query
    const hoursNum = parseInt(hours as string)
    const startTime = new Date(Date.now() - hoursNum * 60 * 60 * 1000)

    const stats = await MonitoringData.aggregate([
      {
        $match: {
          tagId: new mongoose.Types.ObjectId(req.params.tagId),
          timestamp: { $gte: startTime }
        }
      },
      {
        $sort: { timestamp: 1 }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          avgValue: { $avg: '$value' },
          minValue: { $min: '$value' },
          maxValue: { $max: '$value' },
          firstTimestamp: { $min: '$timestamp' },
          lastTimestamp: { $max: '$timestamp' },
          lastValue: { $last: '$value' }
        }
      }
    ])

    if (stats.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No data found for this tag in the specified time range'
      })
    }

    res.status(200).json({
      success: true,
      data: {
        timeRange: `${hoursNum} hours`,
        ...stats[0]
      }
    })
  } catch (error: any) {
    console.error('Error fetching monitoring stats:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch monitoring stats',
      details: error.message
    })
  }
})

// POST /api/v1/monitoring/data - Create monitoring data (for testing)
router.post('/data', async (req: Request, res: Response) => {
  try {
    const { tagId, value, flowId, blockId, programId, cycleId } = req.body

    if (!tagId || value === undefined || !flowId || !blockId) {
      return res.status(400).json({
        success: false,
        error: 'tagId, value, flowId, and blockId are required'
      })
    }

    // Verify tag exists
    const tag = await MonitoringTag.findById(tagId)
    if (!tag) {
      return res.status(404).json({
        success: false,
        error: 'Monitoring tag not found'
      })
    }

    const data = new MonitoringData({
      tagId,
      value,
      flowId,
      blockId,
      programId: programId || undefined,
      cycleId: cycleId || undefined
    })

    const savedData = await data.save()

    res.status(201).json({
      success: true,
      data: savedData,
      message: 'Monitoring data created successfully'
    })
  } catch (error: any) {
    console.error('Error creating monitoring data:', error)
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message)
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      })
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create monitoring data',
      details: error.message
    })
  }
})

export default router
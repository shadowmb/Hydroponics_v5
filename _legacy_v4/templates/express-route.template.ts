import { Router, Request, Response } from 'express'
import mongoose from 'mongoose'
import { Example, IExample } from '../models/Example'
import { ExampleService } from '../services/ExampleService'

const router = Router()

// GET /api/v1/examples - Get all examples with pagination and filtering
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10))
    const status = req.query.status as string
    const category = req.query.category as string

    // Build filter object
    const filter: any = {}
    if (status && ['active', 'inactive', 'pending'].includes(status)) {
      filter.status = status
    }
    if (category) {
      filter.category = category.toLowerCase()
    }

    const result = await ExampleService.getAllPaginated(filter, page, limit)

    res.json({
      success: true,
      data: result,
      message: 'Examples retrieved successfully'
    })
  } catch (error) {
    console.error('Failed to fetch examples:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch examples'
    })
  }
})

// GET /api/v1/examples/search - Search examples
router.get('/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10))

    if (!query?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      })
    }

    const result = await ExampleService.search(query, page, limit)

    res.json({
      success: true,
      data: result,
      message: 'Search completed successfully'
    })
  } catch (error) {
    console.error('Failed to search examples:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Search failed'
    })
  }
})

// GET /api/v1/examples/:id - Get example by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid example ID format'
      })
    }

    const example = await ExampleService.getById(id)
    
    if (!example) {
      return res.status(404).json({
        success: false,
        message: 'Example not found'
      })
    }

    res.json({
      success: true,
      data: example,
      message: 'Example retrieved successfully'
    })
  } catch (error) {
    console.error(`Failed to fetch example ${req.params.id}:`, error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch example'
    })
  }
})

// POST /api/v1/examples - Create new example
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, category, tags, settings } = req.body

    // Validation
    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Example name is required'
      })
    }

    if (!category?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category is required'
      })
    }

    // Additional validation
    if (name.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Name cannot exceed 100 characters'
      })
    }

    const exampleData = {
      name: name.trim(),
      description: description?.trim(),
      category: category.trim().toLowerCase(),
      tags: Array.isArray(tags) ? tags.map((tag: string) => tag.trim().toLowerCase()) : [],
      settings: settings || {}
    }

    const newExample = await ExampleService.create(exampleData)

    res.status(201).json({
      success: true,
      data: newExample,
      message: 'Example created successfully'
    })
  } catch (error) {
    console.error('Failed to create example:', error)
    
    // Handle duplicate key error
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return res.status(409).json({
        success: false,
        message: 'An example with this name already exists'
      })
    }

    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create example'
    })
  }
})

// PUT /api/v1/examples/:id - Update existing example
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { name, description, category, status, tags, settings } = req.body

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid example ID format'
      })
    }

    // Build update object (only include provided fields)
    const updateData: any = {}
    if (name !== undefined) {
      if (!name?.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Example name cannot be empty'
        })
      }
      updateData.name = name.trim()
    }
    if (description !== undefined) updateData.description = description?.trim()
    if (category !== undefined) updateData.category = category?.trim().toLowerCase()
    if (status !== undefined) {
      if (!['active', 'inactive', 'pending'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be active, inactive, or pending'
        })
      }
      updateData.status = status
    }
    if (Array.isArray(tags)) {
      updateData.tags = tags.map((tag: string) => tag.trim().toLowerCase())
    }
    if (settings !== undefined) updateData.settings = settings

    const updatedExample = await ExampleService.update(id, updateData)

    if (!updatedExample) {
      return res.status(404).json({
        success: false,
        message: 'Example not found'
      })
    }

    res.json({
      success: true,
      data: updatedExample,
      message: 'Example updated successfully'
    })
  } catch (error) {
    console.error(`Failed to update example ${req.params.id}:`, error)

    // Handle duplicate key error
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return res.status(409).json({
        success: false,
        message: 'An example with this name already exists'
      })
    }

    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update example'
    })
  }
})

// PATCH /api/v1/examples/:id/status - Toggle example status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid example ID format'
      })
    }

    const updatedExample = await ExampleService.toggleStatus(id)

    if (!updatedExample) {
      return res.status(404).json({
        success: false,
        message: 'Example not found'
      })
    }

    res.json({
      success: true,
      data: updatedExample,
      message: `Example status changed to ${updatedExample.status}`
    })
  } catch (error) {
    console.error(`Failed to toggle status for example ${req.params.id}:`, error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to toggle example status'
    })
  }
})

// DELETE /api/v1/examples/:id - Delete example
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid example ID format'
      })
    }

    const deleted = await ExampleService.delete(id)

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Example not found'
      })
    }

    res.json({
      success: true,
      message: 'Example deleted successfully'
    })
  } catch (error) {
    console.error(`Failed to delete example ${req.params.id}:`, error)
    
    // Handle dependency errors
    if (error instanceof Error && error.message.includes('child references')) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete example that has dependencies'
      })
    }

    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete example'
    })
  }
})

// POST /api/v1/examples/:id/sub-items - Add sub-item to example
router.post('/:id/sub-items', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { name, value, isActive } = req.body

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid example ID format'
      })
    }

    // Validate sub-item data
    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Sub-item name is required'
      })
    }

    if (typeof value !== 'number' || value < 0) {
      return res.status(400).json({
        success: false,
        message: 'Sub-item value must be a non-negative number'
      })
    }

    const subItemData = {
      name: name.trim(),
      value,
      isActive: isActive !== undefined ? Boolean(isActive) : true
    }

    const updatedExample = await ExampleService.addSubItem(id, subItemData)

    if (!updatedExample) {
      return res.status(404).json({
        success: false,
        message: 'Example not found'
      })
    }

    res.status(201).json({
      success: true,
      data: updatedExample,
      message: 'Sub-item added successfully'
    })
  } catch (error) {
    console.error(`Failed to add sub-item to example ${req.params.id}:`, error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to add sub-item'
    })
  }
})

export default router
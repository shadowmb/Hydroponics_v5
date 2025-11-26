// ABOUTME: Tutorial system API routes for managing tutorials and user progress
// ABOUTME: Provides endpoints for tutorial CRUD operations, progress tracking, and demo data

import { Router, Request, Response } from 'express'
import { Tutorial, TutorialProgress } from '../models'

const router = Router()

// GET /api/v1/tutorials - List all tutorials
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, isActive } = req.query

    const filter: any = {}
    if (category) filter.category = category
    if (isActive !== undefined) filter.isActive = isActive === 'true'

    const tutorials = await Tutorial.find(filter)
      .select('id title description category prerequisites estimatedMinutes isActive createdAt')
      .sort({ category: 1, estimatedMinutes: 1 })

    res.json({
      success: true,
      data: tutorials,
      count: tutorials.length,
      message: 'Tutorials retrieved successfully'
    })
  } catch (error: any) {
    console.error('[TutorialRoutes] Error fetching tutorials:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tutorials',
      details: error.message
    })
  }
})

// GET /api/v1/tutorials/by-id/:tutorialId - Get tutorial by tutorialId (text ID)
router.get('/by-id/:tutorialId', async (req: Request, res: Response) => {
  try {
    const tutorialId = req.params.tutorialId

    const tutorial = await Tutorial.findOne({ id: tutorialId })

    if (!tutorial) {
      return res.status(404).json({
        success: false,
        error: 'Tutorial not found'
      })
    }

    res.json({
      success: true,
      data: tutorial,
      message: 'Tutorial retrieved successfully'
    })
  } catch (error: any) {
    console.error('[TutorialRoutes] Error fetching tutorial by tutorialId:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tutorial',
      details: error.message
    })
  }
})

// GET /api/v1/tutorials/:id - Get specific tutorial by MongoDB _id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const tutorialId = req.params.id

    const tutorial = await Tutorial.findById(tutorialId)

    if (!tutorial) {
      return res.status(404).json({
        success: false,
        error: 'Tutorial not found'
      })
    }

    res.json({
      success: true,
      data: tutorial,
      message: 'Tutorial retrieved successfully'
    })
  } catch (error: any) {
    console.error('[TutorialRoutes] Error fetching tutorial:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tutorial',
      details: error.message
    })
  }
})

// GET /api/v1/tutorials/:id/progress - Get progress for tutorial
router.get('/:id/progress', async (req: Request, res: Response) => {
  try {
    const tutorialId = req.params.id

    // Check if tutorial exists
    const tutorial = await Tutorial.findById(tutorialId)
    if (!tutorial) {
      return res.status(404).json({
        success: false,
        error: 'Tutorial not found'
      })
    }

    // Find or create progress record using tutorial._id
    let progress = await TutorialProgress.findByTutorial(tutorial._id.toString())

    if (!progress) {
      progress = await TutorialProgress.createProgress(tutorial._id.toString())
    }

    res.json({
      success: true,
      data: progress,
      message: 'Tutorial progress retrieved successfully'
    })
  } catch (error: any) {
    console.error('[TutorialRoutes] Error fetching tutorial progress:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tutorial progress',
      details: error.message
    })
  }
})

// POST /api/v1/tutorials/:id/start - Start tutorial
router.post('/:id/start', async (req: Request, res: Response) => {
  try {
    const tutorialId = req.params.id
    const { restart = false } = req.body

    // Check if tutorial exists and is active
    const tutorial = await Tutorial.findById(tutorialId)
    if (!tutorial || !tutorial.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Tutorial not found or inactive'
      })
    }

    // Find existing progress or create new using tutorial._id
    let progress = await TutorialProgress.findByTutorial(tutorial._id.toString())

    if (progress) {
      if (restart) {
        // Reset existing progress
        await progress.reset()
      }
      // If progress exists and no restart, continue from current step
    } else {
      // Create new progress record using tutorial._id
      progress = await TutorialProgress.createProgress(tutorial._id.toString())
    }

    // Set initial step if not already set
    if (!progress.currentStep && tutorial.steps.length > 0) {
      await progress.setCurrentStep(tutorial.steps[0].id)
    }

    res.json({
      success: true,
      data: {
        _id: progress._id, // Add progress ID for frontend
        tutorialId: tutorial.id,
        title: tutorial.title,
        currentStep: progress.currentStep,
        status: progress.status,
        totalSteps: tutorial.steps.length,
        completedSteps: progress.completedSteps.length,
        estimatedMinutes: tutorial.estimatedMinutes,
        startedAt: progress.startedAt
      },
      message: 'Tutorial started successfully'
    })
  } catch (error: any) {
    console.error('[TutorialRoutes] Error starting tutorial:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to start tutorial',
      details: error.message
    })
  }
})

// PUT /api/v1/tutorials/:id/progress - Update progress
router.put('/:id/progress', async (req: Request, res: Response) => {
  try {
    const tutorialId = req.params.id
    const { currentStep, completedSteps, status, sessionData, notes } = req.body

    // Find progress record using MongoDB _id
    let progress = await TutorialProgress.findByTutorial(tutorialId)

    if (!progress) {
      return res.status(404).json({
        success: false,
        error: 'Tutorial progress not found. Start the tutorial first.'
      })
    }

    // Validate tutorial exists
    const tutorial = await Tutorial.findById(tutorialId)
    if (!tutorial) {
      return res.status(404).json({
        success: false,
        error: 'Tutorial not found'
      })
    }

    // Validate steps exist in tutorial
    if (currentStep) {
      const stepExists = tutorial.steps.some(step => step.id === currentStep)
      if (!stepExists) {
        return res.status(400).json({
          success: false,
          error: 'Invalid current step ID'
        })
      }
    }

    if (completedSteps) {
      const validSteps = tutorial.steps.map(step => step.id)
      const invalidSteps = completedSteps.filter((stepId: string) => !validSteps.includes(stepId))
      if (invalidSteps.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Invalid completed step IDs: ${invalidSteps.join(', ')}`
        })
      }
    }

    // Update progress
    if (currentStep !== undefined) progress.currentStep = currentStep
    if (completedSteps !== undefined) progress.completedSteps = completedSteps
    if (status !== undefined) progress.status = status
    if (sessionData !== undefined) progress.sessionData = { ...progress.sessionData, ...sessionData }
    if (notes !== undefined) progress.notes = notes

    await progress.save()

    res.json({
      success: true,
      data: progress,
      message: 'Tutorial progress updated successfully'
    })
  } catch (error: any) {
    console.error('[TutorialRoutes] Error updating tutorial progress:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update tutorial progress',
      details: error.message
    })
  }
})

// POST /api/v1/tutorials/:id/complete - Complete tutorial (delete progress, mark tutorial as completed)
router.post('/:id/complete', async (req: Request, res: Response) => {
  try {
    const tutorialId = req.params.id

    // Find progress record using MongoDB _id
    let progress = await TutorialProgress.findByTutorial(tutorialId)

    if (!progress) {
      return res.status(404).json({
        success: false,
        error: 'Tutorial progress not found. Start the tutorial first.'
      })
    }

    // Find tutorial and mark as completed
    const tutorial = await Tutorial.findById(tutorialId)
    if (tutorial) {
      tutorial.isCompleted = true
      await tutorial.save()
    }

    // Delete progress record (tutorial is completed)
    await TutorialProgress.findByIdAndDelete(progress._id)

    res.json({
      success: true,
      data: {
        tutorialId: progress.tutorialId,
        totalAttempts: progress.totalAttempts,
        completedSteps: progress.completedSteps.length,
        isCompleted: true
      },
      message: 'Tutorial completed successfully'
    })
  } catch (error: any) {
    console.error('[TutorialRoutes] Error completing tutorial:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to complete tutorial',
      details: error.message
    })
  }
})

// POST /api/v1/tutorials/reset - Reset all tutorial progress
router.post('/reset', async (req: Request, res: Response) => {
  try {
    const { tutorialId } = req.body

    let deletedCount = 0

    if (tutorialId) {
      // Reset specific tutorial
      const progress = await TutorialProgress.findByTutorial(tutorialId)
      if (progress) {
        await progress.reset()
        deletedCount = 1
      }
    } else {
      // Reset all tutorials (no user filtering since no users)
      const result = await TutorialProgress.deleteMany({})
      deletedCount = result.deletedCount || 0
    }

    res.json({
      success: true,
      data: {
        resetCount: deletedCount,
        tutorialId: tutorialId || 'all'
      },
      message: `Tutorial progress reset successfully (${deletedCount} records)`
    })
  } catch (error: any) {
    console.error('[TutorialRoutes] Error resetting tutorial progress:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to reset tutorial progress',
      details: error.message
    })
  }
})

// GET /api/v1/tutorials/:id/demo-data - Get mock data for tutorial
router.get('/:id/demo-data', async (req: Request, res: Response) => {
  try {
    const tutorialId = req.params.id

    const tutorial = await Tutorial.findById(tutorialId)
    if (!tutorial) {
      return res.status(404).json({
        success: false,
        error: 'Tutorial not found'
      })
    }

    res.json({
      success: true,
      data: {
        tutorialId: tutorial.id,
        mockData: tutorial.mockData || {},
        hasData: Object.keys(tutorial.mockData || {}).length > 0
      },
      message: 'Tutorial demo data retrieved successfully'
    })
  } catch (error: any) {
    console.error('[TutorialRoutes] Error fetching tutorial demo data:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tutorial demo data',
      details: error.message
    })
  }
})

// DIRECT TutorialProgress endpoints for manipulation
// PUT /api/v1/tutorials/progress/:progressId - Update progress by progress ID
router.put('/progress/:progressId', async (req: Request, res: Response) => {
  try {
    const progressId = req.params.progressId
    const { currentStep, completedSteps, status, sessionData, notes } = req.body

    // Find progress record by its own _id
    let progress = await TutorialProgress.findById(progressId)

    if (!progress) {
      return res.status(404).json({
        success: false,
        error: 'Tutorial progress not found.'
      })
    }

    // Update progress fields
    if (currentStep !== undefined) progress.currentStep = currentStep
    if (completedSteps !== undefined) progress.completedSteps = completedSteps
    if (status !== undefined) progress.status = status
    if (sessionData !== undefined) progress.sessionData = { ...progress.sessionData, ...sessionData }
    if (notes !== undefined) progress.notes = notes

    await progress.save()

    res.json({
      success: true,
      data: progress,
      message: 'Tutorial progress updated successfully'
    })
  } catch (error: any) {
    console.error('[TutorialRoutes] Error updating tutorial progress by ID:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update tutorial progress',
      details: error.message
    })
  }
})


export default router
import { Router } from 'express'
import mongoose from 'mongoose'
import Task from '../models/Task.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

/**
 * Validates date format YYYY-MM-DD or ISO string
 */
function parseAndValidateDate(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date
}

/**
 * Parses and validates task input payload
 */
function validateTaskInput(body = {}, isUpdate = false) {
  const errors = []
  const updates = {}

  // Title validation
  if (body.title !== undefined || !isUpdate) {
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    if (!title) {
      errors.push('Task title is required.')
    } else if (title.length > 160) {
      errors.push('Task title must be under 160 characters.')
    } else {
      updates.title = title
    }
  }

  // Subject validation
  if (body.subject !== undefined) {
    const subject = typeof body.subject === 'string' ? body.subject.trim() : ''
    if (subject.length > 80) {
      errors.push('Subject must be under 80 characters.')
    } else {
      updates.subject = subject || 'General'
    }
  } else if (!isUpdate) {
    updates.subject = 'General'
  }

  // Description validation
  if (body.description !== undefined) {
    const description = typeof body.description === 'string' ? body.description.trim() : ''
    if (description.length > 1000) {
      errors.push('Description must be under 1000 characters.')
    } else {
      updates.description = description
    }
  } else if (!isUpdate) {
    updates.description = ''
  }

  // Due Date validation
  if (body.dueDate !== undefined || !isUpdate) {
    const parsedDate = parseAndValidateDate(body.dueDate)
    if (!parsedDate) {
      errors.push('A valid due date is required.')
    } else {
      // Ensure due date has end-of-day time if only date was provided
      if (typeof body.dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.dueDate)) {
        parsedDate.setUTCHours(23, 59, 59, 999)
      }
      updates.dueDate = parsedDate
    }
  }

  // Priority validation
  if (body.priority !== undefined || !isUpdate) {
    const priority = body.priority || 'Medium'
    if (!['Low', 'Medium', 'High'].includes(priority)) {
      errors.push('Priority must be Low, Medium, or High.')
    } else {
      updates.priority = priority
    }
  }

  // Status and Completed validation
  if (body.status !== undefined) {
    if (!['Pending', 'In Progress', 'Completed'].includes(body.status)) {
      errors.push('Status must be Pending, In Progress, or Completed.')
    } else {
      updates.status = body.status
      updates.completed = body.status === 'Completed'
    }
  } else if (body.completed !== undefined) {
    if (typeof body.completed !== 'boolean') {
      errors.push('Completed status must be a boolean.')
    } else {
      updates.completed = body.completed
      updates.status = body.completed ? 'Completed' : 'Pending'
    }
  } else if (!isUpdate) {
    updates.status = 'Pending'
    updates.completed = false
  }

  if (errors.length > 0) {
    return { error: errors.join(' ') }
  }

  return { value: updates }
}

/**
 * GET /api/tasks
 * Fetch tasks for the authenticated student with filtering, search, and sorting
 */
router.get('/', async (req, res, next) => {
  try {
    const { q, subject, priority, status, sort } = req.query
    const filter = { userId: req.userId }

    // Search by title, subject, or description
    if (typeof q === 'string' && q.trim()) {
      const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = { $regex: escaped, $options: 'i' }
      filter.$or = [{ title: regex }, { subject: regex }, { description: regex }]
    }

    // Filter by subject
    if (typeof subject === 'string' && subject.trim() && subject !== 'All') {
      filter.subject = subject.trim()
    }

    // Filter by priority
    if (['Low', 'Medium', 'High'].includes(priority)) {
      filter.priority = priority
    }

    // Filter by status or time window
    const now = new Date()
    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)
    const endOfToday = new Date(now)
    endOfToday.setHours(23, 59, 59, 999)

    if (status === 'Pending') {
      filter.status = 'Pending'
      filter.completed = false
    } else if (status === 'In Progress') {
      filter.status = 'In Progress'
      filter.completed = false
    } else if (status === 'Completed' || status === 'completed') {
      filter.completed = true
    } else if (status === 'overdue') {
      filter.completed = false
      filter.dueDate = { $lt: startOfToday }
    } else if (status === 'today') {
      filter.completed = false
      filter.dueDate = { $gte: startOfToday, $lte: endOfToday }
    } else if (status === 'upcoming') {
      filter.completed = false
      filter.dueDate = { $gt: endOfToday }
    }

    // Sorting
    let sortOptions = { dueDate: 1, createdAt: -1 }
    if (sort === 'dueDateDesc') {
      sortOptions = { dueDate: -1, createdAt: -1 }
    } else if (sort === 'priority') {
      sortOptions = { priority: -1, dueDate: 1 }
    } else if (sort === 'createdAt') {
      sortOptions = { createdAt: -1 }
    }

    const tasks = await Task.find(filter).sort(sortOptions).lean()
    return res.status(200).json({ tasks })
  } catch (error) {
    return next(error)
  }
})

/**
 * GET /api/tasks/stats
 * Calculate dashboard summary statistics for the authenticated user
 */
router.get('/stats', async (req, res, next) => {
  try {
    const now = new Date()
    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)
    const endOfToday = new Date(now)
    endOfToday.setHours(23, 59, 59, 999)

    const [total, completed, inProgress, pending, overdue, dueToday, upcoming] = await Promise.all([
      Task.countDocuments({ userId: req.userId }),
      Task.countDocuments({ userId: req.userId, completed: true }),
      Task.countDocuments({ userId: req.userId, completed: false, status: 'In Progress' }),
      Task.countDocuments({ userId: req.userId, completed: false, status: 'Pending' }),
      Task.countDocuments({ userId: req.userId, completed: false, dueDate: { $lt: startOfToday } }),
      Task.countDocuments({ userId: req.userId, completed: false, dueDate: { $gte: startOfToday, $lte: endOfToday } }),
      Task.countDocuments({ userId: req.userId, completed: false, dueDate: { $gt: endOfToday } }),
    ])

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    return res.status(200).json({
      total,
      completed,
      inProgress,
      pending,
      overdue,
      dueToday,
      upcoming,
      completionRate,
    })
  } catch (error) {
    return next(error)
  }
})

/**
 * GET /api/tasks/:id
 * Retrieve a single task by ID (with ownership check)
 */
router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid Task ID format.' })
    }

    const task = await Task.findOne({ _id: req.params.id, userId: req.userId })
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' })
    }

    return res.status(200).json({ task })
  } catch (error) {
    return next(error)
  }
})

/**
 * POST /api/tasks
 * Create a new task for the authenticated student
 */
router.post('/', async (req, res, next) => {
  try {
    const parsed = validateTaskInput(req.body, false)
    if (parsed.error) {
      return res.status(400).json({ message: parsed.error })
    }

    const task = await Task.create({
      ...parsed.value,
      userId: req.userId,
    })

    return res.status(201).json({ task })
  } catch (error) {
    return next(error)
  }
})

/**
 * PUT /api/tasks/:id
 * Full update of an existing task (with ownership check)
 */
router.put('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid Task ID format.' })
    }

    const parsed = validateTaskInput(req.body, false)
    if (parsed.error) {
      return res.status(400).json({ message: parsed.error })
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: parsed.value },
      { new: true, runValidators: true }
    )

    if (!task) {
      return res.status(404).json({ message: 'Task not found or access denied.' })
    }

    return res.status(200).json({ task })
  } catch (error) {
    return next(error)
  }
})

/**
 * PATCH /api/tasks/:id
 * Partial update of an existing task (e.g., status, priority, title)
 */
router.patch('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid Task ID format.' })
    }

    const parsed = validateTaskInput(req.body, true)
    if (parsed.error) {
      return res.status(400).json({ message: parsed.error })
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: parsed.value },
      { new: true, runValidators: true }
    )

    if (!task) {
      return res.status(404).json({ message: 'Task not found or access denied.' })
    }

    return res.status(200).json({ task })
  } catch (error) {
    return next(error)
  }
})

/**
 * DELETE /api/tasks/:id
 * Delete a task (with ownership check)
 */
router.delete('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid Task ID format.' })
    }

    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    })

    if (!task) {
      return res.status(404).json({ message: 'Task not found or access denied.' })
    }

    return res.status(200).json({ message: 'Task deleted successfully.' })
  } catch (error) {
    return next(error)
  }
})

export default router

import { Router } from 'express'
import mongoose from 'mongoose'
import Task from '../models/Task.js'
import { requireAuth } from '../middleware/auth.js'
import {
  createMemTask,
  deleteMemTask,
  getMemTasksByUser,
  memTasks,
  updateMemTask,
} from '../models/memStore.js'

const router = Router()
router.use(requireAuth)

const isMongoActive = () => mongoose.connection.readyState === 1

function parseAndValidateDate(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date
}

function validateTaskInput(body = {}, isUpdate = false) {
  const errors = []
  const updates = {}

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

  if (body.subject !== undefined) {
    const subject = typeof body.subject === 'string' ? body.subject.trim() : ''
    updates.subject = subject || 'General'
  } else if (!isUpdate) {
    updates.subject = 'General'
  }

  if (body.description !== undefined) {
    updates.description = typeof body.description === 'string' ? body.description.trim() : ''
  } else if (!isUpdate) {
    updates.description = ''
  }

  if (body.dueDate !== undefined || !isUpdate) {
    const parsedDate = parseAndValidateDate(body.dueDate)
    if (!parsedDate) {
      errors.push('A valid due date is required.')
    } else {
      if (typeof body.dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.dueDate)) {
        parsedDate.setUTCHours(23, 59, 59, 999)
      }
      updates.dueDate = parsedDate
    }
  }

  if (body.priority !== undefined || !isUpdate) {
    const priority = body.priority || 'Medium'
    updates.priority = ['Low', 'Medium', 'High'].includes(priority) ? priority : 'Medium'
  }

  if (body.status !== undefined) {
    updates.status = ['Pending', 'In Progress', 'Completed'].includes(body.status) ? body.status : 'Pending'
    updates.completed = updates.status === 'Completed'
  } else if (body.completed !== undefined) {
    updates.completed = Boolean(body.completed)
    updates.status = updates.completed ? 'Completed' : 'Pending'
  } else if (!isUpdate) {
    updates.status = 'Pending'
    updates.completed = false
  }

  if (errors.length > 0) return { error: errors.join(' ') }
  return { value: updates }
}

// GET /api/tasks
router.get('/', async (req, res, next) => {
  try {
    const { q, subject, priority, status, sort } = req.query

    if (isMongoActive()) {
      const filter = { userId: req.userId }
      if (typeof q === 'string' && q.trim()) {
        const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const regex = { $regex: escaped, $options: 'i' }
        filter.$or = [{ title: regex }, { subject: regex }, { description: regex }]
      }
      if (typeof subject === 'string' && subject.trim() && subject !== 'All') {
        filter.subject = subject.trim()
      }
      if (['Low', 'Medium', 'High'].includes(priority)) filter.priority = priority

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

      let sortOptions = { dueDate: 1, createdAt: -1 }
      if (sort === 'dueDateDesc') sortOptions = { dueDate: -1, createdAt: -1 }

      const tasks = await Task.find(filter).sort(sortOptions).lean()
      return res.status(200).json({ tasks })
    } else {
      // Memory fallback
      let userTasks = getMemTasksByUser(req.userId)
      if (q && q.trim()) {
        const query = q.toLowerCase().trim()
        userTasks = userTasks.filter(
          (t) =>
            t.title.toLowerCase().includes(query) ||
            t.subject.toLowerCase().includes(query) ||
            (t.description && t.description.toLowerCase().includes(query))
        )
      }
      if (subject && subject !== 'All') {
        userTasks = userTasks.filter((t) => t.subject === subject)
      }
      if (priority) {
        userTasks = userTasks.filter((t) => t.priority === priority)
      }
      userTasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      return res.status(200).json({ tasks: userTasks })
    }
  } catch (error) {
    return next(error)
  }
})

// GET /api/tasks/stats
router.get('/stats', async (req, res, next) => {
  try {
    const now = new Date()
    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)
    const endOfToday = new Date(now)
    endOfToday.setHours(23, 59, 59, 999)

    if (isMongoActive()) {
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
      return res.status(200).json({ total, completed, inProgress, pending, overdue, dueToday, upcoming, completionRate })
    } else {
      const userTasks = getMemTasksByUser(req.userId)
      const total = userTasks.length
      const completed = userTasks.filter((t) => t.completed).length
      const inProgress = userTasks.filter((t) => !t.completed && t.status === 'In Progress').length
      const pending = userTasks.filter((t) => !t.completed && t.status === 'Pending').length
      const overdue = userTasks.filter((t) => !t.completed && new Date(t.dueDate) < startOfToday).length
      const dueToday = userTasks.filter((t) => !t.completed && new Date(t.dueDate) >= startOfToday && new Date(t.dueDate) <= endOfToday).length
      const upcoming = userTasks.filter((t) => !t.completed && new Date(t.dueDate) > endOfToday).length
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
      return res.status(200).json({ total, completed, inProgress, pending, overdue, dueToday, upcoming, completionRate })
    }
  } catch (error) {
    return next(error)
  }
})

// GET /api/tasks/:id
router.get('/:id', async (req, res, next) => {
  try {
    if (isMongoActive()) {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: 'Invalid Task ID format.' })
      }
      const task = await Task.findOne({ _id: req.params.id, userId: req.userId })
      if (!task) return res.status(404).json({ message: 'Task not found.' })
      return res.status(200).json({ task })
    } else {
      const task = memTasks.get(req.params.id)
      if (!task || String(task.userId) !== String(req.userId)) {
        return res.status(404).json({ message: 'Task not found.' })
      }
      return res.status(200).json({ task })
    }
  } catch (error) {
    return next(error)
  }
})

// POST /api/tasks
router.post('/', async (req, res, next) => {
  try {
    const parsed = validateTaskInput(req.body, false)
    if (parsed.error) return res.status(400).json({ message: parsed.error })

    if (isMongoActive()) {
      const task = await Task.create({ ...parsed.value, userId: req.userId })
      return res.status(201).json({ task })
    } else {
      const task = createMemTask({ ...parsed.value, userId: req.userId })
      return res.status(201).json({ task })
    }
  } catch (error) {
    return next(error)
  }
})

// PUT /api/tasks/:id
router.put('/:id', async (req, res, next) => {
  try {
    const parsed = validateTaskInput(req.body, false)
    if (parsed.error) return res.status(400).json({ message: parsed.error })

    if (isMongoActive()) {
      if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid Task ID.' })
      const task = await Task.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        { $set: parsed.value },
        { new: true, runValidators: true }
      )
      if (!task) return res.status(404).json({ message: 'Task not found.' })
      return res.status(200).json({ task })
    } else {
      const task = updateMemTask(req.params.id, req.userId, parsed.value)
      if (!task) return res.status(404).json({ message: 'Task not found.' })
      return res.status(200).json({ task })
    }
  } catch (error) {
    return next(error)
  }
})

// PATCH /api/tasks/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const parsed = validateTaskInput(req.body, true)
    if (parsed.error) return res.status(400).json({ message: parsed.error })

    if (isMongoActive()) {
      if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid Task ID.' })
      const task = await Task.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        { $set: parsed.value },
        { new: true, runValidators: true }
      )
      if (!task) return res.status(404).json({ message: 'Task not found.' })
      return res.status(200).json({ task })
    } else {
      const task = updateMemTask(req.params.id, req.userId, parsed.value)
      if (!task) return res.status(404).json({ message: 'Task not found.' })
      return res.status(200).json({ task })
    }
  } catch (error) {
    return next(error)
  }
})

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res, next) => {
  try {
    if (isMongoActive()) {
      if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid Task ID.' })
      const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.userId })
      if (!task) return res.status(404).json({ message: 'Task not found.' })
      return res.status(200).json({ message: 'Task deleted successfully.' })
    } else {
      const success = deleteMemTask(req.params.id, req.userId)
      if (!success) return res.status(404).json({ message: 'Task not found.' })
      return res.status(200).json({ message: 'Task deleted successfully.' })
    }
  } catch (error) {
    return next(error)
  }
})

export default router

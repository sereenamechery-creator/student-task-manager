import { Router } from 'express'
import mongoose from 'mongoose'
import Task from '../models/Task.js'
import { requireAuth } from '../middleware/auth.js'
import { getMemTasksByUser } from '../models/memStore.js'

const router = Router()
router.use(requireAuth)

const isMongoActive = () => mongoose.connection.readyState === 1

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

export default router

import { Router } from 'express'
import Task from '../models/Task.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

/**
 * GET /api/dashboard/stats
 * Dedicated dashboard metrics endpoint
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

export default router

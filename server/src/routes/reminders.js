import { Router } from 'express'
import { config } from '../config.js'
import { requireAuth } from '../middleware/auth.js'
import User from '../models/User.js'
import { checkAndSendReminders, sendTestEmail } from '../services/reminders.js'

const router = Router()

// All reminder endpoints require authentication
router.use(requireAuth)

/**
 * GET /api/reminders/status
 * Get the current email reminder configuration status
 */
router.get('/status', async (_req, res) => {
  return res.json({
    enabled: config.email.enabled,
    provider: config.email.isGmail ? 'Gmail SMTP' : 'Custom SMTP',
    sender: config.email.enabled ? config.email.user : null,
    schedule: config.cronSchedule,
    message: config.email.enabled
      ? 'Email reminder service is active and running via node-cron.'
      : 'Email reminder service is not configured. Add EMAIL_USER and EMAIL_APP_PASSWORD to server/.env to enable automated reminders.',
  })
})

/**
 * POST /api/reminders/test
 * Sends a test email to the authenticated user's own email
 */
router.post('/test', async (req, res, next) => {
  try {
    if (!config.email.enabled) {
      return res.status(400).json({
        message: 'Email reminders are not configured. Please add EMAIL_USER and EMAIL_APP_PASSWORD to server/.env.',
        configured: false,
      })
    }

    const user = await User.findById(req.userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found.' })
    }

    await sendTestEmail(user.email, user.name)

    return res.json({
      success: true,
      message: `Test email successfully delivered to ${user.email}.`,
      sentTo: user.email,
    })
  } catch (error) {
    console.error('[Reminders API] Test email failure:', error.message)
    return res.status(500).json({
      success: false,
      message: `Failed to deliver test email: ${error.message}. Please verify your Gmail App Password or SMTP credentials.`,
    })
  }
})

/**
 * POST /api/reminders/process
 * Manually trigger the deadline check (useful for testing/demo)
 */
router.post('/process', async (_req, res, next) => {
  try {
    const result = await checkAndSendReminders()
    return res.json({
      success: true,
      message: 'Deadline reminder check executed.',
      details: result,
    })
  } catch (error) {
    return next(error)
  }
})

export default router

import cron from 'node-cron'
import nodemailer from 'nodemailer'
import Task from '../models/Task.js'
import User from '../models/User.js'
import { config } from '../config.js'

let cronJob = null
let isProcessing = false

/**
 * Creates and returns the configured Nodemailer transporter
 */
export function getMailTransporter() {
  if (!config.email.enabled) {
    return null
  }

  if (config.email.isGmail) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    })
  }

  return nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.port === 465,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  })
}

/**
 * Sends a safe test email to verify credentials for the logged-in student
 */
export async function sendTestEmail(recipientEmail, recipientName = 'Student') {
  if (!config.email.enabled) {
    throw new Error('Email credentials are not configured in server/.env. Please configure EMAIL_USER and EMAIL_APP_PASSWORD.')
  }

  const transporter = getMailTransporter()
  const mailOptions = {
    from: `"Student Task Manager" <${config.email.from}>`,
    to: recipientEmail,
    subject: 'Notification Test: Student Task & Deadline Manager',
    text: `Hello ${recipientName},\n\nThis is a confirmation email from Student Task & Deadline Manager.\n\nYour automated deadline reminder service is successfully configured and active.\n\nYou will receive reminders 24 hours before deadlines and on the day tasks are due.\n\nBest regards,\nStudent Task Manager System`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
        <div style="border-bottom: 2px solid #6366f1; padding-bottom: 12px; margin-bottom: 16px;">
          <h2 style="color: #4f46e5; margin: 0;">Student Task &amp; Deadline Manager</h2>
          <p style="color: #64748b; font-size: 14px; margin: 4px 0 0 0;">Notification Delivery Test</p>
        </div>
        <p style="color: #334155; font-size: 16px; line-height: 1.5;">Hello <strong>${recipientName}</strong>,</p>
        <p style="color: #334155; font-size: 15px; line-height: 1.5;">
          This is a confirmation test verifying that your email notification service is active and properly configured.
        </p>
        <div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #0f172a; font-weight: 600; font-size: 14px;">Service Status: Active</p>
          <p style="margin: 4px 0 0 0; color: #475569; font-size: 13px;">Sender: ${config.email.user}</p>
          <p style="margin: 4px 0 0 0; color: #475569; font-size: 13px;">Frequency: Automated check every 15 minutes</p>
        </div>
        <p style="color: #64748b; font-size: 13px; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px;">
          ICTAK Capstone Project &bull; Student Task &amp; Deadline Manager
        </p>
      </div>
    `,
  }

  const result = await transporter.sendMail(mailOptions)
  return result
}

/**
 * Checks for tasks due in the next 24 hours or due today, and sends reminders
 */
export async function checkAndSendReminders() {
  if (!config.email.enabled) {
    return { skipped: true, reason: 'Email not configured' }
  }

  if (isProcessing) {
    return { skipped: true, reason: 'Previous reminder job still processing' }
  }

  isProcessing = true
  const stats = { found: 0, sent: 0, failed: 0 }

  try {
    const now = new Date()
    // Deadline window: tasks due between now and now + 24 hours
    const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    // Find incomplete tasks due within the reminder window that haven't received a reminder yet
    const dueTasks = await Task.find({
      completed: false,
      status: { $ne: 'Completed' },
      reminderSentAt: null,
      dueDate: { $gte: now, $lte: windowEnd },
    }).populate('userId', 'name email')

    stats.found = dueTasks.length
    if (dueTasks.length === 0) {
      return stats
    }

    const transporter = getMailTransporter()

    for (const task of dueTasks) {
      if (!task.userId || !task.userId.email) {
        console.warn(`[Reminder Service] Task ${task._id} has no valid user email attached. Skipping.`)
        continue
      }

      const student = task.userId
      const formattedDate = new Date(task.dueDate).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })

      const mailOptions = {
        from: `"Student Task Manager" <${config.email.from}>`,
        to: student.email,
        subject: `Upcoming Deadline Reminder: ${task.title} [${task.priority} Priority]`,
        text: `Hello ${student.name},\n\nThis is a reminder that your task "${task.title}" (${task.subject}) is due on ${formattedDate}.\n\nPriority: ${task.priority}\nStatus: ${task.status}\nDescription: ${task.description || 'None provided'}\n\nPlease log in to review and mark it complete.\n\nStudent Task & Deadline Manager`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
            <div style="border-bottom: 2px solid #6366f1; padding-bottom: 12px; margin-bottom: 16px;">
              <h2 style="color: #4f46e5; margin: 0;">Deadline Reminder</h2>
              <p style="color: #64748b; font-size: 14px; margin: 4px 0 0 0;">Student Task &amp; Deadline Manager</p>
            </div>
            <p style="color: #334155; font-size: 16px; line-height: 1.5;">Hello <strong>${student.name}</strong>,</p>
            <p style="color: #334155; font-size: 15px; line-height: 1.5;">
              You have an academic deadline approaching within the next 24 hours:
            </p>
            <div style="background-color: #f8fafc; border-left: 4px solid #6366f1; padding: 16px; border-radius: 4px; margin: 20px 0;">
              <h3 style="margin: 0 0 8px 0; color: #1e293b;">${task.title}</h3>
              <p style="margin: 4px 0; color: #475569; font-size: 14px;"><strong>Subject:</strong> ${task.subject}</p>
              <p style="margin: 4px 0; color: #475569; font-size: 14px;"><strong>Due Date:</strong> ${formattedDate}</p>
              <p style="margin: 4px 0; color: #475569; font-size: 14px;"><strong>Priority:</strong> <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; background-color: ${task.priority === 'High' ? '#fee2e2' : task.priority === 'Medium' ? '#fef3c7' : '#ecfdf5'}; color: ${task.priority === 'High' ? '#b91c1c' : task.priority === 'Medium' ? '#b45309' : '#047857'};">${task.priority}</span></p>
              ${task.description ? `<p style="margin: 8px 0 0 0; color: #64748b; font-size: 13px;"><em>${task.description}</em></p>` : ''}
            </div>
            <p style="color: #334155; font-size: 14px;">
              Please log in to your dashboard to review this assignment or mark it complete once finished.
            </p>
            <p style="color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px;">
              ICTAK Capstone Project &bull; Automated notification sent from Student Task &amp; Deadline Manager
            </p>
          </div>
        `,
      }

      try {
        await transporter.sendMail(mailOptions)
        // Mark task reminderSentAt only AFTER confirmed delivery
        task.reminderSentAt = new Date()
        await task.save()
        stats.sent += 1
        console.info(`[Reminder Service] Successfully sent deadline reminder to ${student.email} for task "${task.title}".`)
      } catch (err) {
        stats.failed += 1
        console.error(`[Reminder Service] Failed to send reminder email to ${student.email}:`, err.message)
        // Leave reminderSentAt as null so next cycle can retry
      }
    }

    return stats
  } catch (error) {
    console.error('[Reminder Service] Error processing scheduled reminders:', error.message)
    throw error
  } finally {
    isProcessing = false
  }
}

/**
 * Initializes the node-cron scheduler
 */
export function startReminderScheduler() {
  if (!config.email.enabled) {
    console.info('[Reminder Service] Email reminders disabled: EMAIL_USER/EMAIL_APP_PASSWORD not set in server/.env.')
    return
  }

  console.info(`[Reminder Service] Starting node-cron scheduler with pattern "${config.cronSchedule}".`)
  cronJob = cron.schedule(config.cronSchedule, async () => {
    try {
      console.info('[Reminder Service] Running automated deadline check...')
      const result = await checkAndSendReminders()
      console.info('[Reminder Service] Check completed:', result)
    } catch (err) {
      console.error('[Reminder Service] Cron job execution error:', err.message)
    }
  })

  // Run an initial check after 10 seconds of startup
  setTimeout(() => {
    checkAndSendReminders().catch((err) => {
      console.error('[Reminder Service] Initial startup check error:', err.message)
    })
  }, 10000)
}

/**
 * Stops the node-cron scheduler during graceful shutdown
 */
export function stopReminderScheduler() {
  if (cronJob) {
    cronJob.stop()
    console.info('[Reminder Service] Reminder cron scheduler stopped.')
  }
}

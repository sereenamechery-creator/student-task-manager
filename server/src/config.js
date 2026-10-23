import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load environment variables from all possible locations
dotenv.config({ path: path.resolve(__dirname, '../.env') })
dotenv.config({ path: path.resolve(__dirname, '../../.env') })
dotenv.config()

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/student_task_manager'
const jwtSecret = process.env.JWT_SECRET || 'dev_secret_student_task_manager_jwt_key_at_least_32_chars'
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'
const port = Number(process.env.PORT || 5000)

// Email configuration: supports Gmail App Password directly or custom SMTP
const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER || ''
const emailPass = process.env.EMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD || ''
const smtpHost = process.env.SMTP_HOST || (emailUser.endsWith('@gmail.com') ? 'smtp.gmail.com' : '')
const smtpPort = Number(process.env.SMTP_PORT || (smtpHost === 'smtp.gmail.com' ? 465 : 587))
const emailFrom = process.env.EMAIL_FROM || emailUser || 'no-reply@studenttaskmanager.com'

export const emailEnabled = Boolean(emailUser && emailPass)

export const config = {
  port,
  mongoUri,
  jwtSecret,
  clientUrl,
  email: {
    enabled: emailEnabled,
    user: emailUser,
    pass: emailPass,
    host: smtpHost,
    port: smtpPort,
    from: emailFrom,
    isGmail: smtpHost === 'smtp.gmail.com' || emailUser.endsWith('@gmail.com'),
  },
  cronSchedule: process.env.CRON_SCHEDULE || '*/15 * * * *',
}

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import mongoose from 'mongoose'
import { config } from './config.js'
import authRoutes from './routes/auth.js'
import taskRoutes from './routes/tasks.js'
import dashboardRoutes from './routes/dashboard.js'
import reminderRoutes from './routes/reminders.js'

const app = express()

app.disable('x-powered-by')
app.use(helmet())
app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, true) // Permissive for local development
    },
    credentials: true,
  })
)
app.use(express.json({ limit: '32kb' }))

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected_mongodb' : 'memory_fallback',
    timestamp: new Date().toISOString(),
  })
})

// Route groups
app.use('/api/auth', authRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/reminders', reminderRoutes)

// 404 handler for undefined API routes
app.use((_req, res) => {
  res.status(404).json({ message: 'Requested API endpoint was not found.' })
})

// Global error handler
app.use((error, _req, res, _next) => {
  console.error('[API Error]:', error)

  if (error?.name === 'ValidationError') {
    return res.status(400).json({ message: error.message || 'Validation failed.' })
  }
  if (error?.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID format.' })
  }
  if (error?.name === 'JsonWebTokenError' || error?.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Invalid or expired session token.' })
  }

  return res.status(error.status || 500).json({
    message: error.message || 'Internal server error occurred.',
  })
})

export default app

import mongoose from 'mongoose'
import app from './app.js'
import { config } from './config.js'
import { startReminderScheduler, stopReminderScheduler } from './services/reminders.js'

async function startServer() {
  try {
    console.info('Attempting connection to MongoDB...')
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    })
    console.info(`✓ Successfully connected to MongoDB at: ${config.mongoUri.replace(/:([^:@]+)@/, ':****@')}`)

    const server = app.listen(config.port, () => {
      console.info(`✓ Student Task Manager API is running on http://localhost:${config.port}`)
      console.info(`✓ Client origin configured for: ${config.clientUrl}`)
      startReminderScheduler()
    })

    const shutdown = async (signal) => {
      console.info(`\nReceived ${signal}. Gracefully stopping server and background tasks...`)
      stopReminderScheduler()
      server.close(async () => {
        await mongoose.disconnect()
        console.info('MongoDB disconnected. Process terminated cleanly.')
        process.exit(0)
      })
    }

    process.on('SIGINT', () => shutdown('SIGINT'))
    process.on('SIGTERM', () => shutdown('SIGTERM'))
  } catch (error) {
    console.error('✗ MongoDB Connection Failed:', error.message)
    console.error('  Please check MONGODB_URI in server/.env (e.g. MongoDB Atlas connection string or local MongoDB instance).')
    process.exit(1)
  }
}

startServer()

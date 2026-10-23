import mongoose from 'mongoose'
import app from './app.js'
import { config } from './config.js'
import { startReminderScheduler, stopReminderScheduler } from './services/reminders.js'

let isConnecting = false

async function connectToMongo() {
  if (mongoose.connection.readyState === 1 || isConnecting) return
  isConnecting = true

  try {
    console.info('Attempting connection to MongoDB...')
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    })
    console.info(`✓ Successfully connected to MongoDB at: ${config.mongoUri.replace(/:([^:@]+)@/, ':****@')}`)
    startReminderScheduler()
  } catch (error) {
    console.warn(`! MongoDB Connection Notice: ${error.message}`)
    console.info('  The API server is running on port 5000. It will automatically reconnect when MongoDB is available.')
    console.info('  To connect to your database, update MONGODB_URI in server/.env with your MongoDB Atlas connection string.')
    // Retry connection after 10 seconds
    setTimeout(connectToMongo, 10000)
  } finally {
    isConnecting = false
  }
}

// Start HTTP server immediately to prevent 502 Bad Gateway
const server = app.listen(config.port, () => {
  console.info(`✓ Student Task Manager API is listening on http://localhost:${config.port}`)
  console.info(`✓ Client origin configured for: ${config.clientUrl}`)
  connectToMongo()
})

const shutdown = async (signal) => {
  console.info(`\nReceived ${signal}. Gracefully stopping server and background tasks...`)
  stopReminderScheduler()
  server.close(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect()
    }
    console.info('Server shutdown cleanly.')
    process.exit(0)
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

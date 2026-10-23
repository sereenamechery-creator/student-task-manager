import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { rateLimit } from 'express-rate-limit'
import User from '../models/User.js'
import { config } from '../config.js'
import { requireAuth } from '../middleware/auth.js'
import {
  createMemUser,
  findMemUserByEmail,
  findMemUserById,
} from '../models/memStore.js'

const router = Router()
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again in a few minutes.' },
})

const DEFAULT_DEV_PASSWORD = 'student_secure_pass_123'

function issueToken(user) {
  const sub = user._id ? String(user._id) : String(user.id)
  return jwt.sign({ sub }, config.jwtSecret, { expiresIn: '30d' })
}

function publicUser(user) {
  const id = user._id ? String(user._id) : String(user.id)
  return { id, name: user.name, email: user.email }
}

const isMongoActive = () => mongoose.connection.readyState === 1

router.post('/register', authLimiter, async (request, response, next) => {
  try {
    const body = request.body ?? {}
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' && body.password ? body.password : DEFAULT_DEV_PASSWORD

    if (!name || name.length > 80 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return response.status(400).json({ message: 'Enter a valid name and email address.' })
    }

    if (isMongoActive()) {
      let existing = await User.findOne({ email })
      if (existing) {
        return response.status(200).json({ token: issueToken(existing), user: publicUser(existing) })
      }
      const passwordHash = await bcrypt.hash(password, 12)
      const user = await User.create({ name, email, passwordHash })
      return response.status(201).json({ token: issueToken(user), user: publicUser(user) })
    } else {
      let existing = findMemUserByEmail(email)
      if (existing) {
        return response.status(200).json({ token: issueToken(existing), user: publicUser(existing) })
      }
      const passwordHash = await bcrypt.hash(password, 12)
      const user = createMemUser({ name, email, passwordHash })
      return response.status(201).json({ token: issueToken(user), user: publicUser(user) })
    }
  } catch (error) {
    return next(error)
  }
})

router.post('/login', authLimiter, async (request, response, next) => {
  try {
    const body = request.body ?? {}
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' && body.password ? body.password : DEFAULT_DEV_PASSWORD

    if (!email) {
      return response.status(400).json({ message: 'Please enter your email.' })
    }

    if (isMongoActive()) {
      let user = await User.findOne({ email }).select('+passwordHash')
      if (!user) {
        const autoName = email.split('@')[0]
        const passwordHash = await bcrypt.hash(password, 12)
        user = await User.create({ name: autoName, email, passwordHash })
      }
      return response.json({ token: issueToken(user), user: publicUser(user) })
    } else {
      let user = findMemUserByEmail(email)
      if (!user) {
        const autoName = email.split('@')[0]
        const passwordHash = await bcrypt.hash(password, 12)
        user = createMemUser({ name: autoName, email, passwordHash })
      }
      return response.json({ token: issueToken(user), user: publicUser(user) })
    }
  } catch (error) {
    return next(error)
  }
})

router.get('/me', requireAuth, async (request, response, next) => {
  try {
    if (isMongoActive()) {
      const user = await User.findById(request.userId)
      if (!user) return response.status(401).json({ message: 'Your account could not be found.' })
      return response.json({ user: publicUser(user) })
    } else {
      const user = findMemUserById(request.userId)
      if (!user) {
        // Fallback demo user
        return response.json({ user: { id: request.userId, name: 'Student', email: 'student@test.com' } })
      }
      return response.json({ user: publicUser(user) })
    }
  } catch (error) {
    return next(error)
  }
})

export default router

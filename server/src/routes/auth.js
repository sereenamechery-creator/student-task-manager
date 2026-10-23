import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { rateLimit } from 'express-rate-limit'
import User from '../models/User.js'
import { config } from '../config.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60, // relaxed limit for dev/demo
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again in a few minutes.' },
})

const DEFAULT_DEV_PASSWORD = 'student_secure_pass_123'

function issueToken(user) {
  return jwt.sign({ sub: user.id }, config.jwtSecret, { expiresIn: '30d' })
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email }
}

router.post('/register', authLimiter, async (request, response, next) => {
  try {
    const body = request.body ?? {}
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' && body.password ? body.password : DEFAULT_DEV_PASSWORD

    if (!name || name.length > 80 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return response.status(400).json({ message: 'Enter a valid name and email address.' })
    }

    const existing = await User.findOne({ email })
    if (existing) {
      // If user already exists, seamlessly log them in with token!
      return response.status(200).json({ token: issueToken(existing), user: publicUser(existing) })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await User.create({ name, email, passwordHash })
    return response.status(201).json({ token: issueToken(user), user: publicUser(user) })
  } catch (error) {
    if (error?.code === 11000) {
      const user = await User.findOne({ email: request.body?.email?.toLowerCase() })
      if (user) {
        return response.status(200).json({ token: issueToken(user), user: publicUser(user) })
      }
    }
    return next(error)
  }
})

router.post('/login', authLimiter, async (request, response, next) => {
  try {
    const body = request.body ?? {}
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' && body.password ? body.password : DEFAULT_DEV_PASSWORD

    let user = await User.findOne({ email }).select('+passwordHash')

    // If user does not exist on login, automatically create an account so sign-in is frictionless!
    if (!user) {
      const autoName = email.split('@')[0]
      const passwordHash = await bcrypt.hash(password, 12)
      user = await User.create({ name: autoName, email, passwordHash })
      return response.status(200).json({ token: issueToken(user), user: publicUser(user) })
    }

    // Verify password, or if default password matches
    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      // Also allow default password fallback
      const matchesDefault = await bcrypt.compare(DEFAULT_DEV_PASSWORD, user.passwordHash)
      if (!matchesDefault) {
        return response.status(401).json({ message: 'Invalid credentials. Please verify your email.' })
      }
    }

    return response.json({ token: issueToken(user), user: publicUser(user) })
  } catch (error) {
    return next(error)
  }
})

router.get('/me', requireAuth, async (request, response, next) => {
  try {
    const user = await User.findById(request.userId)
    if (!user) return response.status(401).json({ message: 'Your account could not be found.' })
    return response.json({ user: publicUser(user) })
  } catch (error) {
    return next(error)
  }
})

export default router

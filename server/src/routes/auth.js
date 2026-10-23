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
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again in a few minutes.' },
})

function issueToken(user) {
  return jwt.sign({ sub: user.id }, config.jwtSecret, { expiresIn: '7d' })
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email }
}

router.post('/register', authLimiter, async (request, response, next) => {
  try {
    const body = request.body ?? {}
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''

    if (!name || name.length > 80 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return response.status(400).json({ message: 'Enter a valid name and email address.' })
    }
    if (password.length < 8 || password.length > 128) {
      return response.status(400).json({ message: 'Password must be between 8 and 128 characters.' })
    }

    const existing = await User.exists({ email })
    if (existing) return response.status(409).json({ message: 'An account with this email already exists.' })

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await User.create({ name, email, passwordHash })
    return response.status(201).json({ token: issueToken(user), user: publicUser(user) })
  } catch (error) {
    if (error?.code === 11000) {
      return response.status(409).json({ message: 'An account with this email already exists.' })
    }
    return next(error)
  }
})

router.post('/login', authLimiter, async (request, response, next) => {
  try {
    const body = request.body ?? {}
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const user = await User.findOne({ email }).select('+passwordHash')

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return response.status(401).json({ message: 'Email or password is incorrect.' })
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

import jwt from 'jsonwebtoken'
import { config } from '../config.js'

export function requireAuth(request, response, next) {
  const authorization = request.get('authorization')
  const [scheme, token] = authorization?.split(' ') ?? []

  if (scheme !== 'Bearer' || !token) {
    return response.status(401).json({ message: 'Please sign in to continue.' })
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret)
    request.userId = payload.sub
    return next()
  } catch {
    return response.status(401).json({ message: 'Your session has expired. Please sign in again.' })
  }
}

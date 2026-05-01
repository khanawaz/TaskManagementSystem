import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const authMiddleware = async (request, response, next) => {
  try {
    const bearerToken = request.headers.authorization?.startsWith('Bearer ')
      ? request.headers.authorization.split(' ')[1]
      : null
    const token = request.cookies.token || bearerToken

    if (!token) {
      return response.status(401).json({
        success: false,
        message: 'Authentication required.',
      })
    }

    const secret = process.env.JWT_SECRET

    if (!secret) {
      throw new Error('JWT_SECRET is missing from environment variables.')
    }

    const decodedToken = jwt.verify(token, secret)
    const user = await User.findById(decodedToken.userId).select('-password')

    if (!user) {
      return response.status(401).json({
        success: false,
        message: 'User no longer exists.',
      })
    }

    request.user = user
    next()
  } catch (_error) {
    response.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.',
    })
  }
}

const requireRole = (...roles) => (request, response, next) => {
  if (!request.user || !roles.includes(request.user.role)) {
    return response.status(403).json({
      success: false,
      message: 'You do not have permission to perform this action.',
    })
  }

  next()
}

export { authMiddleware, requireRole }

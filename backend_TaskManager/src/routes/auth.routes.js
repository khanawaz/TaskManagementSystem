import { Router } from 'express'
import {
  getCurrentUser,
  login,
  logout,
  signup,
} from '../controllers/auth.controller.js'
import { authMiddleware } from '../middlewares/auth.middleware.js'

const authRouter = Router()

authRouter.post('/signup', signup)
authRouter.post('/login', login)
authRouter.post('/logout', logout)
authRouter.get('/me', authMiddleware, getCurrentUser)

export default authRouter

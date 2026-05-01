import { Router } from 'express'
import { getDashboardSummary } from '../controllers/dashboard.controller.js'
import { authMiddleware } from '../middlewares/auth.middleware.js'

const dashboardRouter = Router()

dashboardRouter.use(authMiddleware)
dashboardRouter.get('/summary', getDashboardSummary)

export default dashboardRouter

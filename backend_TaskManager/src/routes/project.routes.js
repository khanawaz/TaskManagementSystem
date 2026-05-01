import { Router } from 'express'
import {
  addProjectMember,
  createProject,
  getProjectById,
  getProjects,
} from '../controllers/project.controller.js'
import { authMiddleware, requireRole } from '../middlewares/auth.middleware.js'

const projectRouter = Router()

projectRouter.use(authMiddleware)

projectRouter.get('/', getProjects)
projectRouter.get('/:id', getProjectById)
projectRouter.post('/', requireRole('admin'), createProject)
projectRouter.patch('/:id/members', addProjectMember)

export default projectRouter

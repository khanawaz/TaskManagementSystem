import { Router } from 'express'
import {
  createTask,
  deleteTask,
  getTasks,
  getTasksByProject,
  updateTask,
  updateTaskStatus,
} from '../controllers/task.controller.js'
import { authMiddleware } from '../middlewares/auth.middleware.js'

const taskRouter = Router()

taskRouter.use(authMiddleware)

taskRouter.get('/', getTasks)
taskRouter.get('/project/:projectId', getTasksByProject)
taskRouter.post('/', createTask)
taskRouter.patch('/:id', updateTask)
taskRouter.patch('/:id/status', updateTaskStatus)
taskRouter.delete('/:id', deleteTask)

export default taskRouter

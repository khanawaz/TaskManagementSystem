import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import path from 'path'
import { ZodError } from 'zod'
import { fileURLToPath } from 'url'
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js'
import authRouter from './routes/auth.routes.js'
import dashboardRouter from './routes/dashboard.routes.js'
import healthRouter from './routes/health.routes.js'
import projectRouter from './routes/project.routes.js'
import taskRouter from './routes/task.routes.js'

const app = express()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const frontendDistPath = path.resolve(__dirname, '../../frontend_TaskManager/dist')

const allowedOrigins = [
  'http://localhost:5173',
  'https://distinguished-empathy-production-9f42.up.railway.app'
]
if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL)
}

app.set('trust proxy', 1)

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.get('/', (_request, response) => {
  response.json({
    success: true,
    message: 'Welcome to the Team Task Manager API.',
  })
})

app.use('/api/health', healthRouter)
app.use('/api/auth', authRouter)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/projects', projectRouter)
app.use('/api/tasks', taskRouter)

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(frontendDistPath))

  app.get(/^(?!\/api).*/, (_request, response) => {
    response.sendFile(path.join(frontendDistPath, 'index.html'))
  })
}

app.use((error, _request, _response, next) => {
  if (error instanceof ZodError) {
    error.statusCode = 400
    error.message = error.issues[0]?.message || 'Validation failed.'
  }

  next(error)
})

app.use(notFoundHandler)
app.use(errorHandler)

export default app

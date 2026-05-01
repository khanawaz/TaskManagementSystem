import dotenv from 'dotenv'
import app from './app.js'
import connectDatabase from './config/db.js'

dotenv.config()

const port = process.env.PORT || 5000

const startServer = async () => {
  try {
    await connectDatabase()

    app.listen(port, () => {
      console.log(`Server is running on port ${port}.`)
    })
  } catch (error) {
    console.error('Failed to start server:', error.message)
    process.exit(1)
  }
}

startServer()

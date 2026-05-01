import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import connectDatabase from '../config/db.js'
import Project from '../models/Project.js'
import Task from '../models/Task.js'
import User from '../models/User.js'

dotenv.config()

const demoUsers = [
  {
    name: 'Task Admin',
    email: 'admin@task.com',
    password: 'Password',
    role: 'admin',
  },
  {
    name: 'Aarav Sharma',
    email: 'aarav@task.com',
    password: 'Password',
    role: 'member',
  },
  {
    name: 'Sara Khan',
    email: 'sara@task.com',
    password: 'Password',
    role: 'member',
  },
  {
    name: 'Riya Patel',
    email: 'riya@task.com',
    password: 'Password',
    role: 'member',
  },
  {
    name: 'Kabir Mehta',
    email: 'kabir@task.com',
    password: 'Password',
    role: 'member',
  },
  {
    name: 'Neha Singh',
    email: 'neha@task.com',
    password: 'Password',
    role: 'member',
  },
]

const projectBlueprints = [
  {
    name: 'Website Redesign',
    description: 'Refresh the marketing site, update navigation, and launch new landing pages.',
    members: [
      ['admin@task.com', 'admin'],
      ['aarav@task.com', 'member'],
      ['sara@task.com', 'member'],
      ['riya@task.com', 'member'],
    ],
    tasks: [
      ['Create new homepage wireframes', 'in_progress', 'high', 'aarav@task.com', 2],
      ['Finalize pricing page copy', 'todo', 'medium', 'sara@task.com', 5],
      ['QA responsive layouts', 'todo', 'medium', 'riya@task.com', 7],
      ['Ship design token updates', 'done', 'high', 'admin@task.com', -1],
      ['Review analytics before launch', 'todo', 'low', 'admin@task.com', 10],
      ['Fix header alignment issue', 'done', 'medium', 'aarav@task.com', -3],
    ],
  },
  {
    name: 'Mobile App Sprint',
    description: 'Sprint work for onboarding, notifications, and release prep.',
    members: [
      ['admin@task.com', 'admin'],
      ['kabir@task.com', 'member'],
      ['neha@task.com', 'member'],
      ['sara@task.com', 'member'],
    ],
    tasks: [
      ['Implement onboarding progress state', 'in_progress', 'high', 'kabir@task.com', 1],
      ['Prepare push notification copy', 'todo', 'medium', 'sara@task.com', 4],
      ['Regression test Android build', 'todo', 'high', 'neha@task.com', 3],
      ['Publish release notes draft', 'done', 'low', 'admin@task.com', -2],
      ['Resolve login retry bug', 'in_progress', 'high', 'kabir@task.com', 0],
      ['Confirm store listing screenshots', 'todo', 'medium', 'neha@task.com', 8],
    ],
  },
  {
    name: 'Operations Board',
    description: 'Internal operations, hiring, support, and weekly reporting.',
    members: [
      ['admin@task.com', 'admin'],
      ['riya@task.com', 'member'],
      ['kabir@task.com', 'member'],
      ['neha@task.com', 'member'],
      ['aarav@task.com', 'member'],
    ],
    tasks: [
      ['Compile weekly team report', 'todo', 'medium', 'riya@task.com', 2],
      ['Audit unresolved support tickets', 'in_progress', 'high', 'neha@task.com', 1],
      ['Update hiring tracker', 'done', 'low', 'kabir@task.com', -4],
      ['Document deployment checklist', 'todo', 'medium', 'aarav@task.com', 6],
      ['Review vendor invoices', 'todo', 'low', 'admin@task.com', 9],
      ['Backfill project tags for old records', 'done', 'medium', 'riya@task.com', -5],
    ],
  },
]

const seededProjectNames = projectBlueprints.map((project) => project.name)

const makeDueDate = (offsetDays) => {
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() + offsetDays)
  return date
}

const upsertUser = async ({ name, email, password, role }) => {
  const hashedPassword = await bcrypt.hash(password, 10)

  return User.findOneAndUpdate(
    { email },
    {
      $set: {
        name,
        email,
        password: hashedPassword,
        role,
      },
    },
    {
      upsert: true,
      returnDocument: 'after',
      setDefaultsOnInsert: true,
    },
  )
}

const seedUsers = async () => {
  const userMap = new Map()

  for (const userData of demoUsers) {
    const user = await upsertUser(userData)
    userMap.set(user.email, user)
  }

  return userMap
}

const seedProjectsAndTasks = async (userMap) => {
  const existingProjects = await Project.find({
    name: { $in: seededProjectNames },
  }).select('_id')

  if (existingProjects.length > 0) {
    const projectIds = existingProjects.map((project) => project._id)
    await Task.deleteMany({ project: { $in: projectIds } })
    await Project.deleteMany({ _id: { $in: projectIds } })
  }

  for (const blueprint of projectBlueprints) {
    const adminUser = userMap.get('admin@task.com')
    const project = await Project.create({
      name: blueprint.name,
      description: blueprint.description,
      createdBy: adminUser._id,
      members: blueprint.members.map(([email, role]) => ({
        user: userMap.get(email)._id,
        role,
      })),
    })

    await Task.insertMany(
      blueprint.tasks.map(
        ([title, status, priority, assignedEmail, dueOffset], index) => ({
          title,
          description: `${title} for ${blueprint.name}.`,
          status,
          priority,
          dueDate: makeDueDate(dueOffset),
          project: project._id,
          assignedTo: userMap.get(assignedEmail)._id,
          createdBy: adminUser._id,
          createdAt: new Date(Date.now() - index * 60 * 60 * 1000),
          updatedAt: new Date(),
        }),
      ),
    )
  }
}

const printSummary = async () => {
  const [users, admins, projects, tasks] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'admin' }),
    Project.countDocuments(),
    Task.countDocuments(),
  ])

  console.log(
    JSON.stringify(
      {
        message: 'Demo seed completed.',
        credentials: {
          email: 'admin@task.com',
          password: 'Password',
        },
        counts: {
          users,
          admins,
          projects,
          tasks,
        },
      },
      null,
      2,
    ),
  )
}

const run = async () => {
  try {
    await connectDatabase()

    const userMap = await seedUsers()
    await seedProjectsAndTasks(userMap)
    await printSummary()
  } catch (error) {
    console.error('Seed failed:', error)
    process.exitCode = 1
  } finally {
    await mongoose.disconnect()
  }
}

run()

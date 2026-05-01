import mongoose from 'mongoose'
import { z } from 'zod'
import Project from '../models/Project.js'
import Task from '../models/Task.js'
import User from '../models/User.js'
import { canAccessProject, isProjectAdmin } from '../utils/projectAccess.js'

const createTaskSchema = z.object({
  title: z.string().trim().min(2, 'Task title must be at least 2 characters long.'),
  description: z
    .string()
    .trim()
    .max(800, 'Description must be 800 characters or less.')
    .optional()
    .default(''),
  priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
  dueDate: z.string().optional().nullable(),
  projectId: z.string().trim().min(1, 'Project is required.'),
  assignedTo: z.string().trim().min(1, 'Assignee is required.'),
})

const updateTaskSchema = z.object({
  title: z.string().trim().min(2).optional(),
  description: z.string().trim().max(800).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z.string().optional().nullable(),
  assignedTo: z.string().trim().optional(),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
})

const updateTaskStatusSchema = z.object({
  status: z.enum(['todo', 'in_progress', 'done']),
})

const taskPopulate = [
  {
    path: 'project',
    select: 'name description members createdBy',
    populate: {
      path: 'members.user',
      select: 'name email role',
    },
  },
  {
    path: 'assignedTo',
    select: 'name email role',
  },
  {
    path: 'createdBy',
    select: 'name email role',
  },
]

const normalizeDueDate = (dueDate) => {
  if (!dueDate) {
    return null
  }

  return new Date(dueDate)
}

const formatTask = (taskDocument, currentUserId) => {
  const task = taskDocument.toObject ? taskDocument.toObject() : taskDocument
  const currentUserProjectRole = task.project.members.find(
    (member) => member.user?._id?.toString() === currentUserId,
  )?.role

  return {
    id: task._id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    project: {
      id: task.project._id,
      name: task.project.name,
      description: task.project.description,
    },
    assignedTo: task.assignedTo,
    createdBy: task.createdBy,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    currentUserProjectRole,
  }
}

const findAccessibleProject = async (projectId, requestUser) => {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return {
      error: {
        status: 400,
        message: 'Invalid project id.',
      },
    }
  }

  const project = await Project.findById(projectId).populate('members.user', 'name email role')

  if (!project) {
    return {
      error: {
        status: 404,
        message: 'Project not found.',
      },
    }
  }

  if (
    !canAccessProject(project, requestUser._id.toString(), requestUser.role)
  ) {
    return {
      error: {
        status: 403,
        message: 'You do not have access to this project.',
      },
    }
  }

  return { project }
}

const createTask = async (request, response, next) => {
  try {
    const validatedData = createTaskSchema.parse(request.body)
    const { project, error } = await findAccessibleProject(
      validatedData.projectId,
      request.user,
    )

    if (error) {
      return response.status(error.status).json({
        success: false,
        message: error.message,
      })
    }

    if (
      !isProjectAdmin(project, request.user._id.toString(), request.user.role)
    ) {
      return response.status(403).json({
        success: false,
        message: 'Only project admins can create tasks.',
      })
    }

    const assignee = await User.findById(validatedData.assignedTo)

    if (!assignee) {
      return response.status(404).json({
        success: false,
        message: 'Assignee not found.',
      })
    }

    const isAssigneeMember = project.members.some(
      (member) => member.user._id.toString() === assignee._id.toString(),
    )

    if (!isAssigneeMember) {
      return response.status(400).json({
        success: false,
        message: 'Assignee must be a member of the selected project.',
      })
    }

    const task = await Task.create({
      title: validatedData.title,
      description: validatedData.description,
      priority: validatedData.priority,
      dueDate: normalizeDueDate(validatedData.dueDate),
      project: project._id,
      assignedTo: assignee._id,
      createdBy: request.user._id,
    })

    const populatedTask = await Task.findById(task._id).populate(taskPopulate)

    response.status(201).json({
      success: true,
      message: 'Task created successfully.',
      task: formatTask(populatedTask, request.user._id.toString()),
    })
  } catch (error) {
    next(error)
  }
}

const getTasks = async (request, response, next) => {
  try {
    const projectId = request.query.projectId
    const currentUserId = request.user._id.toString()

    let taskFilter = {}

    if (request.user.role !== 'admin') {
      const accessibleProjects = await Project.find({
        'members.user': request.user._id,
      }).select('_id')

      taskFilter.project = {
        $in: accessibleProjects.map((project) => project._id),
      }
    }

    if (projectId) {
      const { project, error } = await findAccessibleProject(projectId, request.user)

      if (error) {
        return response.status(error.status).json({
          success: false,
          message: error.message,
        })
      }

      taskFilter.project = project._id
    }

    const tasks = await Task.find(taskFilter)
      .sort({ createdAt: -1 })
      .populate(taskPopulate)

    response.status(200).json({
      success: true,
      tasks: tasks.map((task) => formatTask(task, currentUserId)),
    })
  } catch (error) {
    next(error)
  }
}

const getTasksByProject = async (request, response, next) => {
  try {
    const { projectId } = request.params
    const { project, error } = await findAccessibleProject(projectId, request.user)

    if (error) {
      return response.status(error.status).json({
        success: false,
        message: error.message,
      })
    }

    const tasks = await Task.find({ project: project._id })
      .sort({ createdAt: -1 })
      .populate(taskPopulate)

    response.status(200).json({
      success: true,
      tasks: tasks.map((task) =>
        formatTask(task, request.user._id.toString()),
      ),
    })
  } catch (error) {
    next(error)
  }
}

const getAccessibleTask = async (taskId, requestUser) => {
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    return {
      error: {
        status: 400,
        message: 'Invalid task id.',
      },
    }
  }

  const task = await Task.findById(taskId).populate(taskPopulate)

  if (!task) {
    return {
      error: {
        status: 404,
        message: 'Task not found.',
      },
    }
  }

  if (
    !canAccessProject(task.project, requestUser._id.toString(), requestUser.role)
  ) {
    return {
      error: {
        status: 403,
        message: 'You do not have access to this task.',
      },
    }
  }

  return { task }
}

const updateTask = async (request, response, next) => {
  try {
    const { id } = request.params
    const { task, error } = await getAccessibleTask(id, request.user)

    if (error) {
      return response.status(error.status).json({
        success: false,
        message: error.message,
      })
    }

    if (
      !isProjectAdmin(task.project, request.user._id.toString(), request.user.role)
    ) {
      return response.status(403).json({
        success: false,
        message: 'Only project admins can edit task details.',
      })
    }

    const validatedData = updateTaskSchema.parse(request.body)

    if (validatedData.assignedTo) {
      const assignee = await User.findById(validatedData.assignedTo)

      if (!assignee) {
        return response.status(404).json({
          success: false,
          message: 'Assignee not found.',
        })
      }

      const isAssigneeMember = task.project.members.some(
        (member) => member.user._id.toString() === assignee._id.toString(),
      )

      if (!isAssigneeMember) {
        return response.status(400).json({
          success: false,
          message: 'Assignee must belong to this project.',
        })
      }
    }

    if (validatedData.title !== undefined) {
      task.title = validatedData.title
    }
    if (validatedData.description !== undefined) {
      task.description = validatedData.description
    }
    if (validatedData.priority !== undefined) {
      task.priority = validatedData.priority
    }
    if (validatedData.status !== undefined) {
      task.status = validatedData.status
    }
    if (validatedData.assignedTo !== undefined) {
      task.assignedTo = validatedData.assignedTo
    }
    if (validatedData.dueDate !== undefined) {
      task.dueDate = normalizeDueDate(validatedData.dueDate)
    }

    await task.save()
    await task.populate(taskPopulate)

    response.status(200).json({
      success: true,
      message: 'Task updated successfully.',
      task: formatTask(task, request.user._id.toString()),
    })
  } catch (error) {
    next(error)
  }
}

const updateTaskStatus = async (request, response, next) => {
  try {
    const { id } = request.params
    const { task, error } = await getAccessibleTask(id, request.user)

    if (error) {
      return response.status(error.status).json({
        success: false,
        message: error.message,
      })
    }

    const validatedData = updateTaskStatusSchema.parse(request.body)
    task.status = validatedData.status

    await task.save()
    await task.populate(taskPopulate)

    response.status(200).json({
      success: true,
      message: 'Task status updated successfully.',
      task: formatTask(task, request.user._id.toString()),
    })
  } catch (error) {
    next(error)
  }
}

const deleteTask = async (request, response, next) => {
  try {
    const { id } = request.params
    const { task, error } = await getAccessibleTask(id, request.user)

    if (error) {
      return response.status(error.status).json({
        success: false,
        message: error.message,
      })
    }

    if (
      !isProjectAdmin(task.project, request.user._id.toString(), request.user.role)
    ) {
      return response.status(403).json({
        success: false,
        message: 'Only project admins can delete tasks.',
      })
    }

    await Task.findByIdAndDelete(task._id)

    response.status(200).json({
      success: true,
      message: 'Task deleted successfully.',
    })
  } catch (error) {
    next(error)
  }
}

export {
  createTask,
  deleteTask,
  getTasks,
  getTasksByProject,
  updateTask,
  updateTaskStatus,
}

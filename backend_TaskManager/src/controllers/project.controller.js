import mongoose from 'mongoose'
import { z } from 'zod'
import Project from '../models/Project.js'
import User from '../models/User.js'
import { canAccessProject, isProjectAdmin } from '../utils/projectAccess.js'

const createProjectSchema = z.object({
  name: z.string().trim().min(2, 'Project name must be at least 2 characters long.'),
  description: z.string().trim().max(500, 'Description must be 500 characters or less.').optional().default(''),
})

const addMemberSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please provide a valid member email address.'),
  role: z.enum(['admin', 'member']).optional().default('member'),
})

const projectSummaryPipeline = [
  {
    path: 'createdBy',
    select: 'name email role',
  },
  {
    path: 'members.user',
    select: 'name email role',
  },
]

const formatProject = (project, currentUserId) => {
  const projectObject = project.toObject ? project.toObject() : project
  const members = projectObject.members.map((member) => ({
    user: member.user,
    role: member.role,
  }))
  const currentMembership = members.find(
    (member) => member.user?._id?.toString() === currentUserId,
  )

  return {
    id: projectObject._id,
    name: projectObject.name,
    description: projectObject.description,
    createdBy: projectObject.createdBy,
    members,
    createdAt: projectObject.createdAt,
    updatedAt: projectObject.updatedAt,
    currentUserProjectRole: currentMembership?.role || null,
  }
}

const createProject = async (request, response, next) => {
  try {
    const validatedData = createProjectSchema.parse(request.body)
    const creatorId = request.user._id

    const project = await Project.create({
      ...validatedData,
      createdBy: creatorId,
      members: [
        {
          user: creatorId,
          role: 'admin',
        },
      ],
    })

    const populatedProject = await Project.findById(project._id)
      .populate(projectSummaryPipeline)

    response.status(201).json({
      success: true,
      message: 'Project created successfully.',
      project: formatProject(populatedProject, creatorId.toString()),
    })
  } catch (error) {
    next(error)
  }
}

const getProjects = async (request, response, next) => {
  try {
    const currentUserId = request.user._id
    const filter =
      request.user.role === 'admin'
        ? {}
        : {
            'members.user': currentUserId,
          }

    const projects = await Project.find(filter)
      .sort({ updatedAt: -1 })
      .populate(projectSummaryPipeline)

    response.status(200).json({
      success: true,
      projects: projects.map((project) =>
        formatProject(project, currentUserId.toString()),
      ),
    })
  } catch (error) {
    next(error)
  }
}

const getProjectById = async (request, response, next) => {
  try {
    const { id } = request.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return response.status(400).json({
        success: false,
        message: 'Invalid project id.',
      })
    }

    const project = await Project.findById(id).populate(projectSummaryPipeline)

    if (!project) {
      return response.status(404).json({
        success: false,
        message: 'Project not found.',
      })
    }

    if (
      !canAccessProject(project, request.user._id.toString(), request.user.role)
    ) {
      return response.status(403).json({
        success: false,
        message: 'You do not have access to this project.',
      })
    }

    response.status(200).json({
      success: true,
      project: formatProject(project, request.user._id.toString()),
    })
  } catch (error) {
    next(error)
  }
}

const addProjectMember = async (request, response, next) => {
  try {
    const { id } = request.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return response.status(400).json({
        success: false,
        message: 'Invalid project id.',
      })
    }

    const project = await Project.findById(id)

    if (!project) {
      return response.status(404).json({
        success: false,
        message: 'Project not found.',
      })
    }

    if (
      !isProjectAdmin(project, request.user._id.toString(), request.user.role)
    ) {
      return response.status(403).json({
        success: false,
        message: 'Only project admins can manage team members.',
      })
    }

    const validatedData = addMemberSchema.parse(request.body)
    const memberUser = await User.findOne({ email: validatedData.email })

    if (!memberUser) {
      return response.status(404).json({
        success: false,
        message: 'No user found with that email.',
      })
    }

    const isExistingMember = project.members.some(
      (member) => member.user.toString() === memberUser._id.toString(),
    )

    if (isExistingMember) {
      return response.status(409).json({
        success: false,
        message: 'This user is already a project member.',
      })
    }

    project.members.push({
      user: memberUser._id,
      role: validatedData.role,
    })

    await project.save()

    const populatedProject = await Project.findById(project._id)
      .populate(projectSummaryPipeline)

    response.status(200).json({
      success: true,
      message: 'Member added successfully.',
      project: formatProject(populatedProject, request.user._id.toString()),
    })
  } catch (error) {
    next(error)
  }
}

export { addProjectMember, createProject, getProjectById, getProjects }

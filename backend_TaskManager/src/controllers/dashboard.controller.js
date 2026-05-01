import Project from '../models/Project.js'
import Task from '../models/Task.js'

const getDashboardSummary = async (request, response, next) => {
  try {
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    let taskFilter = {}

    if (request.user.role !== 'admin') {
      const accessibleProjects = await Project.find({
        'members.user': request.user._id,
      }).select('_id')

      taskFilter.project = {
        $in: accessibleProjects.map((project) => project._id),
      }
    }

    const [allTasks, assignedTasks] = await Promise.all([
      Task.find(taskFilter)
        .sort({ dueDate: 1, createdAt: -1 })
        .populate('project', 'name')
        .populate('assignedTo', 'name email role'),
      Task.find({
        ...taskFilter,
        assignedTo: request.user._id,
      })
        .sort({ dueDate: 1, createdAt: -1 })
        .populate('project', 'name')
        .populate('assignedTo', 'name email role'),
    ])

    const overdueTasks = allTasks.filter(
      (task) => task.dueDate && task.dueDate < today && task.status !== 'done',
    )

    const summary = {
      totalTasks: allTasks.length,
      todoTasks: allTasks.filter((task) => task.status === 'todo').length,
      inProgressTasks: allTasks.filter((task) => task.status === 'in_progress')
        .length,
      completedTasks: allTasks.filter((task) => task.status === 'done').length,
      overdueTasks: overdueTasks.length,
      assignedToMe: assignedTasks.length,
    }

    response.status(200).json({
      success: true,
      summary,
      overdueTasks: overdueTasks.slice(0, 5).map((task) => ({
        id: task._id,
        title: task.title,
        dueDate: task.dueDate,
        status: task.status,
        priority: task.priority,
        project: {
          id: task.project._id,
          name: task.project.name,
        },
        assignedTo: task.assignedTo,
      })),
      recentAssignedTasks: assignedTasks.slice(0, 5).map((task) => ({
        id: task._id,
        title: task.title,
        dueDate: task.dueDate,
        status: task.status,
        priority: task.priority,
        project: {
          id: task.project._id,
          name: task.project.name,
        },
      })),
    })
  } catch (error) {
    next(error)
  }
}

export { getDashboardSummary }

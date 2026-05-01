import { useEffect, useState } from 'react'
import apiClient from '../api/client.js'
import useAuth from '../context/useAuth.js'

const emptyTaskForm = {
  title: '',
  description: '',
  priority: 'medium',
  dueDate: '',
  projectId: '',
  assignedTo: '',
}

function TasksPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [taskForm, setTaskForm] = useState(emptyTaskForm)
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const [updatingTaskId, setUpdatingTaskId] = useState('')

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      try {
        const [projectsResponse, tasksResponse] = await Promise.all([
          apiClient.get('/projects'),
          apiClient.get('/tasks'),
        ])

        if (!isMounted) {
          return
        }

        const fetchedProjects = projectsResponse.data.projects || []
        const fetchedTasks = tasksResponse.data.tasks || []

        setProjects(fetchedProjects)
        setTasks(fetchedTasks)
        setErrorMessage('')

        if (fetchedProjects.length > 0) {
          const firstProjectId = fetchedProjects[0].id
          setSelectedProjectId(firstProjectId)
          setTaskForm((currentState) => ({
            ...currentState,
            projectId: currentState.projectId || firstProjectId,
            assignedTo:
              currentState.assignedTo ||
              fetchedProjects[0].members.find((member) => member.role)?.user._id ||
              fetchedProjects[0].members[0]?.user._id ||
              '',
          }))
        }
      } catch (error) {
        if (!isMounted) {
          return
        }

        setErrorMessage(
          error.response?.data?.message || 'Unable to load tasks right now.',
        )
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, [])

  const selectedProject =
    projects.find((project) => project.id === selectedProjectId) || null
  const selectedProjectMembers = selectedProject?.members || []
  const canCreateTasks =
    user?.role === 'admin' ||
    selectedProject?.currentUserProjectRole === 'admin'

  const visibleTasks = tasks.filter((task) => {
    const matchesProject = selectedProjectId
      ? task.project.id === selectedProjectId
      : true
    const matchesStatus =
      statusFilter === 'all' ? true : task.status === statusFilter

    return matchesProject && matchesStatus
  })

  const handleTaskFormChange = (event) => {
    const { name, value } = event.target

    setTaskForm((currentState) => {
      if (name === 'projectId') {
        const nextProject =
          projects.find((project) => project.id === value) || null

        return {
          ...currentState,
          projectId: value,
          assignedTo: nextProject?.members[0]?.user._id || '',
        }
      }

      return {
        ...currentState,
        [name]: value,
      }
    })

    if (name === 'projectId') {
      setSelectedProjectId(value)
    }
  }

  const handleCreateTask = async (event) => {
    event.preventDefault()
    setIsCreatingTask(true)
    setErrorMessage('')

    try {
      const response = await apiClient.post('/tasks', taskForm)
      const newTask = response.data.task

      setTasks((currentTasks) => [newTask, ...currentTasks])
      setTaskForm((currentState) => ({
        ...emptyTaskForm,
        projectId: currentState.projectId,
        assignedTo:
          selectedProject?.members[0]?.user._id || '',
      }))
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || 'Unable to create the task.',
      )
    } finally {
      setIsCreatingTask(false)
    }
  }

  const handleStatusUpdate = async (taskId, status) => {
    setUpdatingTaskId(taskId)
    setErrorMessage('')

    try {
      const response = await apiClient.patch(`/tasks/${taskId}/status`, {
        status,
      })
      const updatedTask = response.data.task

      setTasks((currentTasks) =>
        currentTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
      )
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || 'Unable to update task status.',
      )
    } finally {
      setUpdatingTaskId('')
    }
  }

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return 'No due date'
    }

    return new Date(dateValue).toLocaleDateString()
  }

  const getTaskAssigneeId = (task) => task.assignedTo?._id || task.assignedTo?.id

  const canUpdateTaskStatus = (task) => {
    return user?.role === 'admin' || Boolean(task.currentUserProjectRole)
  }

  return (
    <section className="stack">
      <div className="placeholder-card">
        <h1>Tasks</h1>
        <p>
          Create, assign, and track tasks across your projects. Any member in a
          project can update task status, while project admins manage task
          creation and assignment.
        </p>
      </div>

      {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

      <div className="panel-grid panel-grid--tasks">
        <article className="panel">
          <h2>Create task</h2>
          {!projects.length ? (
            <p>Create a project first before adding tasks.</p>
          ) : !canCreateTasks ? (
            <p>Only project admins can create tasks for the selected project.</p>
          ) : (
            <form className="field-group" onSubmit={handleCreateTask}>
              <div className="field">
                <label htmlFor="task-project">Project</label>
                <select
                  className="field-select"
                  id="task-project"
                  name="projectId"
                  onChange={handleTaskFormChange}
                  value={taskForm.projectId}
                  required
                >
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="task-title">Task title</label>
                <input
                  id="task-title"
                  name="title"
                  onChange={handleTaskFormChange}
                  placeholder="Prepare sprint plan"
                  type="text"
                  value={taskForm.title}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="task-description">Description</label>
                <input
                  id="task-description"
                  name="description"
                  onChange={handleTaskFormChange}
                  placeholder="Add a short task description"
                  type="text"
                  value={taskForm.description}
                />
              </div>
              <div className="field">
                <label htmlFor="task-assignedTo">Assign to</label>
                <select
                  className="field-select"
                  id="task-assignedTo"
                  name="assignedTo"
                  onChange={handleTaskFormChange}
                  value={taskForm.assignedTo}
                  required
                >
                  <option value="" disabled>
                    Select a team member
                  </option>
                  {selectedProjectMembers.map((member) => (
                    <option key={member.user._id} value={member.user._id}>
                      {member.user.name} ({member.role})
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="task-priority">Priority</label>
                <select
                  className="field-select"
                  id="task-priority"
                  name="priority"
                  onChange={handleTaskFormChange}
                  value={taskForm.priority}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="task-dueDate">Due date</label>
                <input
                  id="task-dueDate"
                  name="dueDate"
                  onChange={handleTaskFormChange}
                  type="date"
                  value={taskForm.dueDate}
                />
              </div>
              <button
                className="button button--primary"
                disabled={isCreatingTask}
                type="submit"
              >
                {isCreatingTask ? 'Creating...' : 'Create task'}
              </button>
            </form>
          )}
        </article>

        <article className="panel panel--wide">
          <div className="tasks-toolbar">
            <div>
              <h2>Task list</h2>
              <p>{isLoading ? 'Loading tasks...' : `${visibleTasks.length} tasks shown`}</p>
            </div>
            <div className="tasks-filters">
              <select
                className="field-select"
                onChange={(event) => setSelectedProjectId(event.target.value)}
                value={selectedProjectId}
              >
                {projects.length === 0 ? (
                  <option value="">No projects</option>
                ) : (
                  projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))
                )}
              </select>
              <select
                className="field-select"
                onChange={(event) => setStatusFilter(event.target.value)}
                value={statusFilter}
              >
                <option value="all">All statuses</option>
                <option value="todo">Todo</option>
                <option value="in_progress">In progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          {!visibleTasks.length ? (
            <p>No tasks match this view yet.</p>
          ) : (
            <div className="task-list">
              {visibleTasks.map((task) => (
                <article className="task-card" key={task.id}>
                  <div className="task-card__top">
                    <div>
                      <h3>{task.title}</h3>
                      <p>{task.description || 'No description added.'}</p>
                    </div>
                    <div className="task-badges">
                      <span className={`badge badge--${task.priority}`}>
                        {task.priority}
                      </span>
                      <span className={`badge badge--status-${task.status}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="task-meta">
                    <span>Project: {task.project.name}</span>
                    <span>Assigned to: {task.assignedTo.name}</span>
                    <span>Due: {formatDate(task.dueDate)}</span>
                  </div>

                  <div className="task-actions">
                    <select
                      className="field-select"
                      disabled={
                        updatingTaskId === task.id || !canUpdateTaskStatus(task)
                      }
                      onChange={(event) =>
                        handleStatusUpdate(task.id, event.target.value)
                      }
                      value={task.status}
                    >
                      <option value="todo">Todo</option>
                      <option value="in_progress">In progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>

                  {canUpdateTaskStatus(task) ? (
                    getTaskAssigneeId(task) === user?.id ? (
                      <p className="task-note">
                        This task is assigned to you. You can update its status.
                      </p>
                    ) : (
                      <p className="task-note">
                        You are a member of this project, so you can update this
                        task status.
                      </p>
                    )
                  ) : (
                    <p className="task-note">
                      You need project access to change this task status.
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </article>
      </div>
    </section>
  )
}

export default TasksPage

import { useEffect, useState } from 'react'
import apiClient from '../api/client.js'
import useAuth from '../context/useAuth.js'

const emptySummary = {
  totalTasks: 0,
  todoTasks: 0,
  inProgressTasks: 0,
  completedTasks: 0,
  overdueTasks: 0,
  assignedToMe: 0,
}

function DashboardPage() {
  const { user } = useAuth()
  const [summary, setSummary] = useState(emptySummary)
  const [overdueTasks, setOverdueTasks] = useState([])
  const [recentAssignedTasks, setRecentAssignedTasks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    const fetchDashboard = async () => {
      try {
        const response = await apiClient.get('/dashboard/summary')

        if (!isMounted) {
          return
        }

        setSummary(response.data.summary || emptySummary)
        setOverdueTasks(response.data.overdueTasks || [])
        setRecentAssignedTasks(response.data.recentAssignedTasks || [])
        setErrorMessage('')
      } catch (error) {
        if (!isMounted) {
          return
        }

        setErrorMessage(
          error.response?.data?.message ||
            'Unable to load the dashboard right now.',
        )
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchDashboard()

    return () => {
      isMounted = false
    }
  }, [])

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return 'No due date'
    }

    return new Date(dateValue).toLocaleDateString()
  }

  return (
    <section className="stack">
      <div className="placeholder-card">
        <h1>Dashboard</h1>
        <p>
          {user ? `Welcome back, ${user.name}.` : 'Welcome back.'} Here is your
          current workload and task status.
        </p>
      </div>

      {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

      <div className="panel-grid">
        <article className="stat-card">
          <span className="stat-card__label">Total tasks</span>
          <strong className="stat-card__value">
            {isLoading ? '...' : summary.totalTasks}
          </strong>
        </article>
        <article className="stat-card">
          <span className="stat-card__label">Todo</span>
          <strong className="stat-card__value">
            {isLoading ? '...' : summary.todoTasks}
          </strong>
        </article>
        <article className="stat-card">
          <span className="stat-card__label">In progress</span>
          <strong className="stat-card__value">
            {isLoading ? '...' : summary.inProgressTasks}
          </strong>
        </article>
        <article className="stat-card">
          <span className="stat-card__label">Completed</span>
          <strong className="stat-card__value">
            {isLoading ? '...' : summary.completedTasks}
          </strong>
        </article>
        <article className="stat-card">
          <span className="stat-card__label">Overdue</span>
          <strong className="stat-card__value">
            {isLoading ? '...' : summary.overdueTasks}
          </strong>
        </article>
        <article className="stat-card">
          <span className="stat-card__label">Assigned to me</span>
          <strong className="stat-card__value">
            {isLoading ? '...' : summary.assignedToMe}
          </strong>
        </article>
      </div>

      <div className="panel-grid panel-grid--split">
        <article className="panel">
          <h2>Overdue tasks</h2>
          {!overdueTasks.length ? (
            <p>No overdue tasks right now.</p>
          ) : (
            <div className="task-list">
              {overdueTasks.map((task) => (
                <article className="task-card" key={task.id}>
                  <div className="task-card__top">
                    <div>
                      <h3>{task.title}</h3>
                      <p>{task.project.name}</p>
                    </div>
                    <span className={`badge badge--status-${task.status}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="task-meta">
                    <span>Priority: {task.priority}</span>
                    <span>Due: {formatDate(task.dueDate)}</span>
                    <span>Owner: {task.assignedTo?.name || 'Unassigned'}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>

        <article className="panel">
          <h2>Recently assigned to you</h2>
          {!recentAssignedTasks.length ? (
            <p>No assigned tasks yet.</p>
          ) : (
            <div className="task-list">
              {recentAssignedTasks.map((task) => (
                <article className="task-card" key={task.id}>
                  <div className="task-card__top">
                    <div>
                      <h3>{task.title}</h3>
                      <p>{task.project.name}</p>
                    </div>
                    <span className={`badge badge--${task.priority}`}>
                      {task.priority}
                    </span>
                  </div>
                  <div className="task-meta">
                    <span>Status: {task.status.replace('_', ' ')}</span>
                    <span>Due: {formatDate(task.dueDate)}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>
      </div>
    </section>
  )
}

export default DashboardPage

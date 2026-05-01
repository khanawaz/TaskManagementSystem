import { useEffect, useState } from 'react'
import apiClient from '../api/client.js'
import useAuth from '../context/useAuth.js'

function ProjectsPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
  })
  const [memberForm, setMemberForm] = useState({
    email: '',
    role: 'member',
  })

  useEffect(() => {
    let isMounted = true

    const fetchProjects = async () => {
      try {
        const response = await apiClient.get('/projects')

        if (!isMounted) {
          return
        }

        const fetchedProjects = response.data.projects || []
        setErrorMessage('')
        setProjects(fetchedProjects)

        if (fetchedProjects.length > 0) {
          setSelectedProjectId((currentSelectedId) =>
            currentSelectedId || fetchedProjects[0].id,
          )
        } else {
          setSelectedProjectId('')
        }
      } catch (error) {
        if (!isMounted) {
          return
        }

        setErrorMessage(
          error.response?.data?.message || 'Unable to load projects right now.',
        )
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchProjects()

    return () => {
      isMounted = false
    }
  }, [])

  const handleCreateChange = (event) => {
    setCreateForm((currentState) => ({
      ...currentState,
      [event.target.name]: event.target.value,
    }))
  }

  const handleMemberChange = (event) => {
    setMemberForm((currentState) => ({
      ...currentState,
      [event.target.name]: event.target.value,
    }))
  }

  const handleCreateProject = async (event) => {
    event.preventDefault()
    setIsCreating(true)
    setErrorMessage('')

    try {
      const response = await apiClient.post('/projects', createForm)
      const newProject = response.data.project

      setProjects((currentProjects) => [newProject, ...currentProjects])
      setSelectedProjectId(newProject.id)
      setCreateForm({
        name: '',
        description: '',
      })
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || 'Unable to create the project.',
      )
    } finally {
      setIsCreating(false)
    }
  }

  const handleAddMember = async (event) => {
    event.preventDefault()

    if (!selectedProjectId) {
      setErrorMessage('Create or select a project before adding members.')
      return
    }

    setIsAddingMember(true)
    setErrorMessage('')

    try {
      const response = await apiClient.patch(
        `/projects/${selectedProjectId}/members`,
        memberForm,
      )
      const updatedProject = response.data.project

      setProjects((currentProjects) =>
        currentProjects.map((project) =>
          project.id === updatedProject.id ? updatedProject : project,
        ),
      )
      setMemberForm({
        email: '',
        role: 'member',
      })
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || 'Unable to add the member.',
      )
    } finally {
      setIsAddingMember(false)
    }
  }

  const selectedProject =
    projects.find((project) => project.id === selectedProjectId) || null
  const canManageProject =
    user?.role === 'admin' ||
    selectedProject?.currentUserProjectRole === 'admin'

  return (
    <section className="stack">
      <div className="placeholder-card">
        <h1>Projects</h1>
        <p>
          Create projects, review your team spaces, and add members by email.
          You are signed in as <strong>{user?.role || 'member'}</strong>.
        </p>
      </div>

      {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

      <div className="panel-grid">
        <article className="panel">
          <h2>Project list</h2>
          {isLoading ? (
            <p>Loading projects...</p>
          ) : projects.length === 0 ? (
            <p>No projects yet. Create your first one to get started.</p>
          ) : (
            <div className="project-list">
              {projects.map((project) => (
                <button
                  className={`project-item${
                    selectedProjectId === project.id ? ' project-item--active' : ''
                  }`}
                  key={project.id}
                  onClick={() => setSelectedProjectId(project.id)}
                  type="button"
                >
                  <strong>{project.name}</strong>
                  <span>{project.members.length} members</span>
                </button>
              ))}
            </div>
          )}
        </article>
        <article className="panel">
          <h2>Create project</h2>
          {user?.role !== 'admin' ? (
            <p>Only admins can create projects.</p>
          ) : (
            <form className="field-group" onSubmit={handleCreateProject}>
              <div className="field">
                <label htmlFor="project-name">Project name</label>
                <input
                  id="project-name"
                  name="name"
                  onChange={handleCreateChange}
                  placeholder="Website redesign"
                  type="text"
                  value={createForm.name}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="project-description">Description</label>
                <input
                  id="project-description"
                  name="description"
                  onChange={handleCreateChange}
                  placeholder="Short summary of the project"
                  type="text"
                  value={createForm.description}
                />
              </div>
              <button
                className="button button--primary"
                disabled={isCreating}
                type="submit"
              >
                {isCreating ? 'Creating...' : 'Create project'}
              </button>
            </form>
          )}
        </article>
        <article className="panel">
          <h2>Team members</h2>
          {!selectedProject ? (
            <p>Select a project to review and manage its team.</p>
          ) : (
            <div className="stack stack--compact">
              <div>
                <p>
                  <strong>{selectedProject.name}</strong>
                </p>
                <p>{selectedProject.description || 'No description added yet.'}</p>
              </div>

              <div className="member-list">
                {selectedProject.members.map((member) => (
                  <div className="member-item" key={member.user._id}>
                    <div>
                      <strong>{member.user.name}</strong>
                      <p>{member.user.email}</p>
                    </div>
                    <span className="session-pill">{member.role}</span>
                  </div>
                ))}
              </div>

              {canManageProject ? (
                <form className="field-group" onSubmit={handleAddMember}>
                  <div className="field">
                    <label htmlFor="member-email">Member email</label>
                    <input
                      id="member-email"
                      name="email"
                      onChange={handleMemberChange}
                      placeholder="member@example.com"
                      type="email"
                      value={memberForm.email}
                      required
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="member-role">Project role</label>
                    <select
                      className="field-select"
                      id="member-role"
                      name="role"
                      onChange={handleMemberChange}
                      value={memberForm.role}
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <button
                    className="button button--secondary"
                    disabled={isAddingMember}
                    type="submit"
                  >
                    {isAddingMember ? 'Adding...' : 'Add member'}
                  </button>
                </form>
              ) : (
                <p>Only project admins can add members to this project.</p>
              )}
            </div>
          )}
        </article>
      </div>
    </section>
  )
}

export default ProjectsPage

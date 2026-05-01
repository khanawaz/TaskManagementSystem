import { NavLink, Outlet } from 'react-router-dom'
import useAuth from '../context/useAuth.js'
import '../App.css'

const getNavLinkClassName = ({ isActive }) =>
  isActive ? 'active' : undefined

function AppLayout() {
  const { isAuthenticated, isAuthenticating, logout, user } = useAuth()

  return (
    <div className="shell">
      <header className="shell__header">
        <nav className="shell__nav">
          <NavLink className="brand" to="/">
            <span className="brand__title">TaskForge</span>
            <span className="brand__subtitle">Team task manager</span>
          </NavLink>

          <div className="nav-links">
            <NavLink className={getNavLinkClassName} to="/dashboard">
              Dashboard
            </NavLink>
            <NavLink className={getNavLinkClassName} to="/projects">
              Projects
            </NavLink>
            <NavLink className={getNavLinkClassName} to="/tasks">
              Tasks
            </NavLink>
            {!isAuthenticated ? (
              <>
                <NavLink className={getNavLinkClassName} to="/login">
                  Login
                </NavLink>
                <NavLink className={getNavLinkClassName} to="/signup">
                  Signup
                </NavLink>
              </>
            ) : null}
          </div>

          <div className="nav-session">
            {user ? (
              <div className="session-pill">
                <span>{user.name}</span>
                <small>{user.role}</small>
              </div>
            ) : null}

            {isAuthenticated ? (
              <button
                className="button button--secondary"
                disabled={isAuthenticating}
                onClick={logout}
                type="button"
              >
                {isAuthenticating ? 'Signing out...' : 'Logout'}
              </button>
            ) : null}
          </div>
        </nav>
      </header>

      <main className="shell__main">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout

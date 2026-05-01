import { Navigate, useLocation } from 'react-router-dom'
import useAuth from '../context/useAuth.js'

function ProtectedRoute({ children }) {
  const location = useLocation()
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <section className="placeholder-card">
        <h1>Checking session</h1>
        <p>Loading your workspace.</p>
      </section>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

export default ProtectedRoute

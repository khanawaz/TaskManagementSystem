import { Navigate } from 'react-router-dom'
import useAuth from '../context/useAuth.js'

function HomePage() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <section className="stack">
        <div className="placeholder-card">
          <h1>Loading</h1>
          <p>Opening your workspace.</p>
        </div>
      </section>
    )
  }

  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />
}

export default HomePage

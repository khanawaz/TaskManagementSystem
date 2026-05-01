import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import AuthForm from '../components/AuthForm.jsx'
import useAuth from '../context/useAuth.js'

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, isAuthenticating, login } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [errorMessage, setErrorMessage] = useState('')

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleChange = (event) => {
    setFormData((currentState) => ({
      ...currentState,
      [event.target.name]: event.target.value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')

    try {
      await login(formData)
      const destination = location.state?.from?.pathname || '/dashboard'
      navigate(destination, { replace: true })
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || 'Unable to log in right now.',
      )
    }
  }

  return (
    <div className="stack">
      <AuthForm
        description="Sign in to your workspace."
        errorMessage={errorMessage}
        fields={[
          {
            id: 'login-email',
            name: 'email',
            label: 'Email',
            type: 'email',
            value: formData.email,
            placeholder: 'you@example.com',
            autoComplete: 'email',
          },
          {
            id: 'login-password',
            name: 'password',
            label: 'Password',
            type: 'password',
            value: formData.password,
            placeholder: 'Enter your password',
            autoComplete: 'current-password',
          },
        ]}
        isSubmitting={isAuthenticating}
        onChange={handleChange}
        onSubmit={handleSubmit}
        submitLabel="Login"
        title="Login"
      />

      <p className="auth-switch">
        Need an account? <Link to="/signup">Create one.</Link>
      </p>
    </div>
  )
}

export default LoginPage

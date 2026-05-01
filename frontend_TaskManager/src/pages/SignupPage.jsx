import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import AuthForm from '../components/AuthForm.jsx'
import useAuth from '../context/useAuth.js'

function SignupPage() {
  const navigate = useNavigate()
  const { isAuthenticated, isAuthenticating, signup } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
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
      await signup(formData)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || 'Unable to create your account.',
      )
    }
  }

  return (
    <div className="stack">
      <AuthForm
        description="Create an account to start managing projects and tasks."
        errorMessage={errorMessage}
        fields={[
          {
            id: 'signup-name',
            name: 'name',
            label: 'Full name',
            type: 'text',
            value: formData.name,
            placeholder: 'Enter your name',
            autoComplete: 'name',
          },
          {
            id: 'signup-email',
            name: 'email',
            label: 'Email',
            type: 'email',
            value: formData.email,
            placeholder: 'you@example.com',
            autoComplete: 'email',
          },
          {
            id: 'signup-password',
            name: 'password',
            label: 'Password',
            type: 'password',
            value: formData.password,
            placeholder: 'Create a password',
            autoComplete: 'new-password',
          },
        ]}
        isSubmitting={isAuthenticating}
        onChange={handleChange}
        onSubmit={handleSubmit}
        submitLabel="Create account"
        title="Create account"
      />

      <p className="auth-switch">
        Already have an account? <Link to="/login">Sign in.</Link>
      </p>
    </div>
  )
}

export default SignupPage

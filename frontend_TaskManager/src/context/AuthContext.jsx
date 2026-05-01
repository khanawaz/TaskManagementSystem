import { createContext, useEffect, useRef, useState } from 'react'
import apiClient from '../api/client.js'

const AuthContext = createContext(null)

function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const hasFetchedSession = useRef(false)

  useEffect(() => {
    if (hasFetchedSession.current) {
      return
    }

    hasFetchedSession.current = true

    const fetchCurrentUser = async () => {
      try {
        const response = await apiClient.get('/auth/me')
        setUser(response.data.user)
      } catch {
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCurrentUser()
  }, [])

  const signup = async (payload) => {
    setIsAuthenticating(true)

    try {
      const response = await apiClient.post('/auth/signup', payload)
      setUser(response.data.user)
      return response.data
    } finally {
      setIsAuthenticating(false)
    }
  }

  const login = async (payload) => {
    setIsAuthenticating(true)

    try {
      const response = await apiClient.post('/auth/login', payload)
      setUser(response.data.user)
      return response.data
    } finally {
      setIsAuthenticating(false)
    }
  }

  const logout = async () => {
    setIsAuthenticating(true)

    try {
      await apiClient.post('/auth/logout')
      setUser(null)
    } finally {
      setIsAuthenticating(false)
    }
  }

  const value = {
    user,
    isLoading,
    isAuthenticating,
    isAuthenticated: Boolean(user),
    signup,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { AuthContext, AuthProvider }

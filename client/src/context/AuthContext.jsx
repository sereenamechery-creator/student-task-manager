import { createContext, useContext, useEffect, useState } from 'react'
import { authApi } from '../services/api.js'

const AuthContext = createContext(null)
const TOKEN_KEY = 'studyflow_token'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadUserSession() {
      if (!token) {
        if (isMounted) setIsLoading(false)
        return
      }

      try {
        const data = await authApi.getMe(token)
        if (isMounted) {
          setUser(data.user)
          setAuthError('')
        }
      } catch (err) {
        if (isMounted) {
          console.warn('Session verification failed, logging out:', err.message)
          localStorage.removeItem(TOKEN_KEY)
          setToken(null)
          setUser(null)
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadUserSession()
    return () => {
      isMounted = false
    }
  }, [token])

  const login = async (email, password) => {
    setAuthError('')
    try {
      const data = await authApi.login({ email, password })
      localStorage.setItem(TOKEN_KEY, data.token)
      setToken(data.token)
      setUser(data.user)
      return { success: true }
    } catch (err) {
      const message = err.message || 'Login failed. Please check your credentials.'
      setAuthError(message)
      return { success: false, message }
    }
  }

  const register = async (name, email, password) => {
    setAuthError('')
    try {
      const data = await authApi.register({ name, email, password })
      localStorage.setItem(TOKEN_KEY, data.token)
      setToken(data.token)
      setUser(data.user)
      return { success: true }
    } catch (err) {
      const message = err.message || 'Registration failed. Please try again.'
      setAuthError(message)
      return { success: false, message }
    }
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
    setAuthError('')
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isLoading,
        authError,
        setAuthError,
        login,
        register,
        logout,
        isAuthenticated: Boolean(token && user),
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

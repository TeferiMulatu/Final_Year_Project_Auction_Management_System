import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    const role = localStorage.getItem('role')

    if (token && userData && role) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser({ ...parsedUser, role })
      } catch (error) {
        console.error('Error parsing user data:', error)
        logout()
      }
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password })
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('role', data.user.role)
      setUser(data.user)
      return { success: true, user: data.user }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      }
    }
  }

  const register = async (userData) => {
    try {
      const { data } = await api.post('/auth/register', userData)
      return { success: true, user: data }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('role')
    setUser(null)
  }

  const isAuthenticated = () => {
    return !!user && !!localStorage.getItem('token')
  }

  const hasRole = (roles) => {
    if (!user) return false
    const userRoles = Array.isArray(roles) ? roles : [roles]
    return userRoles.includes(user.role)
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated,
    hasRole
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
